/**
 * Mirrors seller-admin/src/app route folders into apk/src/app
 * Creates page.tsx + index.tsx (Expo Router entry) for each route
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SELLER_ADMIN_APP = path.join(__dirname, '../../seller-admin/src/app');
const APK_APP = path.join(__dirname, '../src/app');

function findPageFiles(dir, base = '') {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = path.join(base, entry.name);
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'api') continue;
      results.push(...findPageFiles(full, rel));
    } else if (entry.name === 'page.tsx') {
      results.push(base.replace(/\\/g, '/'));
    }
  }
  return results;
}

function routeToTitle(routePath) {
  const last = routePath.split('/').filter(Boolean).pop() || 'Home';
  return last
    .replace(/^\[|\]$/g, '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function expoRoutePath(routePath) {
  // admin/dashboard -> /admin/dashboard
  if (!routePath) return '/';
  return '/' + routePath;
}

function createPageContent(routePath, title) {
  const isDynamic = routePath.includes('[');
  return `import React from 'react';
import { AdminScreenShell } from '@/components/common/AdminScreenShell';

export default function Page() {
  return (
    <AdminScreenShell
      title="${title.replace(/"/g, '\\"')}"
      routePath="${expoRoutePath(routePath)}"
      ${isDynamic ? 'dynamic' : ''}
    />
  );
}
`;
}

function createIndexContent() {
  return `export { default } from './page';
`;
}

const routes = findPageFiles(SELLER_ADMIN_APP);
console.log(`Found ${routes.length} routes to scaffold`);

for (const route of routes) {
  const targetDir = path.join(APK_APP, route);
  fs.mkdirSync(targetDir, { recursive: true });

  const pagePath = path.join(targetDir, 'page.tsx');
  const indexPath = path.join(targetDir, 'index.tsx');

  if (!fs.existsSync(pagePath)) {
    fs.writeFileSync(pagePath, createPageContent(route, routeToTitle(route)), 'utf8');
  }
  if (!fs.existsSync(indexPath)) {
    fs.writeFileSync(indexPath, createIndexContent(), 'utf8');
  }
}

// Root page redirect
const rootDir = APK_APP;
fs.mkdirSync(rootDir, { recursive: true });
const rootPage = path.join(rootDir, 'page.tsx');
if (!fs.existsSync(rootPage)) {
  fs.writeFileSync(
    rootPage,
    `import { Redirect } from 'expo-router';
export default function RootPage() {
  return <Redirect href="/login" />;
}
`,
    'utf8',
  );
}

console.log('Scaffold complete');
