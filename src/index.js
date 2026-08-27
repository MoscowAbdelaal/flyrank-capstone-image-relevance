const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { runMigration } = require('./db/migrate');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        service: 'AI Image Understanding & Content Matching Engine'
    });
});

// Start server
async function start() {
    try {
        await runMigration();
        
        app.listen(PORT, () => {
            console.log(`\n🚀 Image Relevance Engine running at http://localhost:${PORT}`);
            console.log(`📚 Health: http://localhost:${PORT}/health`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error.message);
        process.exit(1);
    }
}

start().catch(console.error);

module.exports = app;
