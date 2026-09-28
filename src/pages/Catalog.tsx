import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Pencil,
  Trash2,
  History,
  ImagePlus,
  Package,
  Users,
} from "lucide-react";
import { api, write, useData, upload } from "../api";
import {
  PageHead,
  SearchBox,
  Field,
  Modal,
  Confirm,
  Empty,
  Loading,
  useToast,
  Badge,
  dateTime,
} from "../components";
import {
  productSchema,
  customerSchema,
  formatMoney,
  type Product,
  type Customer,
  type Order,
  type Settings,
} from "../../shared/model";
export default function Catalog({ kind }: { kind: "products" | "customers" }) {
  const products = kind === "products";
  const { data, error, reload } = useData<(Product | Customer)[]>("/" + kind);
  const { data: settings } = useData<Settings>("/settings");
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("active");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("name");
  const [edit, setEdit] = useState<
    Product | Customer | Record<string, never> | null
  >(null);
  const [remove, setRemove] = useState<Customer | null>(null);
  const [history, setHistory] = useState<Customer | null>(null);
  const toast = useToast();
  const list = (data || [])
    .filter((p) => JSON.stringify(p).toLowerCase().includes(q.toLowerCase()))
    .filter(
      (p) =>
        !products ||
        ((filter === "all" ||
          (p as Product).active === (filter === "active")) &&
          (!category || (p as Product).category === category)),
    )
    .sort((a, b) =>
      sort === "price"
        ? (b as Product).price - (a as Product).price
        : a.name.localeCompare(b.name),
    );
  return (
    <>
      <PageHead
        eyebrow={products ? "KATALOG TOKO" : "RELASI PELANGGAN"}
        title={products ? "Produk" : "Pelanggan"}
        description={
          products
            ? "Kelola produk, harga, dan ketersediaan dalam katalog."
            : "Simpan kontak dan kenali riwayat belanja pelanggan."
        }
      >
        <button className="btn primary" onClick={() => setEdit({})}>
          <Plus size={17} />
          Tambah {products ? "produk" : "pelanggan"}
        </button>
      </PageHead>
      <section className="panel">
        <div className="toolbar">
          <SearchBox
            value={q}
            onChange={setQ}
            placeholder={
              products
                ? "Cari nama atau kode produk…"
                : "Cari nama atau nomor telepon…"
            }
          />
          <div className="toolbar-filters">
            {products && (
              <>
                <select
                  aria-label="Status produk"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                >
                  <option value="active">Produk aktif</option>
                  <option value="inactive">Nonaktif</option>
                  <option value="all">Semua status</option>
                </select>
                <select
                  aria-label="Kategori"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="">Semua kategori</option>
                  {Array.from(
                    new Set(((data as Product[]) || []).map((p) => p.category)),
                  )
                    .filter(Boolean)
                    .map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                </select>
                <select
                  aria-label="Urutkan produk"
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                >
                  <option value="name">Nama A–Z</option>
                  <option value="price">Harga tertinggi</option>
                </select>
              </>
            )}
            <span className="count-label">
              {list.length} {products ? "produk" : "pelanggan"}
            </span>
          </div>
        </div>
        {error || !data ? (
          <Loading error={error} />
        ) : !list.length ? (
          <Empty
            title={
              q
                ? "Tidak ada hasil pencarian"
                : products
                  ? "Katalogmu dimulai di sini"
                  : "Kenali pelangganmu"
            }
            description={
              q
                ? "Coba kata kunci atau filter lainnya."
                : products
                  ? "Tambahkan produk pertama beserta harga dan satuannya."
                  : "Tambahkan pelanggan untuk menghubungkan transaksi dengan kontak mereka."
            }
          />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  {(products
                    ? ["PRODUK", "KODE", "KATEGORI", "HARGA", "STATUS"]
                    : ["PELANGGAN", "TELEPON", "ALAMAT", "CATATAN"]
                  ).map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                  <th className="text-right">AKSI</th>
                </tr>
              </thead>
              <tbody>
                {list.map((p) => (
                  <tr key={p.id}>
                    {products ? (
                      <>
                        <td>
                          <div className="cell-identity">
                            {(p as Product).image ? (
                              <img
                                className="product-thumb"
                                src={(p as Product).image}
                                alt=""
                              />
                            ) : (
                              <div className="product-thumb">
                                <Package size={18} />
                              </div>
                            )}
                            <div>
                              <strong>{p.name}</strong>
                              <small>per {(p as Product).unit}</small>
                            </div>
                          </div>
                        </td>
                        <td className="mono">{(p as Product).code}</td>
                        <td>{(p as Product).category || "—"}</td>
                        <td className="numeric">
                          {formatMoney(
                            (p as Product).price,
                            settings?.currency,
                          )}
                        </td>
                        <td>
                          <span
                            className={
                              "badge " +
                              ((p as Product).active ? "success" : "neutral")
                            }
                          >
                            {(p as Product).active ? "Aktif" : "Nonaktif"}
                          </span>
                        </td>
                      </>
                    ) : (
                      <>
                        <td>
                          <div className="cell-identity">
                            <span className="customer-avatar">
                              {p.name.slice(0, 1)}
                            </span>
                            <strong>{p.name}</strong>
                          </div>
                        </td>
                        <td>{(p as Customer).phone || "—"}</td>
                        <td className="truncate-cell">
                          {(p as Customer).address || "—"}
                        </td>
                        <td className="truncate-cell muted">
                          {(p as Customer).notes || "—"}
                        </td>
                      </>
                    )}
                    <td>
                      <div className="row-actions">
                        {!products && (
                          <button
                            className="icon-btn"
                            aria-label={"Riwayat " + p.name}
                            onClick={() => setHistory(p as Customer)}
                          >
                            <History size={17} />
                          </button>
                        )}
                        <button
                          className="icon-btn"
                          aria-label={"Edit " + p.name}
                          onClick={() => setEdit(p)}
                        >
                          <Pencil size={16} />
                        </button>
                        {!products && (
                          <button
                            className="icon-btn text-danger"
                            aria-label={"Hapus " + p.name}
                            onClick={() => setRemove(p as Customer)}
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {edit && (
        <CatalogForm
          key={kind + ("id" in edit ? edit.id : "new")}
          kind={kind}
          value={edit}
          onClose={() => setEdit(null)}
          onSaved={() => {
            setEdit(null);
            reload();
            toast("Data berhasil disimpan.");
          }}
        />
      )}
      {remove && (
        <Confirm
          title="Hapus pelanggan?"
          description={`Kontak ${remove.name} akan dihapus. Riwayat invoice tetap tersimpan beserta nama pelanggan saat transaksi.`}
          onClose={() => setRemove(null)}
          onConfirm={async () => {
            await api("/customers/" + remove.id, { method: "DELETE" });
            reload();
            toast("Pelanggan berhasil dihapus.");
          }}
        />
      )}
      {history && (
        <Modal
          title={"Riwayat · " + history.name}
          wide
          onClose={() => setHistory(null)}
        >
          <CustomerHistory id={history.id} />
        </Modal>
      )}
    </>
  );
}
function CustomerHistory({ id }: { id: number }) {
  const { data, error } = useData<Order[]>("/customers/" + id + "/orders");
  if (!data || error) return <Loading error={error} />;
  return data.length ? (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Invoice</th>
            <th>Tanggal</th>
            <th>Status</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {data.map((o) => (
            <tr key={o.id}>
              <td>
                <Link className="text-link" to={"/orders/" + o.id}>
                  {o.invoice}
                </Link>
              </td>
              <td>{dateTime(o.createdAt)}</td>
              <td>
                <Badge status={o.status} />
              </td>
              <td>{formatMoney(o.grandTotal, o.store.currency)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ) : (
    <Empty
      title="Belum ada transaksi"
      description="Pesanan pelanggan ini akan tampil di sini."
    />
  );
}
function CatalogForm({
  kind,
  value,
  onClose,
  onSaved,
}: {
  kind: "products" | "customers";
  value: any;
  onClose: () => void;
  onSaved: () => void;
}) {
  const products = kind === "products";
  const [form, setForm] = useState<any>(
    products
      ? {
          code: "",
          name: "",
          category: "",
          price: 0,
          unit: "pcs",
          description: "",
          image: "",
          active: true,
          ...value,
        }
      : { name: "", phone: "", address: "", notes: "", ...value },
  );
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const set = (key: string, v: unknown) =>
    setForm((f: any) => ({ ...f, [key]: v }));
  return (
    <Modal
      title={`${value.id ? "Edit" : "Tambah"} ${products ? "produk" : "pelanggan"}`}
      onClose={onClose}
    >
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            const clean = (products ? productSchema : customerSchema).parse(
              form,
            );
            await write(
              "/" + kind + (value.id ? "/" + value.id : ""),
              clean,
              value.id ? "PUT" : "POST",
            );
            onSaved();
          } catch (error) {
            toast((error as Error).message, true);
          } finally {
            setBusy(false);
          }
        }}
      >
        <div className="form-grid">
          <Field label="Nama *">
            <input
              autoFocus
              required
              maxLength={160}
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
            />
          </Field>
          {products ? (
            <>
              <Field label="Kode produk *">
                <input
                  required
                  maxLength={64}
                  value={form.code}
                  onChange={(e) => set("code", e.target.value)}
                />
              </Field>
              <Field label="Kategori">
                <input
                  value={form.category}
                  onChange={(e) => set("category", e.target.value)}
                />
              </Field>
              <Field label="Harga *">
                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => set("price", Number(e.target.value))}
                />
              </Field>
              <Field label="Satuan">
                <input
                  value={form.unit}
                  onChange={(e) => set("unit", e.target.value)}
                />
              </Field>
              <Field label="Status">
                <select
                  value={String(form.active)}
                  onChange={(e) => set("active", e.target.value === "true")}
                >
                  <option value="true">Aktif</option>
                  <option value="false">Nonaktif</option>
                </select>
              </Field>
              <div className="span-2">
                <Field label="Deskripsi">
                  <textarea
                    rows={3}
                    value={form.description}
                    onChange={(e) => set("description", e.target.value)}
                  />
                </Field>
              </div>
              <div className="span-2">
                <Field label="Gambar produk" hint="PNG, JPG, WEBP · maks. 5 MB">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={async (e) => {
                      if (e.target.files?.[0]) {
                        setBusy(true);
                        try {
                          set(
                            "image",
                            await upload(e.target.files[0], "products"),
                          );
                        } catch (err) {
                          toast((err as Error).message, true);
                        } finally {
                          setBusy(false);
                        }
                      }
                    }}
                  />
                </Field>
                {form.image && (
                  <div className="image-field">
                    <img src={form.image} alt="Gambar produk" />
                    <button
                      type="button"
                      className="btn small"
                      onClick={() => set("image", "")}
                    >
                      Hapus gambar
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Field label="Nomor telepon">
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                />
              </Field>
              <div className="span-2">
                <Field label="Alamat">
                  <textarea
                    rows={3}
                    value={form.address}
                    onChange={(e) => set("address", e.target.value)}
                  />
                </Field>
                <Field label="Catatan">
                  <textarea
                    rows={3}
                    value={form.notes}
                    onChange={(e) => set("notes", e.target.value)}
                  />
                </Field>
              </div>
            </>
          )}
        </div>
        <div className="actions form-actions">
          <button
            type="button"
            className="btn"
            disabled={busy}
            onClick={onClose}
          >
            Batal
          </button>
          <button className="btn primary" disabled={busy}>
            {busy
              ? "Menyimpan…"
              : "Simpan " + (products ? "produk" : "pelanggan")}
          </button>
        </div>
      </form>
    </Modal>
  );
}
