import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import request from "supertest";
import { createApp } from "../server/app.js";
const dir = mkdtempSync(path.join(tmpdir(), "receipt-test-"));
let instance: ReturnType<typeof createApp>;
test("SQLite business workflow", async (t) => {
  instance = createApp(dir);
  let api = request(instance.app);
  const product = {
    code: "P01",
    name: "Kopi",
    category: "Minuman",
    price: 20000,
    unit: "cup",
    description: "",
    image: "",
    active: true,
  };
  let pid = 0,
    oid = 0;
  await t.test("rejects malformed and negative prices", async () => {
    assert.equal(
      (await api.post("/api/products").send({ ...product, price: -1 })).status,
      400,
    );
  });
  await t.test("product persists across reopened database", async () => {
    const r = await api.post("/api/products").send(product);
    assert.equal(r.status, 201);
    pid = r.body.id;
    instance.close();
    instance = createApp(dir);
    api = request(instance.app);
    assert.equal((await api.get("/api/products")).body[0].name, "Kopi");
  });
  await t.test(
    "server computes discounted taxed totals, ignoring forged totals",
    async () => {
      const r = await api.post("/api/orders").send({
        items: [
          {
            productId: pid,
            name: "Kopi",
            quantity: 2,
            price: 20000,
            unit: "cup",
          },
        ],
        discountType: "percent",
        discount: 10,
        taxRate: 11,
        fee: 1000,
        status: "Draft",
        paymentMethod: "Cash",
        paid: 0,
        grandTotal: 1,
      });
      assert.equal(r.status, 201);
      assert.equal(r.body.grandTotal, 40960);
      oid = r.body.id;
    },
  );
  await t.test(
    "rejects underpayment and completes with a unique invoice",
    async () => {
      assert.equal(
        (
          await api
            .post(`/api/orders/${oid}/complete`)
            .send({ paid: 100, paymentMethod: "Cash" })
        ).status,
        400,
      );
      const r = await api
        .post(`/api/orders/${oid}/complete`)
        .send({ paid: 50000, paymentMethod: "Cash" });
      assert.equal(r.status, 200);
      assert.equal(r.body.change, 9040);
      assert.match(r.body.invoice, /INV/);
    },
  );
  await t.test(
    "completed invoice immutable and reprint retains product snapshot",
    async () => {
      assert.equal(
        (await api.put(`/api/orders/${oid}`).send({ items: [] })).status,
        409,
      );
      await api
        .put(`/api/products/${pid}`)
        .send({ ...product, name: "Renamed" });
      const r = await api.get(`/api/orders/${oid}`);
      assert.equal(r.body.items[0].name, "Kopi");
      assert.ok(r.body.receiptTemplate);
    },
  );
  await t.test("unique invoice sequence under parallel creation", async () => {
    const results = await Promise.all(
      Array.from({ length: 8 }, () =>
        api.post("/api/orders").send({
          items: [
            {
              productId: pid,
              name: "Kopi",
              quantity: 1,
              price: 20000,
              unit: "cup",
            },
          ],
        }),
      ),
    );
    assert.equal(new Set(results.map((r) => r.body.invoice)).size, 8);
  });
  await t.test(
    "only one template default and last default cannot be deleted",
    async () => {
      const original = (await api.get("/api/receipt-templates")).body[0];
      const r = await api
        .post("/api/receipt-templates")
        .send({ ...original, id: undefined, name: "Baru", isDefault: true });
      assert.equal(r.status, 201);
      const all = (await api.get("/api/receipt-templates")).body;
      assert.equal(all.filter((x: any) => x.isDefault).length, 1);
      assert.equal(
        (await api.delete(`/api/receipt-templates/${r.body.id}`)).status,
        409,
      );
    },
  );
  await t.test("dashboard reflects completed sales only", async () => {
    const r = await api.get("/api/dashboard");
    assert.equal(r.body.todaySales, 40960);
    assert.equal(r.body.todayCount, 1);
  });
  await t.test("invalid restore preserves existing data", async () => {
    const r = await api
      .post("/api/restore")
      .field("confirmed", "true")
      .attach("file", Buffer.from("bad"), "bad.db");
    assert.equal(r.status, 400);
    assert.equal((await api.get("/api/products")).body.length, 1);
  });
  await t.test(
    "valid backup restores records and creates automatic backup",
    async () => {
      const r = await api
        .get("/api/backup")
        .buffer(true)
        .parse((res, cb) => {
          const chunks: Buffer[] = [];
          res.on("data", (c) => chunks.push(c));
          res.on("end", () => cb(null, Buffer.concat(chunks)));
        });
      assert.equal(r.status, 200);
      await api.post("/api/products").send({ ...product, code: "P02" });
      const restored = await api
        .post("/api/restore")
        .field("confirmed", "true")
        .attach("file", r.body, "backup.db");
      assert.equal(restored.status, 200);
      assert.equal((await api.get("/api/products")).body.length, 1);
      assert.ok(
        readdirSync(path.join(dir, "data", "backups")).some((x) =>
          x.startsWith("before-restore"),
        ),
      );
    },
  );
  instance.close();
  rmSync(dir, { recursive: true, force: true });
});
