import fs from 'node:fs';
import path from 'node:path';
import { validateTenantFile } from './tenant-validate';

function verifyTenant(slug: string) {
  const tenantsDir = path.resolve(process.cwd(), 'tenants');
  const configPath = path.join(tenantsDir, slug, 'business.json');
  const publishSqlPath = path.join(tenantsDir, slug, 'publish.sql');

  console.log(`🔎 Verifying tenant [${slug}]...`);

  if (!fs.existsSync(configPath)) {
    console.error(`❌ business.json missing for ${slug}`);
    return false;
  }

  const valid = validateTenantFile(configPath);
  if (!valid) return false;

  if (!fs.existsSync(publishSqlPath)) {
    console.warn(`⚠️ publish.sql not found for ${slug}. Run 'npm run tenant:publish' first.`);
  } else {
    console.log(`   publish.sql is present (${fs.statSync(publishSqlPath).size} bytes)`);
  }

  console.log(`✨ Tenant [${slug}] passed all verification checks!\n`);
  return true;
}

const targetSlug = process.argv[2];
const tenantsDir = path.resolve(process.cwd(), 'tenants');

let success = true;
if (targetSlug) {
  success = verifyTenant(targetSlug);
} else {
  const folders = fs.readdirSync(tenantsDir).filter((f) => fs.statSync(path.join(tenantsDir, f)).isDirectory());
  for (const f of folders) {
    if (!verifyTenant(f)) success = false;
  }
}

if (!success) {
  process.exit(1);
}
