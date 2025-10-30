# App Icons

This directory contains the app icons for Emmy's Learning Adventure PWA.

## Icon Sizes

The following icon sizes are required for full PWA support:

- 16x16 - Browser favicon
- 32x32 - Browser favicon
- 72x72 - Android Chrome
- 96x96 - Android Chrome
- 128x128 - Android Chrome
- 144x144 - Microsoft Tile
- 152x152 - iOS Safari
- 192x192 - Android Chrome (standard)
- 384x384 - Android Chrome
- 512x512 - Android Chrome (high-res)

## Generating Icons

You can generate these icons using the iconGenerator utility:

```javascript
import { generateIconsForDownload } from '../src/utils/iconGenerator';
generateIconsForDownload();
```

Or create them manually with the following specifications:
- Format: PNG
- Background: Purple (#8b5cf6)
- Icon: 🎮 emoji or custom design
- Rounded corners: 20% radius for modern look

## Current Status

Currently using placeholder icons. Replace with actual designed icons for production.