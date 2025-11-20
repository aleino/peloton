export interface StationIconSVGOptions {
  size?: number;
  variant?: 'default' | 'hover' | 'active';
}

/**
 * Color schemes for different icon variants
 */
const COLOR_SCHEMES = {
  default: {
    background: '#1976d2', // MUI primary.main
    icon: '#ffffff',
    border: '#115293', // MUI primary.dark
  },
  hover: {
    background: '#42a5f5', // MUI primary.light
    icon: '#ffffff',
    border: '#1976d2',
  },
  active: {
    background: '#9c27b0', // MUI secondary.main
    icon: '#ffffff',
    border: '#6a1b9a', // MUI secondary.dark
  },
};

/**
 * Generate SVG string for station icon
 *
 * Creates an SVG with a circular background and bike icon.
 * Used for loading icons into Mapbox as image sources.
 *
 * The bike icon uses the actual Lucide bike icon paths:
 * - Two circles for wheels (cx: 18.5, cy: 17.5, r: 3.5) and (cx: 5.5, cy: 17.5, r: 3.5)
 * - One small circle for seat/bell (cx: 15, cy: 5, r: 1)
 * - One path for frame (M12 17.5V14l-3-3 4-3 2 3h2)
 *
 * @param options - Size and variant options
 * @returns SVG string that can be used as image source
 *
 * @example
 * ```typescript
 * const svg = generateStationIconSVG({ size: 32, variant: 'default' });
 * map.loadImage('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg), ...);
 * ```
 */
export function generateStationIconSVG(options: StationIconSVGOptions = {}): string {
  const { size = 32, variant = 'default' } = options;
  const colors = COLOR_SCHEMES[variant];

  const iconSize = size * 0.55;
  const iconOffset = (size - iconSize) / 2;

  // Calculate scale factor for the bike icon (original viewBox is 24x24)
  const scale = iconSize / 24;

  return `
    <svg 
      width="${size}" 
      height="${size}" 
      viewBox="0 0 ${size} ${size}" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <!-- Circle background -->
      <circle
        cx="${size / 2}"
        cy="${size / 2}"
        r="${size / 2 - 1}"
        fill="${colors.background}"
        stroke="${colors.border}"
        stroke-width="2"
      />
      
      <!-- Bike icon (Lucide bike) -->
      <g transform="translate(${iconOffset}, ${iconOffset}) scale(${scale})">
        <!-- Right wheel -->
        <circle
          cx="18.5"
          cy="17.5"
          r="3.5"
          fill="none"
          stroke="${colors.icon}"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <!-- Left wheel -->
        <circle
          cx="5.5"
          cy="17.5"
          r="3.5"
          fill="none"
          stroke="${colors.icon}"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <!-- Seat/bell -->
        <circle
          cx="15"
          cy="5"
          r="1"
          fill="none"
          stroke="${colors.icon}"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <!-- Frame -->
        <path
          d="M12 17.5V14l-3-3 4-3 2 3h2"
          fill="none"
          stroke="${colors.icon}"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </g>
    </svg>
  `.trim();
}

/**
 * Convert SVG string to data URL
 *
 * @param svg - SVG string
 * @returns Data URL that can be used in img src or Mapbox
 */
export function svgToDataURL(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/**
 * Generate all icon variants for Mapbox
 *
 * Creates a map of icon variant names to data URLs.
 * Used to preload all icons into Mapbox on map initialization.
 *
 * @param size - Size of the icons (default: 32)
 * @returns Record of icon names to data URLs
 *
 * @example
 * ```typescript
 * const icons = generateAllStationIcons(32);
 * // Returns:
 * // {
 * //   'station-icon-default': 'data:image/svg+xml;...',
 * //   'station-icon-hover': 'data:image/svg+xml;...',
 * //   'station-icon-active': 'data:image/svg+xml;...'
 * // }
 * ```
 */
export function generateAllStationIcons(size: number = 32): Record<string, string> {
  const variants: Array<'default' | 'hover' | 'active'> = ['default', 'hover', 'active'];

  return variants.reduce(
    (acc, variant) => {
      const svg = generateStationIconSVG({ size, variant });
      acc[`station-icon-${variant}`] = svgToDataURL(svg);
      return acc;
    },
    {} as Record<string, string>
  );
}
