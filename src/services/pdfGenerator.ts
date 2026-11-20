import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Transaction } from '../types';

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount).replace('IDR', 'Rp');
}

export function formatDateIndo(dateStr: string): string {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const year = parts[0];
  const month = months[parseInt(parts[1], 10) - 1] || parts[1];
  const day = parseInt(parts[2], 10);

  return `${day} ${month} ${year}`;
}

export function angkaKeTerbilang(nilai: number): string {
  if (nilai === 0) return 'Nol Rupiah';
  
  const bilangan = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];
  
  function sebut(n: number): string {
    if (n < 12) return bilangan[n];
    if (n < 20) return sebut(n - 10) + ' Belas';
    if (n < 100) return sebut(Math.floor(n / 10)) + ' Puluh ' + sebut(n % 10);
    if (n < 200) return 'Seratus ' + sebut(n - 100);
    if (n < 1000) return sebut(Math.floor(n / 100)) + ' Ratus ' + sebut(n % 100);
    if (n < 2000) return 'Seribu ' + sebut(n - 1000);
    if (n < 1000000) return sebut(Math.floor(n / 1000)) + ' Ribu ' + sebut(n % 1000);
    if (n < 1000000000) return sebut(Math.floor(n / 1000000)) + ' Juta ' + sebut(n % 1000000);
    if (n < 1000000000000) return sebut(Math.floor(n / 1000000000)) + ' Milyar ' + sebut(n % 1000000000);
    return '';
  }

  const hasil = sebut(Math.floor(Math.abs(nilai))).replace(/\s+/g, ' ').trim();
  return (hasil ? hasil : 'Nol') + ' Rupiah';
}

