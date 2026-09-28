import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import Database from "better-sqlite3";
import request from "supertest";
import { createApp } from "../server/app.js";
const makeOrder = {
  items: [
    { name: "Test", quantity: 1, price: 100000, unit: "pcs", productId: null },
  ],
};
test("dashboard separates currencies and does not relabel historical sales", async () => {
  const dir = mkdtempSync(path.join(tmpdir(), "currency-"));
  const instance = createApp(dir);
  const api = request(instance.app);
  try {
    const o = (await api.post("/api/orders").send(makeOrder)).body;
    await api
      .post(`/api/orders/${o.id}/complete`)
      .send({ paid: 100000, paymentMethod: "Cash" });
    const settings = (await api.get("/api/settings")).body;
    await api.put("/api/settings").send({ ...settings, currency: "USD" });
    const usd = (await api.get("/api/dashboard")).body;
    assert.equal(usd.todaySales, 0);
    assert.equal(usd.currency, "USD");
    assert.equal(
      (await api.get("/api/dashboard?currency=IDR")).body.todaySales,
      100000,
    );
  } finally {
    instance.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
for (const mutation of ["snapshot", "totals", "sequence"])
  test(`restore rejects corrupted ${mutation} before replacing data`, async () => {
    const dir = mkdtempSync(path.join(tmpdir(), "restore-"));
    const instance = createApp(dir);
    const api = request(instance.app);
    try {
      const o = (await api.post("/api/orders").send(makeOrder)).body;
      await api
        .post(`/api/orders/${o.id}/complete`)
        .send({ paid: 100000, paymentMethod: "Cash" });
      const source = new Database(path.join(dir, "data", "receipt.db"));
      const target = path.join(dir, "candidate.db");
      await source.backup(target);
      source.close();
      const candidate = new Database(target);
      const row = candidate
        .prepare("SELECT * FROM orders LIMIT 1")
        .get() as any;
      const payload = JSON.parse(row.payload);
      if (mutation === "snapshot") {
        payload.customerName = { invalid: true };
        delete payload.subtotal;
        payload.change = -999;
      }
      if (mutation === "totals") payload.taxAmount = 999;
      if (mutation === "sequence")
        candidate
          .prepare("UPDATE meta SET value='0' WHERE key='sequence'")
          .run();
      candidate
        .prepare("UPDATE orders SET payload=? WHERE id=?")
        .run(JSON.stringify(payload), row.id);
      candidate.close();
      const response = await api
        .post("/api/restore")
        .field("confirmed", "true")
        .attach("file", readFileSync(target), "backup.db");
      assert.equal(response.status, 400);
      assert.equal(
        (await api.get("/api/orders/" + o.id)).body.customerName,
        "Pelanggan umum",
      );
    } finally {
      instance.close();
      rmSync(dir, { recursive: true, force: true });
    }
  });
test("editing existing draft preserves its original currency", async () => {
  const dir = mkdtempSync(path.join(tmpdir(), "draft-"));
  const instance = createApp(dir);
  const api = request(instance.app);
  try {
    const o = (await api.post("/api/orders").send(makeOrder)).body;
    const settings = (await api.get("/api/settings")).body;
    await api.put("/api/settings").send({ ...settings, currency: "USD" });
    const result = await api
      .put("/api/orders/" + o.id)
      .send({ ...o, notes: "Edited" });
    assert.equal(result.body.store.currency, "IDR");
  } finally {
    instance.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
