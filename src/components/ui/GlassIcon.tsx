import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface GlassIconProps {
  icon: ReactNode;
  color: 'indigo' | 'teal' | 'crimson' | 'slate';
  pulse?: boolean;
}

export function GlassIcon({ icon, color, pulse = true }: GlassIconProps) {
  const bgGradients = {
    indigo: 'from-[#4F46E5] to-[#312E81]',
    teal: 'from-[#0D9488] to-[#115E59]',
    crimson: 'from-[#E11D48] to-[#881337]',
    slate: 'from-[#475569] to-[#1E293B]',
  };

  const shadowColors = {
    indigo: 'rgba(79, 70, 229, 0.4)',
    teal: 'rgba(13, 148, 136, 0.4)',
    crimson: 'rgba(225, 29, 72, 0.4)',
    slate: 'rgba(71, 85, 105, 0.4)',
  };

  return (
    <div className="relative flex items-center justify-center w-64 h-64 mx-auto mb-12">
      {/* Background Pulse */}
      {pulse && (
        <motion.div
          className={`absolute inset-0 rounded-[3rem] bg-gradient-to-br ${bgGradients[color]} blur-2xl opacity-60`}
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      {/* 3D Glass Object */}
      <motion.div
        className={`relative z-10 w-48 h-48 rounded-[3rem] bg-gradient-to-br ${bgGradients[color]} flex items-center justify-center`}
        style={{
          boxShadow: `
            inset 0 10px 20px rgba(255,255,255,0.4),
            inset 0 -10px 20px rgba(0,0,0,0.2),
            0 20px 40px ${shadowColors[color]},
            0 0 0 2px rgba(255,255,255,0.2)
          `,
          backdropFilter: 'blur(10px)',
          transformStyle: 'preserve-3d',
          perspective: 1000,
        }}
        animate={{ y: [0, -10, 0], rotateX: [0, 5, 0], rotateY: [0, -5, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      >
        {/* Inner Glare / Reflection */}
        <div className="absolute inset-0 rounded-[3rem] bg-gradient-to-b from-white/30 to-transparent pointer-events-none" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 40%, 0 20%)' }} />
        
        {/* The Icon */}
        <div className="text-white drop-shadow-lg z-20 scale-150">
          {icon}
        </div>
      </motion.div>
    </div>
  );
}
