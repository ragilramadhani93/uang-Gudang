import * as SQLite from 'expo-sqlite';
import { Transaction, KasSummary, TransactionCategory } from '../types';

let dbInstance: SQLite.SQLiteDatabase | null = null;

export const DEFAULT_PLAFON = 2000000;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbInstance) {
    dbInstance = await SQLite.openDatabaseAsync('ops_gudang.db');
  }
  return dbInstance;
}

export function formatVoucherNumber(tanggal: string): string {
  // Format YYYY-MM-DD -> BPG-YYYYMMDD-01
  const cleanDate = tanggal.replace(/[^0-9]/g, '');
  return `BPG-${cleanDate}-01`;
}

export async function initDatabase(): Promise<void> {
  const db = await getDb();
  
  // Enable WAL mode for high performance & reliability
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tanggal TEXT NOT NULL,
      no_bukti TEXT NOT NULL,
      kategori TEXT NOT NULL,
      keterangan TEXT NOT NULL,
      plat_nomor TEXT,
      rute TEXT,
      masuk INTEGER NOT NULL DEFAULT 0,
      keluar INTEGER NOT NULL DEFAULT 0,
      foto_uri TEXT,
      created_at TEXT NOT NULL
    );
  `);

  // Check if seed is needed
  const countResult = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM transactions;'
  );

  if (!countResult || countResult.count === 0) {
    await seedDatabase(db);
  }
}

export async function seedDatabase(db?: SQLite.SQLiteDatabase): Promise<void> {
  const targetDb = db || (await getDb());
  
  // Seed data pembuka wajib:
  // 1. Modal awal: Masuk 2000000, Keluar 0
  // 2. Penyesuaian: Masuk 0, Keluar 228500
  // Hasil: Saldo 1.771.500 & Reimburse 228.500
  const now = new Date().toISOString();
  
  await targetDb.runAsync(
    `INSERT INTO transactions (tanggal, no_bukti, kategori, keterangan, masuk, keluar, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?);`,
    '2026-11-20',
    '-',
    'Plafon Awal',
    'Modal awal kas kecil operasional gudang',
    2000000,
    0,
    now
  );

  await targetDb.runAsync(
    `INSERT INTO transactions (tanggal, no_bukti, kategori, keterangan, masuk, keluar, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?);`,
    '2026-11-20',
    'BPG-AWAL',
    'Penyesuaian',
    'Pengeluaran berjalan sebelum tracker (selisih plafon vs cash on hand)',
    0,
    228500,
    now
  );
}

export async function getAllTransactions(): Promise<Transaction[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<Transaction>(
    'SELECT * FROM transactions ORDER BY tanggal DESC, id DESC;'
  );
  return rows;
}

export async function getTransactionsByVoucher(noBukti: string): Promise<Transaction[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<Transaction>(
    'SELECT * FROM transactions WHERE no_bukti = ? ORDER BY id ASC;',
    noBukti
  );
  return rows;
}

export async function getAllVouchers(): Promise<{ no_bukti: string; tanggal: string; count: number; totalKeluar: number }[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ no_bukti: string; tanggal: string; count: number; totalKeluar: number }>(
    `SELECT no_bukti, MAX(tanggal) as tanggal, COUNT(*) as count, SUM(keluar) as totalKeluar 
     FROM transactions 
     WHERE no_bukti != '-' 
     GROUP BY no_bukti 
     ORDER BY tanggal DESC, no_bukti DESC;`
  );
  return rows;
}

export async function addTransaction(params: {
  tanggal: string;
  no_bukti?: string;
  kategori: TransactionCategory;
  keterangan: string;
  plat_nomor?: string;
  rute?: string;
  masuk: number;
  keluar: number;
  foto_uri?: string | null;
}): Promise<number> {
  const db = await getDb();
  
  // Rule pengelompokan 1 Lembar Bukti:
  // Semua pengeluaran Tol dan Bensin pada tanggal yang sama otomatis memakai No. Bukti BPG-YYYYMMDD-01
  let noBukti = params.no_bukti?.trim();
  if (!noBukti || noBukti === '-' || params.kategori === 'Tol' || params.kategori === 'Bensin') {
    if (params.kategori === 'Top-Up' || params.kategori === 'Plafon Awal') {
      noBukti = '-';
    } else {
      noBukti = formatVoucherNumber(params.tanggal);
    }
  }

  const result = await db.runAsync(
    `INSERT INTO transactions (tanggal, no_bukti, kategori, keterangan, plat_nomor, rute, masuk, keluar, foto_uri, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    params.tanggal,
    noBukti,
    params.kategori,
    params.keterangan,
    params.plat_nomor || null,
    params.rute || null,
    params.masuk,
    params.keluar,
    params.foto_uri || null,
    new Date().toISOString()
  );

  return result.lastInsertRowId;
}

export async function deleteTransaction(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM transactions WHERE id = ?;', id);
}

export async function resetDatabase(): Promise<void> {
  const db = await getDb();
  await db.execAsync('DROP TABLE IF EXISTS transactions;');
  await initDatabase();
}

export async function getKasSummary(plafon: number = DEFAULT_PLAFON): Promise<KasSummary> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ totalMasuk: number | null; totalKeluar: number | null }>(
    'SELECT SUM(masuk) as totalMasuk, SUM(keluar) as totalKeluar FROM transactions;'
  );

  const totalMasuk = row?.totalMasuk || 0;
  const totalKeluar = row?.totalKeluar || 0;
  const cashOnHand = totalMasuk - totalKeluar;
  
  // Imprest Petty Cash:
  // Kebutuhan reimburse adalah selisih plafon dengan sisa kas fisik saat ini
  const kebutuhanReimburse = Math.max(0, plafon - cashOnHand);

  return {
    plafon,
    totalMasuk,
    totalKeluar,
    cashOnHand,
    kebutuhanReimburse,
  };
}
