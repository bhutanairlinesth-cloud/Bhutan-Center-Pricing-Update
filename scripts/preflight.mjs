import fs from 'node:fs';
import path from 'node:path';

const required = [
  'app/page.tsx',
  'app/layout.tsx',
  'admin-app/src/App.tsx',
  'admin-app/src/components/CustomerTracking.tsx',
  'admin-app/src/components/FrontOffice.tsx',
  'admin-app/src/components/UnifiedDashboard.tsx',
  'admin-app/src/components/GrowthWorkspace.tsx',
  'admin-app/src/components/UnifiedBackOfficeShell.tsx',
  'supabase/UNIFIED_V13_WEBSITE_LINE_MARKETING.sql',
];
const missing = required.filter((file) => !fs.existsSync(path.resolve(file)));
if (missing.length) {
  console.error('Unified preflight failed. Missing:', missing.join(', '));
  process.exit(1);
}
console.log('Unified V13.2 preflight OK');
