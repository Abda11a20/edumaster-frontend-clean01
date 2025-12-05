import { useEffect, useRef, useState } from 'react';

const CustomVideoPlayer = ({ videoId, title }) => {
  const playerRef = useRef(null);
  const iframeRef = useRef(null);
  const [player, setPlayer] = useState(null);

  useEffect(() => {
    // تحميل YouTube IFrame API
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

    // تهيئة المشغل عندما تكون API جاهزة
    window.onYouTubeIframeAPIReady = () => {
      const newPlayer = new window.YT.Player(iframeRef.current, {
        videoId: videoId,
        playerVars: {
          'autoplay': 0,
          'controls': 1,
          'rel': 0,
          'showinfo': 0,
          'modestbranding': 1,
          'fs': 1, // منع وضع الملء الشاشة
          'disablekb': 1, // منع التحكم باللوحة المفاتيح
          'iv_load_policy': 3, // إخفاء التعليقات التوضيحية
          'playsinline': 1 // التشغيل داخل الصفحة فقط
        },
        events: {
          'onReady': onPlayerReady,
          'onStateChange': onPlayerStateChange
        }
      });
      setPlayer(newPlayer);
    };

    return () => {
      if (player) {
        player.destroy();
      }
    };
  }, [videoId]);

  const onPlayerReady = (event) => {
    // يمكنك إضافة أي إعدادات إضافية هنا عند جاهزية المشغل
  };

  const onPlayerStateChange = (event) => {
    // التحكم في حالات التشغيل
  };

  return (
    <div 
      ref={playerRef}
      className="relative w-full h-full bg-black rounded-lg overflow-hidden video-protected"
      style={{ 
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none'
      }}
    >
      <div 
        id="youtube-player"
        ref={iframeRef}
        className="w-full h-full"
      />
      
      {/* طبقة حماية إضافية */}
      <div 
        className="absolute inset-0"
        onContextMenu={(e) => e.preventDefault()}
        onDoubleClick={(e) => e.preventDefault()}
        style={{
          pointerEvents: 'none'
        }}
      />
    </div>
  );
};

export default CustomVideoPlayer;