import db from "./db.js";

const CATEGORIES = [
  "Electronics",
  "Clothing",
  "Home & Garden",
  "Sports & Outdoors",
  "Books & Media",
  "Health & Beauty",
  "Automotive",
  "Food & Beverage",
];

const PRODUCTS = [
  { name: "Wireless Headphones", category: "Electronics", sku: "ELEC-001", price: 79.99 },
  { name: "USB-C Hub", category: "Electronics", sku: "ELEC-002", price: 45.99 },
  { name: "Mechanical Keyboard", category: "Electronics", sku: "ELEC-003", price: 129.99 },
  { name: "Monitor Stand", category: "Electronics", sku: "ELEC-004", price: 34.99 },
  { name: "Webcam HD", category: "Electronics", sku: "ELEC-005", price: 59.99 },
  { name: "Cotton T-Shirt", category: "Clothing", sku: "CLTH-001", price: 24.99 },
  { name: "Denim Jeans", category: "Clothing", sku: "CLTH-002", price: 49.99 },
  { name: "Running Shoes", category: "Clothing", sku: "CLTH-003", price: 89.99 },
  { name: "Winter Jacket", category: "Clothing", sku: "CLTH-004", price: 149.99 },
  { name: "Garden Hose", category: "Home & Garden", sku: "HOME-001", price: 29.99 },
  { name: "LED Desk Lamp", category: "Home & Garden", sku: "HOME-002", price: 39.99 },
  { name: "Throw Pillows Set", category: "Home & Garden", sku: "HOME-003", price: 34.99 },
  { name: "Yoga Mat", category: "Sports & Outdoors", sku: "SPRT-001", price: 25.99 },
  { name: "Camping Tent", category: "Sports & Outdoors", sku: "SPRT-002", price: 199.99 },
  { name: "Basketball", category: "Sports & Outdoors", sku: "SPRT-003", price: 29.99 },
  { name: "Programming Book", category: "Books & Media", sku: "BOOK-001", price: 44.99 },
  { name: "Vinyl Record", category: "Books & Media", sku: "BOOK-002", price: 24.99 },
  { name: "Face Moisturizer", category: "Health & Beauty", sku: "HLTH-001", price: 18.99 },
  { name: "Vitamin Pack", category: "Health & Beauty", sku: "HLTH-002", price: 32.99 },
  { name: "Car Phone Mount", category: "Automotive", sku: "AUTO-001", price: 19.99 },
  { name: "Dash Cam", category: "Automotive", sku: "AUTO-002", price: 79.99 },
  { name: "Organic Coffee Beans", category: "Food & Beverage", sku: "FOOD-001", price: 14.99 },
  { name: "Protein Bars Box", category: "Food & Beverage", sku: "FOOD-002", price: 29.99 },
  { name: "Green Tea Set", category: "Food & Beverage", sku: "FOOD-003", price: 22.99 },
];

const REGIONS = [
  { name: "North America - East", timezone: "America/New_York" },
  { name: "North America - West", timezone: "America/Los_Angeles" },
  { name: "North America - Central", timezone: "America/Chicago" },
  { name: "Europe - West", timezone: "Europe/London" },
  { name: "Europe - Central", timezone: "Europe/Berlin" },
  { name: "Asia - Pacific", timezone: "Asia/Tokyo" },
  { name: "Asia - South", timezone: "Asia/Kolkata" },
  { name: "Australia", timezone: "Australia/Sydney" },
];

const STATUSES = ["completed", "completed", "completed", "completed", "pending", "refunded", "cancelled"];

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(start, end) {
  const startTime = start.getTime();
  const endTime = end.getTime();
  const randomTime = startTime + Math.random() * (endTime - startTime);
  const d = new Date(randomTime);
  // BUG (intentional): Store dates in ISO format but with the region's timezone offset
  // mixed into the string. Some dates use UTC (Z), others use offset notation.
  // This creates the timezone aggregation bug — grouping by date(sale_date) in SQLite
  // will produce incorrect groupings for dates near midnight.
  const useOffset = Math.random() > 0.5;
  if (useOffset) {
    const offsets = ["-05:00", "-08:00", "+01:00", "+09:00", "+05:30", "+11:00", "+00:00"];
    const offset = offsets[Math.floor(Math.random() * offsets.length)];
    return d.toISOString().replace("Z", offset);
  }
  return d.toISOString();
}

function seed() {
  console.log("Seeding database...");

  // Clear existing data
  db.exec("DELETE FROM sales");
  db.exec("DELETE FROM products");
  db.exec("DELETE FROM categories");
  db.exec("DELETE FROM regions");

  // Insert categories
  const insertCategory = db.prepare("INSERT INTO categories (name) VALUES (?)");
  const categoryMap = {};
  for (const cat of CATEGORIES) {
    const result = insertCategory.run(cat);
    categoryMap[cat] = result.lastInsertRowid;
  }

  // Insert products
  const insertProduct = db.prepare(
    "INSERT INTO products (name, category_id, sku, unit_price) VALUES (?, ?, ?, ?)"
  );
  const productIds = [];
  for (const prod of PRODUCTS) {
    const result = insertProduct.run(prod.name, categoryMap[prod.category], prod.sku, prod.price);
    productIds.push({ id: result.lastInsertRowid, price: prod.price });
  }

  // Insert regions
  const insertRegion = db.prepare("INSERT INTO regions (name, timezone) VALUES (?, ?)");
  const regionIds = [];
  for (const region of REGIONS) {
    const result = insertRegion.run(region.name, region.timezone);
    regionIds.push(result.lastInsertRowid);
  }

  // Insert sales records
  const insertSale = db.prepare(`
    INSERT INTO sales (product_id, region_id, quantity, unit_price, total_amount, status, sale_date)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const startDate = new Date("2024-01-01");
  const endDate = new Date("2025-06-30");
  const RECORD_COUNT = 5000;

  const insertMany = db.transaction(() => {
    for (let i = 0; i < RECORD_COUNT; i++) {
      const product = productIds[Math.floor(Math.random() * productIds.length)];
      const regionId = regionIds[Math.floor(Math.random() * regionIds.length)];
      const quantity = randomBetween(1, 20);
      const unitPrice = product.price;
      const totalAmount = Math.round(quantity * unitPrice * 100) / 100;
      const status = STATUSES[Math.floor(Math.random() * STATUSES.length)];
      const saleDate = randomDate(startDate, endDate);

      insertSale.run(product.id, regionId, quantity, unitPrice, totalAmount, status, saleDate);
    }
  });

  insertMany();

  const count = db.prepare("SELECT COUNT(*) as count FROM sales").get();
  console.log(`Seeded ${count.count} sales records.`);
  console.log("Done!");

  db.close();
}

seed();
