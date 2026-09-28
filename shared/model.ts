import { Decimal } from "decimal.js";
import { z } from "zod";
export const statuses = [
  "Draft",
  "Menunggu Pembayaran",
  "Diproses",
  "Selesai",
  "Dibatalkan",
] as const;
export const payments = [
  "Cash",
  "Transfer",
  "QRIS",
  "Debit",
  "Credit",
  "Other",
] as const;
const text = z.string().trim().max(2000);
const money = z.number().finite().min(0).max(1e12);
const image = z
  .string()
  .regex(/^$|^\/uploads\/(logos|products)\/[a-f0-9-]+\.(png|jpg|jpeg|webp)$/);
export const productSchema = z.object({
  code: text.min(1).max(64),
  name: text.min(1).max(160),
  category: text.max(80).default(""),
  price: money,
  unit: text.max(30).default("pcs"),
  description: text.default(""),
  image: image.default(""),
  active: z.boolean().default(true),
});
export type Product = z.infer<typeof productSchema> & { id: number };
export const customerSchema = z.object({
  name: text.min(1).max(160),
  phone: text.max(40).default(""),
  address: text.default(""),
  notes: text.default(""),
});
export type Customer = z.infer<typeof customerSchema> & { id: number };
export const itemSchema = z.object({
  productId: z.number().int().positive().nullable().default(null),
  name: text.min(1).max(160),
  quantity: z.number().finite().positive().max(1e6),
  price: money,
  unit: text.max(30).default("pcs"),
});
export const orderSchema = z
  .object({
    customerId: z.number().int().positive().nullable().default(null),
    items: z.array(itemSchema).min(1).max(200),
    discountType: z.enum(["fixed", "percent"]).default("fixed"),
    discount: money.default(0),
    taxRate: z.number().min(0).max(100).default(0),
    fee: money.default(0),
    paid: money.default(0),
    paymentMethod: z.enum(payments).default("Cash"),
    status: z.enum(statuses).default("Draft"),
    notes: text.default(""),
  })
  .superRefine((o, c) => {
    if (o.discountType === "percent" && o.discount > 100)
      c.addIssue({ code: "custom", message: "Diskon maksimal 100%." });
  });
export type OrderInput = z.infer<typeof orderSchema>;
export const toCents = (value: number) =>
  new Decimal(value)
    .times(100)
    .toDecimalPlaces(0, Decimal.ROUND_HALF_UP)
    .toNumber();
export const lineAmount = (quantity: number, price: number) =>
  new Decimal(quantity)
    .times(price)
    .toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
    .toNumber();
export function calculate(
  o: Pick<
    OrderInput,
    "items" | "discountType" | "discount" | "taxRate" | "fee"
  >,
  rounding = 1,
) {
  const subtotalCents = o.items.reduce(
    (sum, i) => sum + toCents(lineAmount(i.quantity, i.price)),
    0,
  );
  const discountCents =
    o.discountType === "percent"
      ? new Decimal(subtotalCents)
          .times(o.discount)
          .div(100)
          .toDecimalPlaces(0, Decimal.ROUND_HALF_UP)
          .toNumber()
      : toCents(o.discount);
  if (discountCents > subtotalCents)
    throw new Error("Diskon melebihi subtotal.");
  const taxCents = new Decimal(subtotalCents - discountCents)
    .times(o.taxRate)
    .div(100)
    .toDecimalPlaces(0, Decimal.ROUND_HALF_UP)
    .toNumber();
  const step = Math.max(1, toCents(rounding));
  const before = subtotalCents - discountCents + taxCents + toCents(o.fee);
  const total = new Decimal(before)
    .div(step)
    .toDecimalPlaces(0, Decimal.ROUND_HALF_UP)
    .times(step)
    .toNumber();
  if (!Number.isSafeInteger(total) || total > 1e14)
    throw new Error("Nilai transaksi terlalu besar.");
  return {
    subtotal: subtotalCents / 100,
    discountAmount: discountCents / 100,
    taxAmount: taxCents / 100,
    grandTotal: total / 100,
    roundingAmount: (total - before) / 100,
  };
}
export const elementTypes = [
  "logo",
  "store_name",
  "address",
  "phone",
  "email",
  "website",
  "header",
  "invoice_number",
  "date",
  "time",
  "customer_name",
  "items",
  "quantity",
  "price",
  "subtotal",
  "discount",
  "tax",
  "fee",
  "grand_total",
  "paid",
  "change",
  "payment_method",
  "qr",
  "separator",
  "spacer",
  "footer",
  "thank_you",
] as const;
export const labels: Record<(typeof elementTypes)[number], string> = {
  logo: "Logo",
  store_name: "Nama toko",
  address: "Alamat",
  phone: "Telepon",
  email: "Email",
  website: "Website",
  header: "Header",
  invoice_number: "Nomor invoice",
  date: "Tanggal",
  time: "Waktu",
  customer_name: "Pelanggan",
  items: "Daftar produk",
  quantity: "Quantity",
  price: "Harga",
  subtotal: "Subtotal",
  discount: "Diskon",
  tax: "Pajak",
  fee: "Biaya tambahan",
  grand_total: "Grand total",
  paid: "Pembayaran",
  change: "Kembalian",
  payment_method: "Metode pembayaran",
  qr: "QR code",
  separator: "Garis pemisah",
  spacer: "Jarak",
  footer: "Footer",
  thank_you: "Ucapan terima kasih",
};
export const elementSchema = z.object({
  id: z.string().max(80),
  type: z.enum(elementTypes),
  visible: z.boolean(),
  text: z.string().max(2000).default(""),
  size: z.number().min(6).max(40),
  font: z.enum(["monospace", "sans-serif", "serif"]),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  align: z.enum(["left", "center", "right"]),
  bold: z.boolean(),
  margin: z.number().min(0).max(40),
  padding: z.number().min(0).max(40),
  offset: z.number().min(-20).max(20).default(0),
  width: z.number().min(10).max(100).default(100),
});
export type ReceiptElement = z.infer<typeof elementSchema>;
export const templateSchema = z
  .object({
    name: text.min(1).max(100),
    width: z.union([z.literal(58), z.literal(80)]),
    isDefault: z.boolean().default(false),
    elements: z.array(elementSchema).min(1).max(80),
  })
  .refine(
    (t) => new Set(t.elements.map((e) => e.id)).size === t.elements.length,
    "ID elemen harus unik.",
  );
