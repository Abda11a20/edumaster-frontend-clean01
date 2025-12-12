import { motion } from 'framer-motion';

const ThemeToggleIcon = ({ theme, className = "" }) => {
  return (
    <div className={`relative w-6 h-6 ${className}`}>
      {/* الشمس في الوضع الفاتح */}
      <motion.div
        initial={false}
        animate={{
          rotate: theme === 'light' ? 0 : 90,
          scale: theme === 'light' ? 1 : 0,
          opacity: theme === 'light' ? 1 : 0,
        }}
        transition={{ duration: 0.4, type: "spring", stiffness: 200 }}
        className="absolute inset-0"
      >
        <svg viewBox="0 0 24 24" className="w-full h-full">
          {/* دائرة الشمس الرئيسية */}
          <circle 
            cx="12" 
            cy="12" 
            r="5" 
            fill="#FBBF24" 
            stroke="#F59E0B" 
            strokeWidth="1.5"
          />
          
          {/* أشعة الشمس المتحركة */}
          {theme === 'light' && (
            <>
              {[...Array(8)].map((_, i) => (
                <motion.rect
                  key={i}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ 
                    opacity: [0.3, 0.7, 0.3],
                    scale: [0.8, 1.2, 0.8],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.1,
                    ease: "easeInOut"
                  }}
                  x="11.5"
                  y="2"
                  width="1"
                  height="4"
                  rx="0.5"
                  fill="#FBBF24"
                  transform={`rotate(${i * 45} 12 12)`}
                />
              ))}
            </>
          )}
        </svg>
      </motion.div>

      {/* القمر في الوضع الداكن */}
      <motion.div
        initial={false}
        animate={{
          rotate: theme === 'dark' ? 0 : -90,
          scale: theme === 'dark' ? 1 : 0,
          opacity: theme === 'dark' ? 1 : 0,
        }}
        transition={{ duration: 0.4, type: "spring", stiffness: 200 }}
        className="absolute inset-0"
      >
        <svg viewBox="0 0 24 24" className="w-full h-full">
          {/* دائرة القمر الرئيسية */}
          <path 
            d="M12 3a9 9 0 1 0 9 9 6.5 6.5 0 0 1-9-9z" 
            fill="#8B5CF6" 
            stroke="#7C3AED" 
            strokeWidth="1.5"
          />
          
          {/* نجوم متحركة في الوضع الداكن */}
          {theme === 'dark' && (
            <>
              {[
                { x: 4, y: 8, delay: 0 },
                { x: 18, y: 4, delay: 0.2 },
                { x: 6, y: 18, delay: 0.4 },
              ].map((star, i) => (
                <motion.circle
                  key={i}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ 
                    opacity: [0, 1, 0],
                    scale: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    delay: star.delay,
                    ease: "easeInOut"
                  }}
                  cx={star.x}
                  cy={star.y}
                  r="1"
                  fill="white"
                  filter="drop-shadow(0 0 2px white)"
                />
              ))}
            </>
          )}
        </svg>
      </motion.div>

      {/* دائرة خلفية مع تأثير تحرك */}
      <motion.div
        initial={false}
        animate={{
          backgroundColor: theme === 'light' ? 'rgba(251, 191, 36, 0.1)' : 'rgba(139, 92, 246, 0.1)',
          borderColor: theme === 'light' ? 'rgba(251, 191, 36, 0.3)' : 'rgba(139, 92, 246, 0.3)',
        }}
        transition={{ duration: 0.4 }}
        className="absolute inset-0 rounded-full border-2"
      />
    </div>
  );
};

export default ThemeToggleIcon;