import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import {
  defaultElement,
  settingsSchema,
  type Settings,
  type Template,
} from "../shared/model.js";
export function openDatabase(root: string) {
  fs.mkdirSync(path.join(root, "data", "backups"), { recursive: true });
  const db = new Database(path.join(root, "data", "receipt.db"));
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.pragma("busy_timeout = 5000");
  db.exec(`CREATE TABLE IF NOT EXISTS meta(key TEXT PRIMARY KEY,value TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS products(id INTEGER PRIMARY KEY AUTOINCREMENT,code TEXT NOT NULL UNIQUE,name TEXT NOT NULL,category TEXT NOT NULL,price REAL NOT NULL CHECK(price>=0),unit TEXT NOT NULL,description TEXT NOT NULL,image TEXT NOT NULL,active INTEGER NOT NULL CHECK(active IN(0,1)));
 CREATE TABLE IF NOT EXISTS customers(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL,phone TEXT NOT NULL,address TEXT NOT NULL,notes TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS settings(id INTEGER PRIMARY KEY CHECK(id=1),payload TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS templates(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL,is_default INTEGER NOT NULL CHECK(is_default IN(0,1)),payload TEXT NOT NULL);
 CREATE UNIQUE INDEX IF NOT EXISTS one_default ON templates(is_default) WHERE is_default=1;
 CREATE TABLE IF NOT EXISTS orders(id INTEGER PRIMARY KEY AUTOINCREMENT,invoice TEXT NOT NULL UNIQUE,customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,status TEXT NOT NULL CHECK(status IN('Draft','Menunggu Pembayaran','Diproses','Selesai','Dibatalkan')),created_at TEXT NOT NULL,completed_at TEXT,total_cents INTEGER NOT NULL CHECK(total_cents>=0),payload TEXT NOT NULL);
 CREATE INDEX IF NOT EXISTS orders_date ON orders(completed_at,status);`);
  db.prepare("INSERT OR IGNORE INTO meta VALUES ('schema','1')").run();
  db.prepare("INSERT OR IGNORE INTO meta VALUES ('sequence','0')").run();
  db.prepare("INSERT OR IGNORE INTO settings VALUES(1,?)").run(
    JSON.stringify(settingsSchema.parse({})),
  );
  if (!db.prepare("SELECT id FROM templates LIMIT 1").get()) {
    const t: Omit<Template, "id"> = {
      name: "Struk Default",
      width: 80,
      isDefault: true,
      elements: [
        "logo",
        "store_name",
        "address",
        "phone",
        "separator",
        "invoice_number",
        "date",
        "time",
        "customer_name",
        "separator",
        "items",
        "separator",
        "subtotal",
        "discount",
        "tax",
        "fee",
        "grand_total",
        "paid",
        "change",
        "payment_method",
        "separator",
        "thank_you",
      ].map((type) => defaultElement(type as any)),
    };
    db.prepare(
      "INSERT INTO templates(name,is_default,payload) VALUES(?,1,?)",
    ).run(t.name, JSON.stringify(t));
  }
  return db;
}
export type DB = ReturnType<typeof openDatabase>;
export function readSettings(db: DB): Settings {
  return JSON.parse(
    (db.prepare("SELECT payload FROM settings WHERE id=1").get() as any)
      .payload,
  );
}
export function readTemplates(db: DB): Template[] {
  return (
    db
      .prepare("SELECT * FROM templates ORDER BY is_default DESC,id")
      .all() as any[]
  ).map((r) => ({
    ...JSON.parse(r.payload),
    id: r.id,
    isDefault: !!r.is_default,
  }));
}
export function readOrder(row: any) {
  return row
    ? { ...JSON.parse(row.payload), id: row.id, customerId: row.customer_id }
    : null;
}
