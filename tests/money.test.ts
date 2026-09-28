import { test } from "node:test";
import assert from "node:assert/strict";
import { calculate, formatMoney } from "../shared/model.js";
test("fractional quantities and rounding reconcile", () => {
  assert.deepEqual(
    calculate(
      {
        items: [
          {
            productId: null,
            name: "Test",
            quantity: 1.25,
            price: 101.5,
            unit: "kg",
          },
        ],
        discountType: "percent",
        discount: 10,
        taxRate: 11,
        fee: 5,
      },
      0.01,
    ),
    {
      subtotal: 126.88,
      discountAmount: 12.69,
      taxAmount: 12.56,
      grandTotal: 131.75,
      roundingAmount: 0,
    },
  );
});
test("IDR formatting preserves fractional values when cents are used", () => {
  assert.match(formatMoney(131.75, "IDR"), /131,75/);
});
test("rejects excessive discount instead of negative totals", () => {
  assert.throws(
    () =>
      calculate({
        items: [
          {
            productId: null,
            name: "Test",
            quantity: 1,
            price: 10,
            unit: "pcs",
          },
        ],
        discountType: "fixed",
        discount: 11,
        taxRate: 0,
        fee: 0,
      }),
    /Diskon/,
  );
});
test("decimal half-up tie is exact for fractional quantity", () => {
  const t = calculate(
    {
      items: [
        {
          productId: null,
          name: "Half",
          quantity: 0.5,
          price: 2.01,
          unit: "kg",
        },
      ],
      discountType: "fixed",
      discount: 0,
      taxRate: 0,
      fee: 0,
    },
    0.01,
  );
  assert.equal(t.subtotal, 1.01);
});
