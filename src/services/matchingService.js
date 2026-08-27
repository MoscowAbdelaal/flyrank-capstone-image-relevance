const embeddingService = require('./embeddingService');
const mismatchGuard = require('./mismatchGuard');
const imageRepository = require('../repositories/imageRepository');
const postRepository = require('../repositories/postRepository');
const matchRepository = require('../repositories/matchRepository');

class MatchingService {
    /**
     * Generate embeddings for all unprocessed images
     */
    async processImageEmbeddings() {
        console.log('🧠 Generating image embeddings...');
        
        const images = await imageRepository.findAll();
        let processed = 0;

        for (const image of images) {
            if (!image.embedding && image.caption) {
                try {
                    const result = await embeddingService.generateEmbedding(image.caption);
                    await imageRepository.updateImage(image.id, {
                        embedding: result.embedding
                    });
                    
                    await embeddingService.logCost(
                        image.id,
                        null,
                        'image_embedding',
                        result.tokensUsed,
                        result.cost,
                        embeddingService.model
                    );
                    
                    processed++;
                    console.log(`✅ Embedded image: ${image.subject}`);
                } catch (error) {
                    console.error(`❌ Failed to embed image ${image.id}:`, error.message);
                }
            }
        }

        console.log(`✅ Processed ${processed} image embeddings`);
        return { processed };
    }

    /**
     * Generate embeddings for all posts
     */
    async processPostEmbeddings() {
        console.log('🧠 Generating post embeddings...');
        
        const posts = await postRepository.findAll();
        let processed = 0;

        for (const post of posts) {
            if (!post.embedding) {
                try {
                    const text = post.title + ' ' + post.content.substring(0, 500);
                    const result = await embeddingService.generateEmbedding(text);
                    await postRepository.updateEmbedding(post.id, result.embedding);
                    
                    await embeddingService.logCost(
                        null,
                        post.id,
                        'post_embedding',
                        result.tokensUsed,
                        result.cost,
                        embeddingService.model
                    );
                    
                    processed++;
                    console.log(`✅ Embedded post: ${post.title}`);
                } catch (error) {
                    console.error(`❌ Failed to embed post ${post.id}:`, error.message);
                }
            }
        }

        console.log(`✅ Processed ${processed} post embeddings`);
        return { processed };
    }

    /**
     * Find matching images for a post
     */
    async findMatchesForPost(postId) {
        const post = await postRepository.findById(postId);
        if (!post) {
            throw new Error('Post not found');
        }

        if (!post.embedding) {
            throw new Error('Post has no embedding. Please run embedding generation first.');
        }

        console.log(`🔍 Finding matches for post: "${post.title}"`);

        const images = await imageRepository.findAll();
        const scoredImages = [];

        for (const image of images) {
            if (!image.embedding) {
                continue;
            }

            // Calculate cosine similarity
            const similarity = embeddingService.cosineSimilarity(
                post.embedding,
                image.embedding
            );

            // Run mismatch guard
            const recommendation = mismatchGuard.getRecommendation(
                image,
                post,
                similarity
            );

            scoredImages.push({
                image,
                similarity,
                recommendation,
                // Store guard result for review
                guardResult: recommendation.guardResult
            });
        }

        // Sort by similarity score (descending)
        scoredImages.sort((a, b) => b.similarity - a.similarity);

        // Store top matches in database
        const topMatches = scoredImages.slice(0, 5);
        for (const match of topMatches) {
            await matchRepository.create({
                post_id: postId,
                image_id: match.image.id,
                similarity_score: match.similarity,
                guard_result: match.guardResult
            });
        }

        return {
            post,
            matches: scoredImages.slice(0, 10).map(m => ({
                image: m.image,
                similarity: m.similarity,
                recommended: m.recommendation.recommended,
                explanation: m.recommendation.explanation
            }))
        };
    }

    /**
     * Get all matches for a post
     */
    async getMatchesForPost(postId) {
        const matches = await matchRepository.findByPost(postId);
        return matches;
    }

    /**
     * Get pending matches (for review)
     */
    async getPendingMatches() {
        return await matchRepository.getPendingMatches();
    }

    /**
     * Approve a match
     */
    async approveMatch(matchId) {
        const match = await matchRepository.updateStatus(matchId, 'approved');
        return match;
    }

    /**
     * Reject a match
     */
    async rejectMatch(matchId) {
        const match = await matchRepository.updateStatus(matchId, 'rejected');
        return match;
    }
}

module.exports = new MatchingService();
