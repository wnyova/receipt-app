import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";
import multer from "multer";
import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { z, ZodError } from "zod";
import {
  productSchema,
  customerSchema,
  orderSchema,
  templateSchema,
  settingsSchema,
  calculate,
  storedOrderSchema,
  toCents,
  localDate,
  payments,
  type Order,
  type Template,
} from "../shared/model.js";
import {
  openDatabase,
  readSettings,
  readTemplates,
  readOrder,
} from "./database.js";
class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
const fail = (status: number, message: string): never => {
  throw new HttpError(status, message);
};
export function createApp(root = process.cwd()) {
  const db = openDatabase(root);
  const app = express();
  let restoring = false;
  app.use((req, res, next) => {
    if (restoring && !["GET", "HEAD"].includes(req.method))
      return res
        .status(503)
        .json({
          error: "Restore sedang berlangsung. Coba kembali setelah selesai.",
        });
    next();
  });
  app.disable("x-powered-by");
  // Localhost-only deployment: also reject cross-site writes and DNS rebinding.
  app.use((req, res, next) => {
    const host = (req.headers.host || "").split(":")[0];
    if (!["localhost", "127.0.0.1", "["].includes(host))
      return res.status(403).json({ error: "Akses hanya dari localhost." });
    const origin = req.headers.origin;
    if (origin) {
      try {
        const u = new URL(origin);
        if (!["localhost", "127.0.0.1", "[::1]"].includes(u.hostname))
          return res.status(403).json({ error: "Origin ditolak." });
      } catch {
        return res.status(403).json({ error: "Origin tidak valid." });
      }
    }
    if (req.headers["sec-fetch-site"] === "cross-site")
      return res
        .status(403)
        .json({ error: "Permintaan lintas situs ditolak." });
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader("X-Frame-Options", "DENY");
    next();
  });
  app.use(express.json({ limit: "1mb" }));
  fs.mkdirSync(path.join(root, "uploads", "logos"), { recursive: true });
  fs.mkdirSync(path.join(root, "uploads", "products"), { recursive: true });
  app.use(
    "/uploads",
    express.static(path.join(root, "uploads"), { dotfiles: "deny" }),
  );
  const id = (req: Request) =>
    z.coerce.number().int().positive().parse(req.params.id);
  const order = (n: number): Order =>
    readOrder(db.prepare("SELECT * FROM orders WHERE id=?").get(n)) ||
    fail(404, "Pesanan tidak ditemukan.");
  const saveOrder = (o: Order) =>
    db
      .prepare(
        "UPDATE orders SET customer_id=?,status=?,completed_at=?,total_cents=?,payload=? WHERE id=?",
      )
      .run(
        o.customerId,
        o.status,
        o.completedAt,
        toCents(o.grandTotal),
        JSON.stringify(o),
        o.id,
      );
  app.get("/api/health", (_req, res) => res.json({ ok: true }));
  app.get("/api/products", (req, res) => {
    const q = String(req.query.q || "");
    res.json(
      (
        db
          .prepare(
            "SELECT * FROM products WHERE name LIKE ? OR code LIKE ? ORDER BY name",
          )
          .all("%" + q + "%", "%" + q + "%") as any[]
      ).map((p) => ({ ...p, active: !!p.active })),
    );
  });
  app.post("/api/products", (req, res) => {
    const p = productSchema.parse(req.body);
    const r = db
      .prepare(
        "INSERT INTO products(code,name,category,price,unit,description,image,active) VALUES(?,?,?,?,?,?,?,?)",
      )
      .run(
        p.code,
        p.name,
        p.category,
        p.price,
        p.unit,
        p.description,
        p.image,
        Number(p.active),
      );
    res.status(201).json({ ...p, id: Number(r.lastInsertRowid) });
  });
  app.put("/api/products/:id", (req, res) => {
    const p = productSchema.parse(req.body);
    const n = id(req);
    if (
      !db
        .prepare(
          "UPDATE products SET code=?,name=?,category=?,price=?,unit=?,description=?,image=?,active=? WHERE id=?",
        )
        .run(
          p.code,
          p.name,
          p.category,
          p.price,
          p.unit,
          p.description,
          p.image,
          Number(p.active),
          n,
        ).changes
    )
      fail(404, "Produk tidak ditemukan.");
    res.json({ ...p, id: n });
  });
  app.get("/api/customers", (req, res) => {
    const q = "%" + String(req.query.q || "") + "%";
    res.json(
      db
        .prepare(
          "SELECT * FROM customers WHERE name LIKE ? OR phone LIKE ? ORDER BY name",
        )
        .all(q, q),
    );
  });
  app.post("/api/customers", (req, res) => {
    const c = customerSchema.parse(req.body);
    const r = db
      .prepare(
        "INSERT INTO customers(name,phone,address,notes) VALUES(?,?,?,?)",
      )
      .run(c.name, c.phone, c.address, c.notes);
    res.status(201).json({ ...c, id: Number(r.lastInsertRowid) });
  });
  app.put("/api/customers/:id", (req, res) => {
    const c = customerSchema.parse(req.body);
    const n = id(req);
    if (
      !db
        .prepare(
          "UPDATE customers SET name=?,phone=?,address=?,notes=? WHERE id=?",
        )
        .run(c.name, c.phone, c.address, c.notes, n).changes
    )
      fail(404, "Pelanggan tidak ditemukan.");
    res.json({ ...c, id: n });
  });
  app.delete("/api/customers/:id", (req, res) => {
    if (!db.prepare("DELETE FROM customers WHERE id=?").run(id(req)).changes)
      fail(404, "Pelanggan tidak ditemukan.");
    res.json({ ok: true });
  });
  app.get("/api/customers/:id/orders", (req, res) =>
    res.json(
      db
        .prepare("SELECT * FROM orders WHERE customer_id=? ORDER BY id DESC")
        .all(id(req))
        .map(readOrder),
    ),
  );
  const listOrders = (req: Request, res: Response) => {
    const q = "%" + String(req.query.q || "") + "%";
    let rows = db
      .prepare(
        "SELECT * FROM orders WHERE (invoice LIKE ? OR payload LIKE ?) ORDER BY id DESC",
      )
      .all(q, q)
      .map(readOrder) as Order[];
    if (req.path === "/api/sales") rows = rows.filter((o) => o.completedAt);
    if (req.query.status)
      rows = rows.filter((o) => o.status === req.query.status);
    if (req.query.method)
      rows = rows.filter((o) => o.paymentMethod === req.query.method);
    if (req.query.from)
      rows = rows.filter(
        (o) =>
          localDate(new Date(o.completedAt || o.createdAt)) >=
          String(req.query.from),
      );
    if (req.query.to)
      rows = rows.filter(
        (o) =>
          localDate(new Date(o.completedAt || o.createdAt)) <=
          String(req.query.to),
      );
    res.json(rows);
  };
  app.get("/api/orders", listOrders);
  app.get("/api/sales", listOrders);
  app.get("/api/orders/:id", (req, res) => res.json(order(id(req))));
  function inputOrder(body: unknown, old?: Order): Order {
    const data = orderSchema.parse(body);
    if (["Selesai", "Dibatalkan"].includes(data.status))
      fail(400, "Gunakan aksi pembayaran atau pembatalan.");
    const settings = old?.store || readSettings(db);
    const customer = data.customerId
      ? (db
          .prepare("SELECT * FROM customers WHERE id=?")
          .get(data.customerId) as any)
      : null;
    if (data.customerId && !customer) fail(400, "Pelanggan tidak ditemukan.");
    for (const item of data.items) {
      if (item.productId) {
        const p = db
          .prepare("SELECT active FROM products WHERE id=?")
          .get(item.productId) as any;
        if (!p || !p.active)
          fail(400, "Produk tidak aktif atau tidak ditemukan.");
      }
    }
    return {
      ...data,
      ...calculate(data, Number(settings.rounding)),
      id: old?.id || 0,
      invoice: old?.invoice || "",
      createdAt: old?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      completedAt: null,
      customerName: customer?.name || "Pelanggan umum",
      customerSnapshot: customer,
      store: settings,
      receiptTemplate: null,
      change: 0,
    };
  }
  app.post("/api/orders", (req, res) => {
    const result = db.transaction(() => {
      const o = inputOrder(req.body);
      const seq =
        Number(
          (
            db
              .prepare("SELECT value FROM meta WHERE key='sequence'")
              .get() as any
          ).value,
        ) + 1;
      db.prepare("UPDATE meta SET value=? WHERE key='sequence'").run(
        String(seq),
      );
      const d = new Date();
      o.invoice = o.store.invoiceFormat
        .replace("{prefix}", o.store.prefix)
        .replace("{YYYY}", String(d.getFullYear()))
        .replace("{MM}", String(d.getMonth() + 1).padStart(2, "0"))
        .replace("{DD}", String(d.getDate()).padStart(2, "0"))
        .replace("{seq}", String(seq).padStart(5, "0"));
      const r = db
        .prepare(
          "INSERT INTO orders(invoice,customer_id,status,created_at,completed_at,total_cents,payload) VALUES(?,?,?,?,NULL,?,?)",
        )
        .run(
          o.invoice,
          o.customerId,
          o.status,
          o.createdAt,
          toCents(o.grandTotal),
          JSON.stringify(o),
        );
      o.id = Number(r.lastInsertRowid);
      return o;
    })();
    res.status(201).json(result);
  });
  app.put("/api/orders/:id", (req, res) => {
    const old = order(id(req));
    if (["Selesai", "Dibatalkan"].includes(old.status))
      fail(409, "Pesanan ini tidak dapat diubah.");
    const o = inputOrder(req.body, old);
    saveOrder(o);
    res.json(o);
  });
  app.post("/api/orders/:id/complete", (req, res) => {
    const payload = z
      .object({
        paid: z.number().finite().min(0).max(1e12),
        paymentMethod: z.enum(payments),
      })
      .parse(req.body);
    const result = db.transaction(() => {
      const o = order(id(req));
      if (["Selesai", "Dibatalkan"].includes(o.status))
        fail(409, "Pesanan sudah selesai atau dibatalkan.");
      if (toCents(payload.paid) < toCents(o.grandTotal))
        fail(400, "Jumlah pembayaran kurang.");
      o.paid = toCents(payload.paid) / 100;
      o.paymentMethod = payload.paymentMethod;
      o.change = (toCents(o.paid) - toCents(o.grandTotal)) / 100;
      o.status = "Selesai";
      o.completedAt = new Date().toISOString();
      o.updatedAt = o.completedAt;
      o.receiptTemplate = readTemplates(db).find((t) => t.isDefault)!;
      saveOrder(o);
      return o;
    })();
    res.json(result);
  });
  app.post("/api/orders/:id/cancel", (req, res) => {
    if (req.body.confirmed !== true)
      fail(400, "Konfirmasi pembatalan diperlukan.");
    const o = order(id(req));
    if (o.status === "Dibatalkan") fail(409, "Pesanan sudah dibatalkan.");
    o.status = "Dibatalkan";
    o.updatedAt = new Date().toISOString();
    saveOrder(o);
    res.json(o);
  });
  app.get("/api/settings", (_req, res) => res.json(readSettings(db)));
  app.put("/api/settings", (req, res) => {
    const s = settingsSchema.parse(req.body);
    db.prepare("UPDATE settings SET payload=? WHERE id=1").run(
      JSON.stringify(s),
    );
    res.json(s);
  });
  app.get("/api/receipt-templates", (_req, res) => res.json(readTemplates(db)));
  app.post("/api/receipt-templates", (req, res) => {
    const t = templateSchema.parse(req.body);
    const n = db.transaction(() => {
      if (t.isDefault) db.prepare("UPDATE templates SET is_default=0").run();
      return Number(
        db
          .prepare(
            "INSERT INTO templates(name,is_default,payload) VALUES(?,?,?)",
          )
          .run(t.name, Number(t.isDefault), JSON.stringify(t)).lastInsertRowid,
      );
    })();
    res.status(201).json({ ...t, id: n });
  });
  app.put("/api/receipt-templates/:id", (req, res) => {
    const n = id(req);
    const old =
      readTemplates(db).find((t) => t.id === n) ||
      fail(404, "Template tidak ditemukan.");
    const t = templateSchema.parse(req.body);
    if (old.isDefault && !t.isDefault)
      fail(409, "Pilih template lain sebagai default terlebih dahulu.");
    db.transaction(() => {
      if (t.isDefault) db.prepare("UPDATE templates SET is_default=0").run();
      db.prepare(
        "UPDATE templates SET name=?,is_default=?,payload=? WHERE id=?",
      ).run(t.name, Number(t.isDefault), JSON.stringify(t), n);
    })();
    res.json({ ...t, id: n });
  });
  app.delete("/api/receipt-templates/:id", (req, res) => {
    const n = id(req);
    const t =
      readTemplates(db).find((t) => t.id === n) ||
      fail(404, "Template tidak ditemukan.");
    if (t.isDefault) fail(409, "Template default tidak dapat dihapus.");
    db.prepare("DELETE FROM templates WHERE id=?").run(n);
    res.json({ ok: true });
  });
  app.get("/api/dashboard", (req, res) => {
    const all = db
      .prepare("SELECT * FROM orders ORDER BY id DESC")
      .all()
      .map(readOrder) as Order[];
    const currency = z
      .enum(["IDR", "USD", "SGD", "MYR", "EUR"])
      .parse(req.query.currency || readSettings(db).currency);
    const sold = all.filter(
      (o) => o.status === "Selesai" && o.store.currency === currency,
    );
    const today = localDate();
    const month = today.slice(0, 7);
    const start = String(req.query.from || month + "-01");
    const end = String(req.query.to || today);
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(start) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(end) ||
      start > end
    )
      fail(400, "Rentang tanggal tidak valid.");
    const date = (o: Order) => localDate(new Date(o.completedAt!));
    const sum = (a: Order[]) =>
      a.reduce((s, o) => s + toCents(o.grandTotal), 0) / 100;
    const filtered = sold.filter((o) => date(o) >= start && date(o) <= end);
    const series: Record<string, number> = {};
    const top: Record<
      string,
      { name: string; quantity: number; total: number }
    > = {};
    for (const o of filtered) {
      const key = date(o);
      series[key] = (toCents(series[key] || 0) + toCents(o.grandTotal)) / 100;
      for (const i of o.items) {
        const k = i.productId ? String(i.productId) : i.name;
        top[k] ||= { name: i.name, quantity: 0, total: 0 };
        top[k].quantity += i.quantity;
        top[k].total += i.price * i.quantity;
      }
    }
    res.json({
      currency,
      todaySales: sum(sold.filter((o) => date(o) === today)),
      todayCount: sold.filter((o) => date(o) === today).length,
      monthSales: sum(sold.filter((o) => date(o).startsWith(month))),
      pending: all.filter((o) => !["Selesai", "Dibatalkan"].includes(o.status))
        .length,
      average: filtered.length ? sum(filtered) / filtered.length : 0,
      periodSales: sum(filtered),
      periodCount: filtered.length,
      series: Object.entries(series)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, total]) => ({ date, total })),
      topProducts: Object.values(top)
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5),
      recent: all.slice(0, 6),
    });
  });
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  });
  app.post("/api/uploads", upload.single("file"), (req, res) => {
    const f = req.file;
    if (!f) fail(400, "Pilih gambar.");
    const ext = path.extname(f!.originalname).slice(1).toLowerCase();
    const allowed: Record<string, string> = {
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      webp: "image/webp",
    };
    const b = f!.buffer;
    const signature =
      ext === "png"
        ? b
            .subarray(0, 8)
            .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
        : ext === "jpg" || ext === "jpeg"
          ? b[0] === 255 && b[1] === 216 && b[2] === 255
          : ext === "webp"
            ? b.toString("ascii", 0, 4) === "RIFF" &&
              b.toString("ascii", 8, 12) === "WEBP"
            : false;
    if (!allowed[ext] || allowed[ext] !== f!.mimetype || !signature)
      fail(400, "Format gambar harus PNG, JPG, atau WEBP yang valid.");
    const folder = req.body.kind === "products" ? "products" : "logos";
    const file = randomUUID() + "." + ext;
    fs.writeFileSync(path.join(root, "uploads", folder, file), b);
    res.status(201).json({ url: `/uploads/${folder}/${file}` });
  });
  app.get("/api/backup", async (_req, res, next) => {
    const filename = path.join(
      root,
      "data",
      "backups",
      `backup-${Date.now()}-${randomUUID()}.db`,
    );
    try {
      await db.backup(filename);
      res.download(filename, `backup-${localDate()}.db`);
    } catch (e) {
      next(e);
    }
  });
  const restoreUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 100 * 1024 * 1024, files: 1 },
  });
  app.post(
    "/api/restore",
    restoreUpload.single("file"),
    async (req, res, next) => {
      let source: Database.Database | undefined;
      let candidate = "";
      try {
        if (req.body.confirmed !== "true")
          fail(400, "Konfirmasi restore diperlukan.");
        if (
          !req.file ||
          !req.file.originalname.endsWith(".db") ||
          req.file.buffer.toString("ascii", 0, 16) !== "SQLite format 3\0"
        )
          fail(400, "File backup SQLite tidak valid.");
        candidate = path.join(root, "data", `restore-${randomUUID()}.db`);
        fs.writeFileSync(candidate, req.file!.buffer);
        source = new Database(candidate, { readonly: true });
        source.pragma("trusted_schema = OFF");
        if (
          source.pragma("integrity_check", { simple: true }) !== "ok" ||
          (
            source
              .prepare("SELECT value FROM meta WHERE key='schema'")
              .get() as any
          )?.value !== "1"
        )
          fail(400, "Versi atau integritas backup tidak sesuai.");
        if ((source.pragma("foreign_key_check") as unknown[]).length)
          fail(400, "Relasi backup tidak valid.");
        const objects = source
          .prepare(
            "SELECT name,type FROM sqlite_master WHERE type IN ('table','trigger','view') AND name NOT LIKE 'sqlite_%'",
          )
          .all() as any[];
        const tables = [
          "meta",
          "products",
          "customers",
          "settings",
          "templates",
          "orders",
        ];
        if (
          objects.length !== tables.length ||
          objects.some((o) => o.type !== "table" || !tables.includes(o.name))
        )
          fail(400, "Struktur backup tidak sesuai.");
        const rows: Record<string, any[]> = {};
        for (const table of tables)
          rows[table] = source.prepare(`SELECT * FROM ${table}`).all();
        for (const p of rows.products)
          productSchema.parse({ ...p, active: !!p.active });
        for (const c of rows.customers) customerSchema.parse(c);
        if (rows.settings.length !== 1 || rows.settings[0].id !== 1)
          fail(400, "Pengaturan backup tidak valid.");
        settingsSchema.parse(JSON.parse(rows.settings[0].payload));
        if (rows.templates.filter((t) => t.is_default === 1).length !== 1)
          fail(400, "Template default backup tidak valid.");
        for (const t of rows.templates)
          templateSchema.parse({
            ...JSON.parse(t.payload),
            isDefault: !!t.is_default,
          });
        const seq = rows.meta.find((m) => m.key === "sequence");
        if (!seq || !/^\d+$/.test(seq.value))
          fail(400, "Urutan invoice tidak valid.");
        for (const row of rows.orders) {
          const o = storedOrderSchema.parse(JSON.parse(row.payload));
          const calculated = calculate(o, Number(o.store.rounding));
          for (const key of [
            "subtotal",
            "discountAmount",
            "taxAmount",
            "grandTotal",
            "roundingAmount",
          ] as const) {
            if (toCents(o[key]) !== toCents(calculated[key]))
              fail(400, "Perhitungan backup tidak sesuai.");
          }
          const invoiceSequence = Number(o.invoice.match(/(\d+)$/)?.[1]);
          if (
            !Number.isSafeInteger(Number(seq.value)) ||
            !invoiceSequence ||
            invoiceSequence > Number(seq.value)
          )
            fail(400, "Urutan invoice backup tidak sesuai.");
          if (o.completedAt) {
            if (
              !["Selesai", "Dibatalkan"].includes(o.status) ||
              !o.receiptTemplate ||
              toCents(o.paid) < toCents(o.grandTotal) ||
              toCents(o.change) !== toCents(o.paid) - toCents(o.grandTotal)
            )
              fail(400, "Snapshot pembayaran tidak valid.");
          } else if (
            o.status === "Selesai" ||
            o.receiptTemplate ||
            o.change !== 0
          )
            fail(400, "Status pembayaran tidak valid.");
          if (
            !Number.isFinite(o.grandTotal) ||
            o.grandTotal < 0 ||
            toCents(o.grandTotal) !== row.total_cents ||
            o.invoice !== row.invoice ||
            o.status !== row.status ||
            o.createdAt !== row.created_at ||
            o.completedAt !== row.completed_at ||
            !Number.isFinite(Date.parse(o.createdAt))
          )
            fail(400, "Transaksi backup tidak valid.");
        }
        source.close();
        source = undefined;
        const automatic = path.join(
          root,
          "data",
          "backups",
          `before-restore-${Date.now()}-${randomUUID()}.db`,
        );
        restoring = true;
        await db.backup(automatic);
        const columns: Record<string, string[]> = {
          meta: ["key", "value"],
          products: [
            "id",
            "code",
            "name",
            "category",
            "price",
            "unit",
            "description",
            "image",
            "active",
          ],
          customers: ["id", "name", "phone", "address", "notes"],
          settings: ["id", "payload"],
          templates: ["id", "name", "is_default", "payload"],
          orders: [
            "id",
            "invoice",
            "customer_id",
            "status",
            "created_at",
            "completed_at",
            "total_cents",
            "payload",
          ],
        };
        db.transaction(() => {
          for (const table of [
            "orders",
            "templates",
            "settings",
            "customers",
            "products",
            "meta",
          ])
            db.prepare(`DELETE FROM ${table}`).run();
          for (const table of tables) {
            const cols = columns[table];
            const insert = db.prepare(
              `INSERT INTO ${table}(${cols.join(",")}) VALUES(${cols.map(() => "?").join(",")})`,
            );
            for (const row of rows[table])
              insert.run(...cols.map((c) => row[c]));
          }
        })();
        res.json({ ok: true, automaticBackup: path.basename(automatic) });
      } catch (e) {
        next(
          e instanceof HttpError
            ? e
            : new HttpError(
                400,
                "Backup tidak valid atau tidak kompatibel. Data lama tetap tersimpan.",
              ),
        );
      } finally {
        restoring = false;
        source?.close();
        if (candidate && fs.existsSync(candidate)) fs.unlinkSync(candidate);
      }
    },
  );
  app.use("/api", (_req, res) =>
    res.status(404).json({ error: "Endpoint tidak ditemukan." }),
  );
  const dist = path.join(root, "dist");
  if (fs.existsSync(dist)) {
    app.use(express.static(dist));
    app.get("/{*path}", (_req, res) =>
      res.sendFile(path.join(dist, "index.html")),
    );
  }
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof ZodError)
      return res.status(400).json({
        error: err.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join("; "),
      });
    if (err instanceof multer.MulterError)
      return res.status(400).json({
        error:
          "Upload gagal: ukuran file terlalu besar atau format permintaan tidak valid.",
      });
    if (err.code === "SQLITE_CONSTRAINT_UNIQUE")
      return res
        .status(409)
        .json({ error: "Kode produk atau nomor invoice sudah digunakan." });
    const status = err.status || 400;
    if (status >= 500) console.error(err);
    res.status(status).json({
      error:
        err instanceof HttpError || err instanceof Error
          ? err.message
          : "Permintaan gagal.",
    });
  });
  return { app, close: () => db.close() };
}
