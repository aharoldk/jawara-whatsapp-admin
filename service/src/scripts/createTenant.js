/**
 * Script untuk membuat tenant baru beserta akun owner-nya.
 *
 * Usage:
 *   node src/scripts/createTenant.js \
 *     --subdomain bengkel-jaya \
 *     --name "Bengkel Jaya Motor" \
 *     --business "Bengkel Motor" \
 *     --owner "Budi Santoso" \
 *     --email budi@bengkeljaya.com \
 *     --password rahasia123
 *
 * Atau via npm:
 *   npm run create-tenant -- --subdomain bengkel-jaya ...
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const mongoose = require('mongoose');
const Tenant   = require('../models/Tenant');
const User     = require('../models/User');

// ── Parse argumen CLI ─────────────────────────────────────────────────────────
function parseArgs() {
  const args = process.argv.slice(2);
  const result = {};

  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].slice(2);
      const val = args[i + 1] && !args[i + 1].startsWith('--') ? args[++i] : true;
      result[key] = val;
    }
  }

  return result;
}

// ── Validasi argumen ──────────────────────────────────────────────────────────
function validate(args) {
  const required = ['subdomain', 'name', 'owner', 'email', 'password'];
  const missing  = required.filter(k => !args[k]);

  if (missing.length > 0) {
    console.error(`\n❌ Parameter wajib belum diisi: ${missing.map(k => `--${k}`).join(', ')}\n`);
    console.error('Contoh penggunaan:');
    console.error('  node src/scripts/createTenant.js \\');
    console.error('    --subdomain bengkel-jaya \\');
    console.error('    --name "Bengkel Jaya Motor" \\');
    console.error('    --business "Bengkel Motor" \\');
    console.error('    --owner "Budi Santoso" \\');
    console.error('    --email budi@bengkeljaya.com \\');
    console.error('    --password rahasia123\n');
    process.exit(1);
  }

  if (!/^[a-z0-9-]+$/.test(args.subdomain)) {
    console.error('\n❌ Subdomain hanya boleh huruf kecil, angka, dan tanda hubung (-)\n');
    process.exit(1);
  }

  if (args.password.length < 6) {
    console.error('\n❌ Password minimal 6 karakter\n');
    process.exit(1);
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const args = parseArgs();
  validate(args);

  const { subdomain, name, business, owner, email, password } = args;

  console.log('\n🔌 Menghubungkan ke database...');
  await mongoose.connect(process.env.DATABASE_URL);
  console.log('✅ Terhubung\n');

  // Cek subdomain sudah dipakai
  const existingTenant = await Tenant.findOne({ subdomain });
  if (existingTenant) {
    console.error(`❌ Subdomain "${subdomain}" sudah digunakan oleh tenant lain.\n`);
    process.exit(1);
  }

  // Cek email sudah dipakai
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    console.error(`❌ Email "${email}" sudah terdaftar.\n`);
    process.exit(1);
  }

  // Buat tenant
  const tenant = await Tenant.create({
    subdomain   : subdomain.toLowerCase(),
    name,
    businessType: business || '',
    status      : 'active'
  });

  console.log(`✅ Tenant dibuat: "${name}" (${subdomain})`);

  // Buat owner
  const user = await User.create({
    tenantId: tenant._id,
    name    : owner,
    email   : email.toLowerCase(),
    password,            // Model akan hash otomatis via pre-save hook
    role    : 'owner',
    isActive: true
  });

  console.log(`✅ Akun owner dibuat: ${owner} (${email})\n`);

  // Summary
  console.log('─'.repeat(50));
  console.log('📋 RINGKASAN TENANT BARU');
  console.log('─'.repeat(50));
  console.log(`  Nama Bisnis : ${name}`);
  console.log(`  Jenis Bisnis: ${business || '-'}`);
  console.log(`  Subdomain   : ${subdomain}`);
  console.log(`  URL Akses   : https://${subdomain}.jawara.com`);
  console.log('');
  console.log('  Akun Owner:');
  console.log(`    Nama      : ${owner}`);
  console.log(`    Email     : ${email}`);
  console.log(`    Password  : ${password}`);
  console.log(`    Role      : owner`);
  console.log('');
  console.log('  ⚠️  Sampaikan kredensial ini ke pemilik bisnis dengan aman.');
  console.log('  ⚠️  Rekomendasikan agar password segera diganti setelah login pertama.');
  console.log('─'.repeat(50));
  console.log('');

  await mongoose.disconnect();
  process.exit(0);
}

main().catch(err => {
  console.error('\n❌ Error:', err.message);
  if (err.code === 11000) {
    console.error('   Subdomain atau email sudah digunakan.\n');
  }
  mongoose.disconnect();
  process.exit(1);
});
