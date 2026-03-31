# Cheapest Weekly Deals - Prototype

A prototype application for comparing weekly supermarket prices across Danish grocery stores.

## Overview

This prototype aims to help users find the best prices for products across multiple supermarkets in Denmark. Each supermarket publishes weekly catalogs/newspapers with special offers, but comparing them manually is time-consuming. This app aggregates these deals and allows price comparison.

## Project Structure

```
cheapest-weekly-deals/
├─ apps/
│  ├─ web/          # Vite + React frontend
│  └─ api/          # Node.js Express backend
├─ packages/
│  └─ shared/       # Shared TypeScript types and utilities
├─ README.md
└─ package.json     # Root workspace configuration
```

## Technology Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Backend**: Node.js + Express + TypeScript
- **Database**: SQLite (prototype) → PostgreSQL (production)
- **Monorepo**: npm workspaces

## Getting Started

### Installation

```bash
# Install all dependencies
npm install
```

### Development

```bash
# Run both web and api in development mode
npm run dev

# Or run individually
npm run web:dev   # Frontend on http://localhost:5173
npm run api:dev   # Backend on http://localhost:3001
```

### Building

```bash
# Build all apps
npm run build

# Or build individually
npm run web:build
npm run api:build
```

## API Endpoints

- `GET /health` - Health check
- `GET /api/supermarkets` - List all supermarkets
- `GET /api/search?q=<query>&week=<week>` - Search products and deals
- `GET /api/deals/best?week=<week>&limit=<n>` - Get best deals

## Prototype Purpose

This prototype is designed to **expose risks and challenges** before building the full product. The following sections document critical considerations.

---

## 🚨 CRITICAL RISKS & CHALLENGES

### 1. Product Matching & Normalization

**THE BIGGEST CHALLENGE** in this application.

**Problem**: The same product appears with different names, sizes, and descriptions across supermarkets.

Examples:
- Netto: "Arla Minimælk 1L"
- Rema 1000: "Arla Skummetmælk 1000ml"
- Føtex: "Arla Semi-skimmed Milk 1 liter"

**Current Prototype Limitation**:
- Simple text matching on product names
- No fuzzy matching or synonym handling
- No brand normalization
- No multi-language support (Danish/English)

**Production Requirements**:
- Machine learning for product matching
- Manual curation/approval system
- Product taxonomy/hierarchy
- Barcode/EAN matching (if available from sources)
- Community feedback for incorrect matches
- Handling different pack sizes (500g vs 1kg)
- Unit price normalization (price per kg/liter)

**Estimated Complexity**: HIGH - Could be 30-40% of development effort

---

### 2. Data Sourcing

**Problem**: Getting real-time weekly deal data from supermarkets.

**Challenges**:

**Option A: Web Scraping**
- ❌ Fragile (breaks when websites change)
- ❌ Legal concerns (Terms of Service)
- ❌ Rate limiting / IP blocking
- ❌ Requires constant maintenance
- ❌ Different structure for each supermarket
- ❌ May not capture all deal details (e.g., "Buy 2 get 1 free")

**Option B: Official APIs**
- ✅ Reliable and legal
- ❌ Most Danish supermarkets don't offer public APIs
- ❌ Would require partnerships/agreements
- ❌ May have usage limits or costs

**Option C: Manual Entry**
- ✅ Accurate
- ❌ Not scalable
- ❌ Labor intensive
- ❌ Can't keep up with weekly changes

**Current Prototype**: Uses mock/seed data

**Production Recommendation**:
1. Start with manual curation for MVP
2. Develop web scrapers for 2-3 major chains
3. Pursue API partnerships
4. Build monitoring to detect scraper failures
5. Consider crowd-sourcing deal submissions

---

### 3. Complex Deal Structures

**Problem**: Deals are not just "X DKK per item"

