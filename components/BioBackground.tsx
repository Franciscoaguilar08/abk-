import React, { useEffect, useRef } from 'react';

interface BioBackgroundProps {
  variant: 'landing' | 'app';
}

export const BioBackground: React.FC<BioBackgroundProps> = ({ variant }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mousePos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    // --- CONFIGURATION BASED ON VARIANT ---
    const isLanding = variant === 'landing';
    
    // Density: Higher density for Plexus effect
    const particleCount = Math.floor((width * height) / (isLanding ? 14000 : 25000)); 
    
    // Interaction
    const mouseDistance = isLanding ? 220 : 0; 
    const connectionDistance = isLanding ? 160 : 110;
    
    // Visuals: Clean Medical Look (Cyan / White / Slate)
    // Base opacity lower for subtle medical feel
    const baseOpacity = isLanding ? 0.4 : 0.15;
    const speedMultiplier = isLanding ? 0.3 : 0.15; 

    const particles: { x: number; y: number; vx: number; vy: number; size: number }[] = [];

    // Init Particles
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * speedMultiplier,
        vy: (Math.random() - 0.5) * speedMultiplier,
        size: Math.random() * (isLanding ? 2.5 : 1.5) + 0.5
      });
    }

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const handleMouseMove = (e: MouseEvent) => {
        if (isLanding) {
            mousePos.current = { x: e.clientX, y: e.clientY };
        }
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Animation Loop
    let animId: number;
    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      
      // Update & Draw Particles
      particles.forEach((p, i) => {
        // Move
        p.x += p.vx;
        p.y += p.vy;

        // Bounce edges
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        // Mouse Interaction
        if (isLanding) {
            const dxMouse = mousePos.current.x - p.x;
            const dyMouse = mousePos.current.y - p.y;
            const distMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);

            if (distMouse < mouseDistance) {
                const forceDirectionX = dxMouse / distMouse;
                const forceDirectionY = dyMouse / distMouse;
                const force = (mouseDistance - distMouse) / mouseDistance;
                const directionX = forceDirectionX * force * 0.5; 
                const directionY = forceDirectionY * force * 0.5;
                
                p.x -= directionX;
                p.y -= directionY;
            }
        }

        // Draw Dot (White/Cyan hue)
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        // Cyan-ish white
        ctx.fillStyle = `rgba(207, 250, 254, ${baseOpacity + (Math.random() * 0.2)})`; 
        ctx.fill();

        // Connect Lines (Plexus Effect)
        for (let j = i + 1; j < particles.length; j++) {
            const p2 = particles[j];
            const dx = p.x - p2.x;
            const dy = p.y - p2.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < connectionDistance) {
                ctx.beginPath();
                // Cyan connection lines (Medical Blue/Green)
                const lineAlpha = (1 - dist / connectionDistance) * (isLanding ? 0.25 : 0.05);
                ctx.strokeStyle = `rgba(34, 211, 238, ${lineAlpha})`; // Cyan-400
                ctx.lineWidth = isLanding ? 0.8 : 0.3;
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.stroke();
            }
        }
      });

      animId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animId);
    };
  }, [variant]);

  return (
    <div className="fixed inset-0 pointer-events-none -z-10 bg-[#020617]">
         {/* Base Gradient for depth - darker blue/slate base */}
        <canvas 
            ref={canvasRef} 
            className="absolute inset-0 pointer-events-none z-0"
        />
        {/* Subtle radial gradient to make center pop */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#020617_90%)] pointer-events-none z-10"></div>
    </div>
  );
};