import { escapeHtml } from './report-print';
import { getMediaUrl } from '@/lib/config';
import {
  fetchTenantInvoiceBranding,
  getTenantBrandingFromStorage,
  mergeInvoiceWithBranding,
  type TenantInvoiceBranding,
} from '@/lib/fetch-tenant-branding';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Alert, Platform } from 'react-native';
import bwipjs from 'bwip-js';
import QRCode from 'qrcode';

export interface InvoiceItemPrint {
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  discountValue?: number;
  discountType?: string;
  total: number;
  imeiNumbers?: string[];
  /** Attribute values to show after product name: "Name (value1, value2)" */
  attributeValues?: string[];
}

export interface InvoicePaymentBreakdownRow {
  type: string;
  amount: number;
  /** Ledger / POS account label when available (invoice print prefers this over type). */
  accountName?: string;
  /** e.g. Cash, Mobile Banking ? used when name is missing and for ?Cash by hand?. */
  accountType?: string;
}

export interface InvoicePrintData {
  invoiceNo: string;
  orderNo: string;
  date: string;
  branchName?: string;
  /** Shown under branch name on print/preview */
  branchAddress?: string;
  branchPhone?: string;
  /** Optional label for Bill To section, e.g. "Retailer" for wholesale */
  billToLabel?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  customerAddress?: string;
  items: InvoiceItemPrint[];
  /** Shown in summary when set (POS / modal). */
  subtotal?: number;
  discountAmount: number;
  couponCode?: string;
  couponDiscount?: number;
  giftCardCode?: string;
  giftCardDiscount?: number;
  /** VIP membership discount (amount); optional % for label */
  vipDiscount?: number;
  vipDiscountPercent?: number;
  pointsDiscount?: number;
  redeemPoints?: number;
  services?: Array<{ name: string; price: number }>;
  taxAmount: number;
  shippingCost: number;
  grandTotal: number;
  paidAmount: number;
  dueAmount: number;
  paymentStatus: string;
  paymentMethod?: string;
  responsiblePerson?: string;
  previousDue?: number | null;
  receivedAmount?: number;
  changeAmount?: number;
  paymentsBreakdown?: InvoicePaymentBreakdownRow[];
  /** Customer/retailer wallet applied toward this invoice (shown in summary + payment block when > 0). */
  advanceApplied?: number | null;
  termsAndConditions?: string;
  /** SMS public receipt terms (separate from sale order T&C). */
  smsReceiptTerms?: { name: string; description: string };
  /** Tenant admin logo (center header). */
  adminLogoUrl?: string | null;
  /** Shown when logo is missing. */
  companyName?: string | null;
  /** Store URL encoded in invoice QR (custom domain when published, else seller-admin). */
  storeQrUrl?: string | null;
  /** Pre-rendered CODE128 barcode as data URL (PNG/SVG) — required for expo-print WebView. */
  barcodeDataUrl?: string | null;
  /** Pre-rendered store QR as data URL (PNG) — required for expo-print WebView. */
  qrDataUrl?: string | null;
}

/** Generate barcode + QR images so print/PDF does not rely on CDN scripts. */
async function attachInvoiceCodeImages(invoice: InvoicePrintData): Promise<InvoicePrintData> {
  const code = String(invoice.invoiceNo || invoice.orderNo || '').trim();
  const storeQrUrl = invoice.storeQrUrl?.trim() || '';

  let barcodeDataUrl = invoice.barcodeDataUrl ?? null;
  let qrDataUrl = invoice.qrDataUrl ?? null;

  if (!barcodeDataUrl && code) {
    try {
      const png = await new Promise<Uint8Array>((resolve, reject) => {
        // bwip-js ships toBuffer at runtime; @types/bwip-js often omits it.
        (bwipjs as unknown as {
          toBuffer: (
            opts: Record<string, unknown>,
            cb: (err: string | Error | undefined, buf?: Uint8Array) => void,
          ) => void;
        }).toBuffer(
          {
            bcid: 'code128',
            text: code,
            scale: 3,
            height: 14,
            includetext: false,
            paddingwidth: 0,
            paddingheight: 0,
          },
          (err, buf) => {
            if (err || !buf) reject(err instanceof Error ? err : new Error(String(err || 'barcode failed')));
            else resolve(buf);
          },
        );
      });
      const base64 = (() => {
        if (typeof Buffer !== 'undefined') {
          return Buffer.from(png).toString('base64');
        }
        let binary = '';
        const chunk = 0x8000;
        for (let i = 0; i < png.length; i += chunk) {
          binary += String.fromCharCode(...png.subarray(i, i + chunk));
        }
        return btoa(binary);
      })();
      barcodeDataUrl = `data:image/png;base64,${base64}`;
    } catch {
      try {
        const svg = bwipjs.toSVG({
          bcid: 'code128',
          text: code,
          scale: 2,
          height: 12,
          includetext: false,
        });
        barcodeDataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
      } catch {
        barcodeDataUrl = null;
      }
    }
  }

  if (!qrDataUrl && storeQrUrl) {
    try {
      qrDataUrl = await QRCode.toDataURL(storeQrUrl, {
        width: 192,
        margin: 1,
        color: { dark: '#111827', light: '#ffffff' },
        errorCorrectionLevel: 'M',
      });
    } catch {
      qrDataUrl = null;
    }
  }

  return { ...invoice, barcodeDataUrl, qrDataUrl };
}

function formatCurrencyBasic(amount: number): string {
  if (isNaN(amount)) return '?0';
  const s = amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).replace(/\.00$/, '');
  return `?${s}`;
}

/** IMEI/Serial: label then numbers on the same line (wrap), not spaced across the row. */
function buildImeiBlockHtml(imeiNumbers: string[] | undefined): string {
  if (!imeiNumbers?.length) return '';
  const list = imeiNumbers.map((n) => String(n).trim()).filter(Boolean);
  if (!list.length) return '';
  const valuesHtml = list.map((n) => escapeHtml(n)).join(', ');
  return `<div class="imei-block"><div class="imei-line"><span class="imei-label">IMEI / Serial</span><span class="imei-values">${valuesHtml}</span></div></div>`;
}

function asNum(v: unknown, def = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}

