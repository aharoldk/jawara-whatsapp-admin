/**
 * Baca subdomain dari URL saat ini.
 *
 * Production : bengkel.jawara.com  → "bengkel"
 * Development: gunakan VITE_TENANT_SUBDOMAIN di .env, atau fallback "dev"
 *
 * Contoh .env.local untuk dev:
 *   VITE_TENANT_SUBDOMAIN=bengkel
 */
export function getSubdomain() {
  const hostname = window.location.hostname;

  // localhost / 127.0.0.1 → pakai env var
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return import.meta.env.VITE_TENANT_SUBDOMAIN || 'dev';
  }

  // Ambil bagian pertama sebelum titik pertama
  // bengkel.jawara.com → "bengkel"
  const parts = hostname.split('.');
  if (parts.length >= 3) {
    return parts[0];
  }

  // Fallback jika hanya satu bagian (custom domain tanpa subdomain)
  return import.meta.env.VITE_TENANT_SUBDOMAIN || '';
}
