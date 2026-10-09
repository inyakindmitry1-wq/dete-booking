import fs from 'node:fs';
import path from 'node:path';
import { BusinessConfigSchema } from './tenant-schema';

export function validateTenantFile(filePath: string) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Config file not found: ${filePath}`);
  }

  const raw = fs.readFileSync(filePath, 'utf-8');
  const json = JSON.parse(raw);

  const parsed = BusinessConfigSchema.safeParse(json);
  if (!parsed.success) {
    console.error(`❌ Validation failed for ${filePath}:`);
    console.error(JSON.stringify(parsed.error.format(), null, 2));
    return false;
  }

  // Cross-reference checks
  const data = parsed.data;
  const resourceIds = new Set(data.resources.map((r) => r.id));
  const serviceIds = new Set(data.services.map((s) => s.id));

  // Check serviceResources mappings
  for (const mapping of data.serviceResources) {
    if (!serviceIds.has(mapping.serviceId)) {
      console.error(`❌ serviceResources references non-existent service ID: ${mapping.serviceId}`);
      return false;
    }
    if (!resourceIds.has(mapping.resourceId)) {
      console.error(`❌ serviceResources references non-existent resource ID: ${mapping.resourceId}`);
      return false;
    }
  }

  // Ensure every service has at least one resource assigned
  for (const s of data.services) {
    const hasResource = data.serviceResources.some((sr) => sr.serviceId === s.id);
    if (!hasResource) {
      console.error(`❌ Service "${s.name}" (${s.id}) has no resource assigned in serviceResources!`);
      return false;
    }
  }

  console.log(`✅ Tenant "${data.name}" (${data.slug}) is valid!`);
  console.log(`   Services: ${data.services.length}, Resources: ${data.resources.length}, Working days: 7`);
  return true;
}

// Run CLI
if (process.argv[1]?.includes('tenant-validate')) {
  const tenantsDir = path.resolve(process.cwd(), 'tenants');
  const specifiedTenant = process.argv[2];

  let allValid = true;

  if (specifiedTenant) {
    const target = path.join(tenantsDir, specifiedTenant, 'business.json');
    allValid = validateTenantFile(target);
  } else {
    const tenantFolders = fs.readdirSync(tenantsDir).filter((f) => {
      return fs.statSync(path.join(tenantsDir, f)).isDirectory();
    });

    console.log(`🔍 Validating ${tenantFolders.length} tenants...\n`);
    for (const folder of tenantFolders) {
      const configPath = path.join(tenantsDir, folder, 'business.json');
      if (fs.existsSync(configPath)) {
        const valid = validateTenantFile(configPath);
        if (!valid) allValid = false;
      }
    }
  }

  if (!allValid) {
    process.exit(1);
  }
}
