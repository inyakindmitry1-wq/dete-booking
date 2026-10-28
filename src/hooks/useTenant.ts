import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { DbTenant } from '@/types/database';

function hexToHsl(hex: string): string {
  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c.split('').map((x) => x + x).join('');
  }
  const r = parseInt(c.substring(0, 2), 16) / 255;
  const g = parseInt(c.substring(2, 4), 16) / 255;
  const b = parseInt(c.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  const hDeg = Math.round(h * 360);
  const sPct = Math.round(s * 100);
  const lPct = Math.round(l * 100);

  return `${hDeg} ${sPct}% ${lPct}%`;
}

export function useTenant() {
  const { slug } = useParams<{ slug: string }>();
  const activeSlug = slug || import.meta.env.VITE_DEFAULT_TENANT || 'sokol';

  const query = useQuery<DbTenant | null>({
    queryKey: ['tenant', activeSlug],
    queryFn: () => api.getTenant(activeSlug),
    staleTime: 1000 * 60 * 10,
  });

  const tenant = query.data;

  // Apply dynamic tenant branding: Title, Favicon, Theme Color, and CSS variables
  useEffect(() => {
    if (!tenant) return;

    // Update document title
    document.title = `${tenant.name} — Онлайн-запись`;

    // Update theme-color meta tag
    let themeMeta = document.querySelector('meta[name="theme-color"]');
    if (!themeMeta) {
      themeMeta = document.createElement('meta');
      themeMeta.setAttribute('name', 'theme-color');
      document.head.appendChild(themeMeta);
    }
    themeMeta.setAttribute('content', tenant.accent_color);

    // Update CSS variable --primary and --ring to match tenant accent
    try {
      const hslValue = hexToHsl(tenant.accent_color);
      document.documentElement.style.setProperty('--primary', hslValue);
      document.documentElement.style.setProperty('--ring', hslValue);
    } catch (e) {
      console.warn('Could not set accent color:', e);
    }

    // Update favicon and apple-touch-icon links
    const faviconLink = document.getElementById('favicon-link') as HTMLLinkElement | null;
    if (faviconLink && tenant.logo_url) {
      faviconLink.href = tenant.logo_url;
    }
    const appleTouchIcon = document.getElementById('apple-touch-icon') as HTMLLinkElement | null;
    if (appleTouchIcon && tenant.logo_url) {
      appleTouchIcon.href = tenant.logo_url;
    }

    // Update Web App Manifest link dynamically
    const manifestLink = document.getElementById('manifest-link') as HTMLLinkElement | null;
    if (manifestLink) {
      const dynamicManifest = {
        name: tenant.name,
        short_name: tenant.name,
        description: tenant.tagline,
        start_url: `${import.meta.env.BASE_URL}s/${tenant.slug}/`.replace(/\/+/g, '/'),
        scope: `${import.meta.env.BASE_URL}s/${tenant.slug}/`.replace(/\/+/g, '/'),
        display: 'standalone',
        background_color: '#0a0d14',
        theme_color: tenant.accent_color,
        icons: [
          {
            src: tenant.logo_url,
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: tenant.logo_url,
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: tenant.logo_url,
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: tenant.logo_url,
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      };
      const blob = new Blob([JSON.stringify(dynamicManifest)], { type: 'application/json' });
      manifestLink.href = URL.createObjectURL(blob);
    }
  }, [tenant]);

  return {
    slug: activeSlug,
    tenant,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  };
}
