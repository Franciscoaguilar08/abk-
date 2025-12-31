import React from 'react';

interface SciFiButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export const SciFiButton: React.FC<SciFiButtonProps> = ({ children, className, ...props }) => {
  return (
    <button
      className={`scifi-btn ${className || ''}`}
      {...props}
    >
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
      <style>{`
        .scifi-btn {
          --border-radius: 12px;
          --border-width: 2px;
          appearance: none;
          position: relative;
          padding: 1em 2em;
          border: 0;
          background-color: rgba(15, 23, 42, 0.8); /* Slate 900 transparent */
          font-family: "Outfit", sans-serif;
          font-size: 16px;
          font-weight: 600;
          color: #fff;
          z-index: 2;
          overflow: hidden;
          cursor: pointer;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          transition: transform 0.2s ease;
        }

        .scifi-btn:hover {
            transform: translateY(-2px);
        }

        .scifi-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            filter: grayscale(1);
        }

        .scifi-btn::after {
          --m-i: linear-gradient(#000, #000);
          --m-o: content-box, padding-box;
          content: "";
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          height: 100%;
          padding: var(--border-width);
          border-radius: var(--border-radius);
          /* CUSTOM APP PALETTE: Violet, Cyan, Emerald, Indigo */
          background-image: conic-gradient(
            #8b5cf6, /* Violet 500 */
            #06b6d4, /* Cyan 500 */
            #10b981, /* Emerald 500 */
            #6366f1, /* Indigo 500 */
            #8b5cf6  /* Loop back to Violet */
          );
          -webkit-mask-image: var(--m-i), var(--m-i);
          mask-image: var(--m-i), var(--m-i);
          -webkit-mask-origin: var(--m-o);
          mask-origin: var(--m-o);
          -webkit-mask-clip: var(--m-o);
          mask-composite: exclude;
          -webkit-mask-composite: destination-out;
          filter: hue-rotate(0);
          animation: rotate-hue linear 2000ms infinite; /* Slower rotation for elegance */
        }
        
        /* Inner glow */
        .scifi-btn::before {
            content: "";
            position: absolute;
            inset: 0;
            background: radial-gradient(circle at center, rgba(139, 92, 246, 0.15), transparent 70%);
            z-index: 0;
        }

        @keyframes rotate-hue {
          to {
            filter: hue-rotate(1turn);
          }
        }
      `}</style>
    </button>
  );
};