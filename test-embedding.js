const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '.env') });

const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testEmbedding() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error('❌ No API key found');
        return;
    }
    
    console.log('🔑 API Key found:', apiKey.substring(0, 10) + '...');
    
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Try different embedding models (confirmed working)
    const models = [
        'models/embedding-001',
        'models/text-embedding-004',
        'embedding-001',
        'text-embedding-004'
    ];
    
    for (const modelName of models) {
        try {
            console.log(`\n📡 Trying: ${modelName}`);
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.embedContent("Test text for embedding");
            const embedding = result.embedding.values;
            console.log(`✅ Success! ${embedding.length} dimensions`);
            console.log(`📊 First 5 values: ${embedding.slice(0, 5).join(', ')}`);
            return embedding;
        } catch (error) {
            console.log(`❌ Failed: ${error.message}`);
        }
    }
    
    console.log('\n❌ All embedding models failed.');
    console.log('📝 Try using: gemini-1.5-flash for text generation instead of embeddings.');
}

testEmbedding();
