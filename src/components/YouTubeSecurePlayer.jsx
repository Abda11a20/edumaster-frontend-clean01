import { useEffect, useRef, useState } from 'react';

// سجل عالمي لجميع مشغلات الفيديو النشطة
const videoPlayerRegistry = new Map();

// دالة لإيقاف جميع الفيديوهات ما عدا الفيديو المحدد
const pauseAllExcept = (exceptId) => {
  videoPlayerRegistry.forEach((player, id) => {
    if (id !== exceptId && player && typeof player.pauseVideo === 'function') {
      try {
        player.pauseVideo();
      } catch (e) {
        // تجاهل الأخطاء
      }
    }
  });
};

const YouTubeSecurePlayer = ({ videoId, title }) => {
  const containerRef = useRef(null);
  const playerRef = useRef(null);
  const [isApiReady, setIsApiReady] = useState(false);
  const uniqueId = useRef(`player_${videoId}_${Date.now()}_${Math.random()}`);

  // تحميل YouTube API مرة واحدة
  useEffect(() => {
    if (window.YT && window.YT.Player) {
      setIsApiReady(true);
      return;
    }

    if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }

    const checkReady = setInterval(() => {
      if (window.YT && window.YT.Player) {
        setIsApiReady(true);
        clearInterval(checkReady);
      }
    }, 100);

    return () => clearInterval(checkReady);
  }, []);

  // تهيئة اللاعب
  useEffect(() => {
    if (!isApiReady || !videoId || !containerRef.current || playerRef.current) {
      return;
    }

    const player = new window.YT.Player(containerRef.current, {
      height: '100%',
      width: '100%',
      videoId: videoId,
      playerVars: {
        autoplay: 0,
        controls: 1,
        rel: 0,
        showinfo: 0,
        modestbranding: 1,
        fs: 1,
        playsinline: 1
      },
      events: {
        onStateChange: (event) => {
          // عند بدء التشغيل، أوقف جميع الفيديوهات الأخرى
          if (event.data === window.YT.PlayerState.PLAYING) {
            pauseAllExcept(uniqueId.current);
          }
        },
        onReady: () => {
          // تسجيل اللاعب في السجل العالمي
          videoPlayerRegistry.set(uniqueId.current, player);
        }
      }
    });
    playerRef.current = player;

    // تنظيف عند إزالة المكون
    return () => {
      videoPlayerRegistry.delete(uniqueId.current);
      if (playerRef.current && typeof playerRef.current.destroy === 'function') {
        try {
          playerRef.current.destroy();
        } catch (e) {
          // تجاهل الأخطاء
        }
      }
      playerRef.current = null;
    };
  }, [isApiReady, videoId]);

  return (
    <div
      className="relative w-full h-full bg-black rounded-lg overflow-hidden video-protected"
      style={{
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none'
      }}
    >
      <div ref={containerRef} className="w-full h-full" />
      <div
        className="absolute inset-0 pointer-events-none"
        onContextMenu={(e) => e.preventDefault()}
      />
    </div>
  );
};

export default YouTubeSecurePlayer;