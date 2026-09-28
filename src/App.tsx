import { NavLink, Route, Routes, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingBag,
  ReceiptText,
  Package,
  Users,
  Settings,
  ChevronRight,
  PanelLeftClose,
  Menu,
  ArrowUpRight,
} from "lucide-react";
import { useState, useEffect } from "react";
import { ToastProvider } from "./components";
import Dashboard from "./pages/Dashboard";
import Catalog from "./pages/Catalog";
import Orders from "./pages/Orders";
import OrderEditor from "./pages/OrderEditor";
import SettingsPage from "./pages/Settings";
import Designer from "./pages/Designer";
import PrintPage from "./pages/Print";
import { useData } from "./api";
import type { Settings as SettingsType } from "../shared/model";
const menu = [
  ["/", "Dashboard", LayoutDashboard],
  ["/orders", "Pesanan", ShoppingBag],
  ["/sales", "Penjualan", ReceiptText],
  ["/products", "Produk", Package],
  ["/customers", "Pelanggan", Users],
  ["/settings", "Pengaturan", Settings],
] as const;
export default function App() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const { data: settings } = useData<SettingsType>("/settings");
  useEffect(() => {
    document.title = settings?.appName || "Receipt Manager";
  }, [settings?.appName]);
  if (location.pathname.startsWith("/print/"))
    return (
      <ToastProvider>
        <Routes>
          <Route path="/print/:id" element={<PrintPage />} />
        </Routes>
      </ToastProvider>
    );
  const current = menu.find(([path]) =>
    path === "/"
      ? location.pathname === "/"
      : location.pathname.startsWith(path),
  );
  return (
    <ToastProvider>
      <div className="app-shell">
        <aside className={"sidebar " + (open ? "is-open" : "")}>
          <NavLink to="/" className="brand">
            <span className="brand-icon">
              <ReceiptText size={25} />
            </span>
            <span>
              {settings?.appName && settings.appName !== "Receipt Manager" ? (
                <span className="custom-brand">{settings.appName}</span>
              ) : (
                <>
                  Receipt<span className="brand-sub">MANAGER</span>
                </>
              )}
            </span>
          </NavLink>
          <div className="workspace">
            <span className="store-avatar">
              {(settings?.storeName || "T").slice(0, 1)}
            </span>
            <div>
              <strong>{settings?.storeName || "Toko Anda"}</strong>
              <small>Ruang kerja lokal</small>
            </div>
            <ChevronRight size={15} />
          </div>
          <div className="nav-label">OPERASIONAL</div>
          <nav>
            {menu.map(([path, label, Icon]) => (
              <NavLink
                key={path}
                to={path}
                end={path === "/"}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  isActive ? "nav-item active" : "nav-item"
                }
              >
                <Icon size={19} strokeWidth={1.7} />
                {label}
                {path === "/orders" && <span className="nav-shortcut">+</span>}
              </NavLink>
            ))}
          </nav>
          <div className="sidebar-bottom">
            <div className="local-note">
              <span className="status-dot" />
              <div>
                <strong>Tersimpan di perangkat</strong>
                <small>Database lokal · SQLite</small>
              </div>
            </div>
            <NavLink to="/settings?tab=backup" className="backup-link">
              Cadangkan data <ArrowUpRight size={14} />
            </NavLink>
            <div className="sidebar-footer">
              <span>RECEIPT MANAGER</span>
              <span>v1.0</span>
            </div>
          </div>
        </aside>
        {open && (
          <button
            aria-label="Tutup navigasi"
            className="nav-overlay"
            onClick={() => setOpen(false)}
          />
        )}
        <main className="main">
          <div className="topbar">
            <div className="breadcrumb">
              <button
                className="icon-btn mobile-menu"
                aria-label="Buka navigasi"
                onClick={() => setOpen(!open)}
              >
                <Menu size={20} />
              </button>
              <PanelLeftClose className="desktop-only" size={17} />
              <span>Ruang kerja</span>
              <ChevronRight size={13} />
              <strong>{current?.[1] || "Receipt Designer"}</strong>
            </div>
            <span className="top-date">
              {new Date().toLocaleDateString("id-ID", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>
          <div
            className={
              "page " +
              (location.pathname.includes("designer") ? "designer-page" : "")
            }
          >
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/products" element={<Catalog kind="products" />} />
              <Route path="/customers" element={<Catalog kind="customers" />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/orders/new" element={<OrderEditor />} />
              <Route path="/orders/:id" element={<OrderEditor />} />
              <Route path="/sales" element={<Orders sales />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/settings/designer" element={<Designer />} />
              <Route
                path="*"
                element={
                  <div>
                    Halaman tidak ditemukan.{" "}
                    <NavLink to="/">Kembali ke dashboard</NavLink>
                  </div>
                }
              />
            </Routes>
            <footer className="page-footer">
              <span>Receipt Manager</span>
              <span>Kelola transaksi. Atur struk. Cetak dengan mudah.</span>
            </footer>
          </div>
        </main>
      </div>
    </ToastProvider>
  );
}