export type Template = z.infer<typeof templateSchema> & { id: number };
export function defaultElement(
  type: ReceiptElement["type"],
  id = type + "-" + Math.random().toString(36).slice(2),
): ReceiptElement {
  return {
    id,
    type,
    visible: true,
    text: type === "thank_you" ? "Terima kasih atas kunjungan Anda." : "",
    size: type === "store_name" ? 18 : type === "grand_total" ? 15 : 11,
    font: "monospace",
    color: "#000000",
    align: [
      "logo",
      "store_name",
      "address",
      "phone",
      "header",
      "footer",
      "thank_you",
      "qr",
    ].includes(type)
      ? "center"
      : "left",
    bold: ["store_name", "grand_total"].includes(type),
    margin: 3,
    padding: 0,
    offset: 0,
    width: 100,
  };
}
export const settingsSchema = z
  .object({
    appName: text.min(1).max(80).default("Receipt Manager"),
    storeName: text.min(1).max(160).default("Toko Anda"),
    address: text.default(""),
    phone: text.max(40).default(""),
    whatsapp: text.max(40).default(""),
    email: z.union([z.literal(""), z.string().email()]).default(""),
    website: z
      .union([
        z.literal(""),
        z
          .string()
          .url()
          .regex(/^https?:\/\//),
      ])
      .default(""),
    description: text.default(""),
    logo: image.default(""),
    prefix: z
      .string()
      .regex(/^[A-Za-z0-9-]{1,20}$/)
      .default("INV"),
    invoiceFormat: z
      .enum(["{prefix}/{YYYY}{MM}/{seq}", "{prefix}-{YYYY}{MM}{DD}-{seq}"])
      .default("{prefix}/{YYYY}{MM}/{seq}"),
    currency: z.enum(["IDR", "USD", "SGD", "MYR", "EUR"]).default("IDR"),
    rounding: z.enum(["0.01", "1", "100", "500", "1000"]).default("1"),
    taxEnabled: z.boolean().default(false),
    taxRate: z.number().min(0).max(100).default(11),
    discountEnabled: z.boolean().default(false),
    discountType: z.enum(["fixed", "percent"]).default("fixed"),
    discount: money.default(0),
    printerWidth: z.union([z.literal(58), z.literal(80)]).default(80),
  })
  .refine(
    (s) => s.discountType !== "percent" || s.discount <= 100,
    "Diskon maksimal 100%.",
  );
export type Settings = z.infer<typeof settingsSchema>;
export type Order = OrderInput &
  ReturnType<typeof calculate> & {
    id: number;
    invoice: string;
    createdAt: string;
    updatedAt: string;
    completedAt: string | null;
    customerName: string;
    customerSnapshot: Customer | null;
    store: Settings;
    receiptTemplate: Template | null;
    change: number;
  };
export const formatMoney = (n: number, currency = "IDR") =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency,
    minimumFractionDigits: currency === "IDR" && Number.isInteger(n) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(n);
export function localDate(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Complete persisted payload, including the historical values consumed by receipts.
export const storedOrderSchema = orderSchema.and(
  z.object({
    id: z.number().int().nonnegative(),
    invoice: z.string().min(1).max(100),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    completedAt: z.string().datetime().nullable(),
    customerName: z.string().max(160),
    customerSnapshot: customerSchema
      .extend({ id: z.number().int().positive() })
      .nullable(),
    store: settingsSchema,
    receiptTemplate: templateSchema.nullable(),
    subtotal: money,
    discountAmount: money,
    taxAmount: money,
    grandTotal: money,
    roundingAmount: z.number().finite(),
    change: money,
  }),
);
