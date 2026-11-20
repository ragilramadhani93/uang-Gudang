export type TransactionCategory = 
  | 'Plafon Awal' 
  | 'Penyesuaian' 
  | 'Tol' 
  | 'Bensin' 
  | 'Top-Up' 
  | 'Lainnya';

export interface Transaction {
  id: number;
  tanggal: string; // YYYY-MM-DD
  no_bukti: string; // e.g. '-' or 'BPG-AWAL' or 'BPG-20261120-01'
  kategori: TransactionCategory;
  keterangan: string;
  plat_nomor?: string;
  rute?: string;
  masuk: number;
  keluar: number;
  foto_uri?: string | null;
  created_at: string;
}

export interface KasSummary {
  plafon: number;
  totalMasuk: number;
  totalKeluar: number;
  cashOnHand: number;
  kebutuhanReimburse: number;
}

export interface GeminiOcrResult {
  tanggal: string;
  kategori: 'Tol' | 'Bensin' | 'Lainnya';
  keterangan: string;
  nominal: number;
  rawText?: string;
}
