const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const { validateVisionResponse, isLowConfidence } = require('./schemaValidation');

class VisionService {
    constructor() {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.warn('⚠️ GEMINI_API_KEY not set. Vision service will not work.');
        }
        this.genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;
        this.model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
        this.costPerToken = 0.000000125; // Approximate cost per token
    }

    async analyzeImage(imagePath) {
        if (!this.genAI) {
            throw new Error('Gemini API key not configured');
        }

        try {
            console.log(`🧠 Analyzing image: ${imagePath}`);

            // Read image as base64
            const imageData = fs.readFileSync(imagePath);
            const base64Image = imageData.toString('base64');

            const model = this.genAI.getGenerativeModel({ model: this.model });

            const prompt = `
You are an image understanding system. Analyze this image and return ONLY valid JSON with the following structure:

{
    "subject": "what is the main subject? (e.g., 'red fox', 'oak tree')",
    "category": "one of: animal, plant, landscape, object, person, other",
    "attributes": ["at least 3 attributes describing the image, e.g., 'orange fur', 'wild', 'forest'"],
    "caption": "a descriptive caption for this image",
    "confidence": 0.94 (a number between 0 and 1 indicating your confidence in this analysis)
}

Return ONLY the JSON, no other text.
`;

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

            // Parse the JSON response
            let parsed;
            try {
                // Clean up response - remove markdown code blocks if present
                let cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
                parsed = JSON.parse(cleaned);
            } catch (e) {
                console.error('❌ Failed to parse vision response:', e.message);
                return {
                    success: false,
                    error: 'Invalid JSON response from vision model',
                    raw: text
                };
            }

            // Validate the response
            const validation = validateVisionResponse(parsed);
            if (!validation.valid) {
                console.error('❌ Schema validation failed:', validation.errors);
                return {
                    success: false,
                    error: 'Schema validation failed',
                    details: validation.errors,
                    raw: parsed
                };
            }

            // Check confidence
            const lowConfidence = isLowConfidence(parsed.confidence);

            // Log cost
            const tokensUsed = response.usageMetadata?.totalTokenCount || 100;
            const cost = tokensUsed * this.costPerToken;

            console.log(`✅ Image analyzed: ${parsed.subject} (${parsed.category})`);
            console.log(`📊 Confidence: ${parsed.confidence}${lowConfidence ? ' ⚠️ LOW CONFIDENCE' : ''}`);
            console.log(`💲 Estimated cost: $${cost.toFixed(6)}`);

            return {
                success: true,
                data: parsed,
                lowConfidence,
                tokensUsed,
                cost,
                model: this.model
            };

        } catch (error) {
            console.error('❌ Vision analysis error:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Track cost in database
    async logCost(imageId, operation, tokensUsed, cost, model) {
        const { pool } = require('../config/database');
        try {
            await pool.query(
                `INSERT INTO cost_logs (operation, image_id, model, tokens_used, cost) 
                 VALUES ($1, $2, $3, $4, $5)`,
                [operation, imageId, model, tokensUsed, cost]
            );
            console.log(`💰 Cost logged: ${operation} - $${cost.toFixed(6)}`);
        } catch (error) {
            console.error('❌ Failed to log cost:', error.message);
        }
    }
}

module.exports = new VisionService();
