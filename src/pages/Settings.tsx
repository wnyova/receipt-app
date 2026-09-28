import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Save,
  Paintbrush,
  Download,
  Upload,
  Building2,
  SlidersHorizontal,
  Printer,
  Database,
  ArrowUpRight,
} from "lucide-react";
import { useData, write, api, upload } from "../api";
import { Field, PageHead, Loading, useToast, Confirm } from "../components";
import { settingsSchema, type Settings } from "../../shared/model";
export default function SettingsPage() {
  const { data, error } = useData<Settings>("/settings");
  const [form, setForm] = useState<Settings | null>(null);
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") || "store";
  const [busy, setBusy] = useState(false);
  const [restore, setRestore] = useState<File | null>(null);
  const toast = useToast();
  useEffect(() => {
    if (data) setForm(data);
  }, [data]);
  if (!form || error) return <Loading error={error} />;
  const set = (key: keyof Settings, value: any) =>
    setForm((f) => ({ ...f!, [key]: value }));
  return (
    <>
      <PageHead
        eyebrow="PREFERENSI TOKO"
        title="Pengaturan"
        description="Sesuaikan informasi toko, transaksi, dan kebutuhan cetak."
      />
      <div className="settings-layout">
        <nav className="settings-nav">
          {[
            ["store", "Informasi aplikasi", Building2],
            ["transaction", "Pengaturan transaksi", SlidersHorizontal],
            ["printer", "Printer & struk", Printer],
            ["backup", "Backup & restore", Database],
          ].map(([value, label, Icon]: any) => (
            <button
              key={value}
              className={tab === value ? "selected" : ""}
              onClick={() => setParams({ tab: value })}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </nav>
        <section className="panel settings-panel">
          {tab === "backup" ? (
            <>
              <div className="panel-head">
                <div>
                  <h2>Backup & restore</h2>
                  <p>Simpan salinan data toko di tempat yang aman.</p>
                </div>
              </div>
              <div className="panel-body">
                <div className="setting-feature">
                  <Database size={27} />
                  <div>
                    <h3>Cadangkan database</h3>
                    <p>
                      Unduh produk, pelanggan, pesanan, pengaturan, dan template
                      dalam satu file SQLite.
                    </p>
                  </div>
                  <button
                    className="btn"
                    disabled={busy}
                    onClick={async () => {
                      setBusy(true);
                      try {
                        const response = await fetch("/api/backup");
                        if (!response.ok)
                          throw new Error("Backup gagal dibuat.");
                        const url = URL.createObjectURL(await response.blob());
                        const a = document.createElement("a");
                        a.href = url;
                        a.download =
                          "backup-" +
                          new Date().toISOString().slice(0, 10) +
                          ".db";
                        a.click();
                        setTimeout(() => URL.revokeObjectURL(url), 10000);
                        toast("Backup berhasil dibuat.");
                      } catch (e) {
                        toast((e as Error).message, true);
                      } finally {
                        setBusy(false);
                      }
                    }}
                  >
                    <Download size={16} />
                    Unduh backup
                  </button>
                </div>
                <div className="notice">
                  Gambar disimpan terpisah. Untuk pindah perangkat, salin juga
                  folder <code>uploads</code> bersama file backup database.
                </div>
                <div className="setting-feature restore-feature">
                  <Upload size={26} />
                  <div>
                    <h3>Pulihkan dari backup</h3>
                    <p>
                      Data saat ini akan digantikan. Aplikasi memvalidasi file
                      dan membuat backup otomatis terlebih dahulu.
                    </p>
                    <label className="btn file-btn">
                      Pilih file .db
                      <input
                        type="file"
                        accept=".db"
                        onChange={(e) => {
                          setRestore(e.target.files?.[0] || null);
                          e.target.value = "";
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setBusy(true);
                try {
                  const s = settingsSchema.parse(form);
                  await write("/settings", s, "PUT");
                  toast("Pengaturan berhasil disimpan.");
                } catch (e) {
                  toast((e as Error).message, true);
                } finally {
                  setBusy(false);
                }
              }}
            >
              <div className="panel-head">
                <div>
                  <h2>
                    {tab === "store"
                      ? "Informasi aplikasi"
                      : tab === "transaction"
                        ? "Pengaturan transaksi"
                        : "Printer & struk"}
                  </h2>
                  <p>
                    {tab === "store"
                      ? "Informasi ini digunakan pada struk transaksi baru."
                      : tab === "transaction"
                        ? "Nilai default untuk pesanan baru."
                        : "Atur kertas dan sesuaikan desain struk toko."}
                  </p>
                </div>
              </div>
              <div className="panel-body">
                {tab === "store" ? (
                  <div className="form-grid">
                    {[
                      ["appName", "Nama aplikasi"],
                      ["storeName", "Nama toko"],
                      ["phone", "Nomor telepon"],
                      ["whatsapp", "WhatsApp"],
                      ["email", "Email"],
                      ["website", "Website"],
                    ].map(([key, label]) => (
                      <Field key={key} label={label}>
                        <input
                          required={["appName", "storeName"].includes(key)}
                          type={
                            key === "email"
                              ? "email"
                              : key === "website"
                                ? "url"
                                : "text"
                          }
                          value={String(form[key as keyof Settings])}
                          onChange={(e) =>
                            set(key as keyof Settings, e.target.value)
                          }
                        />
                      </Field>
                    ))}
                    <div className="span-2">
                      <Field label="Alamat">
                        <textarea
                          rows={3}
                          value={form.address}
                          onChange={(e) => set("address", e.target.value)}
                        />
                      </Field>
                      <Field label="Deskripsi">
                        <textarea
                          rows={2}
                          value={form.description}
                          onChange={(e) => set("description", e.target.value)}
                        />
                      </Field>
                      <Field
                        label="Logo toko"
                        hint="PNG, JPG, WEBP · maks. 5 MB"
                      >
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          onChange={async (e) => {
                            if (e.target.files?.[0]) {
                              setBusy(true);
                              try {
                                set("logo", await upload(e.target.files[0]));
                                toast(
                                  "Logo diunggah. Simpan pengaturan untuk menerapkan.",
                                );
                              } catch (e) {
                                toast((e as Error).message, true);
                              } finally {
                                setBusy(false);
                              }
                            }
                          }}
                        />
                      </Field>
                      {form.logo && (
                        <div className="image-field">
                          <img src={form.logo} alt="Logo toko" />
                          <button
                            className="btn small"
                            type="button"
                            onClick={() => set("logo", "")}
                          >
                            Hapus logo
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ) : tab === "transaction" ? (
                  <>
                    <div className="form-grid">
                      <Field label="Prefix invoice">
                        <input
                          required
                          pattern="[A-Za-z0-9-]{1,20}"
                          value={form.prefix}
                          onChange={(e) => set("prefix", e.target.value)}
                        />
                      </Field>
                      <Field label="Format invoice">
                        <select
                          value={form.invoiceFormat}
                          onChange={(e) => set("invoiceFormat", e.target.value)}
                        >
                          <option>{"{prefix}/{YYYY}{MM}/{seq}"}</option>
                          <option>{"{prefix}-{YYYY}{MM}{DD}-{seq}"}</option>
                        </select>
                      </Field>
                      <Field label="Mata uang">
                        <select
                          value={form.currency}
                          onChange={(e) => set("currency", e.target.value)}
                        >
                          {["IDR", "USD", "SGD", "MYR", "EUR"].map((c) => (
                            <option key={c}>{c}</option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Pembulatan total">
                        <select
                          value={form.rounding}
                          onChange={(e) => set("rounding", e.target.value)}
                        >
                          {["0.01", "1", "100", "500", "1000"].map((c) => (
                            <option key={c} value={c}>
                              Kelipatan {c}
                            </option>
                          ))}
                        </select>
                      </Field>
                    </div>
                    <div className="section-divider" />
                    <label className="check-label">
                      <input
                        type="checkbox"
                        checked={form.taxEnabled}
                        onChange={(e) => set("taxEnabled", e.target.checked)}
                      />
                      Aktifkan pajak secara default
                    </label>
                    <Field label="Pajak (%)">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={form.taxRate}
                        onChange={(e) => set("taxRate", Number(e.target.value))}
                      />
                    </Field>
                    <label className="check-label">
                      <input
                        type="checkbox"
                        checked={form.discountEnabled}
                        onChange={(e) =>
                          set("discountEnabled", e.target.checked)
                        }
                      />
                      Aktifkan diskon secara default
                    </label>
                    <div className="form-grid">
                      <Field label="Jenis diskon">
                        <select
                          value={form.discountType}
                          onChange={(e) => set("discountType", e.target.value)}
                        >
                          <option value="fixed">Nominal</option>
                          <option value="percent">Persen (%)</option>
                        </select>
                      </Field>
                      <Field label="Default diskon">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          max={
                            form.discountType === "percent" ? 100 : undefined
                          }
                          value={form.discount}
                          onChange={(e) =>
                            set("discount", Number(e.target.value))
                          }
                        />
                      </Field>
                    </div>
                    <div className="notice">
                      Pajak dihitung setelah diskon. Biaya tambahan tidak
                      dikenakan pajak. Pembulatan diterapkan pada total akhir.
                      Perubahan mata uang tidak mengonversi harga produk atau
                      transaksi sebelumnya.
                    </div>
                  </>
                ) : (
                  <>
                    <Field label="Lebar kertas default">
                      <select
                        value={form.printerWidth}
                        onChange={(e) =>
                          set("printerWidth", Number(e.target.value))
                        }
                      >
                        <option value={58}>Thermal 58 mm</option>
                        <option value={80}>Thermal 80 mm</option>
                      </select>
                    </Field>
                    <div className="setting-feature">
                      <Paintbrush size={27} />
                      <div>
                        <h3>Receipt Designer</h3>
                        <p>
                          Buat template, susun elemen, dan lihat preview
                          langsung sebelum mencetak.
                        </p>
                        <Link className="btn primary" to="/settings/designer">
                          Buka designer <ArrowUpRight size={16} />
                        </Link>
                      </div>
                    </div>
                    <div className="notice">
                      Cetak melalui dialog browser. Gunakan ukuran kertas yang
                      sesuai driver printer, skala 100%, margin none, dan
                      matikan header/footer. Lebar setiap template dapat diatur
                      terpisah.
                    </div>
                  </>
                )}
              </div>
              <div className="panel-footer">
                <button className="btn primary" disabled={busy}>
                  <Save size={16} />
                  {busy ? "Menyimpan…" : "Simpan pengaturan"}
                </button>
              </div>
            </form>
          )}
        </section>
      </div>
      {restore && (
        <Confirm
          title="Gantikan data dari backup?"
          description={`File: ${restore.name}. Data saat ini akan diganti. Backup otomatis disimpan di data/backups sebelum restore.`}
          onClose={() => setRestore(null)}
          onConfirm={async () => {
            const body = new FormData();
            body.append("file", restore);
            body.append("confirmed", "true");
            await api("/restore", { method: "POST", body });
            toast("Database berhasil dipulihkan.");
            window.location.assign("/");
          }}
        />
      )}
    </>
  );
}
