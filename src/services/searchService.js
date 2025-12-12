// services/searchService.js
class SearchService {
  // تحديث بيانات الدروس في localStorage
  static updateLessonsData(lessons) {
    try {
      localStorage.setItem('lessons', JSON.stringify(lessons));
    } catch (error) {
      // لا تظهر أي أخطاء
    }
  }

  // تحديث بيانات الامتحانات في localStorage
  static updateExamsData(exams) {
    try {
      localStorage.setItem('exams', JSON.stringify(exams));
    } catch (error) {
      // لا تظهر أي أخطاء
    }
  }

  // الحصول على البيانات المحدثة
  static getUpdatedData() {
    try {
      const lessons = JSON.parse(localStorage.getItem('lessons') || '[]');
      const exams = JSON.parse(localStorage.getItem('exams') || '[]');
      return { lessons, exams };
    } catch {
      return { lessons: [], exams: [] };
    }
  }
}

export default SearchService;