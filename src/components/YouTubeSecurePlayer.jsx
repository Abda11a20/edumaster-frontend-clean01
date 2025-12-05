import { useEffect, useRef } from 'react';

const YouTubeSecurePlayer = ({ videoId, title }) => {
  const playerRef = useRef(null);
  const iframeRef = useRef(null);

  useEffect(() => {
    // منع النقر بزر الماوس الأيمن على الـ iframe
    const preventContextMenu = (e) => {
      e.preventDefault();
      return false;
    };

    const iframe = iframeRef.current;
    if (iframe) {
      iframe.addEventListener('contextmenu', preventContextMenu);
      
      // محاولة منع فتح الفيديو في نافذة جديدة
      iframe.addEventListener('load', () => {
        try {
          iframe.contentWindow.document.addEventListener('contextmenu', preventContextMenu);
        } catch (e) {
          // تجاوز خطأ CORS
        }
      });
    }

    return () => {
      if (iframe) {
        iframe.removeEventListener('contextmenu', preventContextMenu);
      }
    };
  }, []);

  const iframeSrc = `https://www.youtube.com/embed/${videoId}?autoplay=0&controls=1&rel=0&showinfo=0&modestbranding=1&fs=0`;

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
      <iframe
        ref={iframeRef}
        src={iframeSrc}
        title={title}
        className="w-full h-full"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen={false}
        loading="lazy"
        style={{
          pointerEvents: 'auto'
        }}
      />
      
      {/* طبقة حماية إضافية لمنع النقر بزر الماوس الأيمن */}
      <div 
        className="absolute inset-0"
        onContextMenu={(e) => e.preventDefault()}
        style={{
          pointerEvents: 'none'
        }}
      />
    </div>
  );
};

export default YouTubeSecurePlayer;