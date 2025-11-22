import { describe, it, expect } from 'vitest';
import {
  generateStationIconSVG,
  svgToDataURL,
  generateAllStationIcons,
} from './generateStationIconSVG';

describe('generateStationIconSVG', () => {
  it('returns a valid SVG string', () => {
    const svg = generateStationIconSVG();

    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
    expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
  });

  it('generates SVG with default size of 32', () => {
    const svg = generateStationIconSVG();

    expect(svg).toContain('width="32"');
    expect(svg).toContain('height="32"');
    expect(svg).toContain('viewBox="0 0 32 32"');
  });

  it('generates SVG with custom size', () => {
    const size = 48;
    const svg = generateStationIconSVG({ size });

    expect(svg).toContain(`width="${size}"`);
    expect(svg).toContain(`height="${size}"`);
    expect(svg).toContain(`viewBox="0 0 ${size} ${size}"`);
  });

  it('uses default variant colors', () => {
    const svg = generateStationIconSVG({ variant: 'default' });

    // Only icon color is in SVG (background comes from circle layer)
    expect(svg).toContain('#ffffff'); // White (icon)
  });

  it('uses hover variant colors', () => {
    const svg = generateStationIconSVG({ variant: 'hover' });

    // Only icon color is in SVG (background comes from circle layer)
    expect(svg).toContain('#ffffff'); // White (icon)
  });

  it('uses active variant colors', () => {
    const svg = generateStationIconSVG({ variant: 'active' });

    // Only icon color is in SVG (background comes from circle layer)
    expect(svg).toContain('#ffffff'); // White (icon)
  });

  it('applies correct scale transformation', () => {
    const size = 32;
    const iconSize = size * 0.55;
    const iconOffset = (size - iconSize) / 2;
    const scale = iconSize / 24;

    const svg = generateStationIconSVG({ size });

    expect(svg).toContain(`translate(${iconOffset}, ${iconOffset}) scale(${scale})`);
  });

  it('has proper stroke attributes for icon paths', () => {
    const svg = generateStationIconSVG();

    expect(svg).toContain('stroke-linecap="round"');
    expect(svg).toContain('stroke-linejoin="round"');
    expect(svg).toContain('fill="none"');
  });
});

describe('svgToDataURL', () => {
  it('converts SVG string to data URL', () => {
    const svg = '<svg width="32" height="32"></svg>';
    const dataURL = svgToDataURL(svg);

    expect(dataURL).toMatch(/^data:image\/svg\+xml;charset=utf-8,/);
  });

  it('properly encodes SVG content', () => {
    const svg = '<svg><path d="M10 10L20 20"/></svg>';
    const dataURL = svgToDataURL(svg);

    // Should be URL encoded
    expect(dataURL).toContain('%3C'); // Encoded <
    expect(dataURL).toContain('%3E'); // Encoded >
    expect(dataURL).toContain('%22'); // Encoded "
  });

  it('returns valid data URL that can be decoded', () => {
    const svg = generateStationIconSVG({ size: 24, variant: 'default' });
    const dataURL = svgToDataURL(svg);

    // Extract and decode the SVG part
    const encodedSvg = dataURL.replace('data:image/svg+xml;charset=utf-8,', '');
    const decodedSvg = decodeURIComponent(encodedSvg);

    expect(decodedSvg).toContain('<svg');
    expect(decodedSvg).toContain('</svg>');
  });
});

describe('generateAllStationIcons', () => {
  it('generates all three variants', () => {
    const icons = generateAllStationIcons();

    expect(Object.keys(icons)).toHaveLength(3);
    expect(icons).toHaveProperty('station-icon-default');
    expect(icons).toHaveProperty('station-icon-hover');
    expect(icons).toHaveProperty('station-icon-active');
  });

  it('generates data URLs for all variants', () => {
    const icons = generateAllStationIcons();

    Object.values(icons).forEach((dataURL) => {
      expect(dataURL).toMatch(/^data:image\/svg\+xml;charset=utf-8,/);
    });
  });

  it('uses provided size for all variants', () => {
    const size = 48;
    const icons = generateAllStationIcons(size);

    Object.values(icons).forEach((dataURL) => {
      const encodedSvg = dataURL.replace('data:image/svg+xml;charset=utf-8,', '');
      const decodedSvg = decodeURIComponent(encodedSvg);

      expect(decodedSvg).toContain(`width="${size}"`);
      expect(decodedSvg).toContain(`height="${size}"`);
    });
  });

  it('uses default size of 32 when not specified', () => {
    const icons = generateAllStationIcons();

    Object.values(icons).forEach((dataURL) => {
      const encodedSvg = dataURL.replace('data:image/svg+xml;charset=utf-8,', '');
      const decodedSvg = decodeURIComponent(encodedSvg);

      expect(decodedSvg).toContain('width="32"');
      expect(decodedSvg).toContain('height="32"');
    });
  });

  it('generates different colors for each variant', () => {
    const icons = generateAllStationIcons();

    const defaultSVG = decodeURIComponent(
      icons['station-icon-default']?.replace('data:image/svg+xml;charset=utf-8,', '') ?? ''
    );
    const hoverSVG = decodeURIComponent(
      icons['station-icon-hover']?.replace('data:image/svg+xml;charset=utf-8,', '') ?? ''
    );
    const activeSVG = decodeURIComponent(
      icons['station-icon-active']?.replace('data:image/svg+xml;charset=utf-8,', '') ?? ''
    );

    // All variants have the same white icon color (backgrounds come from circle layer)
    expect(defaultSVG).toContain('#ffffff');
    expect(hoverSVG).toContain('#ffffff');
    expect(activeSVG).toContain('#ffffff');
  });

  it('returns an object with correct icon name format', () => {
    const icons = generateAllStationIcons();

    expect(icons['station-icon-default']).toBeDefined();
    expect(icons['station-icon-hover']).toBeDefined();
    expect(icons['station-icon-active']).toBeDefined();
  });
});
