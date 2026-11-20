import { GeminiOcrResult } from '../types';

export function getTodayFormatted(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const OCR_PROMPT = `
Anda adalah asisten cerdas OCR khusus struk operasional armada & gudang di Indonesia (struk Gerbang Tol, struk SPBU Pertamina/Shell/BP, atau biaya operasional darurat).
Analisis gambar struk terlampir dan ekstrak informasi ke dalam format JSON murni:
{
  "tanggal": "YYYY-MM-DD",
  "kategori": "Tol" atau "Bensin" atau "Lainnya",
  "keterangan": "Nama gerbang tol / nama SPBU / jenis BBM / merchant",
  "nominal": 125000
}

Petunjuk:
1. tanggal: Cari tanggal transaksi pada struk. Jika tanggal tidak ditemukan, pudar, atau tidak terbaca jelas, gunakan: "${getTodayFormatted()}".
2. kategori:
   - Jika struk gerbang tol / tarif tol / gardu tol / e-toll / struk tap kartu: "Tol".
   - Jika struk pengisian bahan bakar / SPBU Pertamina / Shell / BP / Pertalite / Pertamax / Biosolar / Dex: "Bensin".
   - Jika lainnya (parkir, tambal ban darurat, cuci armada): "Lainnya".
3. keterangan: Ringkas dan jelas, contoh: "Tol Cikarang Utama - Japek", "SPBU 34.12345 Pertamax 20L", atau "SPBU KM 57".
4. nominal: Nilai total yang dibayarkan dalam integer angka murni tanpa titik/koma/simbol Rp (misal: 125000).
Keluarkan HANYA format JSON yang valid.
`;

export async function scanReceiptWithGemini(
  base64Image: string,
  apiKey: string
): Promise<GeminiOcrResult> {
  if (!apiKey || apiKey.trim() === '') {
    throw new Error('Gemini API Key belum diatur. Silakan masukkan API Key di menu Pengaturan.');
  }

  const payload = {
    contents: [
      {
        parts: [
          {
            text: OCR_PROMPT,
          },
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Image,
            },
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      responseMimeType: 'application/json',
    },
  };

  // Coba gemini-2.5-flash terlebih dahulu, jika gagal coba gemini-1.5-flash
  const models = ['gemini-2.5-flash', 'gemini-1.5-flash'];
  let lastError: any = null;

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey.trim()}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const msg = errorData?.error?.message || `HTTP ${response.status} (${response.statusText})`;
        
        // If 404 or model not found, try next model
        if (response.status === 404 || msg.toLowerCase().includes('not found')) {
          lastError = new Error(`Model ${model} tidak tersedia: ${msg}`);
          continue;
        }
        
        throw new Error(`Gemini API Error: ${msg}`);
      }

      const data = await response.json();
      const candidate = data.candidates?.[0];
      const text = candidate?.content?.parts?.[0]?.text;

      if (!text) {
        throw new Error('Tidak ada respon teks yang dihasilkan oleh Gemini.');
      }

      // Parse JSON from text
      let cleanedJsonText = text.trim();
      if (cleanedJsonText.startsWith('```json')) {
        cleanedJsonText = cleanedJsonText.replace(/^```json/, '').replace(/```$/, '').trim();
      } else if (cleanedJsonText.startsWith('```')) {
        cleanedJsonText = cleanedJsonText.replace(/^```/, '').replace(/```$/, '').trim();
      }

      const parsed = JSON.parse(cleanedJsonText);

      // Sanitize fields
      let tanggal = parsed.tanggal;
      if (!tanggal || !/^\d{4}-\d{2}-\d{2}$/.test(tanggal)) {
        tanggal = getTodayFormatted();
      }

      let kategori: 'Tol' | 'Bensin' | 'Lainnya' = 'Lainnya';
      if (parsed.kategori === 'Tol' || parsed.kategori === 'Bensin') {
        kategori = parsed.kategori;
      } else if (typeof parsed.kategori === 'string') {
        const kLower = parsed.kategori.toLowerCase();
        if (kLower.includes('tol')) kategori = 'Tol';
        else if (kLower.includes('bensin') || kLower.includes('spbu') || kLower.includes('bbm')) kategori = 'Bensin';
      }

      const keterangan = parsed.keterangan ? String(parsed.keterangan).trim() : 'Operasional Armada Gudang';
      let nominal = parseInt(String(parsed.nominal).replace(/[^0-9]/g, ''), 10);
      if (isNaN(nominal) || nominal < 0) {
        nominal = 0;
      }

      return {
        tanggal,
        kategori,
        keterangan,
        nominal,
        rawText: text,
      };
    } catch (err: any) {
      lastError = err;
      if (err.message && err.message.includes('API Key')) {
        throw err;
      }
    }
  }

  throw lastError || new Error('Gagal menghubungi Gemini API.');
}

export async function testGeminiKey(apiKey: string): Promise<boolean> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey.trim()}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: 'Ping. Jawab 1 kata: OK' }] }],
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData?.error?.message || `HTTP ${response.status}`);
  }

  return true;
}
