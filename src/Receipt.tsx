import type { CSSProperties } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  formatMoney,
  labels,
  type Order,
  type Template,
  type ReceiptElement,
  type Settings,
  calculate,
  lineAmount,
} from "../shared/model";
export function previewOrder(settings: Settings): Order {
  const input = {
    customerId: null,
    items: [
      {
        productId: null,
        name: "Contoh produk",
        quantity: 2,
        price: 25000,
        unit: "pcs",
      },
    ],
    discountType: "fixed" as const,
    discount: 0,
    taxRate: settings.taxEnabled ? settings.taxRate : 0,
    fee: 0,
    paid: 100000,
    paymentMethod: "Cash" as const,
    status: "Selesai" as const,
    notes: "",
  };
  const total = calculate(input, Number(settings.rounding));
  return {
    ...input,
    ...total,
    id: 0,
    invoice: settings.prefix + "/CONTOH/00001",
    createdAt: "2026-01-01T05:00:00Z",
    updatedAt: "2026-01-01T05:00:00Z",
    completedAt: "2026-01-01T05:00:00Z",
    customerName: "Pelanggan contoh",
    customerSnapshot: null,
    store: settings,
    receiptTemplate: null,
    change: input.paid - total.grandTotal,
  };
}
export function Receipt({
  order,
  template,
  selected,
  onSelect,
}: {
  order: Order;
  template: Template;
  selected?: string;
  onSelect?: (id: string) => void;
}) {
  const money = (n: number) => formatMoney(n, order.store.currency);
  const date = new Date(order.createdAt);
  const vars: Record<string, string> = {
    store_name: order.store.storeName,
    invoice_number: order.invoice,
    customer_name: order.customerName,
    grand_total: money(order.grandTotal),
    items: order.items.map((i) => i.name).join(", "),
  };
  const substitute = (text: string) =>
    text.replace(/\{\{(\w+)\}\}/g, (match, key) => vars[key] ?? match);
  function content(e: ReceiptElement) {
    let value: string | number | undefined;
    switch (e.type) {
      case "logo":
        return order.store.logo ? (
          <img
            className="receipt-logo"
            src={order.store.logo}
            alt="Logo toko"
          />
        ) : null;
      case "store_name":
        return order.store.storeName;
      case "address":
        return order.store.address;
      case "phone":
        return order.store.phone;
      case "email":
        return order.store.email;
      case "website":
        return order.store.website;
      case "header":
      case "footer":
      case "thank_you":
        return substitute(e.text);
      case "separator":
        return <hr />;
      case "spacer":
        return <div style={{ height: e.size }} />;
      case "qr":
        return (
          <QRCodeSVG
            value={substitute(e.text) || order.invoice}
            size={Math.min(140, template.width === 58 ? 100 : 140)}
            level="M"
          />
        );
      case "items":
        return (
          <div>
            {order.items.map((i, index) => (
              <div className="receipt-item" key={index}>
                <div>{i.name}</div>
                <div className="receipt-pair">
                  <span>
                    {i.quantity} {i.unit} × {money(i.price)}
                  </span>
                  <span>{money(lineAmount(i.quantity, i.price))}</span>
                </div>
              </div>
            ))}
          </div>
        );
      case "invoice_number":
        value = order.invoice;
        break;
      case "date":
        value = date.toLocaleDateString("id-ID");
        break;
      case "time":
        value = date.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        });
        break;
      case "customer_name":
        value = order.customerName;
        break;
      case "quantity":
        value = order.items.reduce((s, i) => s + i.quantity, 0);
        break;
      case "price":
        return order.items.map((i, n) => (
          <div className="receipt-pair" key={n}>
            <span>{i.name}</span>
            <span>{money(i.price)}</span>
          </div>
        ));
      case "subtotal":
        value = money(order.subtotal);
        break;
      case "discount":
        value = money(order.discountAmount);
        break;
      case "tax":
        value = money(order.taxAmount);
        break;
      case "fee":
        value = money(order.fee);
        break;
      case "grand_total":
        return (
          <>
            {!!order.roundingAmount && (
              <div className="receipt-pair">
                <span>Pembulatan</span>
                <span>{money(order.roundingAmount)}</span>
              </div>
            )}
            <div className="receipt-pair">
              <span>Total</span>
              <span>{money(order.grandTotal)}</span>
            </div>
          </>
        );
      case "paid":
        value = money(order.paid);
        break;
      case "change":
        value = money(order.change);
        break;
      case "payment_method":
        value = order.paymentMethod;
        break;
    }
    return (
      <div className="receipt-pair">
        <span>{labels[e.type]}</span>
        <span>{value}</span>
      </div>
    );
  }
  return (
    <article className="receipt" style={{ width: `${template.width}mm` }}>
      {order.status === "Dibatalkan" && (
        <div className="cancel-stamp">DIBATALKAN</div>
      )}
      {template.elements
        .filter((e) => e.visible)
        .map((e) => (
          <div
            key={e.id}
            className={
              "receipt-element " +
              (onSelect ? "selectable " : "") +
              (selected === e.id ? "selected" : "")
            }
            role={onSelect ? "button" : undefined}
            tabIndex={onSelect ? 0 : undefined}
            onClick={() => onSelect?.(e.id)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") onSelect?.(e.id);
            }}
            aria-label={onSelect ? labels[e.type] : undefined}
            style={
              {
                fontSize: e.size,
                fontFamily: e.font,
                color: e.color,
                textAlign: e.align,
                fontWeight: e.bold ? 700 : 400,
                marginTop: e.margin,
                marginBottom: e.margin,
                padding: e.padding,
                width: e.width + "%",
                position: "relative",
                left: e.offset,
                marginLeft:
                  e.align === "right"
                    ? "auto"
                    : e.align === "center"
                      ? "auto"
                      : 0,
                marginRight: e.align === "center" ? "auto" : 0,
              } as CSSProperties
            }
          >
            {content(e)}
          </div>
        ))}
    </article>
  );
}
