// App Icon Generator Utility
// This utility helps generate app icons for different platforms

export const generateAppIcon = (size, emoji = '🎮', backgroundColor = '#8b5cf6') => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  canvas.width = size;
  canvas.height = size;
  
  // Draw background
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, size, size);
  
  // Add rounded corners for modern look
  ctx.globalCompositeOperation = 'destination-in';
  ctx.beginPath();
  const radius = size * 0.2; // 20% radius for rounded corners
  ctx.roundRect(0, 0, size, size, radius);
  ctx.fill();
  
  // Reset composite operation
  ctx.globalCompositeOperation = 'source-over';
  
  // Draw emoji
  ctx.font = `${size * 0.6}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(emoji, size / 2, size / 2);
  
  return canvas.toDataURL('image/png');
};

export const generateAllIcons = () => {
  const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
  const icons = {};
  
  sizes.forEach(size => {
    icons[`icon-${size}x${size}`] = generateAppIcon(size);
  });
  
  return icons;
};

export const downloadIcon = (dataUrl, filename) => {
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const generateIconsForDownload = () => {
  const icons = generateAllIcons();
  
  Object.entries(icons).forEach(([name, dataUrl]) => {
    downloadIcon(dataUrl, `${name}.png`);
  });
};

// Utility to create a simple favicon
export const generateFavicon = () => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  canvas.width = 32;
  canvas.height = 32;
  
  // Draw background
  ctx.fillStyle = '#8b5cf6';
  ctx.fillRect(0, 0, 32, 32);
  
  // Draw emoji
  ctx.font = '20px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🎮', 16, 16);
  
  return canvas.toDataURL('image/x-icon');
};

// Create placeholder icons for development
export const createPlaceholderIcons = () => {
  const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
  const iconsData = [];
  
  sizes.forEach(size => {
    const dataUrl = generateAppIcon(size);
    iconsData.push({
      size,
      dataUrl,
      filename: `icon-${size}x${size}.png`
    });
  });
  
  return iconsData;
};

// Generate manifest icons array
export const generateManifestIcons = (basePath = '/emmys-learning-app/icons/') => {
  const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
  
  return sizes.map(size => ({
    src: `${basePath}icon-${size}x${size}.png`,
    sizes: `${size}x${size}`,
    type: 'image/png',
    purpose: 'any maskable'
  }));
};

export default {
  generateAppIcon,
  generateAllIcons,
  downloadIcon,
  generateIconsForDownload,
  generateFavicon,
  createPlaceholderIcons,
  generateManifestIcons
};