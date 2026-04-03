# Jawara Business — Knowledge Base

Dokumen ini adalah contoh knowledge base yang dapat diunggah ke sistem RAG (Qdrant).
Upload file ini (atau versi PDF-nya) melalui endpoint:

  POST http://localhost:5678/webhook/index-docs
  (attach file as multipart form-data, field: "data")

Setelah diindeks, AI akan menggunakan konten ini untuk menjawab pertanyaan pelanggan.

---

## 1. Tentang Kami

**Nama Usaha**: Jawara Katering & Kue
**Lokasi**: Jl. Merdeka No. 12, Bandung, Jawa Barat
**Jam Operasional**: Senin – Sabtu, 08.00 – 17.00 WIB
**WhatsApp**: 628123456789
**Instagram**: @jawarakatering

Kami melayani pesanan kue ulang tahun, kue pernikahan, hampers, dan paket katering untuk acara keluarga maupun korporat.
Pengiriman tersedia untuk area Bandung dan sekitarnya (radius 20 km).

---

## 2. Menu & Produk

### Kue Ulang Tahun

| Produk                   | Ukuran    | Harga        |
|--------------------------|-----------|--------------|
| Kue Coklat Klasik        | 18 cm     | Rp 180.000   |
| Kue Coklat Klasik        | 22 cm     | Rp 250.000   |
| Kue Coklat Klasik        | 26 cm     | Rp 350.000   |
| Kue Red Velvet           | 18 cm     | Rp 210.000   |
| Kue Red Velvet           | 22 cm     | Rp 290.000   |
| Kue Keju Strawberry      | 18 cm     | Rp 200.000   |
| Kue Keju Strawberry      | 22 cm     | Rp 275.000   |
| Kue Taro (Purple)        | 18 cm     | Rp 195.000   |
| Kue Karakter (custom)    | 20 cm     | mulai Rp 350.000 |

> Semua kue dapat ditambahkan tulisan nama tanpa biaya tambahan.
> Lilin ulang tahun disertakan gratis untuk pemesanan kue.

---

### Kue Pernikahan & Engagement

| Paket             | Keterangan                              | Harga          |
|-------------------|-----------------------------------------|----------------|
| Paket Silver      | 3 tier, dekorasi fondant polos          | Rp 950.000     |
| Paket Gold        | 3 tier, dekorasi fondant floral         | Rp 1.500.000   |
| Paket Platinum    | 4 tier, custom penuh, fondant + bunga   | Rp 2.500.000   |
| Mini Wedding Cake | 1 tier, cocok untuk pre-wedding photo   | Rp 350.000     |

> Pemesanan kue pernikahan minimal H-14 hari.

---

### Hampers & Parcel

| Paket Hampers         | Isi                                                | Harga       |
|-----------------------|----------------------------------------------------|-------------|
| Hampers Mini          | 3 toples kue kering + 1 loaf banana cake           | Rp 185.000  |
| Hampers Standar       | 5 toples kue kering + 1 lapis legit mini           | Rp 320.000  |
| Hampers Premium       | 7 toples kue kering + brownies + lapis surabaya    | Rp 550.000  |
| Hampers Korporat      | Custom isi & packaging, min. order 20 pcs          | Rp 250.000/pcs |

> Tersedia packaging custom dengan logo perusahaan untuk pesanan Hampers Korporat (biaya tambahan Rp 15.000/pcs).

---

### Kue Kering (per toples 350 gr)

| Varian            | Harga     |
|-------------------|-----------|
| Nastar            | Rp 75.000 |
| Putri Salju       | Rp 70.000 |
| Kastengel         | Rp 80.000 |
| Semprit           | Rp 65.000 |
| Lidah Kucing      | Rp 70.000 |
| Choco Crinkle     | Rp 75.000 |

> Minimal order kue kering: 3 toples per varian.

---

### Paket Katering

| Paket              | Porsi   | Menu                                                   | Harga/porsi  |
|--------------------|---------|--------------------------------------------------------|--------------|
| Nasi Box Standar   | min 20  | nasi + 1 ayam/ikan + 2 sayur + kerupuk + teh kotak    | Rp 25.000    |
| Nasi Box Premium   | min 20  | nasi + rendang/ayam bakar + 3 lauk + buah + air mineral | Rp 40.000  |
| Prasmanan Keluarga | min 30  | 2 menu utama + 3 lauk + 2 sayur + 2 minuman            | Rp 55.000    |
| Snack Box          | min 30  | 3 item snack + minuman                                 | Rp 18.000    |

