const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        service: 'Image Understanding & Content Matching Engine'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Image Relevance Engine running at http://localhost:${PORT}`);
    console.log(`📚 Health: http://localhost:${PORT}/health`);
});

module.exports = app;
