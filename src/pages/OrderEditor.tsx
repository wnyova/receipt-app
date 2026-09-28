import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Printer,
  Check,
  ShoppingBag,
  Package,
  Save,
} from "lucide-react";
import { api, write, useData } from "../api";
import {
  PageHead,
  Field,
  Loading,
  Empty,
  Badge,
  Confirm,
  useToast,
  dateTime,
  SearchBox,
} from "../components";
import {
  calculate,
  lineAmount,
  orderSchema,
  payments,
  formatMoney,
  type Product,
  type Customer,
  type Settings,
  type Order,
  type OrderInput,
} from "../../shared/model";
export default function OrderEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { data: products } = useData<Product[]>("/products");
  const { data: customers } = useData<Customer[]>("/customers");
  const { data: settings } = useData<Settings>("/settings");
  const [form, setForm] = useState<OrderInput | null>(null);
  const [saved, setSaved] = useState<Order | null>(null);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState<"pay" | "cancel" | null>(null);
  useEffect(() => {
    if (!settings) return;
    let active = true;
    setError("");
    setSaved(null);
    if (id)
      api<Order>("/orders/" + id)
        .then((o) => {
          if (active) {
            setSaved(o);
            setForm(o);
          }
        })
        .catch((e) => setError(e.message));
    else
      setForm({
        customerId: null,
        items: [],
        discountType: settings.discountType,
        discount: settings.discountEnabled ? settings.discount : 0,
        taxRate: settings.taxEnabled ? settings.taxRate : 0,
        fee: 0,
        paid: 0,
        paymentMethod: "Cash",
        status: "Draft",
        notes: "",
      });
    return () => {
      active = false;
    };
  }, [id, settings]);
  if (error) return <Loading error={error} />;
  if (!form || !settings || !products || !customers) return <Loading />;
  const locked = !!saved && ["Selesai", "Dibatalkan"].includes(saved.status);
  const currency = saved?.store.currency || settings.currency;
  const money = (n: number) => formatMoney(n, currency);
  let totals: ReturnType<typeof calculate> | null = null;
  let calculationError = "";
  try {
    totals = locked
      ? saved
      : calculate(form, Number(saved?.store.rounding || settings.rounding));
  } catch (e) {
    calculationError = (e as Error).message;
  }
  const set = (key: keyof OrderInput, value: any) =>
    setForm((f) => ({ ...f!, [key]: value }));
  const patchItem = (i: number, key: string, value: any) =>
    set(
      "items",
      form.items.map((item, n) => (n === i ? { ...item, [key]: value } : item)),
    );
  async function save() {
    const clean = orderSchema.parse(form);
    const o = await write<Order>(
      "/orders" + (id ? "/" + id : ""),
      clean,
      id ? "PUT" : "POST",
    );
    setSaved(o);
    setForm(o);
    if (!id) navigate("/orders/" + o.id, { replace: true });
    return o;
  }
  return (
    <>
      <Link to="/orders" className="back-link">
        <ArrowLeft size={15} />
        Semua pesanan
      </Link>
      <PageHead
        eyebrow={id ? "DETAIL PESANAN" : "TRANSAKSI BARU"}
        title={saved?.invoice || "Buat pesanan"}
        description={
          saved
            ? "Dicatat " + dateTime(saved.createdAt)
            : "Pilih produk, periksa total, lalu catat pembayaran."
        }
      >
        {saved && <Badge status={saved.status} />}{" "}
        {saved?.completedAt && (
          <Link className="btn primary" to={"/print/" + saved.id}>
            <Printer size={17} />
            Cetak struk
          </Link>
        )}
      </PageHead>
      <div className="order-layout">
        <div className="order-main">
          <section className="panel">
            <div className="panel-head">
              <div>
                <h2>Informasi pesanan</h2>
                <p>Pelanggan dan catatan transaksi</p>
              </div>
              <ShoppingBag size={20} className="muted" />
            </div>
            <div className="panel-body form-grid">
              <Field label="Pelanggan">
                {locked ? (
                  <input disabled value={saved?.customerName} />
                ) : (
                  <select
                    value={form.customerId || ""}
                    onChange={(e) =>
                      set("customerId", Number(e.target.value) || null)
                    }
                  >
                    <option value="">Pelanggan umum</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                )}
              </Field>
              <Field label="Status">
                <select
                  disabled={locked}
                  value={form.status}
                  onChange={(e) => set("status", e.target.value)}
                >
                  {(locked
                    ? [form.status]
                    : ["Draft", "Menunggu Pembayaran", "Diproses"]
                  ).map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </Field>
              <div className="span-2">
                <Field label="Catatan">
                  <textarea
                    rows={2}
                    disabled={locked}
                    placeholder="Catatan untuk pesanan ini (opsional)"
                    value={form.notes}
                    onChange={(e) => set("notes", e.target.value)}
                  />
                </Field>
              </div>
            </div>
          </section>
          <section className="panel">
            <div className="panel-head">
              <div>
                <h2>
                  Item pesanan{" "}
                  <span className="inline-count">{form.items.length}</span>
                </h2>
                <p>Harga dapat disesuaikan khusus untuk transaksi ini</p>
              </div>
            </div>
            {!locked && (
              <div className="product-picker">
                <SearchBox
                  value={q}
                  onChange={setQ}
                  placeholder="Cari produk untuk ditambahkan…"
                />
                <div className="pick-list">
                  {products
                    .filter(
                      (p) =>
                        p.active &&
                        `${p.name} ${p.code}`
                          .toLowerCase()
                          .includes(q.toLowerCase()),
                    )
                    .slice(0, 8)
                    .map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          const existing = form.items.findIndex(
                            (i) => i.productId === p.id,
                          );
                          if (existing >= 0)
                            patchItem(
                              existing,
                              "quantity",
                              form.items[existing].quantity + 1,
                            );
                          else
                            set("items", [
                              ...form.items,
                              {
                                productId: p.id,
                                name: p.name,
                                quantity: 1,
                                price: p.price,
                                unit: p.unit,
                              },
                            ]);
                        }}
                      >
                        <span>
                          {p.name}
                          <small>
                            {p.code} · {money(p.price)}
                          </small>
                        </span>
                        <Plus size={16} />
                      </button>
                    ))}
                  {!products.some((p) => p.active) && (
                    <p className="muted">
                      Belum ada produk aktif.{" "}
                      <Link className="text-link" to="/products">
                        Tambahkan produk
                      </Link>
                    </p>
                  )}
                </div>
              </div>
            )}
            {form.items.length ? (
              <div className="table-wrap">
                <table className="order-items">
                  <thead>
                    <tr>
                      <th>PRODUK</th>
                      <th>QTY</th>
                      <th>HARGA</th>
                      <th className="text-right">TOTAL</th>
                      {!locked && <th />}
                    </tr>
                  </thead>
                  <tbody>
                    {form.items.map((item, i) => (
                      <tr key={i}>
                        <td>
                          <strong>{item.name}</strong>
                          <small className="block muted">{item.unit}</small>
                        </td>
                        <td>
                          <input
                            aria-label={"Jumlah " + item.name}
                            disabled={locked}
                            type="number"
                            min="0.001"
                            step="0.001"
                            value={item.quantity}
                            onChange={(e) =>
                              patchItem(i, "quantity", Number(e.target.value))
                            }
                          />
                        </td>
                        <td>
                          <input
                            aria-label={"Harga " + item.name}
                            disabled={locked}
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.price}
                            onChange={(e) =>
                              patchItem(i, "price", Number(e.target.value))
                            }
                          />
                        </td>
                        <td className="text-right numeric">
                          {money(lineAmount(item.quantity, item.price))}
                        </td>
                        {!locked && (
                          <td>
                            <button
                              className="icon-btn text-danger"
                              aria-label={"Hapus " + item.name}
                              onClick={() =>
                                set(
                                  "items",
                                  form.items.filter((_, n) => n !== i),
                                )
                              }
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <Empty
                title="Belum ada item"
                description="Pilih produk dari katalog di atas untuk mulai menghitung pesanan."
              />
            )}
          </section>
          {saved && saved.status !== "Dibatalkan" && (
            <button
              className="text-link text-danger"
              onClick={() => setConfirm("cancel")}
            >
              Batalkan pesanan ini
            </button>
          )}
        </div>
        <aside className="order-summary panel">
          <div className="panel-head">
            <div>
              <h2>Ringkasan pembayaran</h2>
              <p>Periksa sebelum menyelesaikan</p>
            </div>
          </div>
          <div className="panel-body">
            <div className="summary-row">
              <span>Subtotal</span>
              <strong>{money(totals?.subtotal || 0)}</strong>
            </div>
            <div className="form-grid mt-5">
              <Field label="Jenis diskon">
                <select
                  disabled={locked}
                  value={form.discountType}
                  onChange={(e) => set("discountType", e.target.value)}
                >
                  <option value="fixed">Nominal</option>
                  <option value="percent">Persen (%)</option>
                </select>
              </Field>
              <Field label="Diskon">
                <input
                  disabled={locked}
                  type="number"
                  min="0"
                  max={form.discountType === "percent" ? 100 : undefined}
                  step="0.01"
                  value={form.discount}
                  onChange={(e) => set("discount", Number(e.target.value))}
                />
              </Field>
              <Field label="Pajak (%)">
                <input
                  disabled={locked}
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={form.taxRate}
                  onChange={(e) => set("taxRate", Number(e.target.value))}
                />
              </Field>
              <Field label="Biaya tambahan">
                <input
                  disabled={locked}
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.fee}
                  onChange={(e) => set("fee", Number(e.target.value))}
                />
              </Field>
            </div>
            <div className="summary-lines">
              <div className="summary-row">
                <span>Diskon</span>
                <span>−{money(totals?.discountAmount || 0)}</span>
              </div>
              <div className="summary-row">
                <span>Pajak</span>
                <span>{money(totals?.taxAmount || 0)}</span>
              </div>
              <div className="summary-row">
                <span>Biaya tambahan</span>
                <span>{money(form.fee)}</span>
              </div>
              {!!totals?.roundingAmount && (
                <div className="summary-row">
                  <span>Pembulatan</span>
                  <span>{money(totals.roundingAmount)}</span>
                </div>
              )}
            </div>
            <div className="grand-total">
              <span>Grand total</span>
              <strong>{money(totals?.grandTotal || 0)}</strong>
            </div>
            {calculationError && (
              <p className="error-text">{calculationError}</p>
            )}
            <Field label="Metode pembayaran">
              <select
                disabled={locked}
                value={form.paymentMethod}
                onChange={(e) => set("paymentMethod", e.target.value)}
              >
                {payments.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </Field>
            <Field label="Jumlah pembayaran">
              <input
                disabled={locked}
                type="number"
                min="0"
                step="0.01"
                value={form.paid}
                onChange={(e) => set("paid", Number(e.target.value))}
              />
            </Field>
            {!locked && (
              <button
                className="text-link small-link"
                onClick={() => set("paid", totals?.grandTotal || 0)}
              >
                Gunakan uang pas
              </button>
            )}
            <div className="summary-row change-row">
              <span>Kembalian</span>
              <strong>
                {money(Math.max(0, form.paid - (totals?.grandTotal || 0)))}
              </strong>
            </div>
            {!locked && (
              <div className="stack-actions">
                <button
                  className="btn primary"
                  disabled={busy || !form.items.length || !totals}
                  onClick={() => setConfirm("pay")}
                >
                  <Check size={17} />
                  Selesaikan pembayaran
                </button>
                <button
                  className="btn"
                  disabled={busy || !form.items.length || !totals}
                  onClick={async () => {
                    setBusy(true);
                    try {
                      await save();
                      toast("Pesanan berhasil disimpan.");
                    } catch (e) {
                      toast((e as Error).message, true);
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  <Save size={16} />
                  {busy ? "Menyimpan…" : "Simpan pesanan"}
                </button>
              </div>
            )}
            {locked && (
              <p className="muted small mt-5">
                Transaksi {saved?.status.toLowerCase()}. Rincian disimpan
                sebagai arsip dan tidak dapat diedit.
              </p>
            )}
          </div>
        </aside>
      </div>
      {confirm && (
        <Confirm
          title={
            confirm === "pay" ? "Selesaikan pembayaran?" : "Batalkan pesanan?"
          }
          description={
            confirm === "pay"
              ? `Total ${money(totals?.grandTotal || 0)}. Setelah selesai, invoice dan rincian transaksi akan dikunci.`
              : "Pesanan akan ditandai dibatalkan dan tidak dihitung sebagai penjualan. Riwayatnya tetap tersimpan."
          }
          onClose={() => setConfirm(null)}
          onConfirm={async () => {
            if (confirm === "pay") {
              if (form.paid < (totals?.grandTotal || 0))
                throw new Error("Jumlah pembayaran kurang.");
              const o = await save();
              const completed = await write<Order>(
                "/orders/" + o.id + "/complete",
                { paid: form.paid, paymentMethod: form.paymentMethod },
              );
              setSaved(completed);
              setForm(completed);
              toast("Pembayaran selesai. Struk siap dicetak.");
            } else if (saved) {
              const o = await write<Order>("/orders/" + saved.id + "/cancel", {
                confirmed: true,
              });
              setSaved(o);
              setForm(o);
              toast("Pesanan dibatalkan.");
            }
          }}
        />
      )}
    </>
  );
}
