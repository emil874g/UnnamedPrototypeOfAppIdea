/**
 * Core types for the Cheapest Weekly Deals application
 *
 * PROTOTYPE NOTE: These types are simplified for prototyping.
 * Real-world considerations include:
 * - Multi-language support (Danish product names, descriptions)
 * - Complex product hierarchies and categorization
 * - Product variations (size, brand, organic, etc.)
 * - Product matching/normalization challenges
 */

export interface Supermarket {
  id: string;
  name: string;
  logo?: string;
}

/**
 * Represents a product in the system.
 *
 * RISK: Product matching is extremely complex because:
 * - Same product may have different names across supermarkets
 * - Different sizes (500g vs 1kg) need normalization
 * - Brand variations and store brands
 * - Organic vs conventional versions
 * - Seasonal availability
 */
export interface Product {
  id: string;
  name: string;
  description?: string;
  category?: string;

  // Prototype simplification - in reality these would be complex objects
  brand?: string;
  size?: string;
  unit?: string; // 'g', 'kg', 'l', 'ml', 'stk' (pieces)

  // For product matching/normalization
  normalizedName?: string;
  imageUrl?: string;
}

/**
 * Represents a weekly deal/offer from a supermarket
 *
 * RISK: Deals have complex structures:
 * - "Buy 2 get 1 free" type deals
 * - Percentage discounts
 * - Fixed price offers
 * - Bundle deals
 * - Membership-only prices
 */
export interface WeeklyDeal {
  id: string;
  supermarketId: string;
  productId: string;

  // Price information
  price: number;
  originalPrice?: number;
  currency: string; // 'DKK' for Denmark

  // Deal details
  dealType: 'fixed_price' | 'percentage_discount' | 'bulk_discount' | 'bundle';
  dealDescription?: string; // e.g., "2 for 30 DKK"

  // Temporal information
  validFrom: string; // ISO date
  validTo: string; // ISO date
  weekNumber: number;

  // Constraints
  requiresMembership?: boolean;
  maxQuantity?: number;
  minQuantity?: number;
}

/**
 * Normalized price for comparison across supermarkets
 *
 * This is crucial for comparing products of different sizes
 * e.g., 500g for 20 DKK vs 1kg for 35 DKK
 */
export interface PriceComparison {
  dealId: string;
  supermarketId: string;
  productId: string;

  // Actual price
  price: number;

  // Normalized to standard units (per kg, per liter, per piece)
  pricePerUnit: number;
  normalizedUnit: string;

  // Discount percentage (if applicable)
  discountPercentage?: number;
}

/**
 * API Response types
 */

export interface SearchQuery {
  query: string;
  category?: string;
  supermarketIds?: string[];
  weekNumber?: number;
}

export interface SearchResult {
  products: Product[];
  deals: WeeklyDeal[];
  comparisons: PriceComparison[];
}

export interface ApiError {
  message: string;
  code: string;
  details?: unknown;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}
