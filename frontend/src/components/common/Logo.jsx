import React from 'react';

const Logo = ({ className = '', alt = '' }) => (
  <img
    src="/logo.jpg"
    alt={alt}
    draggable="false"
    className={`object-cover ${className}`}
  />
);

export default Logo;
