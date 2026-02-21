import React from 'react';
import './StyledCard.css';

const StyledCard = ({ 
  icon, 
  iconBgColor = '#e0e7ff', 
  iconColor = '#4f46e5',
  timestamp, 
  subtitle, 
  title, 
  description, 
  onClick,
  status,
  footer
}) => {
  return (
    <div className="styled-card" onClick={onClick}>
      <div className="styled-card-header">
        <div 
          className="styled-card-icon" 
          style={{ 
            backgroundColor: iconBgColor, 
            color: iconColor,
            backgroundImage: typeof icon === 'string' && icon.includes('/') ? `url(${icon})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          {typeof icon === 'string' && icon.includes('/') ? null : icon}
        </div>
        {timestamp && <div className="styled-card-time">{timestamp}</div>}
      </div>
      
      <div className="styled-card-body">
        {subtitle && <div className="styled-card-subtitle">{subtitle}</div>}
        <h3 className="styled-card-title">{title}</h3>
        {description && <div className="styled-card-desc">{description}</div>}
      </div>

      {(status || footer) && (
        <div className="styled-card-footer">
          {status}
          {footer}
        </div>
      )}
    </div>
  );
};

export default StyledCard;
