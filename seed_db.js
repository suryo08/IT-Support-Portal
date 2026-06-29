const { Pool } = require('pg');
const crypto = require('crypto');
const axios = require('axios');

const connectionString = process.env.DATABASE_URL || 'postgresql://gilang:gilang1234@31.97.187.38:999/gilang';
const pool = new Pool({ connectionString });

const STORAGE_URL = 'https://integrations.emergentagent.com/objstore/api/v1/storage';
const EMERGENT_KEY = process.env.EMERGENT_LLM_KEY || '';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

const TUTORIALS = [
  {
    title: 'Cara Reset Password Email Korporat',
    category: 'Office 365 Apps',
    content: `Panduan Reset Password Email Korporat

Jika Anda lupa password email korporat, ikuti langkah berikut:

1. Buka halaman login email korporat
2. Klik link "Lupa Password?" di bawah form login
3. Masukkan alamat email korporat Anda
4. Cek inbox email alternatif Anda untuk link reset password
5. Klik link tersebut (berlaku 1 jam)
6. Masukkan password baru (minimal 8 karakter, kombinasi huruf besar, kecil, angka, dan simbol)
7. Konfirmasi password baru
8. Login dengan password baru Anda

Catatan Keamanan:
- Jangan gunakan password yang sama dengan akun lain
- Ganti password secara berkala setiap 3 bulan
- Jangan bagikan password kepada siapa pun
- Aktifkan two-factor authentication untuk keamanan ekstra

Jika masih mengalami kendala, hubungi IT Support di ext. 1234 atau email support@company.com`
  },
  {
    title: 'Troubleshooting Printer Tidak Mau Print',
    category: 'Hardware',
    content: `Solusi Masalah Printer Tidak Mau Print

Masalah umum printer dan solusinya:

A. Cek Koneksi Dasar
1. Pastikan printer menyala (lampu power hijau)
2. Cek kabel USB atau koneksi WiFi
3. Pastikan printer terhubung ke komputer yang benar
4. Restart printer: matikan, tunggu 30 detik, nyalakan kembali

B. Cek Status Printer di Komputer
1. Buka Control Panel > Devices and Printers (Windows)
2. Klik kanan pada printer Anda
3. Pastikan tidak ada tanda "Offline" atau "Paused"
4. Jika ada, klik "Set as Default Printer" dan "Resume Printing"

C. Clear Print Queue
1. Buka Devices and Printers
2. Double-click printer Anda
3. Klik Document > Cancel All Documents
4. Tunggu hingga queue kosong, lalu coba print ulang

D. Update atau Reinstall Driver
1. Download driver terbaru dari website printer
2. Uninstall driver lama di Control Panel > Programs
3. Install driver baru
4. Restart komputer

E. Cek Kertas dan Tinta
1. Pastikan ada kertas di tray
2. Cek level tinta/toner (tidak kosong)
3. Pastikan tidak ada paper jam

Jika semua langkah di atas sudah dicoba tapi masih gagal, hubungi IT Support.`
  },
  {
    title: 'Cara Koneksi VPN Kantor dari Rumah',
    category: 'Network',
    content: `Panduan Koneksi VPN untuk Remote Work

VPN (Virtual Private Network) memungkinkan Anda mengakses jaringan kantor secara aman dari rumah.

Langkah Setup Awal (hanya sekali):
1. Download aplikasi VPN dari portal IT (link dikirim via email)
2. Install aplikasi sesuai sistem operasi Anda (Windows/Mac)
3. Buka aplikasi VPN
4. Masukkan kredensial VPN Anda:
   - Server: vpn.company.com
   - Username: username korporat Anda
   - Password: password VPN (berbeda dari password email)

Cara Koneksi VPN:
1. Buka aplikasi VPN
2. Klik tombol "Connect"
3. Masukkan password VPN jika diminta
4. Tunggu status berubah menjadi "Connected" (ikon berubah hijau)

Jika koneksi gagal:
- Pastikan internet rumah Anda aktif dan stabil
- Cek apakah Anda menggunakan koneksi hotspot seluler (beberapa operator memblokir VPN)
- Hubungi IT Support jika akun VPN terblokir.`
  },
  {
    title: 'Panduan Menggunakan Microsoft Teams',
    category: 'Online Meeting',
    content: `Panduan Menggunakan Microsoft Teams untuk Rapat Online

Microsoft Teams adalah aplikasi utama untuk kolaborasi dan rapat online di perusahaan.

A. Membuat Rapat Baru (Scheduling)
1. Buka Microsoft Teams
2. Masuk ke tab Calendar di menu sebelah kiri
3. Klik tombol "New meeting" di pojok kanan atas
4. Masukkan judul rapat, peserta (email), tanggal, dan waktu
5. Tambahkan detail rapat di kolom deskripsi
6. Klik "Send" (peserta akan menerima undangan Outlook berisi link rapat)

B. Bergabung ke Rapat
1. Buka Calendar di Teams atau Outlook
2. Klik rapat yang akan diikuti, lalu klik "Join"
3. Atur kamera dan mikrofon (nyalakan/matikan) sebelum masuk
4. Klik "Join now"

C. Share Screen Saat Presentasi
1. Di dalam rapat, klik tombol "Share" (ikon panah ke atas)
2. Pilih apakah ingin membagikan seluruh "Screen" atau hanya jendela aplikasi tertentu ("Window")
3. Jika ingin membagikan suara video, centang opsi "Include computer sound"
4. Klik "Stop sharing" jika sudah selesai.`
  }
];

