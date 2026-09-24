import { PartnershipDiscountType } from '@prisma/client';

export type DiscountTypeValue = PartnershipDiscountType | 'NONE' | 'PERCENTAGE' | 'FIXED_AMOUNT';

export type LinePricingInput = {
  quantity: number | null | undefined;
  unitPrice: number | null | undefined;
  discountType?: DiscountTypeValue | null;
  discountValue?: number | null;
};

export type ProposalTotalsInput = {
  lines: LinePricingInput[];
  headerDiscountType?: DiscountTypeValue | null;
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

/** Round money to 2 decimal places (half-up). */
export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function applyDiscount(
  base: number,
  discountType: DiscountTypeValue | null | undefined,
  discountValue: number | null | undefined,
): { discounted: number; discountAmount: number } {
  const type = (discountType ?? 'NONE') as string;
  const raw = toNumber(discountValue);
  if (type === 'NONE' || raw === null || raw <= 0 || base <= 0) {
    return { discounted: base, discountAmount: 0 };
  }
  if (type === 'PERCENTAGE') {
    const pct = Math.min(100, Math.max(0, raw));
    const amount = roundMoney((base * pct) / 100);
    return { discounted: roundMoney(Math.max(0, base - amount)), discountAmount: amount };
  }
  // FIXED_AMOUNT
  const amount = roundMoney(Math.min(base, Math.max(0, raw)));
  return { discounted: roundMoney(Math.max(0, base - amount)), discountAmount: amount };
}

/**
 * Line subtotal = quantity × unitPrice, then line-level discount.
 * Returns null when quantity or unitPrice is unset (no invented zeros).
 */
export function computeLineSubtotal(input: LinePricingInput): number | null {
  const qty = toNumber(input.quantity);
  const price = toNumber(input.unitPrice);
  if (qty === null || price === null) {
    return null;
  }
  const base = roundMoney(qty * price);
  return applyDiscount(base, input.discountType, input.discountValue).discounted;
}

/**
 * Proposal commercial totals. Tax applies only when taxEnabled and taxRate set.
 * Currency is never defaulted here.
 */
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
