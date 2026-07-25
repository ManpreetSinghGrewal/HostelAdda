import React, { useEffect, useRef, useContext } from 'react';
import { ThemeContext } from '../contexts/ThemeContext';
import './ParticleBackground.css';

const ParticleBackground = () => {
  const canvasRef = useRef(null);
  const { isDark } = useContext(ThemeContext);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Dynamic colors based on theme
    const colors = isDark
      ? [
          'rgba(249, 115, 22, ',  // Primary Warm Orange
          'rgba(251, 146, 60, ',  // Light Warm Orange
          'rgba(245, 158, 11, ',  // Golden Amber
          'rgba(251, 191, 36, ',  // Warm Gold
          'rgba(234, 88, 12, ',   // Deep Crimson Orange
          'rgba(251, 113, 133, '  // Soft Coral
        ]
      : [
          'rgba(234, 88, 12, ',   // Rich Orange
          'rgba(249, 115, 22, ',  // Primary Orange
          'rgba(217, 119, 6, ',   // Amber Brown
          'rgba(245, 158, 11, '   // Bright Amber
        ];

    const particleCount = Math.floor(Math.min(window.innerWidth * 0.12, 160));
    const particles = [];

    const mouse = { x: -1000, y: -1000 };
    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    window.addEventListener('mousemove', handleMouseMove);

    class Particle {
      constructor() {
        this.reset(true);
      }

      reset(initial = false) {
        this.x = Math.random() * width;
        this.y = initial ? Math.random() * height : height + 10;
        this.size = Math.random() * 2.2 + 0.6;
        this.speedY = -(Math.random() * 0.35 + 0.12);
        this.speedX = (Math.random() - 0.5) * 0.25;
        this.baseColor = colors[Math.floor(Math.random() * colors.length)];
        this.alpha = isDark ? Math.random() * 0.5 + 0.2 : Math.random() * 0.25 + 0.1;
        this.angle = Math.random() * Math.PI * 2;
        this.wobbleSpeed = Math.random() * 0.012 + 0.004;
      }

      update() {
        this.angle += this.wobbleSpeed;
        this.x += this.speedX + Math.sin(this.angle) * 0.2;
        this.y += this.speedY;

        this.alpha += Math.sin(this.angle) * 0.002;
        const maxAlpha = isDark ? 0.75 : 0.35;
        const minAlpha = isDark ? 0.15 : 0.08;
        if (this.alpha > maxAlpha) this.alpha = maxAlpha;
        if (this.alpha < minAlpha) this.alpha = minAlpha;

        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 100) {
          const force = (100 - dist) / 100;
          this.x -= (dx / dist) * force * 1.2;
          this.y -= (dy / dist) * force * 1.2;
        }

        if (this.y < -10 || this.x < -10 || this.x > width + 10) {
          this.reset(false);
        }
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);

        const gradient = ctx.createRadialGradient(
          this.x, this.y, 0,
          this.x, this.y, this.size * 2.5
        );
        gradient.addColorStop(0, `${this.baseColor}${this.alpha})`);
        gradient.addColorStop(0.5, `${this.baseColor}${this.alpha * 0.4})`);
        gradient.addColorStop(1, `${this.baseColor}0)`);

        ctx.fillStyle = gradient;
        ctx.fill();
      }
    }

    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.update();
        p.draw();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isDark]);

  return (
    <div className={`particle-bg-container ${isDark ? 'dark-bg' : 'light-bg'}`}>
      <div className="particle-bg-gradient" />
      <canvas ref={canvasRef} className="particle-bg-canvas" />
    </div>
  );
};

export default ParticleBackground;
