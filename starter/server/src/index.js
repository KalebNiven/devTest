import express from "express";
import cors from "cors";
import salesRouter from "./routes/sales.js";
import exportRouter from "./routes/export.js";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use("/api/sales/export", exportRouter);
app.use("/api/sales", salesRouter);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
