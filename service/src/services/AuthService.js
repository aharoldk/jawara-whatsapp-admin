const jwt            = require('jsonwebtoken');
const Boom           = require('@hapi/boom');
const User           = require('../models/User');
const Tenant         = require('../models/Tenant');
const tenantRepository = require('../repositories/TenantRepository');
const config         = require('../config');

class AuthService {
  // ── JWT ──────────────────────────────────────────────────────────────────

  generateToken(user, tenant) {
    return jwt.sign(
      {
        id        : user.id || user._id,
        email     : user.email,
        role      : user.role,
        tenantId  : tenant.id || tenant._id,
        subdomain : tenant.subdomain
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );
  }

  verifyToken(token) {
    try {
      return jwt.verify(token, config.jwt.secret);
    } catch (err) {
      if (err.name === 'TokenExpiredError') throw Boom.unauthorized('Token expired');
      throw Boom.unauthorized('Invalid token');
    }
  }

  // ── Register Tenant ───────────────────────────────────────────────────────
  // Membuat tenant baru sekaligus user owner-nya

  async registerTenant({ tenantName, subdomain, businessType, ownerName, email, password, phone }) {
    // Validasi subdomain belum dipakai
    const subdomainTaken = await tenantRepository.isSubdomainTaken(subdomain);
    if (subdomainTaken) {
      throw Boom.conflict(`Subdomain "${subdomain}" sudah digunakan`);
    }

    // Cek email tidak duplikat (cross-tenant tidak masalah karena unique per tenant,
    // tapi buat owner kita cek global biar tidak membingungkan)
    const emailExists = await User.findOne({ email: email.toLowerCase() });
    if (emailExists) {
      throw Boom.conflict('Email sudah terdaftar');
    }

    // Buat tenant
    const tenant = await Tenant.create({
      subdomain   : subdomain.toLowerCase(),
      name        : tenantName,
      businessType: businessType || '',
      status      : 'active'
    });

    // Buat owner user
    const owner = await User.create({
      tenantId: tenant._id,
      name    : ownerName,
      email   : email.toLowerCase(),
      password,
      phone   : phone || '',
      role    : 'owner'
    });

    const token = this.generateToken(owner, tenant);
    return { tenant, user: owner, token };
  }

  // ── Login ─────────────────────────────────────────────────────────────────
  // Subdomain dikirim dari frontend via header X-Tenant-Subdomain

  async login({ email, password, subdomain }) {
    // Resolve tenant dari subdomain
    const tenant = await tenantRepository.findBySubdomain(subdomain);
    if (!tenant) {
      throw Boom.unauthorized('Tenant tidak ditemukan');
    }
    if (tenant.status === 'suspended') {
      throw Boom.forbidden('Akun ini sedang disuspend. Hubungi administrator.');
    }

    // Cari user dalam tenant ini
    const user = await User.findOne({
      tenantId: tenant._id,
      email   : email.toLowerCase()
    }).select('+password');

    if (!user || !user.isActive) {
      throw Boom.unauthorized('Email atau password salah');
    }

    const valid = await user.comparePassword(password);
    if (!valid) {
      throw Boom.unauthorized('Email atau password salah');
    }

    const token = this.generateToken(user, tenant);
    return { user, tenant, token };
  }

  // ── Get profile ───────────────────────────────────────────────────────────

  async getProfile(tenantId, userId) {
    const user = await User.findOne({ _id: userId, tenantId });
    if (!user) throw Boom.notFound('User tidak ditemukan');
    return user;
  }
}

module.exports = new AuthService();
