import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Printer, ArrowLeft } from "lucide-react";
import { useData } from "../api";
import { Receipt } from "../Receipt";
import { Loading, useToast } from "../components";
import type { Order, Template } from "../../shared/model";
export default function PrintPage() {
  const { id } = useParams();
  const { data: order, error } = useData<Order>("/orders/" + id);
  const { data: templates } = useData<Template[]>("/receipt-templates");
  const [width, setWidth] = useState<58 | 80 | null>(null);
  const toast = useToast();
  const template =
    order?.receiptTemplate || templates?.find((t) => t.isDefault);
  useEffect(() => {
    if (!template) return;
    const style = document.createElement("style");
    style.textContent = `@media print { @page { size: ${width || template.width}mm auto; margin: 0; } html, body { width: ${width || template.width}mm; } }`;
    document.head.appendChild(style);
    return () => style.remove();
  }, [width, template]);
  if (!order || !template || error) return <Loading error={error} />;
  return (
    <div className="print-page">
      <div className="print-toolbar">
        <Link className="btn" to={"/orders/" + id}>
          <ArrowLeft size={16} />
          Kembali
        </Link>
        <span>{order.invoice}</span>
        <select
          aria-label="Ukuran kertas"
          value={width || template.width}
          onChange={(e) => setWidth(Number(e.target.value) as 58 | 80)}
        >
          <option value="58">58 mm</option>
          <option value="80">80 mm</option>
        </select>
        <button
          className="btn primary"
          onClick={async () => {
            try {
              await document.fonts.ready;
              await Promise.all(
                Array.from(document.images).map((img) =>
                  img.decode().catch(() => {}),
                ),
              );
              window.print();
            } catch {
              toast(
                "Dialog cetak tidak dapat dibuka. Periksa pengaturan browser.",
                true,
              );
            }
          }}
        >
          <Printer size={16} />
          Cetak struk
        </button>
      </div>
      <p className="print-help">
        Pilih printer thermal, skala 100%, margin none, dan nonaktifkan
        header/footer browser.
      </p>
      <div id="print-area">
        <Receipt
          order={order}
          template={{ ...template, width: width || template.width }}
        />
      </div>
    </div>
  );
}
