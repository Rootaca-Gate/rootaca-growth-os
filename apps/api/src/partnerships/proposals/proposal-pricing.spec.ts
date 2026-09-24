import { PartnershipDiscountType } from '@prisma/client';
import {
  computeLineSubtotal,
  computeProposalTotals,
  roundMoney,
} from './proposal-pricing';

describe('proposal-pricing', () => {
  it('returns null line subtotal when qty or price missing', () => {
    expect(computeLineSubtotal({ quantity: null, unitPrice: 100 })).toBeNull();
    expect(computeLineSubtotal({ quantity: 10, unitPrice: null })).toBeNull();
  });

  it('computes line subtotal with percentage discount', () => {
    expect(
      computeLineSubtotal({
        quantity: 20,
        unitPrice: 100,
        discountType: PartnershipDiscountType.PERCENTAGE,
        discountValue: 10,
      }),
    ).toBe(1800);
  });

  it('clamps fixed discount to base', () => {
    expect(
      computeLineSubtotal({
        quantity: 1,
        unitPrice: 50,
        discountType: PartnershipDiscountType.FIXED_AMOUNT,
        discountValue: 80,
      }),
    ).toBe(0);
  });

  it('applies header discount and optional tax', () => {
    const totals = computeProposalTotals({
      lines: [
        { quantity: 10, unitPrice: 100 },
        { quantity: 2, unitPrice: 500 },
      ],
      headerDiscountType: PartnershipDiscountType.PERCENTAGE,
      headerDiscountValue: 10,
      taxEnabled: true,
      taxRate: 15,
    });
    // subtotal 1000+1000=2000; -10% = 1800; tax 15% = 270; total 2070
    expect(totals.subtotal).toBe(2000);
    expect(totals.discountAmount).toBe(200);
    expect(totals.taxAmount).toBe(270);
    expect(totals.grandTotal).toBe(2070);
  });

  it('does not invent tax when disabled or rate missing', () => {
    const noTax = computeProposalTotals({
      lines: [{ quantity: 1, unitPrice: 100 }],
      taxEnabled: false,
      taxRate: 15,
    });
    expect(noTax.taxAmount).toBeNull();
    expect(noTax.grandTotal).toBe(100);

    const missingRate = computeProposalTotals({
      lines: [{ quantity: 1, unitPrice: 100 }],
      taxEnabled: true,
      taxRate: null,
    });
    expect(missingRate.taxAmount).toBeNull();
    expect(missingRate.grandTotal).toBe(100);
  });

  it('rounds money half-up to 2 decimals', () => {
    expect(roundMoney(10.005)).toBe(10.01);
  });
});
