import React, { useEffect, useState } from 'react';

interface CustomAvatarProps {
  src?: string | null;
  name?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const CustomAvatar: React.FC<CustomAvatarProps> = ({
  src,
  name = '',
  size = 'md',
  className = '',
}) => {
  const [errored, setErrored] = useState(false);
  const hasSrc = typeof src === 'string' && src.trim().length > 0;

  useEffect(() => {
    if (hasSrc) setErrored(false);
  }, [hasSrc, src]);
  
  const sizeClasses = {
    sm: 'h-8 w-8 text-sm',
    md: 'h-9 w-9 text-base',
    lg: 'h-10 w-10 text-lg',
  };

  const showFallback = !hasSrc || errored;
  const initial = name?.[0]?.toUpperCase() || 'U';

  if (showFallback) {
    return (
      <div
        className={`${sizeClasses[size]} ${className} rounded-full flex items-center justify-center bg-primary text-primary-foreground font-semibold`}
        aria-label={name || 'User avatar'}
      >
        {initial}
      </div>
    );
  }

  return (
    <img
      key={src || 'avatar'}
      src={hasSrc ? src! : undefined}
      alt={name || 'User avatar'}
      className={`${sizeClasses[size]} ${className} rounded-full object-cover ring-1 ring-border`}
      referrerPolicy="no-referrer"
      crossOrigin="anonymous"
      loading="lazy"
      decoding="async"
      onError={() => setErrored(true)}
    />
  );
};