> Harga belum termasuk ongkos pengiriman.
> Untuk acara > 100 porsi, tersedia diskon 5%.

---

## 3. Cara Pemesanan

1. Hubungi kami via WhatsApp di **628123456789**
2. Informasikan:
   - Nama pemesan
   - Produk & ukuran yang diinginkan
   - Tanggal pengiriman / pengambilan yang diinginkan
   - Alamat pengiriman (jika diantar)
   - Desain atau referensi (untuk kue custom, lampirkan foto)
3. Kami akan mengirimkan konfirmasi pesanan + nominal DP
4. Lakukan pembayaran DP dalam 1×24 jam untuk mengamankan slot
5. Pelunasan dilakukan H-1 sebelum pengiriman

---

## 4. Pembayaran

**Metode yang diterima:**
- Transfer Bank BCA — No. Rek: 1234567890 a.n. Jawara Katering
- Transfer Bank Mandiri — No. Rek: 0987654321 a.n. Jawara Katering
- GoPay / OVO / DANA — 628123456789
- QRIS (tersedia di toko)

**DP (Down Payment):**
- Kue & Hampers: DP 50% dari total harga
- Katering: DP 30% dari total harga
- Kue Pernikahan: DP 50% minimal H-14

> Bukti transfer harap dikirimkan via WhatsApp setelah melakukan pembayaran.

---

## 5. Pengiriman

| Zona                        | Ongkos Kirim       |
|-----------------------------|--------------------|
| Bandung Kota                | Rp 15.000          |
| Bandung Barat / Timur       | Rp 20.000 – 25.000 |
| Cimahi                      | Rp 20.000          |
| Luar area (>20 km)          | Hubungi kami       |

- Jam pengiriman: 08.00 – 16.00 WIB
- Pengiriman kue tier/pernikahan hanya dilayani oleh kurir kami sendiri (tidak via ojek online)
- Opsi ambil sendiri tersedia di toko (senin – sabtu, 08.00 – 17.00)

---

## 6. Kebijakan Pembatalan & Perubahan

- Pembatalan pesanan **H-3 atau lebih**: DP dikembalikan 50%
- Pembatalan pesanan **H-2 atau H-1**: DP tidak dapat dikembalikan
- Perubahan desain/ukuran masih dapat dilakukan **maksimal H-3** sebelum tanggal pengiriman
- Perubahan mendadak (H-1 atau H-2) dikenakan biaya tambahan sesuai kondisi

---

## 7. FAQ

**Q: Apakah bisa custom rasa dan warna?**
A: Ya, kami menerima request rasa (vanilla, coklat, red velvet, pandan, taro, keju, dll.) dan warna buttercream sesuai keinginan. Untuk kue karakter atau custom penuh, harap lampirkan referensi gambar saat pemesanan.

**Q: Berapa lama ketahanan kue?**
A: Kue basah (ulang tahun, pernikahan) tahan 2–3 hari di suhu ruang dan hingga 5 hari di kulkas. Kue kering tahan 2–4 minggu di toples kedap udara.

**Q: Apakah ada diskon untuk pemesanan dalam jumlah banyak?**
A: Ada! Untuk pesanan kue ulang tahun ≥5 pcs: diskon 5%. Hampers ≥10 pcs: diskon 7%. Katering >100 porsi: diskon 5%. Hubungi kami untuk negosiasi pesanan korporat.

**Q: Bisakah saya melihat contoh desain kue?**
A: Bisa! Lihat portofolio kami di Instagram @jawarakatering atau minta katalog via WhatsApp.

**Q: Apakah tersedia pilihan bebas gluten atau vegan?**
A: Saat ini kami belum menyediakan produk bebas gluten. Untuk pilihan vegan (tanpa telur/susu) tersedia untuk beberapa varian, harap konfirmasi saat pemesanan.

**Q: Bagaimana jika produk rusak saat diterima?**
A: Foto kondisi produk segera setelah diterima dan hubungi kami via WhatsApp dalam 1 jam. Kami akan mengevaluasi dan memberikan solusi terbaik (penggantian atau refund sebagian).

---

## 8. Kontak & Sosial Media

- **WhatsApp**: 628123456789 (fast response jam kerja)
- **Instagram**: @jawarakatering
- **Email**: hello@jawarakatering.id
- **Alamat Toko**: Jl. Merdeka No. 12, Bandung 40111

---

*Dokumen ini terakhir diperbarui: Maret 2026*
*Harga dapat berubah sewaktu-waktu. Konfirmasi harga terkini via WhatsApp.*
