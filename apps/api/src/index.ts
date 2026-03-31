import express from 'express';
import cors from 'cors';
import { initializeDatabase, seedDatabase } from './db/database.js';
import apiRoutes from './routes/api.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database
initializeDatabase();

// Seed database with sample data (only for prototype)
// In production, this would be handled by proper migrations and data import
seedDatabase();

// Routes
app.use('/api', apiRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 API server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔍 Search API: http://localhost:${PORT}/api/search?q=milk`);
});
