const path = require('path');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { runMigration } = require('./db/migrate');
const imageRoutes = require('./routes/imageRoutes');
const matchingRoutes = require('./routes/matchingRoutes');

// Load .env from the correct path
dotenv.config({ path: path.join(__dirname, '../.env') });

// Check if Gemini API key is set
if (!process.env.GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY is not set in .env file');
    console.error('📝 Please create .env file with your Gemini API key');
    console.error('   Get your key from: https://aistudio.google.com/');
    process.exit(1);
} else {
    console.log('🔑 Gemini API Key: ✅ Set');
}

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

// Routes
app.use('/api', imageRoutes);
app.use('/api', matchingRoutes);

// Start server
async function start() {
    try {
        await runMigration();
        
        app.listen(PORT, () => {
            console.log(`\n🚀 Image Relevance Engine running at http://localhost:${PORT}`);
            console.log(`📚 Health: http://localhost:${PORT}/health`);
            console.log(`📸 Upload: POST http://localhost:${PORT}/api/images/upload`);
            console.log(`🔄 Process: POST http://localhost:${PORT}/api/images/process`);
            console.log(`📋 Images: GET http://localhost:${PORT}/api/images`);
            console.log(`📝 Posts: POST http://localhost:${PORT}/api/posts`);
            console.log(`🔍 Matches: GET http://localhost:${PORT}/api/posts/:id/matches`);
            console.log(`📊 Cost Logs: GET http://localhost:${PORT}/api/cost-logs`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error.message);
        process.exit(1);
    }
}

start().catch(console.error);

module.exports = app;