export function generateVoucherHtml(params: {
  noBukti: string;
  tanggal: string;
  items: Transaction[];
  cashOnHand: number;
  plafon: number;
}): string {
  const { noBukti, tanggal, items, cashOnHand, plafon } = params;

  let subtotalTol = 0;
  let subtotalBensin = 0;
  let subtotalLainnya = 0;

  // Dapatkan plat nomor dan penerima dari item pertama yang ada
  let platNomorList: string[] = [];
  items.forEach((item) => {
    if (item.kategori === 'Tol') subtotalTol += item.keluar;
    else if (item.kategori === 'Bensin') subtotalBensin += item.keluar;
    else subtotalLainnya += item.keluar;

    if (item.plat_nomor && !platNomorList.includes(item.plat_nomor)) {
      platNomorList.push(item.plat_nomor);
    }
  });

  const totalPengeluaran = subtotalTol + subtotalBensin + subtotalLainnya;
  const platNomorStr = platNomorList.length > 0 ? platNomorList.join(', ') : '-';
  const terbilangStr = angkaKeTerbilang(totalPengeluaran);
  const totalLampiran = items.filter(it => it.foto_uri).length || items.length;

  const tableRows = items.map((item, index) => {
    const detailParts = [];
    if (item.plat_nomor) detailParts.push(`Plat: ${item.plat_nomor}`);
    if (item.rute) detailParts.push(`Rute: ${item.rute}`);
    const extraStr = detailParts.length > 0 ? `<div class="sub-detail">${detailParts.join(' &bull; ')}</div>` : '';

    return `
      <tr>
        <td class="text-center">${index + 1}</td>
        <td class="text-center font-bold">${item.kategori}</td>
        <td>
          <div class="item-title">${item.keterangan}</div>
          ${extraStr}
        </td>
        <td class="text-right num font-bold">${formatRupiah(item.keluar)}</td>
      </tr>
    `;
  }).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Bukti Kas Keluar - ${noBukti}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 15mm 12mm 15mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      font-size: 10.5pt;
      line-height: 1.35;
      color: #111315;
      background: #FFFFFF;
      margin: 0;
      padding: 0;
    }

    /* Box Luar Form Kuning / Klasik Kas Keluar */
    .voucher-frame {
      border: 2px solid #111315;
      padding: 12px 14px;
      background: #FFFFFF;
    }

    .top-strip {
      text-align: center;
      font-size: 8pt;
      font-weight: 800;
      letter-spacing: 2px;
      color: #52525B;
      border-bottom: 1px dashed #71717A;
      padding-bottom: 3px;
      margin-bottom: 8px;
    }

    .header-layout {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 12px;
      border-bottom: 2px solid #111315;
      padding-bottom: 10px;
    }

    .title-block {
      flex: 1;
    }
    .title-main {
      font-size: 18pt;
      font-weight: 900;
      letter-spacing: 1px;
      text-transform: uppercase;
      margin: 0;
    }
    .company-sub {
      font-size: 9pt;
      font-weight: 700;
      color: #475569;
      text-transform: uppercase;
      margin-top: 2px;
    }

    .meta-box-right {
      width: 220px;
      border: 1px solid #111315;
      background: #F8FAFC;
      font-size: 9pt;
    }
    .meta-row {
      display: flex;
      border-bottom: 1px solid #CBD5E1;
      padding: 4px 8px;
    }
    .meta-row:last-child {
      border-bottom: none;
    }
    .meta-lbl {
      width: 80px;
      font-weight: 700;
      color: #475569;
    }
    .meta-val {
      flex: 1;
      font-weight: 800;
      text-align: right;
    }

    /* Box Info Armada & Penerima */
    .party-grid {
      display: flex;
      border: 1px solid #111315;
      margin-bottom: 12px;
      background: #F8FAFC;
    }
    .party-col {
      flex: 1;
      padding: 6px 10px;
      font-size: 9.5pt;
    }
    .party-col:first-child {
      border-right: 1px solid #111315;
    }
    .party-lbl {
      font-size: 8pt;
      font-weight: 700;
      color: #64748B;
      text-transform: uppercase;
      margin-bottom: 2px;
    }
    .party-val {
      font-size: 10.5pt;
      font-weight: 800;
      color: #0F172A;
    }

    /* Tabel Uraian Pengeluaran */
    table.data-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 10px;
      border: 1px solid #111315;
    }
    table.data-table th {
      background: #18181B;
      color: #FFFFFF;
      font-size: 9pt;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 6px 8px;
      border: 1px solid #18181B;
    }
    table.data-table td {
      padding: 6px 8px;
      border: 1px solid #94A3B8;
      font-size: 9.5pt;
      vertical-align: middle;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .font-bold { font-weight: 700; }
    .num {
      font-variant-numeric: tabular-nums;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }
    .item-title {
      font-weight: 700;
      color: #0F172A;
    }
    .sub-detail {
      font-size: 8pt;
      color: #64748B;
      margin-top: 1px;
    }

    /* Terbilang & Total Box */
    .bottom-summary-grid {
      display: flex;
      border: 1px solid #111315;
      margin-bottom: 14px;
    }
    .terbilang-box {
      flex: 1.3;
      padding: 8px 10px;
      border-right: 1px solid #111315;
      background: #FAFAFA;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    .terbilang-lbl {
      font-size: 8pt;
      font-weight: 800;
      color: #64748B;
      text-transform: uppercase;
      margin-bottom: 3px;
    }
    .terbilang-text {
      font-size: 10pt;
      font-weight: 800;
      font-style: italic;
      color: #0F172A;
      line-height: 1.3;
    }

    .totals-box {
      flex: 1;
      padding: 6px 10px;
      background: #FFFFFF;
    }
    .tot-row {
      display: flex;
      justify-content: space-between;
      font-size: 9pt;
      padding: 3px 0;
      border-bottom: 1px solid #E2E8F0;
    }
    .tot-row.grand {
      border-bottom: none;
      padding-top: 5px;
      font-size: 11pt;
      font-weight: 900;
      color: #09090B;
    }

    /* Status Imprest info bar */
    .imprest-status-bar {
      display: flex;
      justify-content: space-between;
      background: #F1F5F9;
      border: 1px solid #CBD5E1;
      padding: 5px 8px;
      font-size: 8.5pt;
      margin-bottom: 14px;
    }

    /* 5 Kolom Tanda Tangan Sesuai Fisik Form Kas Keluar */
    .signature-grid {
      display: flex;
      border: 1px solid #111315;
      background: #FFFFFF;
    }
    .sig-col {
      flex: 1;
      border-right: 1px solid #111315;
      text-align: center;
      padding: 6px 4px;
    }
    .sig-col:last-child {
      border-right: none;
    }
    .sig-role {
      font-size: 8pt;
      font-weight: 800;
      text-transform: uppercase;
      color: #334155;
      margin-bottom: 45px;
    }
    .sig-name {
      border-top: 1px dashed #64748B;
      margin: 0 4px;
      padding-top: 4px;
      font-size: 8.5pt;
      font-weight: 800;
    }
    .sig-date {
      font-size: 7pt;
      color: #64748B;
      margin-top: 2px;
    }

    .footer-doc {
      margin-top: 8px;
      font-size: 7.5pt;
      color: #64748B;
      display: flex;
      justify-content: space-between;
      font-weight: 600;
    }
  </style>
</head>
<body>

  <div class="voucher-frame">
    <div class="top-strip">KEPERLUAN INTERN OPERASIONAL GUDANG &bull; SISTEM DANA TETAP (IMPREST)</div>

    <div class="header-layout">
      <div class="title-block">
        <h1 class="title-main">BUKTI KAS KELUAR</h1>
        <div class="company-sub">LOGISTIK & OPERASIONAL ARMADA GUDANG</div>
      </div>
      <div class="meta-box-right">
        <div class="meta-row">
          <span class="meta-lbl">No. Bukti</span>
          <span class="meta-val num">${noBukti}</span>
        </div>
        <div class="meta-row">
          <span class="meta-lbl">Tanggal</span>
          <span class="meta-val">${formatDateIndo(tanggal)}</span>
        </div>
        <div class="meta-row">
          <span class="meta-lbl">Lampiran</span>
          <span class="meta-val">${totalLampiran} Lembar</span>
        </div>
      </div>
    </div>

    <div class="party-grid">
      <div class="party-col">
        <div class="party-lbl">Dibayarkan Kepada / Penerima</div>
        <div class="party-val">Supir / Driver Armada (Kas Operasional)</div>
      </div>
      <div class="party-col">
        <div class="party-lbl">Kendaraan / Plat Nomor Armada</div>
        <div class="party-val num">${platNomorStr}</div>
      </div>
    </div>

    <table class="data-table">
      <thead>
        <tr>
          <th style="width: 28px;">NO</th>
          <th style="width: 80px;">PERKIRAAN</th>
          <th>URAIAN PENGELUARAN</th>
          <th style="width: 110px;">JUMLAH (RP)</th>
        </tr>
      </thead>
      <tbody>
        ${tableRows.length > 0 ? tableRows : '<tr><td colspan="4" class="text-center" style="padding: 14px; color: #64748B;">Tidak ada item pengeluaran.</td></tr>'}
      </tbody>
    </table>

    <div class="bottom-summary-grid">
      <div class="terbilang-box">
        <div class="terbilang-lbl">Terbilang :</div>
        <div class="terbilang-text"># ${terbilangStr} #</div>
      </div>
      <div class="totals-box">
        <div class="tot-row">
          <span>Subtotal Tol</span>
          <span class="num font-bold">${formatRupiah(subtotalTol)}</span>
        </div>
        <div class="tot-row">
          <span>Subtotal Bensin / BBM</span>
          <span class="num font-bold">${formatRupiah(subtotalBensin)}</span>
        </div>
        ${subtotalLainnya > 0 ? `
        <div class="tot-row">
          <span>Subtotal Parkir / Lainnya</span>
          <span class="num font-bold">${formatRupiah(subtotalLainnya)}</span>
        </div>
        ` : ''}
        <div class="tot-row grand">
          <span>JUMLAH :</span>
          <span class="num">${formatRupiah(totalPengeluaran)}</span>
        </div>
      </div>
    </div>

    <div class="imprest-status-bar">
      <span>Plafon Kas Kecil: <strong class="num">${formatRupiah(plafon)}</strong></span>
      <span>Sisa Cash on Hand Saat Ini: <strong class="num">${formatRupiah(cashOnHand)}</strong></span>
      <span>Kebutuhan Reimburse Kasir: <strong class="num">${formatRupiah(totalPengeluaran)}</strong></span>
    </div>

    <!-- 5 Kolom Tanda Tangan Sesuai Form Standar -->
    <div class="signature-grid">
      <div class="sig-col">
        <div class="sig-role">Pembukuan</div>
        <div class="sig-name">( Admin Kas )</div>
        <div class="sig-date">Tgl: ..........</div>
      </div>
      <div class="sig-col">
        <div class="sig-role">Mengetahui</div>
        <div class="sig-name">( Spv. Gudang )</div>
        <div class="sig-date">Tgl: ..........</div>
      </div>
      <div class="sig-col">
        <div class="sig-role">Menyetujui</div>
        <div class="sig-name">( Manajer Ops )</div>
        <div class="sig-date">Tgl: ..........</div>
      </div>
      <div class="sig-col">
        <div class="sig-role">Kasir</div>
        <div class="sig-name">( Kasir Gudang )</div>
        <div class="sig-date">Tgl: ..........</div>
      </div>
      <div class="sig-col">
        <div class="sig-role">Penerima</div>
        <div class="sig-name">( Driver / Bambang )</div>
        <div class="sig-date">Tgl: ..........</div>
      </div>
    </div>

    <div class="footer-doc">
      <span>* Wajib melampirkan seluruh struk asli (SPBU, e-Toll, dll.) pada lembar ini saat serah terima reimburse.</span>
      <span>Dicetak: ${new Date().toLocaleDateString('id-ID')}</span>
    </div>
  </div>

</body>
</html>
  `;
}

export async function exportAndSharePdf(params: {
  noBukti: string;
  tanggal: string;
  items: Transaction[];
  cashOnHand: number;
  plafon: number;
}): Promise<void> {
  const html = generateVoucherHtml(params);
  
  const { uri } = await Print.printToFileAsync({
    html,
    width: 595, // standard A4 pt
    height: 842,
  });

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: `Bagikan Bukti Kas Keluar ${params.noBukti}`,
      UTI: 'com.adobe.pdf',
    });
  } else {
    await Print.printAsync({ uri });
  }
}
