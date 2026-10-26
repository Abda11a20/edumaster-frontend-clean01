/**
 * Exam Attempt State Machine
 *
 * Derives the student's attempt state from the backend response to
 * GET /studentExam/exams/remaining-time/:examId
 *
 * Possible backend responses:
 *   404 (null from handleResponse)  → NOT_STARTED
 *   200 { remainingTime: { minutes, seconds } } (remaining > 0) → IN_PROGRESS
 *   200 { remainingTime: 0 }        → EXPIRED_UNSUBMITTED
 *   400 "Exam already submitted"   → SUBMITTED
 */

/**
 * Canonical exam attempt states.
 * @enum {string}
 */
export const ExamState = Object.freeze({
  /** Student has never started this exam */
  NOT_STARTED: 'NOT_STARTED',
  /** Attempt exists and time is still ticking */
  IN_PROGRESS: 'IN_PROGRESS',
  /** Attempt exists, time ran out, but never submitted */
  EXPIRED_UNSUBMITTED: 'EXPIRED_UNSUBMITTED',
  /** Attempt was submitted (score available) */
  SUBMITTED: 'SUBMITTED',
  /** State could not be determined (network / 5xx). Never offer "Start" here: it could create a duplicate attempt. */
  UNKNOWN: 'UNKNOWN',
});

/**
 * Fetch the canonical exam attempt state from the backend.
 *
 * @param {string} examId
 * @param {Function} apiRequest – the raw apiRequest function from api.js
 * @returns {Promise<{ state: string, remainingSeconds?: number }>}
 *   - state: one of ExamState values
 *   - remainingSeconds: only present when state === IN_PROGRESS
 */
export async function getExamAttemptState(examId, apiRequest) {
  try {
    // We call the raw apiRequest directly instead of examsAPI.getRemainingTime
    // because the latter swallows 400 errors by trying a fallback URL.
    // silent: a 400 "already submitted" is an expected answer here, not an error toast.
    const response = await apiRequest(`/studentExam/exams/remaining-time/${examId}`, { silent: true });

    // 404 → null from handleResponse
    if (response === null) {
      return { state: ExamState.NOT_STARTED };
    }

    // 200 with remaining time
    const rt = response.remainingTime ?? response.data?.remainingTime;

    if (rt === 0 || rt === '0') {
      return { state: ExamState.EXPIRED_UNSUBMITTED };
    }

    if (rt && typeof rt === 'object') {
      const minutes = Number(rt.minutes) || 0;
      const seconds = Number(rt.seconds) || 0;
      const totalSeconds = minutes * 60 + seconds;

      if (totalSeconds <= 0) {
        return { state: ExamState.EXPIRED_UNSUBMITTED };
      }

      return { state: ExamState.IN_PROGRESS, remainingSeconds: totalSeconds };
    }

    // Fallback: if remainingTime is a positive number (seconds)
    if (typeof rt === 'number' && rt > 0) {
      return { state: ExamState.IN_PROGRESS, remainingSeconds: rt };
    }

    // Unknown shape but got a 200 → treat as expired
    return { state: ExamState.EXPIRED_UNSUBMITTED };

  } catch (error) {
    // 400 "Exam already submitted" or "already submitted"
    const msg = (error.message || '').toLowerCase();
    if (error.status === 400 && msg.includes('already submitted')) {
      return { state: ExamState.SUBMITTED };
    }

    // 401 → re-throw (session expired, handled globally)
    if (error.status === 401) {
      throw error;
    }

    // Any other error (network, 5xx after retries, unexpected 400) → UNKNOWN.
    // Do NOT default to NOT_STARTED: offering "Start" could create a duplicate attempt.
    console.warn('getExamAttemptState: unexpected error, state UNKNOWN', error);
    return { state: ExamState.UNKNOWN };
  }
}
