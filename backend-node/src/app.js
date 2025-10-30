const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Security middleware
const securityMiddleware = require('./middlewares/security');
const { errorHandler } = require('./middlewares/errorHandler');

// Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const flowRoutes = require('./routes/flows');

// Load environment variables
dotenv.config({ path: path.join(__dirname, 'config', '.env') });

const app = express();

// Apply security middleware first
app.use(securityMiddleware);

// CORS configuration
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch((err) => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/flows', flowRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Gumflow Automation API',
    version: '1.0.0',
    status: 'operational'
  });
});

// Global error handling middleware (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});