const { GoogleGenerativeAI } = require('@google/generative-ai');

class EmbeddingService {
    constructor() {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.warn('⚠️ GEMINI_API_KEY not set. Embedding service will not work.');
        }
        this.genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;
        this.model = process.env.EMBEDDING_MODEL || 'text-embedding-004';
        this.costPerToken = 0.0000001; // Approximate cost per token
    }

    async generateEmbedding(text) {
        if (!this.genAI) {
            throw new Error('Gemini API key not configured');
        }

        try {
            console.log(`🧠 Generating embedding for text (${text.length} chars)...`);

            const model = this.genAI.getGenerativeModel({ model: this.model });
            const result = await model.embedContent(text);
            const embedding = result.embedding.values;

            // Estimate cost (rough approximation)
            const tokensUsed = Math.ceil(text.length / 4);
            const cost = tokensUsed * this.costPerToken;

            console.log(`✅ Embedding generated (${embedding.length} dimensions)`);
            console.log(`💲 Estimated cost: $${cost.toFixed(6)}`);

            return {
                embedding,
                tokensUsed,
                cost
            };

        } catch (error) {
            console.error('❌ Embedding generation error:', error.message);
            throw error;
        }
    }

    async logCost(imageId, postId, operation, tokensUsed, cost, model) {
        const { pool } = require('../config/database');
        try {
            await pool.query(
                `INSERT INTO cost_logs (operation, image_id, post_id, model, tokens_used, cost) 
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [operation, imageId, postId, model, tokensUsed, cost]
            );
            console.log(`💰 Cost logged: ${operation} - $${cost.toFixed(6)}`);
        } catch (error) {
            console.error('❌ Failed to log cost:', error.message);
        }
    }

    // Calculate cosine similarity between two embeddings
    cosineSimilarity(vecA, vecB) {
        if (!vecA || !vecB || vecA.length !== vecB.length) {
            return 0;
        }

        let dotProduct = 0;
        let normA = 0;
        let normB = 0;

        for (let i = 0; i < vecA.length; i++) {
            dotProduct += vecA[i] * vecB[i];
            normA += vecA[i] * vecA[i];
            normB += vecB[i] * vecB[i];
        }

        if (normA === 0 || normB === 0) {
            return 0;
        }

        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }
}

module.exports = new EmbeddingService();
