import { useState } from 'react';
import type { ApiResponse, SearchResult } from '@cheapest-deals/shared';
import './App.css';

const API_URL = 'http://localhost:3001/api';

function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!searchQuery.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/search?q=${encodeURIComponent(searchQuery)}&week=14`);
      const data: ApiResponse<SearchResult> = await response.json();

      if (data.success && data.data) {
        setResults(data.data);
      } else {
        setError(data.error?.message || 'Search failed');
      }
    } catch (err) {
      setError('Failed to connect to API. Make sure the API server is running on port 3001.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <header>
        <h1>Cheapest Weekly Deals</h1>
        <p>Find the best prices across Danish supermarkets</p>
      </header>

      <main>
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for products (e.g., milk, bread, coffee)..."
            className="search-input"
          />
          <button type="submit" disabled={loading} className="search-button">
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>

        {error && (
          <div className="error">
            <p>{error}</p>
          </div>
        )}

        {results && (
          <div className="results">
            <h2>Search Results</h2>

            {results.products.length === 0 && (
              <p>No products found. Try searching for "milk", "bread", or "coffee".</p>
            )}

            {results.products.length > 0 && (
              <div className="products">
                {results.products.map((product) => {
                  const productDeals = results.deals.filter(d => d.productId === product.id);
                  const productComparisons = results.comparisons.filter(c => c.productId === product.id);

                  return (
                    <div key={product.id} className="product-card">
                      <h3>{product.name}</h3>
                      {product.brand && <p className="brand">{product.brand}</p>}
                      {product.size && product.unit && (
                        <p className="size">{product.size}{product.unit}</p>
                      )}

                      <div className="deals">
                        <h4>Weekly Deals (Week 14)</h4>
                        {productDeals.length === 0 && <p>No deals this week</p>}
                        {productDeals.map((deal, index) => {
                          const comparison = productComparisons.find(c => c.dealId === deal.id);
                          return (
                            <div key={deal.id} className={`deal ${index === 0 ? 'best-deal' : ''}`}>
                              <div className="deal-header">
                                <span className="supermarket">{deal.supermarketId}</span>
                                <span className="price">{deal.price} {deal.currency}</span>
                              </div>
                              {deal.originalPrice && (
                                <div className="discount">
                                  <span className="original-price">{deal.originalPrice} {deal.currency}</span>
                                  <span className="save">
                                    Save {comparison?.discountPercentage}%
                                  </span>
                                </div>
                              )}
                              {comparison && (
                                <p className="unit-price">
                                  {comparison.pricePerUnit.toFixed(2)} {deal.currency}/{comparison.normalizedUnit}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {!results && !error && (
          <div className="instructions">
            <h2>How to use</h2>
            <ol>
              <li>Make sure the API server is running: <code>npm run api:dev</code></li>
              <li>Search for products like "milk", "bread", or "coffee"</li>
              <li>View price comparisons across different supermarkets</li>
            </ol>

            <div className="prototype-notice">
              <h3>Prototype Notice</h3>
              <p>This is a simplified prototype. See README.md for limitations and production considerations.</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
