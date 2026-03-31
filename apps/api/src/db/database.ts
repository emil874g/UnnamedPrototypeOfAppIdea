import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Use a file-based SQLite database in development
const dbPath = join(__dirname, '../../data/cheapest-deals.db');

export const db: Database.Database = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

/**
 * Initialize the database schema
 *
 * PROTOTYPE NOTE: This schema is simplified for rapid prototyping.
 *
 * MIGRATION RISK: Moving from SQLite to PostgreSQL will require:
 * - Changing date/time handling (SQLite uses TEXT for dates)
 * - Updating connection logic and query syntax
 * - Handling transactions differently
 * - Adjusting for PostgreSQL's stricter type system
 * - Updating indexes and constraints
 */
export function initializeDatabase() {
  // Supermarkets table
  db.exec(`
    CREATE TABLE IF NOT EXISTS supermarkets (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      logo TEXT
    );
  `);

  // Products table
  // RISK: Product normalization is complex - this simple schema won't handle:
  // - Product variations (different sizes, brands)
  // - Product hierarchies (categories, subcategories)
  // - Multi-language support
  // - Product matching across supermarkets
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      category TEXT,
      brand TEXT,
      size TEXT,
      unit TEXT,
      normalized_name TEXT,
      image_url TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create index on normalized_name for faster searching
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_products_normalized_name
    ON products(normalized_name);
  `);

  // Weekly deals table
  // RISK: Deal types are much more complex in reality
  // - "Buy 2 get 1 free"
  // - "Save 20%"
  // - Bundle deals
  // - Membership-only prices
  // This simple structure won't handle all deal types
  db.exec(`
    CREATE TABLE IF NOT EXISTS weekly_deals (
      id TEXT PRIMARY KEY,
      supermarket_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      price REAL NOT NULL,
      original_price REAL,
      currency TEXT DEFAULT 'DKK',
      deal_type TEXT CHECK(deal_type IN ('fixed_price', 'percentage_discount', 'bulk_discount', 'bundle')),
      deal_description TEXT,
      valid_from TEXT NOT NULL,
      valid_to TEXT NOT NULL,
      week_number INTEGER NOT NULL,
      requires_membership INTEGER DEFAULT 0,
      max_quantity INTEGER,
      min_quantity INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (supermarket_id) REFERENCES supermarkets(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );
  `);

  // Create indexes for common queries
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_deals_supermarket
    ON weekly_deals(supermarket_id);
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_deals_product
    ON weekly_deals(product_id);
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_deals_week
    ON weekly_deals(week_number);
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_deals_dates
    ON weekly_deals(valid_from, valid_to);
  `);

  console.log('Database initialized successfully');
}

/**
 * Seed the database with sample data
 *
 * PROTOTYPE NOTE: This is mock data for testing.
 * Real data would come from web scraping or APIs from each supermarket.
 *
 * DATA SOURCING RISK: Major challenge is getting real-time data:
 * - Web scraping is fragile (website changes break scrapers)
 * - No standardized APIs from Danish supermarkets
 * - Legal/Terms of Service considerations
 * - Data refresh frequency and reliability
 */
export function seedDatabase() {
  // Clear existing data
  db.exec('DELETE FROM weekly_deals');
  db.exec('DELETE FROM products');
  db.exec('DELETE FROM supermarkets');

  // Seed supermarkets (major Danish chains)
  const supermarkets = [
    { id: 'netto', name: 'Netto' },
    { id: 'rema1000', name: 'Rema 1000' },
    { id: 'fotex', name: 'Føtex' },
    { id: 'bilka', name: 'Bilka' },
    { id: 'lidl', name: 'Lidl' }
  ];

  const insertSupermarket = db.prepare(
    'INSERT INTO supermarkets (id, name) VALUES (?, ?)'
  );

  for (const market of supermarkets) {
    insertSupermarket.run(market.id, market.name);
  }

  // Seed sample products
  const products = [
    { id: 'milk-1l-arla', name: 'Arla Minimælk 1L', brand: 'Arla', size: '1', unit: 'l', category: 'Dairy' },
    { id: 'bread-rye', name: 'Rugbrød', brand: 'Kohberg', size: '1', unit: 'stk', category: 'Bakery' },
    { id: 'coffee-500g', name: 'Kaffe Classic', brand: 'Merrild', size: '500', unit: 'g', category: 'Beverages' },
    { id: 'banana-kg', name: 'Bananer', size: '1', unit: 'kg', category: 'Fruits' },
    { id: 'chicken-breast-kg', name: 'Kyllingebryst', size: '1', unit: 'kg', category: 'Meat' }
  ];

  const insertProduct = db.prepare(
    'INSERT INTO products (id, name, brand, size, unit, category, normalized_name) VALUES (?, ?, ?, ?, ?, ?, ?)'
  );

  for (const product of products) {
    insertProduct.run(
      product.id,
      product.name,
      product.brand || null,
      product.size,
      product.unit,
      product.category,
      product.name.toLowerCase()
    );
  }

  // Seed sample weekly deals (week 14-2026, March 31 - April 6)
  const deals = [
    // Milk deals
    { id: 'deal-1', supermarket_id: 'netto', product_id: 'milk-1l-arla', price: 6.95, original_price: 8.95, week_number: 14, valid_from: '2026-03-31', valid_to: '2026-04-06' },
    { id: 'deal-2', supermarket_id: 'rema1000', product_id: 'milk-1l-arla', price: 7.50, original_price: 8.95, week_number: 14, valid_from: '2026-03-31', valid_to: '2026-04-06' },
    { id: 'deal-3', supermarket_id: 'fotex', product_id: 'milk-1l-arla', price: 7.95, original_price: 8.95, week_number: 14, valid_from: '2026-03-31', valid_to: '2026-04-06' },

    // Bread deals
    { id: 'deal-4', supermarket_id: 'netto', product_id: 'bread-rye', price: 12.00, week_number: 14, valid_from: '2026-03-31', valid_to: '2026-04-06' },
    { id: 'deal-5', supermarket_id: 'lidl', product_id: 'bread-rye', price: 10.00, week_number: 14, valid_from: '2026-03-31', valid_to: '2026-04-06' },

    // Coffee deals
    { id: 'deal-6', supermarket_id: 'bilka', product_id: 'coffee-500g', price: 29.95, original_price: 39.95, week_number: 14, valid_from: '2026-03-31', valid_to: '2026-04-06' },
    { id: 'deal-7', supermarket_id: 'rema1000', product_id: 'coffee-500g', price: 32.00, original_price: 39.95, week_number: 14, valid_from: '2026-03-31', valid_to: '2026-04-06' }
  ];

  const insertDeal = db.prepare(`
    INSERT INTO weekly_deals (id, supermarket_id, product_id, price, original_price, week_number, valid_from, valid_to, deal_type)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'fixed_price')
  `);

  for (const deal of deals) {
    insertDeal.run(
      deal.id,
      deal.supermarket_id,
      deal.product_id,
      deal.price,
      deal.original_price || null,
      deal.week_number,
      deal.valid_from,
      deal.valid_to
    );
  }

  console.log('Database seeded with sample data');
}