/** API / Prisma often sends money as string; POS customer list may use number. */
export function parseMoneyField(v: unknown): number | undefined {
  if (v == null || v === '') return undefined;
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string') {
    const t = v.trim().replace(/,/g, '');
    if (t === '') return undefined;
    const n = parseFloat(t);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

/** Customer balance before this sale (same fields as POS CompleteOrderModal). */
export function pickCustomerPreviousDueForInvoice(c: unknown): number | undefined {
  if (!c || typeof c !== 'object') return undefined;
  const raw = c as Record<string, unknown>;
  const v =
    parseMoneyField(raw.totalDue) ??
    parseMoneyField(raw.previousDue) ??
    parseMoneyField(raw.dueAmount);
  return v !== undefined && v > 0 ? v : undefined;
}

function roundMoney2(n: number): number {
  return Math.round((Number(n) || 0) * 100) / 100;
}

/** Advance amount for display: explicit field or sum of `advance` rows in breakdown. */
export function getAdvanceAppliedDisplay(inv: InvoicePrintData): number {
  const direct = parseMoneyField(inv.advanceApplied);
  if (direct !== undefined && direct > 0) return roundMoney2(direct);
  const fromBreakdown = (inv.paymentsBreakdown || [])
    .filter((p) => (p.type || '').toLowerCase() === 'advance')
    .reduce((s, p) => s + (Number(p.amount) || 0), 0);
  return fromBreakdown > 0 ? roundMoney2(fromBreakdown) : 0;
}

function stripInvisible(s: string): string {
  return s.replace(/[\u200B-\u200D\uFEFF]/g, '');
}

/** Normalize API / modal / nested `account` shapes into one breakdown row. */
function parseBreakdownRowFromUnknown(p: Record<string, unknown>): InvoicePaymentBreakdownRow {
  const type = String(p.type ?? 'payment');
  const amount = asNum(p.amount, 0);
  let accountName: string | undefined;
  let accountType: string | undefined;
  if (typeof p.accountName === 'string' && stripInvisible(p.accountName).trim()) {
    accountName = stripInvisible(p.accountName).trim();
  }
  if (!accountName && typeof p.account_name === 'string' && stripInvisible(p.account_name).trim()) {
    accountName = stripInvisible(p.account_name).trim();
  }
  if (typeof p.accountType === 'string' && p.accountType.trim()) {
    accountType = p.accountType.trim();
  }
  if (!accountType && typeof p.account_type === 'string' && p.account_type.trim()) {
    accountType = p.account_type.trim();
  }
  const acc = p.account ?? p.sellerAccount ?? p.seller_account;
  if (acc && typeof acc === 'object') {
    const o = acc as Record<string, unknown>;
    if (!accountName) {
      const n = o.accountName ?? o.account_name ?? o.name;
      if (typeof n === 'string' && stripInvisible(n).trim()) accountName = stripInvisible(n).trim();
    }
    if (!accountType) {
      const t = o.accountType ?? o.account_type;
      if (typeof t === 'string' && t.trim()) accountType = t.trim();
    }
  }
  return { type, amount, accountName, accountType };
}

/** Merge explicit advance into breakdown when POS passes only `advanceApplied` (not in rows). */
function buildPaymentBreakdownForDisplay(inv: InvoicePrintData): InvoicePaymentBreakdownRow[] {
  const rows: InvoicePaymentBreakdownRow[] = (inv.paymentsBreakdown || []).map((p) =>
    parseBreakdownRowFromUnknown(p as unknown as Record<string, unknown>),
  );
  const adv = parseMoneyField(inv.advanceApplied);
  if (adv !== undefined && adv > 0) {
    const sumAdvanceInRows = rows
      .filter((p) => (p.type || '').toLowerCase() === 'advance')
      .reduce((s, p) => s + (Number(p.amount) || 0), 0);
    if (sumAdvanceInRows < adv - 0.001) {
      rows.push({ type: 'advance', amount: roundMoney2(adv - sumAdvanceInRows) });
    }
  }
  return rows;
}

function paymentLabelForType(type: string): string {
  const t = (type || '').toLowerCase();
  if (t === 'cash') return 'Cash';
  if (t === 'card') return 'Card';
  if (t === 'mobile_banking') return 'Mobile Banking';
  if (t === 'bank_transfer') return 'Bank';
  if (t === 'advance') return 'Advance';
  if (t === 'payment') return 'Payment';
  return type;
}

/** Invoice copy: ledger cash / cash account style names read as physical cash. */
const CASH_BY_HAND_LABEL = 'Cash by hand';

function isLedgerCashAccountName(accountName: string): boolean {
  const n = stripInvisible(accountName)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
  if (n === 'cash' || n === 'cash account') return true;
  if (/\bcash\s+account\b/i.test(accountName)) return true;
  if (/^cash(\s|-|_|:)/i.test(stripInvisible(accountName).trim())) return true;
  return false;
}

function ledgerAccountTypeIsCash(accountType: string | undefined): boolean {
  if (!accountType?.trim()) return false;
  const t = accountType.toLowerCase().trim().replace(/\s+/g, ' ');
  return t === 'cash' || t.replace(/\s/g, '') === 'cash';
}

function paymentRowDisplayLabel(row: InvoicePaymentBreakdownRow): string {
  const name = row.accountName ? stripInvisible(row.accountName).trim() : '';
  if (name) {
    if (isLedgerCashAccountName(name)) return CASH_BY_HAND_LABEL;
    return row.accountName!.trim();
  }
  if (ledgerAccountTypeIsCash(row.accountType)) return CASH_BY_HAND_LABEL;
  if ((row.type || '').toLowerCase() === 'cash') return CASH_BY_HAND_LABEL;
  return paymentLabelForType(row.type || '');
}

/** Aligns with POS `usePOS` primary paymentMethod when multiple splits exist. */
export function derivePaymentMethodFromBreakdown(
  breakdown: InvoicePaymentBreakdownRow[] | undefined,
): string | undefined {
  if (!breakdown?.length) return undefined;
  const types = breakdown.map((p) => String(p.type || '').toLowerCase()).filter(Boolean);
  const uniq = [...new Set(types)];
  if (uniq.length === 1) return uniq[0];
  return 'cash';
}

function pickPreviousDueFromPayload(r: Record<string, unknown>): number | undefined {
  const direct =
    parseMoneyField(r.previousDue) ?? parseMoneyField(r.customerPreviousDue);
  if (direct !== undefined && direct > 0) return direct;
  const cust = r.customer;
  if (cust && typeof cust === 'object') {
    const c = cust as Record<string, unknown>;
    const from =
      parseMoneyField(c.totalDue) ??
      parseMoneyField(c.previousDue) ??
      parseMoneyField(c.dueAmount);
    if (from !== undefined && from > 0) return from;
  }
  return undefined;
}

/** String for Payment Details ? API may send string or nested employee object. */
function pickResponsiblePerson(r: Record<string, unknown>): string | undefined {
  const rp = r.responsiblePerson;
  if (typeof rp === 'string' && rp.trim()) return rp.trim();
  if (rp && typeof rp === 'object') {
    const o = rp as Record<string, unknown>;
    const name = o.fullName ?? o.name ?? o.employeeName;
    if (typeof name === 'string' && name.trim()) return name.trim();
  }
  const alt =
    (typeof r.soldByName === 'string' && r.soldByName.trim()) ||
    (typeof r.createdByName === 'string' && r.createdByName.trim()) ||
    (typeof r.employeeName === 'string' && r.employeeName.trim()) ||
    (typeof r.responsibleEmployeeName === 'string' && r.responsibleEmployeeName.trim()) ||
    undefined;
  return alt || undefined;
}

function strTrimmed(v: unknown): string | undefined {
  if (typeof v === 'string' && v.trim()) return v.trim();
  if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  return undefined;
}

/** Branch line + contact from flat fields or nested `branch` object. */
function pickBranchFromPayload(r: Record<string, unknown>): {
  branchName?: string;
  branchAddress?: string;
  branchPhone?: string;
} {
  const flatName = strTrimmed(r.branchName);
  const flatAddr = strTrimmed(r.branchAddress);
  const flatPhone = strTrimmed(r.branchPhone);
  const b = r.branch;
  if (b && typeof b === 'object') {
    const br = b as Record<string, unknown>;
    return {
      branchName: strTrimmed(br.name) ?? flatName,
      branchAddress: strTrimmed(br.address) ?? flatAddr,
      branchPhone: strTrimmed(br.phone) ?? flatPhone,
    };
  }
  return { branchName: flatName, branchAddress: flatAddr, branchPhone: flatPhone };
}

/** Normalize POS / modal / API payloads into one shape for preview + print. */
export function invoicePayloadToPrintData(raw: unknown): InvoicePrintData {
  if (!raw || typeof raw !== 'object') {
    return {
      invoiceNo: '',
      orderNo: '',
      date: new Date().toISOString(),
      items: [],
      discountAmount: 0,
      taxAmount: 0,
      shippingCost: 0,
      grandTotal: 0,
      paidAmount: 0,
      dueAmount: 0,
      paymentStatus: 'due',
    };
  }
  const r = raw as Record<string, unknown>;
  const itemsRaw = Array.isArray(r.items) ? r.items : [];
  const items: InvoiceItemPrint[] = itemsRaw.map((it: Record<string, unknown>) => {
    const serialNumbers = Array.isArray(it.serialNumbers) ? it.serialNumbers.map(String) : [];
    const imeiNumbers = Array.isArray(it.imeiNumbers) ? it.imeiNumbers.map(String) : [];
    const attrList: string[] = [];
    if (Array.isArray(it.attributeValues)) {
      it.attributeValues.forEach((v) => {
        if (v != null && v !== '') attrList.push(String(v));
      });
    } else {
      const variant = it.variant as { attributes?: Array<{ value?: string }> } | undefined;
      const attrs = variant?.attributes;
      if (Array.isArray(attrs)) {
        attrs.forEach((a) => {
          if (a?.value) attrList.push(String(a.value));
        });
      }
    }
    const imeiForPrint =
      imeiNumbers.length > 0 ? imeiNumbers : serialNumbers.length > 0 ? serialNumbers : undefined;
    return {
      productName: String(it.productName ?? '?'),
      sku: String(it.sku ?? '?'),
      quantity: asNum(it.quantity, 0),
      unitPrice: asNum(it.unitPrice, 0),
      discountValue:
        it.discountValue !== undefined && it.discountValue !== null ? asNum(it.discountValue, 0) : undefined,
      discountType: typeof it.discountType === 'string' ? it.discountType : undefined,
      total: asNum(it.total ?? it.totalPrice, 0),
      imeiNumbers: imeiForPrint,
      attributeValues: attrList.length ? attrList : undefined,
    };
  });

  const subTotalRaw = r.subtotal !== undefined && r.subtotal !== null ? asNum(r.subtotal, 0) : undefined;
  const subtotal =
    subTotalRaw !== undefined
      ? subTotalRaw
      : items.length > 0
        ? Math.round(items.reduce((s, i) => s + i.total, 0) * 100) / 100
        : undefined;

  const branchFields = pickBranchFromPayload(r);
  return {
    invoiceNo: String(r.invoiceNo ?? ''),
    orderNo: String(r.orderNo ?? ''),
    date: String(r.date ?? new Date().toISOString()),
    ...branchFields,
    billToLabel: typeof r.billToLabel === 'string' ? r.billToLabel : undefined,
    customerName: typeof r.customerName === 'string' ? r.customerName : undefined,
    customerPhone: typeof r.customerPhone === 'string' ? r.customerPhone : undefined,
    customerEmail: typeof r.customerEmail === 'string' ? r.customerEmail : undefined,
    customerAddress: typeof r.customerAddress === 'string' ? r.customerAddress : undefined,
    items,
    subtotal,
    discountAmount: asNum(r.discountAmount, 0),
    couponCode: typeof r.couponCode === 'string' ? r.couponCode : undefined,
    couponDiscount: r.couponDiscount !== undefined ? asNum(r.couponDiscount, 0) : undefined,
    giftCardCode: typeof r.giftCardCode === 'string' ? r.giftCardCode : undefined,
    giftCardDiscount: r.giftCardDiscount !== undefined ? asNum(r.giftCardDiscount, 0) : undefined,
    vipDiscount: r.vipDiscount !== undefined ? asNum(r.vipDiscount, 0) : undefined,
    vipDiscountPercent:
      r.vipDiscountPercent !== undefined && r.vipDiscountPercent !== null
        ? asNum(r.vipDiscountPercent, 0)
        : undefined,
    pointsDiscount: r.pointsDiscount !== undefined ? asNum(r.pointsDiscount, 0) : undefined,
    redeemPoints: r.redeemPoints !== undefined ? asNum(r.redeemPoints, 0) : undefined,
    services: Array.isArray(r.services) ? (r.services as Array<{ name: string; price: number }>) : undefined,
    taxAmount: asNum(r.taxAmount, 0),
    shippingCost: asNum(r.shippingCost, 0),
    grandTotal: asNum(r.grandTotal, 0),
    paidAmount: asNum(r.paidAmount, 0),
    dueAmount: asNum(r.dueAmount, 0),
    paymentStatus: String(r.paymentStatus ?? 'due'),
    paymentMethod: typeof r.paymentMethod === 'string' ? r.paymentMethod : undefined,
    responsiblePerson: pickResponsiblePerson(r),
    previousDue: pickPreviousDueFromPayload(r),
    receivedAmount:
      r.receivedAmount !== undefined && r.receivedAmount !== null ? asNum(r.receivedAmount, 0) : undefined,
    changeAmount:
      r.changeAmount !== undefined && r.changeAmount !== null ? asNum(r.changeAmount, 0) : undefined,
    paymentsBreakdown: Array.isArray(r.paymentsBreakdown)
      ? (r.paymentsBreakdown as Record<string, unknown>[]).map((p) => parseBreakdownRowFromUnknown(p))
      : undefined,
    advanceApplied:
      r.advanceApplied === null || r.advanceApplied === undefined
        ? undefined
        : (() => {
            const a = parseMoneyField(r.advanceApplied);
            return a !== undefined && a > 0 ? roundMoney2(a) : undefined;
          })(),
    termsAndConditions: typeof r.termsAndConditions === 'string' ? r.termsAndConditions : undefined,
    smsReceiptTerms: (() => {
      const block = r.smsReceiptTerms;
      if (!block || typeof block !== 'object') return undefined;
      const o = block as Record<string, unknown>;
      const description = typeof o.description === 'string' ? o.description.trim() : '';
      if (!description) return undefined;
      const name =
        typeof o.name === 'string' && o.name.trim() ? o.name.trim() : 'Terms & Conditions';
      return { name, description };
    })(),
    adminLogoUrl:
      r.adminLogoUrl === null
        ? null
        : typeof r.adminLogoUrl === 'string'
          ? r.adminLogoUrl
          : undefined,
    companyName:
      typeof r.companyName === 'string'
        ? r.companyName
        : typeof r.company === 'string'
          ? r.company
          : undefined,
    storeQrUrl:
      r.storeQrUrl === null
        ? null
        : typeof r.storeQrUrl === 'string'
          ? r.storeQrUrl
          : undefined,
  };
}

/** Same HTML as print ? use for iframe preview (`srcDoc`) and {@link printInvoiceHtml}. */
export function buildInvoicePrintDocumentHtml(invoice: InvoicePrintData): string {
  const itemsRows = invoice.items
    .map(
      (item) => `<tr>
  <td>
    <div>
      <div class="item-name-wrap"><span class="item-name-bold">${escapeHtml(item.productName)}</span>${item.attributeValues && item.attributeValues.length > 0 ? ` <span class="attr-values">(${item.attributeValues.map((v) => escapeHtml(v)).join(', ')})</span>` : ''}</div>
      ${
        !(item.imeiNumbers && item.imeiNumbers.length > 0)
          ? `<div class="sku">SKU: ${escapeHtml(item.sku)}</div>`
          : ''
      }
      ${buildImeiBlockHtml(item.imeiNumbers)}
    </div>
  </td>
  <td class="text-right cell-num">${item.quantity}</td>
  <td class="text-right cell-num">${formatCurrencyBasic(item.unitPrice)}</td>
  <td class="text-right cell-total">${formatCurrencyBasic(item.total)}</td>
</tr>`,
    )
    .join('');

  // Services will be rendered inline inside summary (above Grand Total)

  const displayBreakdown = buildPaymentBreakdownForDisplay(invoice);

  const txAccountBodyRows: string[] = [];
  if (displayBreakdown.length > 0) {
    for (const p of displayBreakdown) {
      const name = escapeHtml(paymentRowDisplayLabel(p));
      const amt = formatCurrencyBasic(Number(p.amount) || 0);
      txAccountBodyRows.push(`<tr><td class="tx-cell-account">${name}</td><td class="tx-cell-amt">${amt}</td></tr>`);
    }
  } else if (invoice.paymentMethod && invoice.paidAmount > 0) {
    txAccountBodyRows.push(
      `<tr><td class="tx-cell-account">${escapeHtml(
        invoice.paymentMethod.replace(/_/g, ' '),
      )}</td><td class="tx-cell-amt">${formatCurrencyBasic(invoice.paidAmount)}</td></tr>`,
    );
  } else if (invoice.paidAmount > 0) {
    txAccountBodyRows.push(
      `<tr><td class="tx-cell-account">Payment</td><td class="tx-cell-amt">${formatCurrencyBasic(
        invoice.paidAmount,
      )}</td></tr>`,
    );
  }

  const txSettleBodyRows: string[] = [];
  if (invoice.receivedAmount != null && !isNaN(invoice.receivedAmount) && invoice.receivedAmount > 0) {
    txSettleBodyRows.push(
      `<tr><td class="tx-cell-account">Received from customer</td><td class="tx-cell-amt">${formatCurrencyBasic(
        invoice.receivedAmount,
      )}</td></tr>`,
    );
  }
  if (invoice.changeAmount != null && !isNaN(invoice.changeAmount) && invoice.changeAmount > 0) {
    txSettleBodyRows.push(
      `<tr><td class="tx-cell-account">Change returned</td><td class="tx-cell-amt">${formatCurrencyBasic(
        invoice.changeAmount,
      )}</td></tr>`,
    );
  }
  if (invoice.dueAmount > 0) {
    txSettleBodyRows.push(
      `<tr><td class="tx-cell-account">Due (this invoice)</td><td class="tx-cell-amt due">${formatCurrencyBasic(
        invoice.dueAmount,
      )}</td></tr>`,
    );
  }
  if (invoice.previousDue != null && !isNaN(invoice.previousDue) && invoice.previousDue > 0) {
    txSettleBodyRows.push(
      `<tr><td class="tx-cell-account">Previous due</td><td class="tx-cell-amt due">${formatCurrencyBasic(
        invoice.previousDue,
      )}</td></tr>`,
    );
  }
  if (
    invoice.dueAmount > 0 &&
    invoice.previousDue != null &&
    !isNaN(invoice.previousDue) &&
    invoice.previousDue > 0
  ) {
    const totalDueRaw = (invoice.previousDue || 0) + (invoice.dueAmount || 0);
    const totalDue = Math.round(totalDueRaw * 100) / 100;
    txSettleBodyRows.push(
      `<tr class="tx-row-emph"><td class="tx-cell-account">Total due</td><td class="tx-cell-amt due">${formatCurrencyBasic(
        totalDue,
      )}</td></tr>`,
    );
  }

  const txAccountTable =
    txAccountBodyRows.length > 0
      ? `<table class="tx-table" role="presentation">
  <thead><tr><th>Account</th><th>Amount</th></tr></thead>
  <tbody>${txAccountBodyRows.join('')}</tbody>
</table>`
      : '';

  const txSettleTable =
    txSettleBodyRows.length > 0
      ? `<div class="tx-settle-head">Settlement</div>
<table class="tx-table tx-table-settle" role="presentation">
  <tbody>${txSettleBodyRows.join('')}</tbody>
</table>`
      : '';

  const summaryAsideInner =
    txAccountTable || txSettleTable
      ? `<div class="tx-panel">
  <div class="section-title-small">Transaction details</div>
  ${txAccountTable}
  ${txSettleTable}
</div>`
      : '';
  const hasSummaryAside = summaryAsideInner.length > 0;

  const summaryLines: string[] = [];
  if (invoice.discountAmount > 0) {
    summaryLines.push(
      `<div class="row-line"><span>Discount:</span><span class="neg">-${formatCurrencyBasic(
        invoice.discountAmount,
      )}</span></div>`,
    );
  }
  if (invoice.couponDiscount !== undefined && invoice.couponDiscount > 0) {
    const couponLabel = invoice.couponCode?.trim()
      ? `Coupon (${invoice.couponCode}):`
      : 'Coupon discount:';
    summaryLines.push(
      `<div class="row-line"><span>${escapeHtml(couponLabel)}</span><span class="neg">-${formatCurrencyBasic(
        invoice.couponDiscount,
      )}</span></div>`,
    );
  }
  if (invoice.vipDiscount !== undefined && invoice.vipDiscount > 0) {
    const pct = invoice.vipDiscountPercent;
    const vipLabel =
      pct !== undefined && pct > 0
        ? `VIP discount (${pct}%):`
        : 'VIP discount:';
    summaryLines.push(
      `<div class="row-line"><span>${escapeHtml(vipLabel)}</span><span class="neg">-${formatCurrencyBasic(
        invoice.vipDiscount,
      )}</span></div>`,
    );
  }
  if (invoice.giftCardDiscount !== undefined && invoice.giftCardDiscount > 0) {
    const giftLabel = invoice.giftCardCode?.trim()
      ? `Gift Card (${invoice.giftCardCode}):`
      : 'Gift card discount:';
    summaryLines.push(
      `<div class="row-line"><span>${escapeHtml(giftLabel)}</span><span class="neg">-${formatCurrencyBasic(
        invoice.giftCardDiscount,
      )}</span></div>`,
    );
  }
  if (invoice.pointsDiscount !== undefined && invoice.pointsDiscount > 0) {
    const ptsLabel =
      invoice.redeemPoints && invoice.redeemPoints > 0
        ? `Points (${invoice.redeemPoints} pts):`
        : 'Points discount:';
    summaryLines.push(
      `<div class="row-line"><span>${escapeHtml(ptsLabel)}</span><span class="neg">-${formatCurrencyBasic(
        invoice.pointsDiscount,
      )}</span></div>`,
    );
  }
  if (invoice.taxAmount > 0) {
    summaryLines.push(
      `<div class="row-line"><span>Tax:</span><span>${formatCurrencyBasic(
        invoice.taxAmount,
      )}</span></div>`,
    );
  }
  if (invoice.shippingCost > 0) {
    summaryLines.push(
      `<div class="row-line"><span>Shipping:</span><span>${formatCurrencyBasic(
        invoice.shippingCost,
      )}</span></div>`,
    );
  }
  if (invoice.services && invoice.services.length > 0) {
    summaryLines.push(
      `<div class="section-title-small">Services:</div>`,
    );
    invoice.services.forEach((s) => {
      summaryLines.push(
        `<div class="row-line"><span>${escapeHtml(s.name)}:</span><span>${formatCurrencyBasic(
          s.price,
        )}</span></div>`,
      );
    });
  }
  summaryLines.push(
    `<div class="row-line total"><span>Grand Total:</span><span>${formatCurrencyBasic(
      invoice.grandTotal,
    )}</span></div>`,
  );
  const advanceShown = getAdvanceAppliedDisplay(invoice);
  if (advanceShown > 0) {
    summaryLines.push(
      `<div class="row-line"><span>Advance applied:</span><span>${formatCurrencyBasic(
        advanceShown,
      )}</span></div>`,
    );
  }
  summaryLines.push(
    `<div class="row-line"><span>Invoice Paid:</span><span>${formatCurrencyBasic(
      invoice.paidAmount,
    )}</span></div>`,
  );
  /* Received, change, and due lines live in the left "Transaction details" panel only. */

  const branchHeaderParts: string[] = [];
  const bn = invoice.branchName?.trim();
  if (bn) {
    branchHeaderParts.push(`<div class="brand-branch-name">${escapeHtml(bn)}</div>`);
  }
  const ba = invoice.branchAddress?.trim();
  if (ba) {
    branchHeaderParts.push(`<div class="brand-address">${escapeHtml(ba)}</div>`);
  }
  const bp = invoice.branchPhone?.trim();
  if (bp) {
    branchHeaderParts.push(`<div class="brand-phone">${escapeHtml(bp)}</div>`);
  }
  const branchCenterHtml = branchHeaderParts.join('');

  const logoSrc = invoice.adminLogoUrl ? getMediaUrl(invoice.adminLogoUrl) : '';
  const companyFallback = invoice.companyName?.trim() || '';
  const brandCenterHtml = (() => {
    if (logoSrc) {
      return `<img class="brand-logo" src="${escapeHtml(logoSrc)}" alt="" decoding="async" />${branchCenterHtml}`;
    }
    if (companyFallback) {
      return `<div class="brand-name-fallback">${escapeHtml(companyFallback)}</div>${branchCenterHtml}`;
    }
    return branchCenterHtml || '<div class="brand-name-fallback">INVOICE</div>';
  })();

  const storeQrUrl = invoice.storeQrUrl?.trim() || '';
  let storeQrHost = '';
  if (storeQrUrl) {
    try {
      storeQrHost = new URL(storeQrUrl).host;
    } catch {
      storeQrHost = storeQrUrl.replace(/^https?:\/\//i, '').split('/')[0] || storeQrUrl;
    }
  }
  const orderDateLabel = new Date(invoice.date).toLocaleString();
  const barcodeCode = String(invoice.invoiceNo || invoice.orderNo || '').trim();
  const barcodeImgHtml = invoice.barcodeDataUrl
    ? `<img class="barcode" src="${invoice.barcodeDataUrl}" alt="Barcode" />`
    : '';
  const qrBlockHtml =
    storeQrUrl && invoice.qrDataUrl
      ? `<div class="qr-stack">
  <div class="qr-box"><img src="${invoice.qrDataUrl}" alt="Store QR" width="96" height="96" /></div>
  ${storeQrHost ? `<div class="qr-host">${escapeHtml(storeQrHost)}</div>` : ''}
</div>`
      : storeQrUrl
        ? `<div class="qr-stack">
  <div class="qr-box" style="font-size:10px;color:#6b7280;text-align:center;padding:8px;">QR</div>
  ${storeQrHost ? `<div class="qr-host">${escapeHtml(storeQrHost)}</div>` : ''}
</div>`
        : '';
  const headerRightHtml = `<div class="header-right">
  ${qrBlockHtml}
</div>`;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(invoice.invoiceNo || 'Invoice')}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+Bengali:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    @page {
      size: A4;
      margin: 13mm;
    }
    * { box-sizing: border-box; }
    /* Screen: same 16px body inset as supplier/customer/retailer ledger print HTML */
    body {
      font-family: 'Inter', 'Noto Sans Bengali', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 14px;
      line-height: 1.45;
      margin: 0;
      padding: 16px;
      color: #000000;
      background: #ffffff;
    }
    /* Content wrapper: no extra mm padding ? @page margin: 13mm matches ledger on print. */
    .page {
      width: 100%;
      max-width: 210mm;
      min-height: auto;
      margin: 0 auto;
      padding: 0;
      background: #ffffff;
      box-sizing: border-box;
    }
    .invoice-wrapper {
      width: 100%;
    }
    .header {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr);
      align-items: start;
      gap: 12px;
      padding: 10px 0 12px 0;
      margin-bottom: 10px;
      border-bottom: 1px solid #000000;
    }
    .header-meta {
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      align-self: start;
      text-align: left;
      font-size: 13px;
      line-height: 1.4;
      min-width: 0;
    }
    .header-meta-title {
      font-size: 26px;
      font-weight: 800;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      margin: 0 0 4px 0;
      line-height: 1.05;
      color: #000000;
    }
    .header-meta-sub {
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 0.04em;
      color: #374151;
      margin: 0;
    }
    .header-brand-center {
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      gap: 4px;
      min-width: 0;
    }
    .brand-logo {
      display: block;
      max-height: 64px;
      max-width: min(220px, 100%);
      width: auto;
      height: auto;
      object-fit: contain;
      margin: 0 auto 6px;
    }
    .brand-name-fallback {
      font-size: 32px;
      font-weight: 800;
      color: #111827;
      margin-bottom: 10px;
      line-height: 1.15;
      letter-spacing: -0.02em;
      max-width: 100%;
      word-break: break-word;
    }
    .brand-branch-name {
      font-size: 14px;
      font-weight: 800;
      color: #111827;
      margin: 2px 0 6px;
      line-height: 1.3;
    }
    .brand-address {
      font-size: 13px;
      font-weight: 600;
      color: #111827;
      white-space: pre-wrap;
      line-height: 1.45;
      max-width: 100%;
    }
    .brand-phone {
      font-size: 13px;
      font-weight: 700;
      color: #111827;
      margin-top: 2px;
    }
    .header-right {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      justify-content: flex-start;
      text-align: right;
      min-width: 0;
    }
    .qr-stack {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }
    .qr-box {
      width: 96px;
      height: 96px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .qr-box img,
    .qr-box canvas {
      display: block;
      max-width: 96px;
      max-height: 96px;
    }
    .qr-host {
      margin-top: 4px;
      font-size: 11px;
      font-weight: 600;
      color: #374151;
      text-align: center;
      word-break: break-word;
      max-width: 120px;
      line-height: 1.35;
    }
    .brand {
      font-size: 14px;
    }
    .brand-title {
      font-size: 22px;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      margin: 0 0 4px 0;
    }
    .brand-sub {
      font-size: 13px;
    }
    .brand-tagline {
      font-weight: 500;
      color: #374151;
    }
    .brand-branch {
      font-weight: 700;
      color: #111827;
    }
    .branch-detail {
      margin-top: 2px;
      color: #111827;
      white-space: pre-wrap;
      font-weight: 600;
    }
    .meta {
      font-size: 13px;
      line-height: 1.45;
      text-align: right;
    }
    .meta-label {
      color: #374151;
      font-weight: 700;
    }
    .meta-value {
      font-weight: 700;
      color: #000000;
    }
    .meta-row {
      white-space: nowrap;
    }
    .barcode-block {
      text-align: center;
      margin: 10px 0 0 0;
    }
    .barcode {
      display: inline-block;
      margin-bottom: 4px;
      max-width: min(320px, 92vw);
      height: auto;
    }
    .barcode-number {
      font-family: 'SF Mono', ui-monospace, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
      font-size: 13px;
      letter-spacing: 0.18em;
      color: #000000;
      font-weight: 700;
    }
    .section-title {
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #111827;
      margin-bottom: 6px;
    }
    .section-title-small {
      font-size: 13px;
      font-weight: 700;
      margin-bottom: 4px;
      color: #111827;
    }
    .two-col {
      display: flex;
      gap: 24px;
      margin-top: 16px;
      margin-bottom: 16px;
    }
    .two-col > div {
      flex: 1;
      font-size: 14px;
    }
    .payment-details {
      text-align: right;
    }
    .payment-meta {
      font-size: 13px;
      margin-bottom: 10px;
    }
    .payment-meta .meta-row {
      display: flex;
      justify-content: flex-end;
      gap: 4px;
      margin-bottom: 2px;
    }
    .payment-meta .meta-row:last-child {
      margin-bottom: 0;
    }
    .payment-details .kv-row {
      justify-content: flex-end;
    }
    .label {
      color: #4b5563;
      font-weight: 600;
    }
    .value {
      font-weight: 700;
      color: #111827;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
      margin-top: 4px;
    }
    th, td {
      padding: 8px 10px;
      border-bottom: 1px solid #e5e7eb;
    }
    th {
      text-align: left;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #374151;
      border-bottom-width: 2px;
    }
    .text-right { text-align: right; }
    .cell-num {
      font-weight: 600;
      color: #111827;
    }
    .cell-total {
      font-weight: 700;
      color: #000000;
    }
    .item-name-wrap { margin-bottom: 2px; }
    .item-name-bold { font-weight: 700; }
    .attr-values { font-size: 11px; color: #4b5563; font-weight: 600; }
    .sku {
      font-size: 12px;
      color: #4b5563;
      font-weight: 600;
      margin-top: 2px;
    }
    .imei-block {
      margin-top: 6px;
      max-width: 100%;
    }
    .imei-line {
      display: flex;
      flex-wrap: wrap;
      align-items: baseline;
      justify-content: flex-start;
      gap: 6px 10px;
      width: 100%;
    }
    .imei-label {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #64748b;
      flex-shrink: 0;
    }
    .imei-values {
      font-family: ui-monospace, 'SF Mono', Menlo, Monaco, Consolas, monospace;
      font-size: 11px;
      font-weight: 600;
      line-height: 1.45;
      color: #111827;
      text-align: left;
      word-break: break-all;
      min-width: 0;
    }
    .summary-with-aside {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
      margin-top: 26px;
      width: 100%;
    }
    .summary-with-aside--solo .summary {
      margin-left: auto;
    }
    .summary-aside {
      flex: 0 1 auto;
      min-width: 0;
      max-width: min(380px, 100%);
      font-size: 13px;
      align-self: flex-start;
      margin-top: 16px;
    }
    .tx-panel {
      padding-top: 2px;
    }
    .tx-panel .section-title-small {
      margin-bottom: 5px;
    }
    .tx-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
      margin: 0 0 7px 0;
    }
    .tx-table:last-child {
      margin-bottom: 0;
    }
    .tx-table th {
      text-align: left;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.07em;
      color: #6b7280;
      padding: 0 8px 3px 0;
      border-bottom: 1px solid #d1d5db;
      vertical-align: bottom;
    }
    .tx-table th:last-child {
      text-align: right;
      padding-right: 0;
      padding-left: 10px;
    }
    .tx-table td {
      padding: 3px 8px 3px 0;
      border-bottom: 1px solid #f3f4f6;
      vertical-align: top;
    }
    .tx-table tbody tr:last-child td {
      border-bottom: none;
    }
    .tx-cell-account {
      font-weight: 600;
      color: #374151;
      word-break: break-word;
    }
    .tx-cell-amt {
      text-align: right;
      white-space: nowrap;
      font-weight: 700;
      color: #111827;
      padding-left: 10px;
      font-variant-numeric: tabular-nums;
    }
    .tx-table-settle .tx-cell-account {
      font-weight: 600;
      color: #4b5563;
    }
    .tx-row-emph .tx-cell-account {
      font-weight: 700;
      color: #111827;
    }
    .tx-row-emph .tx-cell-amt {
      font-weight: 800;
    }
    .tx-settle-head {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #6b7280;
      margin: 2px 0 4px 0;
      padding-top: 1px;
      border-top: 1px solid #e5e7eb;
    }
    .summary {
      width: 300px;
      flex-shrink: 0;
      margin-left: 0;
      font-size: 13px;
      margin-top: 0;
    }
    .row-line {
      display: flex;
      justify-content: space-between;
      margin-bottom: 2px;
    }
    .summary .row-line > span:first-child {
      font-weight: 600;
      color: #374151;
    }
    .summary .row-line > span:last-child {
      font-weight: 700;
      color: #111827;
    }
    .summary .row-line.total > span:first-child {
      font-weight: 700;
      color: #000000;
    }
    .summary .row-line.total > span:last-child {
      font-size: 16px;
      font-weight: 800;
      color: #000000;
    }
    .kv-row {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 13px;
      margin-bottom: 3px;
    }
    .neg {
      color: #dc2626;
      font-weight: 700;
    }
    .due {
      color: #b45309;
      font-weight: 700;
    }
    .tc-section {
      margin-top: 20px;
      padding-top: 10px;
      border-top: 1px solid #e5e7eb;
    }
    .terms-sheet {
      margin-top: 0;
      padding-top: 0;
      border-top: none;
    }
    .page:has(.terms-sheet) .invoice-sheet {
      page-break-after: always;
      break-after: page;
    }
    .terms-sheet {
      page-break-before: always;
      break-before: page;
    }
    body.invoice-pdf-capture .invoice-sheet {
      margin-bottom: 0;
      padding-bottom: 20px;
    }
    body.invoice-pdf-capture .terms-sheet {
      margin-top: 24px;
      padding-top: 8px;
      padding-bottom: 24px;
    }
    .tc-title {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #374151;
      font-weight: 700;
      margin-bottom: 6px;
    }
    .terms-sheet .tc-title {
      text-align: center;
      font-size: 15px;
      font-weight: 800;
      color: #111827;
      letter-spacing: 0.1em;
      margin-bottom: 12px;
    }
    .tc-content {
      font-size: 11px;
      font-weight: 500;
      color: #374151;
      line-height: 1.55;
    }
    .tc-content p { margin: 0 0 3px 0; }
    .tc-content ul, .tc-content ol { margin: 2px 0 4px 16px; padding: 0; }
    .tc-content li { margin-bottom: 1px; }
    .tc-content strong, .tc-content b { font-weight: 700; }
    .footer {
      margin-top: 24px;
      padding-top: 8px;
      border-top: 1px solid #e5e7eb;
      font-size: 12px;
      font-weight: 600;
      color: #4b5563;
      text-align: center;
    }
    /* Screen: desktop preview matches print layout; mobile stacks below 768px */
    @media screen {
      html {
        -webkit-text-size-adjust: 100%;
      }
    }
    @media screen and (min-width: 769px) {
      body {
        padding: 0;
      }
      .page {
        width: 100%;
        max-width: 210mm;
        min-height: auto;
        margin-left: auto;
        margin-right: auto;
        padding: 0;
      }
      .two-col {
        flex-direction: row;
      }
      .payment-details {
        text-align: right;
      }
      .payment-meta .meta-row {
        justify-content: flex-end;
      }
      .payment-details .kv-row {
        justify-content: flex-end;
      }
      .summary-with-aside {
        flex-direction: row;
      }
      .summary-with-aside--solo .summary {
        margin-left: auto;
        margin-right: 0;
      }
      .summary-aside {
        max-width: min(380px, 100%);
      }
      .summary {
        width: 300px;
        max-width: none;
        margin-left: 0;
        margin-right: 0;
      }
    }
    @media screen and (max-width: 768px) {
      body {
        padding: clamp(8px, 2vw, 16px);
      }
      .page {
        width: 100%;
        max-width: 210mm;
        min-height: auto;
        margin-left: auto;
        margin-right: auto;
        padding: 0;
      }
      .two-col {
        flex-direction: column;
        gap: 14px;
      }
      .payment-details {
        text-align: left;
      }
      .payment-meta .meta-row {
        justify-content: flex-start;
      }
      .payment-details .kv-row {
        justify-content: flex-start;
      }
      .summary-with-aside {
        flex-direction: column;
        gap: 10px;
      }
      .summary-with-aside .summary {
        width: 100%;
        max-width: 100%;
      }
      .summary-aside {
        max-width: 100%;
      }
      .summary {
        width: 100%;
        max-width: 100%;
        font-size: 13px;
      }
      .header {
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr);
        gap: 8px;
      }
      .header-meta-title {
        font-size: 18px;
        letter-spacing: 0.08em;
      }
      .header-meta-sub {
        font-size: 11px;
      }
      .brand-logo {
        max-height: 48px;
        max-width: min(120px, 100%);
      }
      .brand-name-fallback {
        font-size: 15px;
        margin-bottom: 4px;
      }
      .brand-branch-name {
        font-size: 11px;
      }
      .brand-address,
      .brand-phone {
        font-size: 10px;
      }
      .qr-box {
        width: 72px;
        height: 72px;
      }
      .qr-box img,
      .qr-box canvas {
        max-width: 72px;
        max-height: 72px;
      }
      .qr-host {
        font-size: 9px;
        max-width: 72px;
      }
      .barcode-block {
        margin: 6px 0 0;
      }
      .barcode {
        max-width: min(240px, 88vw);
        height: auto;
        margin-bottom: 2px;
      }
      .barcode-number {
        font-size: 11px;
        letter-spacing: 0.1em;
        margin-top: 2px;
      }
    }
    @media print {
      @page {
        margin: 13mm;
        size: auto;
      }
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        background: #ffffff !important;
        height: auto !important;
        overflow: visible !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      body * {
        visibility: hidden;
      }
      .page,
      .page * {
        visibility: visible;
      }
      .page {
        position: absolute;
        left: 0;
        top: 0;
        margin: 0 !important;
        padding: 0 !important;
        width: 100% !important;
        max-width: none !important;
        min-height: auto !important;
        box-shadow: none !important;
        background: #ffffff !important;
      }
      .invoice-sheet {
        box-shadow: none !important;
      }
      .two-col {
        flex-direction: row;
      }
      .payment-details {
        text-align: right;
      }
      .payment-details .kv-row {
        justify-content: flex-end;
      }
      .header {
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr);
      }
      .header-right {
        align-items: flex-end;
        text-align: right;
      }
      .meta {
        text-align: right;
      }
      .meta-row {
        white-space: nowrap;
      }
      .summary-with-aside {
        flex-direction: row;
      }
      .summary-with-aside--solo .summary {
        margin-left: auto;
        margin-right: 0;
      }
      .summary {
        width: 300px;
        max-width: none;
        margin-left: 0;
        margin-right: 0;
      }
      .page:has(.terms-sheet) .invoice-sheet {
        page-break-after: always;
        break-after: page;
      }
      .terms-sheet {
        page-break-before: always;
        break-before: page;
      }
    }
    body.invoice-pdf-capture {
      margin: 0;
      padding: 0;
      background: #ffffff;
    }
    body.invoice-pdf-capture .page {
      margin: 0;
      padding: 0;
      width: 794px;
      max-width: none;
      min-height: auto;
      box-shadow: none;
    }
    body.invoice-pdf-capture .two-col {
      flex-direction: row;
    }
    body.invoice-pdf-capture .payment-details {
      text-align: right;
    }
    body.invoice-pdf-capture .payment-meta .meta-row {
      justify-content: flex-end;
    }
    body.invoice-pdf-capture .payment-details .kv-row {
      justify-content: flex-end;
    }
    body.invoice-pdf-capture .header {
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr);
    }
    body.invoice-pdf-capture .header-right {
      align-items: flex-end;
      text-align: right;
    }
    body.invoice-pdf-capture .summary-with-aside {
      flex-direction: row;
    }
    body.invoice-pdf-capture .summary-with-aside--solo .summary {
      margin-left: auto;
      margin-right: 0;
    }
    body.invoice-pdf-capture .summary-aside {
      max-width: min(380px, 100%);
    }
    body.invoice-pdf-capture .summary {
      width: 300px;
      max-width: none;
    }
    body.invoice-pdf-capture .barcode {
      transform: none;
      margin-bottom: 4px;
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="invoice-sheet">
    <div class="invoice-wrapper">
      <div class="header">
        <div class="header-meta">
          <div class="header-meta-title">INVOICE</div>
          <div class="header-meta-sub">Sales Memo</div>
        </div>
        <div class="header-brand-center">
          ${brandCenterHtml}
        </div>
        ${headerRightHtml}
      </div>

    <div class="two-col">
      <div>
        <div class="section-title">${escapeHtml(invoice.billToLabel || 'Bill To')}</div>
        <div class="value">${escapeHtml(invoice.customerName || (invoice.billToLabel === 'Retailer' ? '?' : 'Walk-in Customer'))}</div>
        ${
          invoice.customerPhone
            ? `<div class="label">Phone: ${escapeHtml(invoice.customerPhone)}</div>`
            : ''
        }
        ${
          invoice.customerEmail
            ? `<div class="label">Email: ${escapeHtml(invoice.customerEmail)}</div>`
            : ''
        }
        ${
          invoice.customerAddress
            ? `<div class="label">${escapeHtml(invoice.customerAddress)}</div>`
            : ''
        }
      </div>
      <div class="payment-details">
        <div class="payment-meta">
          <div class="meta-row">
            <span class="meta-label">Invoice No:</span>
            <span class="meta-value">${escapeHtml(invoice.invoiceNo)}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">Order No:</span>
            <span class="meta-value">${escapeHtml(invoice.orderNo)}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">Date:</span>
            <span class="meta-value">${escapeHtml(orderDateLabel)}</span>
          </div>
        </div>
        <div class="section-title">Payment Details</div>
        ${(() => {
          if (displayBreakdown.length > 0) {
            const labels = Array.from(
              new Set(
                displayBreakdown.map((p) => paymentRowDisplayLabel(p)),
              ),
            );
            return `<div class="kv-row"><span class="label">Method:</span><span class="value">${escapeHtml(
              labels.join(' + '),
            )}</span></div>`;
          }
          return invoice.paymentMethod
            ? `<div class="kv-row"><span class="label">Method:</span><span class="value">${escapeHtml(
                invoice.paymentMethod.replace('_', ' '),
              )}</span></div>`
            : '';
        })()}
        ${
          invoice.responsiblePerson
            ? `<div class="kv-row"><span class="label">Responsible:</span><span class="value">${escapeHtml(
                invoice.responsiblePerson,
              )}</span></div>`
            : ''
        }
        <div class="kv-row">
          <span class="label">Status:</span>
          <span class="value">${escapeHtml(invoice.paymentStatus)}</span>
        </div>
      </div>
    </div>

    <div class="barcode-block">
      ${barcodeImgHtml}
      <div class="barcode-number">${escapeHtml(barcodeCode)}</div>
    </div>

    <div>
      <div class="section-title">Items</div>
      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th class="text-right">Qty</th>
            <th class="text-right">Price</th>
            <th class="text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
        </tbody>
      </table>
    </div>

    <div class="summary-with-aside${hasSummaryAside ? '' : ' summary-with-aside--solo'}">
      ${
        hasSummaryAside
          ? `<div class="summary-aside">${summaryAsideInner}</div>`
          : ''
      }
      <div class="summary">
        ${summaryLines.join('')}
      </div>
    </div>

    ${
      invoice.termsAndConditions
        ? `<div class="tc-section">
      <div class="tc-title">Terms &amp; Conditions</div>
      <div class="tc-content">${invoice.termsAndConditions}</div>
    </div>`
        : ''
    }

    <div class="footer">
      <div>Thank you for your business.</div>
    </div>
    </div>
    </div>

    ${
      invoice.smsReceiptTerms
        ? `<div class="terms-sheet tc-section">
      <div class="tc-title">${escapeHtml(invoice.smsReceiptTerms.name)}</div>
      <div class="tc-content">${invoice.smsReceiptTerms.description}</div>
    </div>`
        : ''
    }
  </div>
</body>
</html>`;
}

function mergeInvoiceBrandingForPrint(invoice: unknown): unknown {
  const base =
    typeof invoice === 'object' && invoice !== null
      ? (invoice as TenantInvoiceBranding)
      : ({} as TenantInvoiceBranding);
  return mergeInvoiceWithBranding(base, getTenantBrandingFromStorage());
}

function invoicePdfFilename(invoice: InvoicePrintData): string {
  const base = (invoice.invoiceNo || invoice.orderNo || 'invoice').trim();
  const safe = base.replace(/[^\w.-]+/g, '-').replace(/^-+|-+$/g, '') || 'invoice';
  return `invoice-${safe}.pdf`;
}

/** Build final HTML with optional API branding (same layout as seller-admin). */
export async function buildInvoiceHtmlAsync(invoice: unknown): Promise<string> {
  const branding = await fetchTenantInvoiceBranding();
  const base =
    typeof invoice === 'object' && invoice !== null
      ? (invoice as TenantInvoiceBranding)
      : ({} as TenantInvoiceBranding);
  const data = await attachInvoiceCodeImages(
    invoicePayloadToPrintData(mergeInvoiceWithBranding(base, branding)),
  );
  return buildInvoicePrintDocumentHtml(data);
}

/**
 * Web: print ONLY the invoice HTML in a hidden iframe (expo-print web ignores html
 * and calls window.print() on the whole app).
 */
function printHtmlDocumentInBrowser(html: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof document === 'undefined') {
      reject(new Error('Print is not available'));
      return;
    }

    const iframe = document.createElement('iframe');
    iframe.setAttribute('aria-hidden', 'true');
    iframe.setAttribute('title', 'Invoice print');
    iframe.style.cssText =
      'position:fixed;right:0;bottom:0;width:0;height:0;border:0;opacity:0;pointer-events:none';
    document.body.appendChild(iframe);

    const win = iframe.contentWindow;
    const doc = win?.document;
    if (!doc || !win) {
      document.body.removeChild(iframe);
      reject(new Error('Could not open print frame'));
      return;
    }

    doc.open();
    doc.write(html);
    doc.close();

    const cleanup = () => {
      setTimeout(() => {
        if (document.body.contains(iframe)) document.body.removeChild(iframe);
      }, 1200);
    };

    let printed = false;
    const triggerPrint = () => {
      if (printed) return;
      printed = true;
      try {
        win.focus();
        win.print();
        resolve();
      } catch (e) {
        reject(e instanceof Error ? e : new Error('Print failed'));
      } finally {
        cleanup();
      }
    };

    // Images are already embedded; print as soon as the document is ready.
    const schedule = () => setTimeout(triggerPrint, 80);
    if (doc.readyState === 'complete') {
      schedule();
    } else {
      iframe.onload = schedule;
      // Fallback if onload never fires
      setTimeout(schedule, 400);
    }
  });
}

/** Native / web print ? only the invoice document, not the app UI. */
export async function printInvoiceHtmlAsync(invoice: unknown): Promise<void> {
  try {
    const html = await buildInvoiceHtmlAsync(invoice);
    if (Platform.OS === 'web') {
      await printHtmlDocumentInBrowser(html);
      return;
    }
    await Print.printAsync({ html });
  } catch (e) {
    Alert.alert('Print failed', e instanceof Error ? e.message : 'Could not print invoice');
  }
}

/** Create PDF and open native share sheet (WhatsApp/email/files). */
export async function shareInvoicePdf(invoice: unknown): Promise<void> {
  try {
    const html = await buildInvoiceHtmlAsync(invoice);
    const data = invoicePayloadToPrintData(mergeInvoiceBrandingForPrint(invoice));
    const filename = invoicePdfFilename(data);
    const { uri } = await Print.printToFileAsync({ html });
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: filename,
        UTI: 'com.adobe.pdf',
      });
      return;
    }
    if (Platform.OS === 'web') {
      await printHtmlDocumentInBrowser(html);
      return;
    }
    Alert.alert('Share unavailable', `PDF saved at ${uri}`);
  } catch (e) {
    Alert.alert('Share failed', e instanceof Error ? e.message : 'Could not share invoice PDF');
  }
}

/** Kept for older call sites ? uses full seller-admin HTML. */
export async function printInvoice(order: Record<string, unknown>): Promise<void> {
  await printInvoiceHtmlAsync(order);
}

export function buildInvoiceText(order: Record<string, unknown>): string {
  const data = invoicePayloadToPrintData(order);
  const lines = [
    '================================',
    String(data.companyName || 'SELLER ADMIN').toUpperCase(),
    '================================',
    `Invoice: ${data.invoiceNo}`,
    `Date: ${data.date}`,
    '--------------------------------',
  ];
  for (const item of data.items) {
    lines.push(
      `${item.productName} x${item.quantity}`,
      `  ?${Number(item.unitPrice || 0).toFixed(2)}`,
    );
  }
  lines.push(
    '--------------------------------',
    `TOTAL: ?${Number(data.grandTotal || 0).toFixed(2)}`,
    '================================',
    'Thank you for your purchase!',
  );
  return lines.join('\n');
}

export function buildThermalReceipt(order: Record<string, unknown>): string {
  return buildInvoiceText(order);
}
