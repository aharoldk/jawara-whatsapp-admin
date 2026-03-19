# Tenant Management

Panduan lengkap untuk mengelola tenant di Jawara WhatsApp Admin.

---

## Konsep Dasar

Setiap bisnis yang menggunakan aplikasi ini disebut **tenant**. Tenant diidentifikasi
secara unik melalui **subdomain**:

```
bengkel-jaya.jawara.com  →  tenant dengan subdomain "bengkel-jaya"
laundry-bersih.jawara.com →  tenant dengan subdomain "laundry-bersih"
```

Subdomain berfungsi sebagai unique ID tenant. Saat user membuka
`bengkel-jaya.jawara.com`, sistem otomatis mengenali tenant mana yang dimaksud
dan hanya menampilkan data milik tenant tersebut.

---

## Cara Membuat Tenant Baru

### Opsi 1 — Script (Rekomendasi)

Masuk ke server, lalu jalankan:

```bash
cd /path/to/jawara-whatsapp-admin/service

node src/scripts/createTenant.js \
  --subdomain bengkel-jaya \
  --name "Bengkel Jaya Motor" \
  --business "Bengkel Motor" \
  --owner "Budi Santoso" \
  --email budi@bengkeljaya.com \
  --password rahasia123
```

Atau via npm:

```bash
npm run create-tenant -- \
  --subdomain bengkel-jaya \
  --name "Bengkel Jaya Motor" \
  --business "Bengkel Motor" \
  --owner "Budi Santoso" \
  --email budi@bengkeljaya.com \
  --password rahasia123
```

**Parameter:**

| Parameter     | Wajib | Keterangan                                      |
|---------------|-------|-------------------------------------------------|
| `--subdomain` | ✅    | Unik, huruf kecil, angka, tanda hubung saja     |
| `--name`      | ✅    | Nama bisnis (boleh ada spasi)                   |
| `--owner`     | ✅    | Nama pemilik akun                               |
| `--email`     | ✅    | Email untuk login                               |
| `--password`  | ✅    | Password awal, minimal 6 karakter               |
| `--business`  | ❌    | Jenis bisnis (opsional, contoh: "Bengkel Motor")|

**Output:**

```
✅ Tenant dibuat: "Bengkel Jaya Motor" (bengkel-jaya)
✅ Akun owner dibuat: Budi Santoso (budi@bengkeljaya.com)

──────────────────────────────────────────────────
📋 RINGKASAN TENANT BARU
──────────────────────────────────────────────────
  Nama Bisnis : Bengkel Jaya Motor
  Jenis Bisnis: Bengkel Motor
  Subdomain   : bengkel-jaya
  URL Akses   : https://bengkel-jaya.jawara.com

  Akun Owner:
    Nama      : Budi Santoso
    Email     : budi@bengkeljaya.com
    Password  : rahasia123
    Role      : owner

  ⚠️  Sampaikan kredensial ini ke pemilik bisnis dengan aman.
  ⚠️  Rekomendasikan agar password segera diganti setelah login pertama.
──────────────────────────────────────────────────
```

---

### Opsi 2 — cURL (jika perlu via API internal)

> Endpoint ini hanya untuk digunakan dari dalam server (localhost),
> tidak diekspos ke publik. Pastikan server tidak mengekspos port 3000
> ke internet jika menggunakan cara ini.

```bash
curl -X POST http://localhost:3000/api/auth/register-tenant \
  -H "Content-Type: application/json" \
  -d '{
    "tenantName"  : "Bengkel Jaya Motor",
    "subdomain"   : "bengkel-jaya",
    "businessType": "Bengkel Motor",
    "ownerName"   : "Budi Santoso",
    "email"       : "budi@bengkeljaya.com",
    "password"    : "rahasia123"
  }'
```

> **Catatan:** Endpoint ini saat ini dinonaktifkan secara default.
> Aktifkan kembali hanya jika memang diperlukan dengan cara
> mengembalikan route di `src/routes/authRoutes.js`.

---

## Manajemen Tenant

### Lihat semua tenant

```bash
node src/scripts/manageTenant.js list

# atau
npm run manage-tenant -- list
```

Output:
```
📋 DAFTAR TENANT (3)
──────────────────────────────────────────────────────────────────────
STATUS      SUBDOMAIN                NAMA                     DIBUAT
──────────────────────────────────────────────────────────────────────
🟢 active   bengkel-jaya             Bengkel Jaya Motor       01/01/2025
🟢 active   laundry-bersih           Laundry Bersih           05/01/2025
🔴 suspended toko-sepi               Toko Sepi                10/01/2025
──────────────────────────────────────────────────────────────────────
```

### Lihat detail satu tenant

```bash
node src/scripts/manageTenant.js info --subdomain bengkel-jaya
```

### Suspend tenant (non-aktifkan)

User tenant yang di-suspend tidak bisa login. Datanya tetap aman di database.

```bash
node src/scripts/manageTenant.js suspend --subdomain bengkel-jaya
```

### Aktifkan kembali tenant

```bash
node src/scripts/manageTenant.js activate --subdomain bengkel-jaya
```

---

## Cara User Tenant Login

Setelah tenant dibuat, sampaikan informasi berikut ke pemilik bisnis:

```
URL   : https://[subdomain].jawara.com
Email : [email yang didaftarkan]
Pass  : [password yang didaftarkan]
```

Contoh:
```
URL   : https://bengkel-jaya.jawara.com
Email : budi@bengkeljaya.com
Pass  : rahasia123
```

Pemilik bisnis membuka URL tersebut di browser, lalu login dengan
email dan password yang diberikan.

---

## Bagaimana Subdomain Bekerja

```
User buka: bengkel-jaya.jawara.com
                ↓
         DNS Wildcard (*.jawara.com)
         mengarahkan ke IP server
                ↓
         Nginx membaca subdomain
         dari Host header
                ↓
         Header X-Tenant-Subdomain: bengkel-jaya
         dikirim ke aplikasi Hapi.js
                ↓
         Aplikasi cari tenant dengan
         subdomain = "bengkel-jaya" di MongoDB
                ↓
         Semua data difilter by tenantId
         User hanya melihat data mereka sendiri
```

---

## Tips Penamaan Subdomain

- Gunakan huruf kecil semua
- Pisahkan kata dengan tanda hubung (`-`)
- Hindari karakter khusus selain tanda hubung
- Maksimal sekitar 20 karakter agar URL tidak terlalu panjang

**Contoh yang baik:**
```
bengkel-jaya
laundry-bersih
toko-pak-amin
klinik-sehat
```

**Contoh yang tidak valid:**
```
Bengkel Jaya     ← ada huruf kapital dan spasi
bengkel_jaya     ← underscore tidak diperbolehkan
bengkel.jaya     ← titik tidak diperbolehkan
```

---

## Menjalankan Script di Docker

Jika aplikasi berjalan dalam Docker container:

```bash
# Masuk ke container service
docker exec -it whatsapp-admin-app sh

# Lalu jalankan script seperti biasa
node src/scripts/createTenant.js \
  --subdomain bengkel-jaya \
  --name "Bengkel Jaya Motor" \
  --owner "Budi" \
  --email budi@bengkel.com \
  --password rahasia123
```

Atau langsung dari host tanpa masuk ke container:

```bash
docker exec whatsapp-admin-app node src/scripts/createTenant.js \
  --subdomain bengkel-jaya \
  --name "Bengkel Jaya Motor" \
  --owner "Budi" \
  --email budi@bengkel.com \
  --password rahasia123
```