**Real-world deal types**:
- Fixed price: "10 DKK"
- Percentage discount: "Save 25%"
- Bulk discount: "2 for 30 DKK"
- Buy X get Y free: "Buy 2 get 1 free"
- Mix & match: "3 for 50 DKK - choose from 10 products"
- Tiered pricing: "1 pc: 15 DKK, 2+ pcs: 12 DKK each"
- Membership prices: "Member price: 20 DKK, Regular: 25 DKK"
- Minimum purchase: "Save 30% when you buy 4+"
- Bundle deals: "Buy milk + cereal for 35 DKK"

**Current Prototype Limitation**:
- Only handles simple fixed prices
- Basic discount percentage calculation
- No support for complex conditions

**Production Requirements**:
- Rich deal type system
- Complex pricing calculator
- UI to display deal conditions clearly
- Comparison logic that accounts for deal types
- Warning system ("Best only if buying 2+")

---

### 4. Database Migration (SQLite → PostgreSQL)

**Problem**: SQLite is convenient for prototypes but not production-ready at scale.

**Migration Challenges**:

**Date/Time Handling**:
- SQLite: Stores dates as TEXT
- PostgreSQL: Native DATE, TIMESTAMP types
- Need to update all date queries and formatting

**Type System**:
- PostgreSQL is stricter with types
- May reveal type coercion bugs

**Connection Management**:
- SQLite: File-based, single connection
- PostgreSQL: Network-based, connection pooling required
- Need to implement proper connection pooling (e.g., pg-pool)

**Transactions**:
- Different syntax and behavior
- Need to update transaction handling code

**Full-text Search**:
- SQLite: Limited search capabilities
- PostgreSQL: Powerful full-text search with tsvector
- Should implement proper search indexes

**Performance**:
- Need proper indexes for PostgreSQL
- Query optimization may differ

**Recommendation**:
- Use an ORM/query builder (Drizzle, Prisma, Kysely) from the start
- Keep migration scripts in version control
- Plan for zero-downtime migration strategy

---

### 5. Price Comparison Accuracy

**Problem**: Comparing products of different sizes.

**Example**:
- Store A: 500g butter for 20 DKK = 40 DKK/kg
- Store B: 1kg butter for 35 DKK = 35 DKK/kg
- Store B is cheaper, but requires buying 1kg

