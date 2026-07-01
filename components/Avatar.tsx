import React from 'react';

interface AvatarProps {
  url: string | null;
  initials: string;
  color: string;
  size?: number;
  shape?: 'circle' | 'rounded';
}

const Avatar: React.FC<AvatarProps> = ({ url, initials, color, size = 40, shape = 'circle' }) => {
  const roundedClass = shape === 'circle' ? 'rounded-full' : 'rounded-lg';
  
  if (url) {
    return (
      <img 
        src={url} 
        alt="Avatar" 
        className={`${roundedClass} object-cover flex-shrink-0`}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div 
      className={`${roundedClass} flex items-center justify-center text-white font-bold flex-shrink-0`}
      style={{ 
        backgroundColor: color, 
        width: size, 
        height: size,
        fontSize: size * 0.4 
      }}
    >
      {initials.slice(0, 2).toUpperCase()}
    </div>
  );
};

export default Avatar;