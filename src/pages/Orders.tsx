import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, ArrowUpRight, Printer, SlidersHorizontal } from "lucide-react";
import { useData } from "../api";
import {
  PageHead,
  SearchBox,
  Badge,
  Empty,
  Loading,
  dateTime,
} from "../components";
import {
  statuses,
  payments,
  formatMoney,
  type Order,
} from "../../shared/model";
export default function Orders({ sales = false }: { sales?: boolean }) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [method, setMethod] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const params = new URLSearchParams({ q, status, method, from, to });
  const { data, error } = useData<Order[]>(
    (sales ? "/sales" : "/orders") + "?" + params,
  );
  return (
    <>
      <PageHead
        eyebrow={sales ? "CATATAN PENJUALAN" : "MEJA TRANSAKSI"}
        title={sales ? "Penjualan" : "Pesanan"}
        description={
          sales
            ? "Telusuri pembayaran, lihat detail, dan cetak kembali struk."
            : "Dari pesanan pertama hingga pembayaran selesai."
        }
      >
        <Link className="btn primary" to="/orders/new">
          <Plus size={17} />
          Pesanan baru
        </Link>
      </PageHead>
      <section className="panel">
        <div className="toolbar">
          <SearchBox
            value={q}
            onChange={setQ}
            placeholder="Cari invoice, pelanggan, atau produk…"
          />
          <div className="toolbar-filters">
            <select
              aria-label="Filter status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">Semua status</option>
              {(sales ? ["Selesai", "Dibatalkan"] : statuses).map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <select
              aria-label="Filter pembayaran"
              value={method}
              onChange={(e) => setMethod(e.target.value)}
            >
              <option value="">Semua pembayaran</option>
              {payments.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="filter-row">
          <SlidersHorizontal size={15} />
          <span>Tanggal</span>
          <input
            aria-label="Dari tanggal"
            type="date"
            max={to || undefined}
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
          <span>—</span>
          <input
            aria-label="Sampai tanggal"
            type="date"
            min={from || undefined}
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
          {(q || status || method || from || to) && (
            <button
              className="text-link"
              onClick={() => {
                setQ("");
                setStatus("");
                setMethod("");
                setFrom("");
                setTo("");
              }}
            >
              Reset filter
            </button>
          )}
          <span className="ml-auto count-label">
            {data?.length || 0} transaksi
          </span>
        </div>
        {!data || error ? (
          <Loading error={error} />
        ) : !data.length ? (
          <Empty
            title="Belum ada transaksi yang cocok"
            description={
              sales
                ? "Selesaikan pembayaran pesanan untuk mencatat penjualan."
                : "Buat pesanan baru atau ubah filter pencarian."
            }
          />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>INVOICE</th>
                  <th>TANGGAL</th>
                  <th>PELANGGAN</th>
                  <th>PEMBAYARAN</th>
                  <th>STATUS</th>
                  <th className="text-right">TOTAL</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {data.map((o) => (
                  <tr key={o.id}>
                    <td>
                      <Link className="invoice-link" to={"/orders/" + o.id}>
                        {o.invoice}
                      </Link>
                    </td>
                    <td className="muted">
                      {dateTime(o.completedAt || o.createdAt)}
                    </td>
                    <td>{o.customerName}</td>
                    <td>{o.completedAt ? o.paymentMethod : "—"}</td>
                    <td>
                      <Badge status={o.status} />
                    </td>
                    <td className="text-right numeric">
                      {formatMoney(o.grandTotal, o.store.currency)}
                    </td>
                    <td>
                      <div className="row-actions">
                        {o.completedAt && (
                          <Link
                            className="icon-btn"
                            aria-label={"Cetak " + o.invoice}
                            to={"/print/" + o.id}
                          >
                            <Printer size={17} />
                          </Link>
                        )}
                        <Link
                          className="icon-btn"
                          aria-label={"Detail " + o.invoice}
                          to={"/orders/" + o.id}
                        >
                          <ArrowUpRight size={17} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
