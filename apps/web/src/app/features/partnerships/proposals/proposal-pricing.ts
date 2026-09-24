/**
 * Client-side mirror of apps/api/.../proposal-pricing.ts for live form totals.
 * Must stay aligned with the API — no invented zeros when qty/price unset.
 */
import { PartnershipDiscountType } from './proposal.models';

export type LinePricingInput = {
  quantity: number | null | undefined;
  unitPrice: number | null | undefined;
  discountType?: PartnershipDiscountType | null;
  discountValue?: number | null;
};

export type ProposalTotalsInput = {
  lines: LinePricingInput[];
  headerDiscountType?: PartnershipDiscountType | null;
  headerDiscountValue?: number | null;
  taxEnabled?: boolean;
  taxRate?: number | null;
};

export type ProposalTotals = {
  lineSubtotals: Array<number | null>;
  subtotal: number | null;
  discountAmount: number | null;
  taxAmount: number | null;
  grandTotal: number | null;
};

function toNumber(value: number | null | undefined): number | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (!Number.isFinite(value)) {
    return null;
  }
  return value;
}

export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function applyDiscount(
  base: number,
  discountType: PartnershipDiscountType | null | undefined,
  discountValue: number | null | undefined,
): { discounted: number; discountAmount: number } {
  const type = discountType ?? 'NONE';
  const raw = toNumber(discountValue);
  if (type === 'NONE' || raw === null || raw <= 0 || base <= 0) {
    return { discounted: base, discountAmount: 0 };
  }
  if (type === 'PERCENTAGE') {
    const pct = Math.min(100, Math.max(0, raw));
    const amount = roundMoney((base * pct) / 100);
    return { discounted: roundMoney(Math.max(0, base - amount)), discountAmount: amount };
  }
  const amount = roundMoney(Math.min(base, Math.max(0, raw)));
  return { discounted: roundMoney(Math.max(0, base - amount)), discountAmount: amount };
}

export function computeLineSubtotal(input: LinePricingInput): number | null {
  const qty = toNumber(input.quantity);
  const price = toNumber(input.unitPrice);
  if (qty === null || price === null) {
    return null;
  }
  const base = roundMoney(qty * price);
  return applyDiscount(base, input.discountType, input.discountValue).discounted;
}

export function computeProposalTotals(input: ProposalTotalsInput): ProposalTotals {
  const lineSubtotals = input.lines.map((line) => computeLineSubtotal(line));
  const priced = lineSubtotals.filter((v): v is number => v !== null);
  if (!priced.length) {
    return {
      lineSubtotals,
      subtotal: null,
      discountAmount: null,
      taxAmount: null,
      grandTotal: null,
    };
  }

  const subtotal = roundMoney(priced.reduce((sum, v) => sum + v, 0));
  const afterHeader = applyDiscount(
    subtotal,
    input.headerDiscountType,
    input.headerDiscountValue,
  );

  let taxAmount: number | null = null;
  let grandTotal = afterHeader.discounted;
  if (input.taxEnabled === true) {
    const rate = toNumber(input.taxRate);
    if (rate !== null && rate >= 0) {
      taxAmount = roundMoney((afterHeader.discounted * rate) / 100);
      grandTotal = roundMoney(afterHeader.discounted + taxAmount);
    }
  }

  return {
    lineSubtotals,
    subtotal,
    discountAmount: afterHeader.discountAmount > 0 ? afterHeader.discountAmount : 0,
    taxAmount,
    grandTotal,
  };
}

export function formatMoney(
  value: number | null | undefined,
  currency: string | null | undefined,
  empty = '—',
): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return empty;
  }
  const amount = value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const code = currency?.trim();
  return code ? `${code} ${amount}` : amount;
}
