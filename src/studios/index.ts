import { StudioPreset } from './types';
import { apexPreset } from './presets/apex';
import { caronePreset } from './presets/carone';
import { syndicatePreset } from './presets/syndicate';
import { brooklandsPreset } from './presets/brooklands';

export * from './types';
export { apexPreset, caronePreset, syndicatePreset, brooklandsPreset };

export const studiosRegistry: Record<string, StudioPreset> = {
  carone: caronePreset,
  apex: apexPreset,
  syndicate: syndicatePreset,
  brooklands: brooklandsPreset,
};

export const DEFAULT_STUDIO_SLUG = 'carone';

/**
 * Generates stylish SVG monogram Data URI for studios without dedicated image
 */
export function generateSvgLogoDataUri(name: string, accentColor = '#2563eb'): string {
  const words = name.trim().split(/\s+/);
  const initials = words.length > 1
    ? (words[0][0] + words[1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">
    <rect width="128" height="128" rx="28" fill="#09090b" stroke="${accentColor}" stroke-width="4" stroke-opacity="0.3"/>
    <text x="50%" y="54%" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="44" fill="${accentColor}" text-anchor="middle" dominant-baseline="middle" letter-spacing="1">
      ${initials}
    </text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Resolves active studio slug from URL query (?studio=slug), path (/s/:slug), or default
 */
export function getActiveStudioSlug(): string {
  if (typeof window === 'undefined') return DEFAULT_STUDIO_SLUG;

  // 1. Priority: URL query parameter (?studio=<slug>)
  const searchParams = new URLSearchParams(window.location.search);
  const querySlug = searchParams.get('studio');
  if (querySlug && studiosRegistry[querySlug.toLowerCase()]) {
    return querySlug.toLowerCase();
  }

  // 2. Secondary: Route path (/s/<slug>)
  const match = window.location.pathname.match(/\/s\/([a-zA-Z0-9_-]+)/);
  if (match && match[1] && studiosRegistry[match[1].toLowerCase()]) {
    return match[1].toLowerCase();
  }

  // 3. Fallback to default
  return DEFAULT_STUDIO_SLUG;
}

/**
 * Returns active studio preset
 */
export function getActiveStudio(): StudioPreset {
  const slug = getActiveStudioSlug();
  return studiosRegistry[slug] || studiosRegistry[DEFAULT_STUDIO_SLUG];
}

/**
 * Returns array of all available studios for dropdown selection
 */
export function getAllStudios(): StudioPreset[] {
  return Object.values(studiosRegistry);
}

/**
 * Dynamically updates document title, favicon, apple-touch-icon and PWA manifest
 */
export function applyStudioBranding(studio: StudioPreset): void {
  if (typeof document === 'undefined') return;

  // 1. Update Title
  document.title = `${studio.name} — Онлайн-запись в студию`;

  // 2. Resolve logo or fallback monogram
  const iconUrl = studio.logoUrl || generateSvgLogoDataUri(studio.name, studio.accentColor);

  // 3. Update ALL Favicons & Apple Touch Icons
  const favicons = document.querySelectorAll<HTMLLinkElement>("link[rel*='icon']");
  favicons.forEach((el) => {
    el.href = iconUrl;
  });

  const appleIcons = document.querySelectorAll<HTMLLinkElement>("link[rel*='apple-touch-icon']");
  appleIcons.forEach((el) => {
    el.href = iconUrl;
  });

  // 4. Update Meta Theme Color
  let metaTheme = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null;
  if (!metaTheme) {
    metaTheme = document.createElement('meta');
    metaTheme.name = 'theme-color';
    document.head.appendChild(metaTheme);
  }
  metaTheme.content = '#09090b';

  // 5. Update Web App Manifest dynamically for home screen desktop icon
  const manifestLink = document.getElementById('manifest-link') as HTMLLinkElement | null;
  if (manifestLink) {
    const dynamicManifest = {
      name: studio.name,
      short_name: studio.shortName,
      description: studio.description || studio.tagline,
      start_url: `${import.meta.env.BASE_URL}s/${studio.slug}/?studio=${studio.slug}`.replace(/\/+/g, '/'),
      scope: `${import.meta.env.BASE_URL}`.replace(/\/+/g, '/'),
      display: 'standalone',
      background_color: '#09090b',
      theme_color: '#09090b',
      icons: [
        {
          src: iconUrl,
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any',
        },
        {
          src: iconUrl,
          sizes: '192x192',
          type: 'image/png',
          purpose: 'maskable',
        },
        {
          src: iconUrl,
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any',
        },
        {
          src: iconUrl,
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable',
        },
      ],
    };
    const blob = new Blob([JSON.stringify(dynamicManifest, null, 2)], {
      type: 'application/manifest+json',
    });
    manifestLink.href = URL.createObjectURL(blob);
  }
}