**Current Prototype Limitation**:
- Basic price-per-unit calculation
- Assumes unit conversion is straightforward
- Doesn't account for:
  - Waste (can't use full 1kg before expiry)
  - Storage space limitations
  - Upfront cost (need more money now)
  - Quantity needs (only need 100g)

**Production Requirements**:
- Sophisticated unit normalization
- User preference settings (household size, storage space)
- "Total cost" vs "Unit cost" views
- Consider product shelf life
- Smart recommendations based on typical usage

---

### 6. Weekly Catalog Timing

**Problem**: Different supermarkets have different weekly cycles.

**Challenges**:
- Some start Monday, others start Wednesday
- Overlap periods (week 13 deals + week 14 deals both valid)
- Flash sales (24-hour deals, weekend specials)
- Regional variations (different prices in different stores)

**Current Prototype Limitation**:
- Assumes all deals follow same weekly cycle
- No handling of overlapping valid periods
- No flash sales or time-limited offers

**Production Requirements**:
- Flexible date range queries
- "Valid today" view
- Notifications for expiring deals
- Historical price tracking

---

### 7. Product Categories & Filtering

**Problem**: Users shop by category, but categorization is subjective.

**Challenges**:
- Same product fits multiple categories (yogurt: Dairy? Breakfast? Snacks?)
- Category names differ across supermarkets
- Subcategories and hierarchies
- Seasonal categories (Christmas, Summer BBQ)
- Dietary categories (Vegetarian, Organic, Gluten-free)

**Current Prototype Limitation**:
- Simple flat category field
- No category management system
- No multi-category support

**Production Requirements**:
- Hierarchical category system
- Tag-based filtering
- User-created shopping lists by category
- Dietary preference filters

---

### 8. User Experience Challenges

**Problem**: Presenting comparison data clearly without overwhelming users.

**UX Challenges**:
- Information overload (too many options)
- Map/location integration (which store is closest?)
- Shopping list generation
- Total basket comparison (whole shopping trip, not single items)
- Recipe-based shopping (price for making a recipe)
- Past price trends ("Is this a good deal?")
- Deal notifications

**Current Prototype**: No frontend implementation yet

**Production Considerations**:
- Mobile-first design (users shop on the go)
- Offline support (poor signal in stores)
- Barcode scanning
- Location-based recommendations
- Push notifications for favorite products

---

### 9. Legal & Business Considerations

**Risks**:
- **Terms of Service**: Web scraping may violate supermarket ToS
- **Copyright**: Product images, descriptions may be copyrighted
- **Pricing Errors**: If our data is wrong, who's liable?
- **Competition Law**: Is price comparison legal/regulated?
- **Data Privacy**: GDPR compliance for user data
- **Revenue Model**: How to monetize without compromising neutrality?

**Recommendations**:
- Legal review before launch
- Consider affiliate partnerships
- Clear disclaimers about price accuracy
- User agreement terms

---

### 10. Performance & Scalability

**Current Prototype**:
- No caching
- No pagination
- Synchronous processing
- Single server

**Production Needs**:
- Redis/memory caching for frequently accessed data
- CDN for static assets
- Background job queue for data updates
- Horizontal scaling (multiple API servers)
- Database read replicas
- Search index (Elasticsearch/Meilisearch)
- Monitoring and alerting

---

### 11. Data Freshness & Accuracy

**Problem**: Deals change weekly, prices may change mid-week.

**Challenges**:
- Automated weekly data refresh
- Handling out-of-stock items
- Price error corrections
- User-reported issues
- Data quality monitoring

**Recommendations**:
- Automated scraping schedule
- Manual verification workflow
- User feedback mechanism
- Stale data warnings
- Data versioning/audit trail

---

## Prototype vs Production Gap

| Aspect | Prototype | Production |
|--------|-----------|------------|
| Database | SQLite file | PostgreSQL cluster with replicas |
| Data Source | Mock seed data | Scrapers + APIs + manual curation |
| Product Matching | Simple string match | ML-based fuzzy matching + manual review |
| Deal Types | Fixed price only | 10+ deal structures with conditions |
| Search | Basic SQL LIKE | Elasticsearch with autocomplete |
| Auth | None | User accounts, social login |
| Caching | None | Redis multi-layer cache |
| Error Handling | Basic try/catch | Comprehensive logging, monitoring, alerts |
| Testing | None | Unit, integration, E2E tests |
| Deployment | Local dev server | CI/CD, staging, blue-green production |

---

## Next Steps for MVP

1. **Validate the concept**:
   - Build basic frontend with search and comparison
   - User testing with seed data
   - Confirm users find value

2. **Solve product matching**:
   - Prototype ML matching algorithm
   - Build manual curation interface
   - Start building product database

3. **Data sourcing strategy**:
   - Choose 2-3 supermarkets for MVP
   - Build reliable scrapers
   - Set up monitoring

4. **Core features**:
   - Search & compare
   - Best deals list
   - Shopping list with price totals
   - Basic categorization

5. **Infrastructure**:
   - Migrate to PostgreSQL
   - Deploy to cloud (Vercel + Railway/Render)
   - Set up monitoring

---

## Questions This Prototype Should Answer

1. ✅ Can we structure the data model for products and deals?
2. ✅ What are the technical challenges?
3. ⏳ Is the user experience valuable?
4. ⏳ Can we reliably source data?
5. ⏳ Can we match products accurately?
6. ⏳ What are users' most important features?
7. ⏳ What's the minimum viable feature set?

---

## Conclusion

This prototype demonstrates the **technical feasibility** but reveals that **product matching and data sourcing** are the two biggest challenges. These two issues will likely determine success or failure of the full product.

**Recommendation**: Before investing heavily in development, validate:
1. Data sourcing approach with 2-3 supermarkets
2. Product matching accuracy with real data
3. User interest through landing page / beta waitlist

This is a solvable problem, but it's harder than it looks! 🚀
