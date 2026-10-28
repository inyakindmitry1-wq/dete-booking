import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

console.log('🚀 Building application for GitHub Pages (base: /dete-booking/)...');
process.env.BASE_PATH = '/dete-booking/';
execSync('npm run build', { stdio: 'inherit', env: { ...process.env, BASE_PATH: '/dete-booking/' } });

const distDir = path.join(process.cwd(), 'dist');

// Create .nojekyll to prevent GitHub Pages from bypassing files with underscores
fs.writeFileSync(path.join(distDir, '.nojekyll'), '');

// Pre-create directory index.html for all known tenant routes for zero-redirect 200 OK on GitHub Pages
const staticRoutes = [
  's/sokol',
  's/sokol/owner',
  's/graphite',
  's/graphite/owner',
  's/apex',
  's/apex/owner',
];
for (const r of staticRoutes) {
  const targetDir = path.join(distDir, r);
  fs.mkdirSync(targetDir, { recursive: true });
  fs.copyFileSync(path.join(distDir, 'index.html'), path.join(targetDir, 'index.html'));

  // Also copy icon and manifest assets so relative lookups from sub-routes always resolve 200 OK
  const iconFiles = ['apple-touch-icon.png', 'favicon.png', 'pwa-192x192.png', 'pwa-512x512.png', 'manifest.webmanifest'];
  for (const f of iconFiles) {
    const srcFile = path.join(distDir, f);
    if (fs.existsSync(srcFile)) {
      fs.copyFileSync(srcFile, path.join(targetDir, f));
    }
  }
}
console.log('✓ Pre-generated static route HTML files for instant 200 OK');

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
  execSync('git commit -m "deploy: update GitHub Pages build"', { cwd: distDir });
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
