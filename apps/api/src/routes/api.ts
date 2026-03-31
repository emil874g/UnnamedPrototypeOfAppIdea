import { Router } from 'express';
import { db } from '../db/database.js';
import type { ApiResponse, Product, WeeklyDeal, Supermarket, PriceComparison } from '@cheapest-deals/shared';

const router = Router();

/**
 * Get all supermarkets
 */
router.get('/supermarkets', (req, res) => {
  try {
    const supermarkets = db.prepare('SELECT * FROM supermarkets').all() as Supermarket[];

    const response: ApiResponse<Supermarket[]> = {
      success: true,
      data: supermarkets
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch supermarkets',
        code: 'DB_ERROR',
        details: error
      }
    });
  }
});

/**
 * Search products and their deals
 *
 * PROTOTYPE LIMITATION: This is a simple text search.
 * Production would need:
 * - Fuzzy matching
 * - Synonym handling
 * - Multi-language support
 * - Product normalization
 */
router.get('/search', (req, res) => {
  try {
    const query = req.query.q as string;
    const weekNumber = req.query.week ? parseInt(req.query.week as string) : undefined;

    if (!query) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Query parameter "q" is required',
          code: 'INVALID_QUERY'
        }
      });
      return;
    }

    // Search products
    const searchPattern = `%${query.toLowerCase()}%`;
    const products = db.prepare(`
      SELECT * FROM products
      WHERE LOWER(name) LIKE ? OR LOWER(normalized_name) LIKE ? OR LOWER(brand) LIKE ?
    `).all(searchPattern, searchPattern, searchPattern) as Product[];

    if (products.length === 0) {
      res.json({
        success: true,
        data: { products: [], deals: [], comparisons: [] }
      });
      return;
    }

    // Get deals for found products
    const productIds = products.map(p => p.id);
    const placeholders = productIds.map(() => '?').join(',');

    let dealsQuery = `
      SELECT d.*, s.name as supermarket_name
      FROM weekly_deals d
      JOIN supermarkets s ON d.supermarket_id = s.id
      WHERE d.product_id IN (${placeholders})
    `;

    const params: any[] = [...productIds];

    if (weekNumber) {
      dealsQuery += ' AND d.week_number = ?';
      params.push(weekNumber);
    } else {
      // Default to current week if not specified
      dealsQuery += ' AND d.week_number = ?';
      params.push(14); // Week 14 of 2026
    }

    dealsQuery += ' ORDER BY d.price ASC';

    const deals = db.prepare(dealsQuery).all(...params) as (WeeklyDeal & { supermarket_name: string })[];

    // Calculate price comparisons
    // RISK: This is simplified - real comparison needs to normalize by unit
    // e.g., 500g vs 1kg products need proper price-per-kg calculation
    const comparisons: PriceComparison[] = deals.map(deal => {
      const product = products.find(p => p.id === deal.productId);
      const unit = product?.unit || 'unit';
      const size = parseFloat(product?.size || '1');

      return {
        dealId: deal.id,
        supermarketId: deal.supermarketId,
        productId: deal.productId,
        price: deal.price,
        pricePerUnit: deal.price / size,
        normalizedUnit: unit,
        discountPercentage: deal.originalPrice
          ? Math.round(((deal.originalPrice - deal.price) / deal.originalPrice) * 100)
          : undefined
      };
    });

    res.json({
      success: true,
      data: {
        products,
        deals,
        comparisons
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        message: 'Search failed',
        code: 'SEARCH_ERROR',
        details: error
      }
    });
  }
});

/**
 * Get best deals for the current week
 */
router.get('/deals/best', (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const weekNumber = req.query.week ? parseInt(req.query.week as string) : 14;

    const deals = db.prepare(`
      SELECT
        d.*,
        p.name as product_name,
        p.brand,
        p.size,
        p.unit,
        s.name as supermarket_name,
        CASE
          WHEN d.original_price IS NOT NULL
          THEN ROUND((d.original_price - d.price) / d.original_price * 100)
          ELSE 0
        END as discount_percentage
      FROM weekly_deals d
      JOIN products p ON d.product_id = p.id
      JOIN supermarkets s ON d.supermarket_id = s.id
      WHERE d.week_number = ?
      ORDER BY discount_percentage DESC, d.price ASC
      LIMIT ?
    `).all(weekNumber, limit);

    res.json({
      success: true,
      data: deals
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch best deals',
        code: 'DB_ERROR',
        details: error
      }
    });
  }
});

export default router;
