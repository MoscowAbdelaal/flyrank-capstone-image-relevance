const path = require('path');
const dotenv = require('dotenv');

// Load .env from the correct path
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Check if Gemini API key is set
if (!process.env.GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY is not set in .env file');
    console.error('📝 Please create .env file with your Gemini API key');
    process.exit(1);
}

const imageProcessor = require('../jobs/imageProcessor');

async function processImages() {
    console.log('🔄 Starting image processing...\n');
    
    const result = await imageProcessor.processAllImages();
    
    console.log('\n📊 Processing Complete:');
    console.log(`   ✅ Processed: ${result.processed}`);
    console.log(`   ❌ Errors: ${result.errors}`);
    
    process.exit(0);
}

if (require.main === module) {
    processImages().catch((error) => {
        console.error('❌ Processing failed:', error);
        process.exit(1);
    });
}

module.exports = { processImages };
