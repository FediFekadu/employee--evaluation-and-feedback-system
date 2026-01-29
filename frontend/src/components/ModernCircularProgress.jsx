import { useState, useEffect } from 'react';

function ModernCircularProgress({ 
  percentage, 
  size = 200, 
  strokeWidth = 12, 
  title = "Total", 
  subtitle = "Final Score",
  performanceLevel = "",
  animated = true,
  showGlow = true,
  colors = {
    excellent: '#10b981', // green-500
    good: '#3b82f6',      // blue-500
    average: '#f59e0b',   // amber-500
    poor: '#ef4444'       // red-500
  }
}) {
  const [animatedPercentage, setAnimatedPercentage] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  
  // Intersection observer for animation trigger
  useEffect(() => {
    setIsVisible(true);
  }, []);
  
  // Animation effect
  useEffect(() => {
    if (!animated || !isVisible) {
      setAnimatedPercentage(percentage);
      return;
    }

    const duration = 2000; // 2 seconds for smoother animation
    const steps = 80;
    const increment = percentage / steps;
    let current = 0;
    
    // Add a small delay before starting animation
    const startDelay = setTimeout(() => {
      const timer = setInterval(() => {
        current += increment;
        if (current >= percentage) {
          setAnimatedPercentage(percentage);
          clearInterval(timer);
        } else {
          setAnimatedPercentage(current);
        }
      }, duration / steps);
    }, 300);

    return () => {
      clearTimeout(startDelay);
    };
  }, [percentage, animated, isVisible]);

  // Calculate circle properties
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (animatedPercentage / 100) * circumference;

  // Determine color based on performance level or percentage
  const getColor = () => {
    if (performanceLevel) {
      const level = performanceLevel.toLowerCase();
      if (level.includes('excellent')) return colors.excellent;
      if (level.includes('good') || level.includes('very good')) return colors.good;
      if (level.includes('average') || level.includes('satisfactory') || level.includes('fair')) return colors.average;
      if (level.includes('poor') || level.includes('needs improvement')) return colors.poor;
    }
    
    // More reasonable percentage-based coloring for academic evaluations
    if (percentage >= 85) return colors.excellent;  // 85%+ = Excellent (Green)
    if (percentage >= 70) return colors.good;       // 70-84% = Good (Blue)
    if (percentage >= 55) return colors.average;    // 55-69% = Average (Amber)
    return colors.poor;                             // <55% = Needs Improvement (Red)
  };

  const primaryColor = getColor();
  const glowColor = showGlow ? `${primaryColor}40` : 'transparent';

  return (
    <div className="modern-circular-progress" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="progress-svg"
      >
        <defs>
          {/* Gradient definition */}
          <linearGradient id={`gradient-${Math.random()}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={primaryColor} stopOpacity="1" />
            <stop offset="100%" stopColor={primaryColor} stopOpacity="0.7" />
          </linearGradient>
          
          {/* Glow filter */}
          {showGlow && (
            <filter id={`glow-${Math.random()}`}>
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge> 
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          )}
        </defs>
        
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--border-soft, #e5e7eb)"
          strokeWidth={strokeWidth}
          className="progress-bg"
        />
        
        {/* Glow circle (behind main progress) */}
        {showGlow && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={glowColor}
            strokeWidth={strokeWidth + 4}
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{
              transform: 'rotate(-90deg)',
              transformOrigin: '50% 50%',
              transition: animated ? 'stroke-dashoffset 0.1s ease-out' : 'none',
              opacity: 0.6
            }}
          />
        )}
        
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={primaryColor}
          strokeWidth={strokeWidth}
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="progress-fill"
          style={{
            transform: 'rotate(-90deg)',
            transformOrigin: '50% 50%',
            transition: animated ? 'stroke-dashoffset 0.1s ease-out' : 'none',
            filter: showGlow ? `drop-shadow(0 0 8px ${glowColor})` : 'drop-shadow(0 0 8px rgba(0,0,0,0.1))'
          }}
        />
      </svg>
      
      {/* Center content */}
      <div className="progress-content">
        <div className="progress-title">{title}</div>
        <div className="progress-percentage" style={{ color: primaryColor }}>
          {Math.round(animatedPercentage)}%
        </div>
        <div className="progress-subtitle">{subtitle}</div>
        {performanceLevel && (
          <div 
            className="progress-performance" 
            style={{ 
              color: primaryColor,
              borderColor: `${primaryColor}30`,
              backgroundColor: `${primaryColor}10`
            }}
          >
            {performanceLevel}
          </div>
        )}
      </div>
    </div>
  );
}

export default ModernCircularProgress;