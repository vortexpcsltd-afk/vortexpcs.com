export function BackgroundEffects() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Animated gradient mesh base */}
      <div className="absolute inset-0">
        <div 
          className="absolute top-0 left-0 w-full h-full opacity-35"
          style={{
            background: `
              radial-gradient(circle at 20% 30%, rgba(0, 230, 255, 0.12) 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, rgba(100, 200, 255, 0.08) 0%, transparent 50%),
              radial-gradient(circle at 40% 70%, rgba(0, 200, 230, 0.1) 0%, transparent 50%),
              radial-gradient(circle at 70% 80%, rgba(180, 220, 255, 0.06) 0%, transparent 50%)
            `,
          }}
        />
      </div>

      {/* Animated floating orb 1 - Electric Cyan */}
      <div 
        className="absolute"
        style={{
          top: '10%',
          left: '15%',
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(0, 230, 255, 0.18) 0%, rgba(0, 200, 230, 0.09) 25%, transparent 70%)',
          filter: 'blur(60px)',
          animation: 'float 20s ease-in-out infinite',
          opacity: 0.7,
        }}
      />

      {/* Animated floating orb 2 - Ice Blue */}
      <div 
        className="absolute"
        style={{
          top: '60%',
          right: '10%',
          width: '600px',
          height: '600px',
          background: 'radial-gradient(circle, rgba(100, 200, 255, 0.15) 0%, rgba(120, 210, 255, 0.07) 25%, transparent 70%)',
          filter: 'blur(80px)',
          animation: 'float 25s ease-in-out infinite reverse',
          opacity: 0.6,
        }}
      />

      {/* Animated floating orb 3 - Platinum accent */}
      <div 
        className="absolute"
        style={{
          bottom: '15%',
          left: '30%',
          width: '400px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(180, 220, 255, 0.12) 0%, rgba(200, 230, 255, 0.06) 25%, transparent 70%)',
          filter: 'blur(70px)',
          animation: 'float 30s ease-in-out infinite',
          opacity: 0.5,
        }}
      />

      {/* Spotlight effect - top */}
      <div 
        className="absolute"
        style={{
          top: '-20%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '1200px',
          height: '800px',
          background: 'radial-gradient(ellipse, rgba(100, 200, 255, 0.07) 0%, transparent 70%)',
          filter: 'blur(100px)',
          opacity: 0.6,
        }}
      />

      {/* Side accent lights */}
      <div 
        className="absolute"
        style={{
          top: '40%',
          left: '-10%',
          width: '400px',
          height: '600px',
          background: 'radial-gradient(ellipse, rgba(0, 230, 255, 0.1) 0%, transparent 70%)',
          filter: 'blur(80px)',
          opacity: 0.45,
          animation: 'pulse 8s ease-in-out infinite',
        }}
      />

      <div 
        className="absolute"
        style={{
          top: '30%',
          right: '-10%',
          width: '450px',
          height: '650px',
          background: 'radial-gradient(ellipse, rgba(100, 200, 255, 0.09) 0%, transparent 70%)',
          filter: 'blur(80px)',
          opacity: 0.45,
          animation: 'pulse 10s ease-in-out infinite reverse',
        }}
      />

      {/* Subtle grid overlay */}
      <div 
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />

      {/* Noise texture overlay */}
      <div 
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
        }}
      />

      {/* Edge vignette - top */}
      <div 
        className="absolute top-0 left-0 right-0 h-64"
        style={{
          background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.4) 0%, transparent 100%)',
        }}
      />

      {/* Edge vignette - bottom */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-48"
        style={{
          background: 'linear-gradient(0deg, rgba(0, 0, 0, 0.3) 0%, transparent 100%)',
        }}
      />

      {/* Subtle side shadows */}
      <div 
        className="absolute top-0 left-0 bottom-0 w-32"
        style={{
          background: 'linear-gradient(90deg, rgba(0, 0, 0, 0.2) 0%, transparent 100%)',
        }}
      />

      <div 
        className="absolute top-0 right-0 bottom-0 w-32"
        style={{
          background: 'linear-gradient(-90deg, rgba(0, 0, 0, 0.2) 0%, transparent 100%)',
        }}
      />

      {/* Animated RGB accent streaks */}
      <div 
        className="absolute"
        style={{
          top: '25%',
          right: '20%',
          width: '2px',
          height: '150px',
          background: 'linear-gradient(180deg, transparent, rgba(0, 230, 255, 0.5), transparent)',
          filter: 'blur(1px)',
          opacity: 0.7,
          animation: 'slideDown 3s ease-in-out infinite',
        }}
      />

      <div 
        className="absolute"
        style={{
          top: '50%',
          left: '25%',
          width: '2px',
          height: '120px',
          background: 'linear-gradient(180deg, transparent, rgba(100, 200, 255, 0.45), transparent)',
          filter: 'blur(1px)',
          opacity: 0.6,
          animation: 'slideDown 4s ease-in-out infinite 1s',
        }}
      />

      {/* Subtle animated particles */}
      {[...Array(12)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            width: `${2 + Math.random() * 3}px`,
            height: `${2 + Math.random() * 3}px`,
            background: `rgba(${Math.random() > 0.5 ? '0, 230, 255' : '100, 200, 255'}, 0.35)`,
            filter: 'blur(1px)',
            animation: `twinkle ${3 + Math.random() * 4}s ease-in-out infinite ${Math.random() * 2}s`,
          }}
        />
      ))}

      {/* CSS animations */}
      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translate(0, 0);
          }
          25% {
            transform: translate(30px, -30px);
          }
          50% {
            transform: translate(-20px, 20px);
          }
          75% {
            transform: translate(20px, 10px);
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 0.4;
          }
          50% {
            opacity: 0.6;
          }
        }

        @keyframes slideDown {
          0% {
            transform: translateY(-100%);
            opacity: 0;
          }
          50% {
            opacity: 0.6;
          }
          100% {
            transform: translateY(300px);
            opacity: 0;
          }
        }

        @keyframes twinkle {
          0%, 100% {
            opacity: 0.2;
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.5);
          }
        }
      `}</style>
    </div>
  );
}
