const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '.env') });

const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');

async function testGemini() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error('❌ No API key found');
        return;
    }
    
    console.log('🔑 API Key found:', apiKey.substring(0, 10) + '...');
    
    const genAI = new GoogleGenerativeAI(apiKey);
    // Use gemini-3.1-flash-lite
    const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite' });
    
    // Find a sample image
    const imageDir = './data/images/animal';
    if (!fs.existsSync(imageDir)) {
        console.error('❌ Image directory not found:', imageDir);
        return;
    }
    
    const files = fs.readdirSync(imageDir);
    const imageFile = files.find(f => f.match(/\.(jpg|jpeg|png)$/i));
    
    if (!imageFile) {
        console.error('❌ No images found in data/images/animal/');
        return;
    }
    
    const imagePath = path.join(imageDir, imageFile);
    console.log('📸 Testing with image:', imagePath);
    
    const imageData = fs.readFileSync(imagePath);
    const base64Image = imageData.toString('base64');
    
    const prompt = `
You are an image understanding system. Analyze this image and return ONLY valid JSON with the following structure:

{
    "subject": "what is the main subject? (e.g., 'red fox', 'oak tree')",
    "category": "one of: animal, plant, landscape, object, person, other",
    "attributes": ["at least 3 attributes describing the image"],
    "caption": "a descriptive caption for this image",
    "confidence": 0.94 (a number between 0 and 1)
}

Return ONLY the JSON, no other text.
`;

    try {
        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    mimeType: 'image/jpeg',
                    data: base64Image
                }
            }
        ]);
        
        const response = await result.response;
        const text = response.text();
        console.log('📄 Response:', text);
        
        const parsed = JSON.parse(text);
        console.log('✅ Parsed:', parsed);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.response) {
            console.error('Response:', JSON.stringify(error.response, null, 2));
        }
    }
}

testGemini();
