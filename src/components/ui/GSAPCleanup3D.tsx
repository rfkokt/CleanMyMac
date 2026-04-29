import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { Trash, FileDashed } from '@phosphor-icons/react';

export function GSAPCleanup3D({ isCleaningUp }: { isCleaningUp: boolean }) {
  const container = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!isCleaningUp) {
      // Reset everything if not cleaning
      gsap.set('.gsap-trash', { clearProps: 'all' });
      gsap.set('.gsap-file', { opacity: 0 });
      return;
    }

    gsap.set('.gsap-scene', { perspective: 800 });

    // Trash can 3D hover and shake
    const tl = gsap.timeline({ repeat: -1 });
    
    tl.to('.gsap-trash', {
      rotationY: 180,
      duration: 0.5,
      ease: 'power2.inOut'
    })
    .to('.gsap-trash', {
      rotationZ: 15,
      yoyo: true,
      repeat: 5,
      duration: 0.08,
      ease: 'none'
    })
    .to('.gsap-trash', {
      rotationY: 360,
      duration: 0.5,
      ease: 'power2.inOut'
    });

    // Files flying down into the trash
    gsap.fromTo('.gsap-file', 
      { z: 200, y: -60, x: () => gsap.utils.random(-30, 30), rotationX: () => gsap.utils.random(-180, 180), rotationY: () => gsap.utils.random(-180, 180), opacity: 0 },
      { 
        z: 0, 
        y: 10, 
        rotationX: 0, 
        opacity: 1, 
        duration: 0.8, 
        stagger: 0.2, 
        repeat: -1,
        ease: 'power2.in'
      }
    );
  }, { scope: container, dependencies: [isCleaningUp] });

  return (
    <div ref={container} className={`relative flex items-center justify-center shrink-0 ${isCleaningUp ? 'w-32 h-32' : 'w-12 h-12'}`}>
      <div className="gsap-scene relative w-full h-full flex items-center justify-center">
        {/* Flying files */}
        <div className="absolute inset-0 flex items-start justify-center z-20 pointer-events-none overflow-hidden">
          <div className="gsap-file absolute top-0 text-[#E11D48] opacity-0"><FileDashed size={isCleaningUp ? 28 : 14} weight="fill" /></div>
          <div className="gsap-file absolute top-0 text-[#E11D48] opacity-0"><FileDashed size={isCleaningUp ? 28 : 14} weight="fill" /></div>
          <div className="gsap-file absolute top-0 text-[#E11D48] opacity-0"><FileDashed size={isCleaningUp ? 28 : 14} weight="fill" /></div>
          {isCleaningUp && (
            <>
              <div className="gsap-file absolute top-0 text-[#E11D48] opacity-0"><FileDashed size={24} weight="fill" /></div>
              <div className="gsap-file absolute top-0 text-[#E11D48] opacity-0"><FileDashed size={20} weight="fill" /></div>
            </>
          )}
        </div>

        {/* 3D Trash Can */}
        <div className={`gsap-trash relative z-10 flex items-center justify-center rounded-full bg-[#E11D48]/20 text-[#E11D48] shadow-[0_0_30px_rgba(225,29,72,0.4)] ${isCleaningUp ? 'p-6 border border-[#E11D48]/40' : 'p-2.5 border border-[#E11D48]/20'}`}>
          <Trash size={isCleaningUp ? 48 : 24} weight={isCleaningUp ? "fill" : "duotone"} />
        </div>
      </div>
    </div>
  );
}
