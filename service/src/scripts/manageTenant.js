/**
 * Script manajemen tenant: list, suspend, aktifkan, hapus.
 *
 * Usage:
 *   node src/scripts/manageTenant.js list
 *   node src/scripts/manageTenant.js suspend --subdomain bengkel-jaya
 *   node src/scripts/manageTenant.js activate --subdomain bengkel-jaya
 *   node src/scripts/manageTenant.js info --subdomain bengkel-jaya
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const mongoose = require('mongoose');
const Tenant   = require('../models/Tenant');
const User     = require('../models/User');

const STATUS_ICON = { active: '🟢', suspended: '🔴', trial: '🟡' };

async function connect() {
  await mongoose.connect(process.env.DATABASE_URL);
}

// ── Handlers ──────────────────────────────────────────────────────────────────

async function listTenants() {
  const tenants = await Tenant.find({}).sort({ createdAt: -1 });

  if (tenants.length === 0) {
    console.log('\n📭 Belum ada tenant.\n');
    return;
  }

  console.log(`\n📋 DAFTAR TENANT (${tenants.length})`);
  console.log('─'.repeat(70));
  console.log(
    'STATUS'.padEnd(10) +
    'SUBDOMAIN'.padEnd(25) +
    'NAMA'.padEnd(25) +
    'DIBUAT'
  );
  console.log('─'.repeat(70));

  for (const t of tenants) {
    const icon    = STATUS_ICON[t.status] || '⚪';
    const created = t.createdAt.toLocaleDateString('id-ID');
    console.log(
      `${icon} ${t.status}`.padEnd(12) +
      t.subdomain.padEnd(25) +
      t.name.padEnd(25) +
      created
    );
  }
  console.log('─'.repeat(70));
  console.log('');
}

async function tenantInfo(subdomain) {
  const tenant = await Tenant.findOne({ subdomain });
  if (!tenant) { console.error(`\n❌ Tenant "${subdomain}" tidak ditemukan.\n`); return; }

  const users  = await User.find({ tenantId: tenant._id });
  const owner  = users.find(u => u.role === 'owner');

  console.log(`\n📋 INFO TENANT: ${tenant.name}`);
  console.log('─'.repeat(50));
  console.log(`  Subdomain   : ${tenant.subdomain}`);
  console.log(`  URL         : https://${tenant.subdomain}.jawara.com`);
  console.log(`  Jenis Bisnis: ${tenant.businessType || '-'}`);
  console.log(`  Status      : ${STATUS_ICON[tenant.status]} ${tenant.status}`);
  console.log(`  Dibuat      : ${tenant.createdAt.toLocaleString('id-ID')}`);
  console.log(`  Total User  : ${users.length}`);
  if (owner) {
    console.log(`\n  Akun Owner:`);
    console.log(`    Nama  : ${owner.name}`);
    console.log(`    Email : ${owner.email}`);
  }
  console.log('─'.repeat(50));
  console.log('');
}

async function setStatus(subdomain, status) {
  const tenant = await Tenant.findOneAndUpdate(
    { subdomain },
    { status },
    { new: true }
  );

  if (!tenant) {
    console.error(`\n❌ Tenant "${subdomain}" tidak ditemukan.\n`);
    return;
  }

  const icon   = STATUS_ICON[status] || '⚪';
  const action = status === 'suspended' ? 'disuspend' : 'diaktifkan';
  console.log(`\n${icon} Tenant "${tenant.name}" (${subdomain}) berhasil ${action}.\n`);
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const [,, command, ...rest] = process.argv;
  const args = {};
  for (let i = 0; i < rest.length; i++) {
    if (rest[i].startsWith('--')) {
      args[rest[i].slice(2)] = rest[i + 1] || true;
      i++;
    }
  }

  if (!command) {
    console.log('\nUsage:');
    console.log('  node src/scripts/manageTenant.js list');
    console.log('  node src/scripts/manageTenant.js info     --subdomain <subdomain>');
    console.log('  node src/scripts/manageTenant.js suspend  --subdomain <subdomain>');
    console.log('  node src/scripts/manageTenant.js activate --subdomain <subdomain>');
    console.log('');
    process.exit(0);
  }

  await connect();

  switch (command) {
    case 'list':
      await listTenants();
      break;
    case 'info':
      if (!args.subdomain) { console.error('❌ --subdomain wajib diisi'); break; }
      await tenantInfo(args.subdomain);
      break;
    case 'suspend':
      if (!args.subdomain) { console.error('❌ --subdomain wajib diisi'); break; }
      await setStatus(args.subdomain, 'suspended');
      break;
    case 'activate':
      if (!args.subdomain) { console.error('❌ --subdomain wajib diisi'); break; }
      await setStatus(args.subdomain, 'active');
      break;
    default:
      console.error(`\n❌ Command tidak dikenal: "${command}"\n`);
  }

  await mongoose.disconnect();
  process.exit(0);
}

main().catch(err => {
  console.error('\n❌ Error:', err.message);
  mongoose.disconnect();
  process.exit(1);
});
