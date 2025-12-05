import { useRef, useState, useEffect } from 'react';
import ReactPlayer from 'react-player';

const React19VideoPlayer = ({ url, title }) => {
  const playerRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [played, setPlayed] = useState(0);
  const [seeking, setSeeking] = useState(false);
  const [duration, setDuration] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [playerReady, setPlayerReady] = useState(false);

  // إخفاء عناصر التحكم تلقائياً بعد 3 ثواني
  useEffect(() => {
    let timeoutId;
    if (playing && showControls) {
      timeoutId = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [playing, showControls]);

  // وظائف التحكم الأساسية
  const handlePlayPause = () => {
    setPlaying(!playing);
    setShowControls(true);
  };

  const handleVolumeChange = (e) => {
    setVolume(parseFloat(e.target.value));
  };

  const handlePlaybackRateChange = (rate) => {
    setPlaybackRate(rate);
  };

  const handleProgress = (state) => {
    if (!seeking) {
      setPlayed(state.played);
    }
  };

  const handleSeekChange = (e) => {
    setPlayed(parseFloat(e.target.value));
  };

  const handleSeekMouseDown = () => {
    setSeeking(true);
  };

  const handleSeekMouseUp = (e) => {
    setSeeking(false);
    if (playerRef.current) {
      playerRef.current.seekTo(parseFloat(e.target.value));
    }
  };

  const handleReady = () => {
    setPlayerReady(true);
    console.log('Player is ready');
  };

  const toggleFullscreen = () => {
    const container = document.querySelector('.react19-video-container');
    if (!container) return;

    if (!fullscreen) {
      if (container.requestFullscreen) {
        container.requestFullscreen();
      } else if (container.webkitRequestFullscreen) {
        container.webkitRequestFullscreen();
      } else if (container.mozRequestFullScreen) {
        container.mozRequestFullScreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      }
    }
    setFullscreen(!fullscreen);
  };

  const skipForward = (seconds = 10) => {
    if (playerRef.current) {
      const currentTime = playerRef.current.getCurrentTime();
      playerRef.current.seekTo(currentTime + seconds);
    }
  };

  const skipBackward = (seconds = 10) => {
    if (playerRef.current) {
      const currentTime = playerRef.current.getCurrentTime();
      playerRef.current.seekTo(Math.max(0, currentTime - seconds));
    }
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleMouseMove = () => {
    setShowControls(true);
  };

  // الحصول على المدة عندما يتغير الفيديو
  useEffect(() => {
    if (playerRef.current && playerReady) {
      const interval = setInterval(() => {
        if (playerRef.current) {
          const internalPlayer = playerRef.current.getInternalPlayer();
          if (internalPlayer && internalPlayer.getDuration) {
            const videoDuration = internalPlayer.getDuration();
            if (videoDuration && videoDuration !== duration) {
              setDuration(videoDuration);
            }
          }
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [playerReady, duration]);

  return (
    <div 
      className="react19-video-container"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* مشغل الفيديو */}
      <div className="player-wrapper">
        <ReactPlayer
          ref={playerRef}
          url={url}
          width="100%"
          height="100%"
          playing={playing}
          volume={volume}
          playbackRate={playbackRate}
          onProgress={handleProgress}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onReady={handleReady}
          onError={(e) => console.error('Video error:', e)}
          config={{
            youtube: {
              playerVars: {
                controls: 0,
                modestbranding: 1,
                rel: 0,
                showinfo: 0,
                fs: 0,
                disablekb: 1
              }
            }
          }}
          style={{
            borderRadius: '8px'
          }}
        />
        
        {/* زر التشغيل/الإيقاف المركزي */}
        {!playing && (
          <div 
            className="center-play-button"
            onClick={handlePlayPause}
          >
            <div className="play-icon">
              ▶️
            </div>
          </div>
        )}
      </div>

      {/* عناصر التحكم المخصصة */}
      <div 
        className={`custom-controls-panel ${showControls ? 'visible' : 'hidden'}`}
      >
        {/* شريط التقدم */}
        <div className="progress-control">
          <div className="time-display">
            <span>{formatTime(played * duration)}</span>
            <span> / </span>
            <span>{formatTime(duration)}</span>
          </div>
          <input
            type="range"
            min={0}
            max={0.999999}
            step="any"
            value={played}
            onChange={handleSeekChange}
            onMouseDown={handleSeekMouseDown}
            onMouseUp={handleSeekMouseUp}
            className="progress-slider"
          />
        </div>

        {/* أزرار التحكم الرئيسية */}
        <div className="main-controls">
          <div className="left-controls">
            <button onClick={handlePlayPause} className="control-btn">
              {playing ? '⏸️ إيقاف' : '▶️ تشغيل'}
            </button>
            
            <button onClick={() => skipBackward(10)} className="control-btn" title="رجوع 10 ثواني">
              ⏪ 10s
            </button>
            
            <button onClick={() => skipForward(10)} className="control-btn" title="تقديم 10 ثواني">
              10s ⏩
            </button>

            <div className="volume-control">
              <span className="volume-icon">{volume > 0 ? '🔊' : '🔇'}</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.1}
                value={volume}
                onChange={handleVolumeChange}
                className="volume-slider"
              />
              <span className="volume-percent">{Math.round(volume * 100)}%</span>
            </div>
          </div>

          <div className="right-controls">
            <select 
              value={playbackRate} 
              onChange={(e) => handlePlaybackRateChange(parseFloat(e.target.value))}
              className="speed-select"
              title="سرعة التشغيل"
            >
              <option value={0.5}>0.5x</option>
              <option value={0.75}>0.75x</option>
              <option value={1}>1x عادي</option>
              <option value={1.25}>1.25x</option>
              <option value={1.5}>1.5x</option>
              <option value={2}>2x</option>
            </select>

            <button onClick={toggleFullscreen} className="control-btn fullscreen-btn" title="ملء الشاشة">
              {fullscreen ? '⛶ خروج' : '⛶ ملء'}
            </button>
          </div>
        </div>
      </div>

      {/* رسالة التحميل */}
      {!playerReady && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <span>جاري تحميل الفيديو...</span>
        </div>
      )}
    </div>
  );
};

export default React19VideoPlayer;