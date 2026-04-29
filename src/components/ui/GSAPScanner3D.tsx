import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { HardDrives } from '@phosphor-icons/react';

export function GSAPScanner3D() {
  const container = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    // Set initial 3D perspective
    gsap.set('.gsap-scene', { perspective: 800 });
    gsap.set('.gsap-ring', { rotationX: 75 });
    
    // Outer dashed ring scanning
    gsap.to('.gsap-ring-outer', {
      rotationZ: 360,
      duration: 4,
      repeat: -1,
      ease: 'none',
    });

    // Inner solid ring scanning opposite direction
    gsap.to('.gsap-ring-inner', {
      rotationZ: -360,
      duration: 3,
      repeat: -1,
      ease: 'none',
    });

    // Center icon 3D flip/hover
    gsap.to('.gsap-core', {
      rotationY: 360,
      duration: 2.5,
      repeat: -1,
      ease: 'linear',
    });
    
    // Bobbing animation for the whole container
    gsap.to('.gsap-scene', {
      y: -5,
      duration: 1.5,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut'
    });
  }, { scope: container });

  return (
    <div ref={container} className="relative w-16 h-16 flex items-center justify-center shrink-0">
      <div className="gsap-scene relative w-full h-full flex items-center justify-center">
        {/* Rings */}
        <div className="gsap-ring gsap-ring-outer absolute inset-0 rounded-full border border-accent-primary border-dashed opacity-60" />
        <div className="gsap-ring gsap-ring-inner absolute inset-2 rounded-full border border-accent-primary opacity-40" />
        
        {/* Core Icon */}
        <div className="gsap-core relative z-10 flex items-center justify-center w-8 h-8 bg-accent-primary text-white rounded-none">
          <HardDrives size={16} weight="fill" />
        </div>
      </div>
    </div>
  );
}
