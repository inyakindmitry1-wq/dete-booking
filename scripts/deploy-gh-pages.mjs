import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

console.log('🚀 Building application for GitHub Pages (base: /dete-booking/)...');
process.env.BASE_PATH = '/dete-booking/';
execSync('npm run build', { stdio: 'inherit', env: { ...process.env, BASE_PATH: '/dete-booking/' } });

const distDir = path.join(process.cwd(), 'dist');

// Create .nojekyll to prevent GitHub Pages from bypassing files with underscores
fs.writeFileSync(path.join(distDir, '.nojekyll'), '');

const tenantMetadata = {
  'ev-motors': {
    name: 'EV Motors',
    shortName: 'EV Motors',
    tagline: 'Премиальный детейлинг и защита кузова в Самаре',
    logoRelPath: 'logos/ev-motors.png',
  },
  'carone': {
    name: 'Carone Detailing',
    shortName: 'Carone',
    tagline: 'Профессиональный детейлинг, бронирование кузова и автомойка в Самаре',
    logoRelPath: 'logos/carone.png',
  },
  'apex': {
    name: 'Apex Detailing',
    shortName: 'Apex',
    tagline: 'Премиальный детейлинг и защита кузова в Москве',
    logoRelPath: 'icons/apex-logo.png',
  },
  'syndicate': {
    name: 'Syndicate Detailing',
    shortName: 'Syndicate',
    tagline: 'Студия премиального детейлинга и защиты кузова',
    logoRelPath: 'icons/syndicate-logo.png',
  },
  'brooklands': {
    name: 'Brooklands Detailing',
    shortName: 'Brooklands',
    tagline: 'Премиальный детейлинг-центр в Москве',
    logoRelPath: 'icons/apex-logo.png',
  },
  'sokol': {
    name: 'Автомоечный комплекс Сокол',
    shortName: 'Сокол',
    tagline: 'Современная автомойка и детейлинг в Москве',
    logoRelPath: 'icons/sokol-logo.png',
  },
  'graphite': {
    name: 'Graphite Auto Lab',
    shortName: 'Graphite',
    tagline: 'Студия профессионального автодетейлинга в Санкт-Петербурге',
    logoRelPath: 'icons/sokol-logo.png',
  },
};

// Pre-create directory index.html and dedicated manifest/icons for all known tenant routes
const staticRoutes = [
  's/sokol',
  's/sokol/owner',
  's/graphite',
  's/graphite/owner',
  's/apex',
  's/apex/owner',
  's/syndicate',
  's/syndicate/owner',
  's/carone',
  's/carone/owner',
  's/ev-motors',
  's/ev-motors/owner',
  's/brooklands',
  's/brooklands/owner',
];

const baseHtmlTemplate = fs.readFileSync(path.join(distDir, 'index.html'), 'utf8');

for (const r of staticRoutes) {
  const targetDir = path.join(distDir, r);
  fs.mkdirSync(targetDir, { recursive: true });

  const parts = r.split('/');
  const slug = parts[1];
  const isOwner = parts.length > 2 && parts[2] === 'owner';
  const meta = tenantMetadata[slug];

  if (meta) {
    const titleText = isOwner
      ? `${meta.name} • Панель владельца`
      : `${meta.name} — Онлайн-запись в студию`;
    const shortNameText = meta.shortName || meta.name;
    const logoUrl = `/dete-booking/${meta.logoRelPath}`;

    let customizedHtml = baseHtmlTemplate
      .replace(/<title id="app-title">.*?<\/title>/, `<title id="app-title">${titleText}</title>`)
      .replace(/<meta name="apple-mobile-web-app-title" id="apple-mobile-web-app-title" content=".*?" \/>/, `<meta name="apple-mobile-web-app-title" id="apple-mobile-web-app-title" content="${shortNameText}" />`);

    // Replace default icon references with tenant-specific logo
    customizedHtml = customizedHtml
      .replaceAll('/dete-booking/apple-touch-icon.png', logoUrl)
      .replaceAll('/dete-booking/favicon.png', logoUrl)
      .replaceAll('/dete-booking/pwa-192x192.png', logoUrl)
      .replaceAll('/dete-booking/pwa-512x512.png', logoUrl)
      .replace('/dete-booking/manifest.webmanifest', `/dete-booking/s/${slug}/manifest.webmanifest`);

    fs.writeFileSync(path.join(targetDir, 'index.html'), customizedHtml, 'utf8');

    // Generate dedicated tenant manifest
    const tenantManifest = {
      name: meta.name,
      short_name: shortNameText,
      description: meta.tagline,
      start_url: `/dete-booking/s/${slug}/`,
      scope: `/dete-booking/s/${slug}/`,
      display: 'standalone',
      background_color: '#09090b',
      theme_color: '#09090b',
      icons: [
        {
          src: logoUrl,
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any',
        },
        {
          src: logoUrl,
          sizes: '192x192',
          type: 'image/png',
          purpose: 'maskable',
        },
        {
          src: logoUrl,
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any',
        },
        {
          src: logoUrl,
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable',
        },
      ],
    };
    fs.writeFileSync(path.join(targetDir, 'manifest.webmanifest'), JSON.stringify(tenantManifest, null, 2), 'utf8');

    // Copy tenant logo to local icon filenames so relative lookups always resolve 200 OK
    const srcLogo = path.join(distDir, meta.logoRelPath);
    if (fs.existsSync(srcLogo)) {
      fs.copyFileSync(srcLogo, path.join(targetDir, 'apple-touch-icon.png'));
      fs.copyFileSync(srcLogo, path.join(targetDir, 'favicon.png'));
      fs.copyFileSync(srcLogo, path.join(targetDir, 'pwa-192x192.png'));
      fs.copyFileSync(srcLogo, path.join(targetDir, 'pwa-512x512.png'));
    }
  } else {
    fs.copyFileSync(path.join(distDir, 'index.html'), path.join(targetDir, 'index.html'));
  }
}
console.log('✓ Pre-generated static route HTML files with custom tenant titles, icons & manifests for instant 200 OK');

console.log('📦 Pushing build to gh-pages branch...');
try {
  // Remove any stale .git inside dist so we create a clean, single fresh commit
  const distGit = path.join(distDir, '.git');
  if (fs.existsSync(distGit)) {
    fs.rmSync(distGit, { recursive: true, force: true });
  }

  // Use temporary git in dist to cleanly push to gh-pages branch
  execSync('git init', { cwd: distDir, stdio: 'ignore' });
  execSync('git config user.name "deploy-bot"', { cwd: distDir, stdio: 'ignore' });
  execSync('git config user.email "deploy@github.com"', { cwd: distDir, stdio: 'ignore' });
  execSync('git add -A', { cwd: distDir });
  execSync('git commit -m "deploy: update GitHub Pages build with dynamic PWA branding"', { cwd: distDir });
  execSync('git branch -M gh-pages', { cwd: distDir });
  execSync('git push -f https://github.com/inyakindmitry1-wq/dete-booking.git gh-pages', { cwd: distDir, stdio: 'inherit' });
  console.log('✅ gh-pages branch updated on GitHub!');
} catch (err) {
  console.error('Error during git push:', err);
  process.exit(1);
}

// Enable or update GitHub Pages via gh API
console.log('⚙️ Ensuring GitHub Pages is enabled...');
try {
  execSync('gh api repos/inyakindmitry1-wq/dete-booking/pages -X POST -f source=\'{"branch":"gh-pages","path":"/"}\'', { stdio: 'inherit' });
  console.log('✅ GitHub Pages enabled successfully!');
} catch {
  console.log('ℹ️ GitHub Pages already configured or updated.');
}
