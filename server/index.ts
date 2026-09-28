import { createApp } from "./app.js";
const { app, close } = createApp();
const port = Number(process.env.PORT || 3001);
const server = app.listen(port, "127.0.0.1", () =>
  console.log(`Receipt Manager: http://localhost:${port}`),
);
for (const signal of ["SIGINT", "SIGTERM"] as const)
  process.on(signal, () =>
    server.close(() => {
      close();
      process.exit(0);
    }),
  );
server.on("error", (error) => {
  console.error("Server gagal dijalankan:", error.message);
  close();
  process.exit(1);
});
