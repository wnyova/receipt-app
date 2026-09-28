import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  ArrowUpRight,
  ArrowRight,
  CalendarDays,
  Wallet,
  ShoppingBag,
  ChartNoAxesCombined,
  Clock3,
} from "lucide-react";
import { useData } from "../api";
import { PageHead, Empty, Loading, Badge, dateTime } from "../components";
import {
  formatMoney,
  localDate,
  type Order,
  type Settings,
} from "../../shared/model";
type Stats = {
  currency: string;
  todaySales: number;
  todayCount: number;
  monthSales: number;
  pending: number;
  average: number;
  periodSales: number;
  periodCount: number;
  series: { date: string; total: number }[];
  topProducts: { name: string; quantity: number; total: number }[];
  recent: Order[];
};
export default function Dashboard() {
  const [period, setPeriod] = useState("7");
  const [currency, setCurrency] = useState("");
  const [from, setFrom] = useState(localDate());
  const [to, setTo] = useState(localDate());
  let start = new Date();
  if (period === "month") start.setDate(1);
  else if (period !== "custom")
    start.setDate(start.getDate() - Number(period) + 1);
  const startDate = period === "custom" ? from : localDate(start);
  const endDate = period === "custom" ? to : localDate();
  const { data, error } = useData<Stats>(
    `/dashboard?from=${startDate}&to=${endDate}&currency=${currency}`,
  );
  const { data: settings } = useData<Settings>("/settings");
  const money = (n: number) =>
    formatMoney(n, data?.currency || settings?.currency);
  const hasData = !!data?.series.length;
  return (
    <>
      <PageHead
        eyebrow="RINGKASAN USAHA"
        title="Dashboard"
        description="Semua aktivitas toko, dalam satu pandangan."
      >
        <select
          aria-label="Mata uang laporan"
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
        >
          <option value="">Mata uang toko</option>
          {["IDR", "USD", "SGD", "MYR", "EUR"].map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <Link className="btn primary" to="/orders/new">
          <Plus size={17} />
          Pesanan baru
        </Link>
      </PageHead>
      {error ? (
        <Loading error={error} />
      ) : !data ? (
        <Loading />
      ) : (
        <>
          <div className="stats-grid">
            {[
              {
                label: "Penjualan hari ini",
                value: money(data.todaySales),
                caption: `${data.todayCount} transaksi selesai`,
                icon: Wallet,
              },
              {
                label: "Transaksi hari ini",
                value: String(data.todayCount).padStart(2, "0"),
                caption: "Pembayaran berhasil dicatat",
                icon: ShoppingBag,
              },
              {
                label: "Penjualan bulan ini",
                value: money(data.monthSales),
                caption: new Date().toLocaleDateString("id-ID", {
                  month: "long",
                  year: "numeric",
                }),
                icon: ChartNoAxesCombined,
              },
              {
                label: "Pesanan pending",
                value: String(data.pending).padStart(2, "0"),
                caption: "Menunggu tindak lanjut",
                icon: Clock3,
              },
            ].map(({ label, value, caption, icon: Icon }) => (
              <div className="stat-card" key={label}>
                <div className="stat-label">
                  {label}
                  <Icon size={17} />
                </div>
                <div className="stat-value">{value}</div>
                <div className="stat-caption">{caption}</div>
              </div>
            ))}
          </div>
          <div className="dashboard-middle">
            <section className="panel chart-panel">
              <div className="panel-head">
                <div>
                  <h2>Ikhtisar penjualan</h2>
                  <p>Transaksi selesai pada periode terpilih</p>
                </div>
                <select
                  aria-label="Periode grafik"
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                >
                  <option value="1">Hari ini</option>
                  <option value="7">7 hari terakhir</option>
                  <option value="30">30 hari terakhir</option>
                  <option value="month">Bulan ini</option>
                  <option value="custom">Custom tanggal</option>
                </select>
              </div>
              {period === "custom" && (
                <div className="date-range">
                  <input
                    aria-label="Dari tanggal"
                    type="date"
                    max={to}
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                  />
                  <span>—</span>
                  <input
                    aria-label="Sampai tanggal"
                    type="date"
                    min={from}
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                  />
                </div>
              )}
              <div className="chart-summary">
                <strong>{money(data.periodSales)}</strong>
                <span>
                  <span className="blue-dot" /> Penjualan
                </span>
              </div>
              {hasData ? (
                <SalesChart data={data.series} currency={data.currency} />
              ) : (
                <div className="chart-empty">
                  <div className="chart-grid" />
                  <div>
                    <ChartNoAxesCombined size={25} />
                    <strong>Belum ada penjualan di periode ini</strong>
                    <span>Grafik muncul setelah pesanan selesai dibayar.</span>
                  </div>
                </div>
              )}
              <div className="chart-bottom">
                <span>
                  <CalendarDays size={14} />
                  {startDate} — {endDate}
                </span>
                <span>
                  Rata-rata transaksi <strong>{money(data.average)}</strong>
                </span>
              </div>
            </section>
            <section className="panel top-products">
              <div className="panel-head">
                <div>
                  <h2>Produk terlaris</h2>
                  <p>Berdasarkan jumlah terjual</p>
                </div>
                <Link
                  to="/products"
                  className="icon-btn"
                  aria-label="Lihat produk"
                >
                  <ArrowUpRight size={18} />
                </Link>
              </div>
              {data.topProducts.length ? (
                <div className="rank-list">
                  {data.topProducts.map((p, i) => (
                    <div className="rank" key={p.name}>
                      <span className="rank-number">0{i + 1}</span>
                      <div>
                        <strong>{p.name}</strong>
                        <div className="rank-bar">
                          <i
                            style={{
                              width:
                                (p.quantity / data.topProducts[0].quantity) *
                                  100 +
                                "%",
                            }}
                          />
                        </div>
                      </div>
                      <span>
                        {p.quantity}
                        <small>terjual</small>
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <Empty
                  title="Produk terbaikmu, di sini"
                  description="Mulai catat penjualan untuk melihat produk yang paling diminati."
                />
              )}
              <Link className="panel-bottom-link" to="/products">
                Kelola katalog produk <ArrowRight size={15} />
              </Link>
            </section>
          </div>
          <section className="panel">
            <div className="panel-head">
              <div>
                <h2>Transaksi terbaru</h2>
                <p>Pantau pesanan dan pembayaran terakhir</p>
              </div>
              <Link to="/orders" className="text-link">
                Lihat semua <ArrowRight size={15} />
              </Link>
            </div>
            {data.recent.length ? (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>INVOICE</th>
                      <th>PELANGGAN</th>
                      <th>TANGGAL</th>
                      <th>STATUS</th>
                      <th className="text-right">TOTAL</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {data.recent.map((o) => (
                      <tr key={o.id}>
                        <td>
                          <Link className="invoice-link" to={"/orders/" + o.id}>
                            {o.invoice}
                          </Link>
                        </td>
                        <td>{o.customerName}</td>
                        <td className="muted">{dateTime(o.createdAt)}</td>
                        <td>
                          <Badge status={o.status} />
                        </td>
                        <td className="text-right numeric">
                          {formatMoney(o.grandTotal, o.store.currency)}
                        </td>
                        <td>
                          <Link
                            to={"/orders/" + o.id}
                            aria-label={"Buka " + o.invoice}
                          >
                            <ArrowUpRight size={17} />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <Empty
                title="Siap untuk transaksi pertama?"
                description="Tambahkan produk, buat pesanan, lalu catat pembayarannya."
              >
                <Link className="btn" to="/products">
                  <Plus size={16} />
                  Tambahkan produk
                </Link>
              </Empty>
            )}
          </section>
          <div className="dashboard-tip">
            <ReceiptTip />
            <div>
              <strong>Struk yang terasa seperti tokomu.</strong>
              <p>
                Atur logo, susunan informasi, dan ukuran kertas sebelum
                mencetak.
              </p>
            </div>
            <Link to="/settings/designer">
              Buka Receipt Designer <ArrowRight size={16} />
            </Link>
          </div>
        </>
      )}
    </>
  );
}
function ReceiptTip() {
  return (
    <div className="tip-icon">
      <svg width="26" height="32" viewBox="0 0 26 32" fill="none">
        <path
          d="M4 2h18v27l-5-3-4 3-4-3-5 3V2Z"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path
          d="M8 9h10M8 14h10M8 19h6"
          stroke="currentColor"
          strokeWidth="1.5"
        />
      </svg>
    </div>
  );
}
function SalesChart({
  data,
  currency,
}: {
  data: { date: string; total: number }[];
  currency: string;
}) {
  const max = Math.max(...data.map((d) => d.total), 1);
  return (
    <div
      className="sales-chart"
      role="img"
      aria-label="Grafik penjualan harian"
    >
      <div className="chart-scale">
        {[1, 0.5, 0].map((n) => (
          <span key={n}>{formatMoney(max * n, currency)}</span>
        ))}
      </div>
      <div className="bars">
        {data.map((d) => (
          <div
            className="bar-column"
            key={d.date}
            title={`${d.date}: ${formatMoney(d.total, currency)}`}
          >
            <div className="bar-track">
              <i style={{ height: Math.max(2, (d.total / max) * 100) + "%" }} />
            </div>
            <span>
              {d.date.slice(8)}/{d.date.slice(5, 7)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
