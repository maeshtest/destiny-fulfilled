import { Link } from "react-router-dom";

interface MaragaLogoProps {
  className?: string;
  variant?: "default" | "white";
}

const MaragaLogo = ({ className = "", variant = "default" }: MaragaLogoProps) => {
  const isWhite = variant === "white";
  
  return (
    <Link to="/" className={`flex items-center gap-1 ${className}`}>
      {/* Kenyan hat/cap icon */}
      <svg width="40" height="32" viewBox="0 0 40 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Red cap */}
        <ellipse cx="20" cy="8" rx="12" ry="6" fill="#DC2626" />
        <path d="M8 8 Q20 2 32 8 Q32 4 20 2 Q8 4 8 8" fill="#DC2626" />
        {/* Green M shape below */}
        <path 
          d="M6 14 L12 28 L20 18 L28 28 L34 14" 
          stroke={isWhite ? "#FFFFFF" : "#1A8754"} 
          strokeWidth="4" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
      
      {/* Text */}
      <div className="flex items-baseline">
        <span 
          className={`text-2xl font-bold tracking-tight ${isWhite ? "text-white" : "text-primary"}`}
          style={{ fontFamily: '"Inter", sans-serif' }}
        >
          MARAGA
        </span>
        <span 
          className="text-lg font-semibold text-accent ml-0.5"
          style={{ fontFamily: '"Inter", sans-serif' }}
        >
          '27
        </span>
      </div>
    </Link>
  );
};

export default MaragaLogo;
