import { Router } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import db from "../db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = Router();

// BUG (intentional): Race condition — concurrent export requests all write to the SAME
// temp file path. If two users export at the same time, the file gets corrupted.
// The fix should use unique temp files per request or stream directly without a temp file.
const TEMP_EXPORT_PATH = path.join(__dirname, "..", "..", "data", "export-temp.csv");

router.get("/", async (req, res) => {
  try {
    const { status = "", region = "", category = "", startDate = "", endDate = "" } = req.query;

    let whereClause = "WHERE 1=1";
    const params = [];

    if (status) {
      whereClause += " AND s.status = ?";
      params.push(status);
    }
    if (region) {
      whereClause += " AND r.name = ?";
      params.push(region);
    }
    if (category) {
      whereClause += " AND c.name = ?";
      params.push(category);
    }
    if (startDate) {
      whereClause += " AND s.sale_date >= ?";
      params.push(startDate);
    }
    if (endDate) {
      whereClause += " AND s.sale_date <= ?";
      params.push(endDate);
    }

    const query = `
      SELECT
        s.id,
        p.name as product_name,
        p.sku,
        c.name as category,
        r.name as region,
        s.quantity,
        s.unit_price,
        s.total_amount,
        s.status,
        s.sale_date
      FROM sales s
      JOIN products p ON s.product_id = p.id
      JOIN categories c ON p.category_id = c.id
      JOIN regions r ON s.region_id = r.id
      ${whereClause}
      ORDER BY s.sale_date DESC
    `;

    const rows = db.prepare(query).all(...params);

    // BUG: Write to a shared temp file — race condition with concurrent requests
    const headers = "ID,Product,SKU,Category,Region,Quantity,Unit Price,Total,Status,Date\n";
    fs.writeFileSync(TEMP_EXPORT_PATH, headers);

    // Simulate slow write for large exports (makes the race condition more likely)
    for (const row of rows) {
      const line = [
        row.id,
        `"${row.product_name}"`,
        row.sku,
        `"${row.category}"`,
        `"${row.region}"`,
        row.quantity,
        row.unit_price,
        row.total_amount,
        row.status,
        row.sale_date,
      ].join(",");

      fs.appendFileSync(TEMP_EXPORT_PATH, line + "\n");
    }

    // Send the temp file
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=sales-export.csv");
    res.setHeader("X-Total-Rows", rows.length.toString());

    const fileContent = fs.readFileSync(TEMP_EXPORT_PATH, "utf-8");
    res.send(fileContent);

    // Clean up (but another request might be writing to the same file right now!)
    try {
      fs.unlinkSync(TEMP_EXPORT_PATH);
    } catch {
      // ignore cleanup errors
    }
  } catch (error) {
    console.error("Error exporting sales:", error);
    res.status(500).json({ error: "Failed to export sales data" });
  }
});

export default router;