async function getStorageKey() {
  if (!EMERGENT_KEY) return null;
  try {
    const resp = await axios.post(`${STORAGE_URL}/init`, {
      emergent_key: EMERGENT_KEY
    });
    return resp.data.storage_key;
  } catch (err) {
    console.warn('Storage initialization bypassed or failed in seed:', err.message);
    return null;
  }
}

async function uploadPdf(storageKey, tutorialId) {
  if (!storageKey) return `it-support-portal/tutorials/${tutorialId}.pdf`;
  
  // Create mock PDF content
  const pdfBytes = Buffer.from('%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF');
  const path = `it-support-portal/tutorials/${tutorialId}.pdf`;
  
  try {
    await axios.put(`${STORAGE_URL}/objects/${path}`, pdfBytes, {
      headers: {
        'X-Storage-Key': storageKey,
        'Content-Type': 'application/pdf'
      }
    });
    console.log(`Uploaded seed PDF for ${tutorialId}`);
    return path;
  } catch (err) {
    console.warn(`Failed to upload PDF for ${tutorialId}:`, err.message);
    return path;
  }
}

async function getEmbedding(text) {
  if (!GEMINI_API_KEY) return new Array(768).fill(0.0);
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-2:embedContent?key=${GEMINI_API_KEY}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: { parts: [{ text }] },
        outputDimensionality: 768
      })
    });
    if (!response.ok) return new Array(768).fill(0.0);
    const data = await response.json();
    return data.embedding?.values || new Array(768).fill(0.0);
  } catch (err) {
    return new Array(768).fill(0.0);
  }
}

async function seed() {
  console.log('Connecting to PostgreSQL database for seeding...');
  const client = await pool.connect();
  try {
    // 1. Create cosine_similarity function if not exists
    await client.query(`
      CREATE OR REPLACE FUNCTION cosine_similarity(a double precision[], b double precision[])
      RETURNS double precision AS $$
      DECLARE
        dot_product double precision := 0;
        norm_a double precision := 0;
        norm_b double precision := 0;
        i integer;
      BEGIN
        IF array_length(a, 1) IS NULL OR array_length(b, 1) IS NULL OR array_length(a, 1) <> array_length(b, 1) THEN
          RETURN 0;
        END IF;
        FOR i IN 1..array_length(a, 1) LOOP
          dot_product := dot_product + a[i] * b[i];
          norm_a := norm_a + a[i] * a[i];
          norm_b := norm_b + b[i] * b[i];
        END LOOP;
        IF norm_a = 0 OR norm_b = 0 THEN
          RETURN 0;
        END IF;
        RETURN dot_product / (sqrt(norm_a) * sqrt(norm_b));
      END;
      $$ LANGUAGE plpgsql IMMUTABLE;
    `);

    // 2. Create tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'admin',
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        approved_at TIMESTAMP WITH TIME ZONE
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS tutorials (
        id VARCHAR(255) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        content TEXT NOT NULL,
        pdf_path VARCHAR(512),
        embedding double precision[],
        is_deleted BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        created_by VARCHAR(255)
      );
    `);

    // 3. Clear existing tutorials
    await client.query('DELETE FROM tutorials');
    console.log('Cleared existing tutorials.');

    const storageKey = await getStorageKey();

    for (const t of TUTORIALS) {
      const tutorialId = crypto.randomUUID();
      const pdfPath = await uploadPdf(storageKey, tutorialId);
      const embedding = await getEmbedding(t.content);

      await client.query(`
        INSERT INTO tutorials (id, title, category, content, pdf_path, embedding, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, 'default-admin-id')
      `, [tutorialId, t.title, t.category, t.content, pdfPath, embedding]);
      
      console.log(`Seeded tutorial: ${t.title}`);
    }

    console.log('Database seeding finished successfully!');
  } catch (err) {
    console.error('Seeding failed:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
