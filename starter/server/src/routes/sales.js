import { Router } from "express";
import db from "../db.js";

const router = Router();

// GET /api/sales — List sales with filtering, sorting, and pagination
// BUG (intentional): N+1 query — fetches category name in a loop instead of using a JOIN
// BUG (intentional): SQL injection via sort column — column name is interpolated directly
router.get("/", (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = "",
      status = "",
      region = "",
      category = "",
      startDate = "",
      endDate = "",
      sortBy = "sale_date",
      sortOrder = "desc",
    } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const offset = (pageNum - 1) * limitNum;

    let whereClause = "WHERE 1=1";
    const params = [];

    if (search) {
      whereClause += " AND (p.name LIKE ? OR p.sku LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }

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

    // BUG (intentional): SQL injection — sortBy is interpolated directly into the query
    // A candidate should add a whitelist of allowed column names
    const order = sortOrder === "asc" ? "ASC" : "DESC";

    // BUG (intentional): N+1 query pattern
    // First, get sales WITHOUT the category name via a join
    const countQuery = `
      SELECT COUNT(*) as total
      FROM sales s
      JOIN products p ON s.product_id = p.id
      JOIN regions r ON s.region_id = r.id
      JOIN categories c ON p.category_id = c.id
      ${whereClause}
    `;

    const { total } = db.prepare(countQuery).get(...params);

    // N+1: We deliberately don't JOIN categories here, then loop below to fetch each one
    const dataQuery = `
      SELECT
        s.id,
        s.quantity,
        s.unit_price,
        s.total_amount,
        s.status,
        s.sale_date,
        s.created_at,
        p.id as product_id,
        p.name as product_name,
        p.sku,
        p.category_id,
        r.id as region_id,
        r.name as region_name
      FROM sales s
      JOIN products p ON s.product_id = p.id
      JOIN regions r ON s.region_id = r.id
      JOIN categories c ON p.category_id = c.id
      ${whereClause}
      ORDER BY ${sortBy} ${order}
      LIMIT ? OFFSET ?
    `;

    const rows = db.prepare(dataQuery).all(...params, limitNum, offset);

    // BUG (intentional): N+1 — fetch category name for each row individually
    const getCategoryName = db.prepare("SELECT name FROM categories WHERE id = ?");
    const salesWithCategory = rows.map((row) => {
      const category = getCategoryName.get(row.category_id);
      return {
        ...row,
        category_name: category ? category.name : "Unknown",
      };
    });

    res.json({
      data: salesWithCategory,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("Error fetching sales:", error);
    res.status(500).json({ error: "Failed to fetch sales data" });
  }
});

// GET /api/sales/summary — Aggregated summary data for dashboard cards and chart
// BUG (intentional): Timezone issue — groups by date using SQLite's date() which treats
// the stored ISO strings as-is, causing incorrect date groupings for records stored
// with timezone offsets (e.g., a sale at 2024-03-15T23:00:00-05:00 is actually
// 2024-03-16 in UTC but gets grouped under 2024-03-15)
router.get("/summary", (req, res) => {
  try {
    const { startDate = "", endDate = "", status = "", region = "", category = "" } = req.query;

    let whereClause = "WHERE 1=1";
    const params = [];

    if (startDate) {
      whereClause += " AND s.sale_date >= ?";
      params.push(startDate);
    }
    if (endDate) {
      whereClause += " AND s.sale_date <= ?";
      params.push(endDate);
    }
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

    // Summary cards
    const summaryQuery = `
      SELECT
        COUNT(*) as total_sales,
        SUM(s.total_amount) as total_revenue,
        AVG(s.total_amount) as avg_order_value,
        SUM(CASE WHEN s.status = 'refunded' THEN s.total_amount ELSE 0 END) as total_refunds
      FROM sales s
      JOIN products p ON s.product_id = p.id
      JOIN regions r ON s.region_id = r.id
      JOIN categories c ON p.category_id = c.id
      ${whereClause}
    `;

    const summary = db.prepare(summaryQuery).get(...params);

    // BUG (intentional): Timezone grouping — date() in SQLite just strips the time portion
    // of the ISO string, which is WRONG for offset dates. A sale at "2024-03-15T23:00:00-05:00"
    // is actually March 16 UTC, but date() returns "2024-03-15".
    const chartQuery = `
      SELECT
        date(s.sale_date) as date,
        SUM(s.total_amount) as revenue,
        COUNT(*) as count
      FROM sales s
      JOIN products p ON s.product_id = p.id
      JOIN regions r ON s.region_id = r.id
      JOIN categories c ON p.category_id = c.id
      ${whereClause}
      GROUP BY date(s.sale_date)
      ORDER BY date(s.sale_date) ASC
    `;

    const chartData = db.prepare(chartQuery).all(...params);

    // Top products
    const topProductsQuery = `
      SELECT
        p.name,
        SUM(s.total_amount) as revenue,
        SUM(s.quantity) as units_sold
      FROM sales s
      JOIN products p ON s.product_id = p.id
      JOIN regions r ON s.region_id = r.id
      JOIN categories c ON p.category_id = c.id
      ${whereClause}
      GROUP BY p.id
      ORDER BY revenue DESC
      LIMIT 5
    `;

    const topProducts = db.prepare(topProductsQuery).all(...params);

    // Status breakdown
    const statusQuery = `
      SELECT
        s.status,
        COUNT(*) as count,
        SUM(s.total_amount) as amount
      FROM sales s
      JOIN products p ON s.product_id = p.id
      JOIN regions r ON s.region_id = r.id
      JOIN categories c ON p.category_id = c.id
      ${whereClause}
      GROUP BY s.status
    `;

    const statusBreakdown = db.prepare(statusQuery).all(...params);

    res.json({
      summary: {
        totalSales: summary.total_sales,
        totalRevenue: summary.total_revenue || 0,
        avgOrderValue: summary.avg_order_value || 0,
        totalRefunds: summary.total_refunds || 0,
      },
      chartData,
      topProducts,
      statusBreakdown,
    });
  } catch (error) {
    console.error("Error fetching summary:", error);
    res.status(500).json({ error: "Failed to fetch summary data" });
  }
});

// GET /api/sales/filters — Available filter options
router.get("/filters", (req, res) => {
  try {
    const regions = db.prepare("SELECT DISTINCT name FROM regions ORDER BY name").all();
    const categories = db.prepare("SELECT DISTINCT name FROM categories ORDER BY name").all();
    const statuses = db
      .prepare("SELECT DISTINCT status FROM sales ORDER BY status")
      .all();

    res.json({
      regions: regions.map((r) => r.name),
      categories: categories.map((c) => c.name),
      statuses: statuses.map((s) => s.status),
    });
  } catch (error) {
    console.error("Error fetching filters:", error);
    res.status(500).json({ error: "Failed to fetch filter options" });
  }
});

export default router;
