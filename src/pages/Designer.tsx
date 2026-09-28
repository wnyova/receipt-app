import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Save,
  Plus,
  Copy,
  Trash2,
  GripVertical,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
  Star,
  Settings2,
  Layers,
  Type,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useData, write, api } from "../api";
import {
  PageHead,
  Field,
  Loading,
  Modal,
  Confirm,
  useToast,
} from "../components";
import { Receipt, previewOrder } from "../Receipt";
import {
  defaultElement,
  elementTypes,
  labels,
  templateSchema,
  type Template,
  type Settings,
  type ReceiptElement,
} from "../../shared/model";
export default function Designer() {
  const {
    data: templates,
    error,
    reload,
  } = useData<Template[]>("/receipt-templates");
  const { data: settings } = useData<Settings>("/settings");
  const [draft, setDraft] = useState<Template | null>(null);
  const [selected, setSelected] = useState("");
  const [drag, setDrag] = useState("");
  const [add, setAdd] = useState(false);
  const [deleteTemplate, setDeleteTemplate] = useState(false);
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [switchTo, setSwitchTo] = useState<number | null>(null);
  const toast = useToast();
  useEffect(() => {
    if (templates && !draft) {
      setDraft(templates[0]);
      setSelected(templates[0].elements[0]?.id || "");
    }
  }, [templates, draft]);
  if (!templates || !settings || !draft || error)
    return <Loading error={error} />;
  const element = draft.elements.find((e) => e.id === selected);
  const update = (patch: Partial<Template>) => {
    setDraft((t) => ({ ...t!, ...patch }));
    setDirty(true);
  };
  const updateElement = (patch: Partial<ReceiptElement>) =>
    update({
      elements: draft.elements.map((e) =>
        e.id === selected ? { ...e, ...patch } : e,
      ),
    });
  const move = (from: string, to: string) => {
    const list = [...draft.elements];
    const a = list.findIndex((e) => e.id === from),
      b = list.findIndex((e) => e.id === to);
    if (a < 0 || b < 0) return;
    const [item] = list.splice(a, 1);
    list.splice(b, 0, item);
    update({ elements: list });
  };
  async function save() {
    setBusy(true);
    try {
      const t = templateSchema.parse(draft);
      const saved = await write<Template>(
        "/receipt-templates" + (draft!.id ? "/" + draft!.id : ""),
        t,
        draft!.id ? "PUT" : "POST",
      );
      setDraft(saved);
      setDirty(false);
      reload();
      toast("Template berhasil disimpan.");
    } catch (e) {
      toast((e as Error).message, true);
    } finally {
      setBusy(false);
    }
  }
  function choose(id: number) {
    const t = templates!.find((t) => t.id === id)!;
    setDraft(t);
    setSelected(t.elements[0]?.id || "");
    setDirty(false);
  }
  return (
    <>
      <Link className="back-link" to="/settings?tab=printer">
        <ArrowLeft size={15} />
        Pengaturan printer & struk
      </Link>
      <PageHead
        eyebrow="STUDIO STRUK"
        title="Receipt Designer"
        description="Susun struk yang pas untuk tokomu. Semua perubahan terlihat langsung."
      >
        <span className="save-status">
          {dirty ? "Perubahan belum disimpan" : "Semua perubahan tersimpan"}
        </span>
        <button className="btn primary" disabled={busy} onClick={save}>
          <Save size={17} />
          {busy ? "Menyimpan…" : "Simpan template"}
        </button>
      </PageHead>
      <div className="designer-toolbar panel">
        <div className="template-select">
          <span>Template</span>
          <select
            aria-label="Pilih template"
            value={draft.id}
            onChange={(e) =>
              dirty
                ? setSwitchTo(Number(e.target.value))
                : choose(Number(e.target.value))
            }
          >
            {!draft.id && <option value={0}>{draft.name}</option>}
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
                {t.isDefault ? " · Default" : ""}
              </option>
            ))}
          </select>
        </div>
        <div className="row-actions">
          <button
            className="btn small"
            onClick={() => {
              if (dirty) {
                toast("Simpan perubahan template terlebih dahulu.", true);
                return;
              }
              setDraft({
                id: 0,
                name: "Template baru",
                width: settings.printerWidth,
                isDefault: false,
                elements: [
                  "store_name",
                  "invoice_number",
                  "items",
                  "grand_total",
                  "thank_you",
                ].map((t) => defaultElement(t as any)),
              });
              setSelected("");
              setDirty(true);
            }}
          >
            <Plus size={15} />
            Baru
          </button>
          <button
            className="btn small"
            onClick={() => {
              setDraft({
                ...draft,
                id: 0,
                name: draft.name + " (salinan)",
                isDefault: false,
              });
              setDirty(true);
            }}
          >
            <Copy size={15} />
            Duplikat
          </button>
          <button
            className="icon-btn text-danger"
            disabled={!draft.id || draft.isDefault}
            aria-label="Hapus template"
            onClick={() => setDeleteTemplate(true)}
          >
            <Trash2 size={17} />
          </button>
        </div>
      </div>
      <div className="designer-grid">
        <section className="panel element-panel">
          <div className="panel-head">
            <h2>
              <Layers size={16} />
              Elemen
            </h2>
            <button
              className="icon-btn"
              aria-label="Tambah elemen"
              onClick={() => setAdd(true)}
            >
              <Plus size={18} />
            </button>
          </div>
          <p className="panel-note">
            Tarik untuk mengurutkan, atau gunakan panah.
          </p>
          <div className="element-list">
            {draft.elements.map((e, i) => (
              <div
                key={e.id}
                className={
                  "element-row " + (selected === e.id ? "selected" : "")
                }
                draggable
                onDragStart={(event) => {
                  setDrag(e.id);
                  event.dataTransfer.effectAllowed = "move";
                  event.dataTransfer.setData("text/plain", e.id);
                }}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  move(drag, e.id);
                  setDrag("");
                }}
              >
                <GripVertical size={13} className="drag-handle" />
                <button
                  className="element-name"
                  onClick={() => setSelected(e.id)}
                >
                  {labels[e.type]}
                </button>
                <button
                  className="tiny-btn"
                  aria-label={"Geser naik " + labels[e.type]}
                  disabled={i === 0}
                  onClick={() => move(e.id, draft.elements[i - 1].id)}
                >
                  <ChevronUp size={13} />
                </button>
                <button
                  className="tiny-btn"
                  aria-label={"Geser turun " + labels[e.type]}
                  disabled={i === draft.elements.length - 1}
                  onClick={() => move(e.id, draft.elements[i + 1].id)}
                >
                  <ChevronDown size={13} />
                </button>
                <button
                  className="tiny-btn"
                  aria-label={
                    (e.visible ? "Sembunyikan " : "Tampilkan ") + labels[e.type]
                  }
                  onClick={() =>
                    update({
                      elements: draft.elements.map((x) =>
                        x.id === e.id ? { ...x, visible: !x.visible } : x,
                      ),
                    })
                  }
                >
                  {e.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
              </div>
            ))}
          </div>
          <button className="add-element" onClick={() => setAdd(true)}>
            <Plus size={16} />
            Tambah elemen
          </button>
        </section>
        <section className="preview-panel">
          <div className="preview-head">
            <span>
              <span className="status-dot" />
              LIVE PREVIEW
            </span>
            <div className="paper-switch">
              {[58, 80].map((w) => (
                <button
                  className={draft.width === w ? "active" : ""}
                  key={w}
                  onClick={() => update({ width: w as 58 | 80 })}
                >
                  {w} mm
                </button>
              ))}
            </div>
          </div>
          <div className="preview-surface">
            <Receipt
              template={draft}
              order={previewOrder(settings)}
              selected={selected}
              onSelect={setSelected}
            />
          </div>
          <div className="preview-caption">
            Data contoh · klik elemen pada struk untuk mengedit
          </div>
        </section>
        <section className="panel properties-panel">
          <div className="panel-head">
            <h2>
              <Settings2 size={16} />
              Properti
            </h2>
          </div>
          <div className="panel-body">
            <Field label="Nama template">
              <input
                value={draft.name}
                maxLength={100}
                onChange={(e) => update({ name: e.target.value })}
              />
            </Field>
            <label className="check-label">
              <input
                type="checkbox"
                checked={draft.isDefault}
                disabled={!!templates.find((t) => t.id === draft.id)?.isDefault}
                onChange={(e) => update({ isDefault: e.target.checked })}
              />
              <Star size={14} />
              Template default
            </label>
            <div className="section-divider" />
            {element ? (
              <>
                <div className="property-heading">
                  <Type size={16} />
                  <strong>{labels[element.type]}</strong>
                  <button
                    className="icon-btn text-danger ml-auto"
                    aria-label="Hapus elemen terpilih"
                    disabled={draft.elements.length === 1}
                    onClick={() => {
                      update({
                        elements: draft.elements.filter(
                          (e) => e.id !== selected,
                        ),
                      });
                      setSelected("");
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <label className="check-label">
                  <input
                    type="checkbox"
                    checked={element.visible}
                    onChange={(e) =>
                      updateElement({ visible: e.target.checked })
                    }
                  />
                  Tampilkan elemen
                </label>
                {["header", "footer", "thank_you", "qr"].includes(
                  element.type,
                ) && (
                  <Field
                    label={
                      element.type === "qr"
                        ? "Isi QR (kosong = invoice)"
                        : "Teks"
                    }
                    hint="Variabel: {{store_name}}, {{invoice_number}}, {{customer_name}}, {{grand_total}}"
                  >
                    <textarea
                      rows={3}
                      value={element.text}
                      onChange={(e) => updateElement({ text: e.target.value })}
                    />
                  </Field>
                )}
                {element.type === "logo" && (
                  <p className="small muted">
                    Logo memakai{" "}
                    <Link className="text-link" to="/settings">
                      informasi toko
                    </Link>
                    . Atur lebar elemen untuk mengubah ukurannya.
                  </p>
                )}
                <Field label="Font">
                  <select
                    value={element.font}
                    onChange={(e) =>
                      updateElement({ font: e.target.value as any })
                    }
                  >
                    <option value="monospace">Monospace · thermal</option>
                    <option value="sans-serif">Sans serif</option>
                    <option value="serif">Serif</option>
                  </select>
                </Field>
                <div className="form-grid">
                  <Field label="Ukuran (px)">
                    <input
                      type="number"
                      min="6"
                      max="40"
                      value={element.size}
                      onChange={(e) =>
                        updateElement({
                          size: Math.min(
                            40,
                            Math.max(6, Number(e.target.value)),
                          ),
                        })
                      }
                    />
                  </Field>
                  <Field label="Warna">
                    <input
                      className="color-input"
                      type="color"
                      value={element.color}
                      onChange={(e) => updateElement({ color: e.target.value })}
                    />
                  </Field>
                </div>
                <Field label="Alignment">
                  <select
                    value={element.align}
                    onChange={(e) =>
                      updateElement({ align: e.target.value as any })
                    }
                  >
                    <option value="left">Kiri</option>
                    <option value="center">Tengah</option>
                    <option value="right">Kanan</option>
                  </select>
                </Field>
                <label className="check-label">
                  <input
                    type="checkbox"
                    checked={element.bold}
                    onChange={(e) => updateElement({ bold: e.target.checked })}
                  />
                  Teks tebal
                </label>
                <div className="form-grid">
                  {[
                    ["margin", "Margin (px)", 0, 40],
                    ["padding", "Padding (px)", 0, 40],
                    ["offset", "Posisi X (px)", -20, 20],
                    ["width", "Lebar (%)", 10, 100],
                  ].map(([key, label, min, max]) => (
                    <Field key={key} label={String(label)}>
                      <input
                        type="number"
                        min={Number(min)}
                        max={Number(max)}
                        value={
                          element[
                            key as "margin" | "padding" | "offset" | "width"
                          ]
                        }
                        onChange={(e) =>
                          updateElement({
                            [key]: Math.min(
                              Number(max),
                              Math.max(Number(min), Number(e.target.value)),
                            ),
                          })
                        }
                      />
                    </Field>
                  ))}
                </div>
                <p className="small muted">
                  Printer thermal monokrom mencetak warna sebagai hitam/abu-abu.
                </p>
              </>
            ) : (
              <p className="muted small">
                Pilih elemen di daftar atau preview untuk mengatur tampilannya.
              </p>
            )}
          </div>
        </section>
      </div>
      {add && (
        <Modal title="Tambahkan elemen" wide onClose={() => setAdd(false)}>
          <div className="element-library">
            {elementTypes.map((type) => (
              <button
                key={type}
                onClick={() => {
                  const e = defaultElement(type);
                  update({ elements: [...draft.elements, e] });
                  setSelected(e.id);
                  setAdd(false);
                }}
              >
                <Plus size={15} />
                {labels[type]}
              </button>
            ))}
          </div>
        </Modal>
      )}
      {deleteTemplate && (
        <Confirm
          title="Hapus template?"
          description={`Template ${draft.name} akan dihapus. Struk transaksi lama tetap dapat dicetak dari salinan yang tersimpan.`}
          onClose={() => setDeleteTemplate(false)}
          onConfirm={async () => {
            await api("/receipt-templates/" + draft.id, { method: "DELETE" });
            const remaining = templates.filter((t) => t.id !== draft.id);
            setDraft(remaining[0]);
            setDirty(false);
            reload();
            toast("Template berhasil dihapus.");
          }}
        />
      )}
      {switchTo !== null && (
        <Confirm
          title="Abaikan perubahan?"
          description="Perubahan template ini belum disimpan. Berpindah template akan mengabaikannya."
          onClose={() => setSwitchTo(null)}
          onConfirm={async () => choose(switchTo)}
        />
      )}
    </>
  );
}
