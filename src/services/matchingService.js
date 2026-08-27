const mismatchGuard = require('./mismatchGuard');
const imageRepository = require('../repositories/imageRepository');
const postRepository = require('../repositories/postRepository');
const matchRepository = require('../repositories/matchRepository');

class MatchingService {
    // No embeddings needed - using text-based matching
    async processImageEmbeddings() {
        console.log('ℹ️ Embeddings skipped - using text-based matching');
        return { processed: 0 };
    }

    async processPostEmbeddings() {
        console.log('ℹ️ Embeddings skipped - using text-based matching');
        return { processed: 0 };
    }

    // Extract keywords from text
    _extractKeywords(text) {
        const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/);
        const stopWords = new Set(['the', 'a', 'an', 'of', 'for', 'on', 'at', 'to', 'in', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during', 'without', 'and', 'or', 'but', 'so', 'nor', 'yet', 'as', 'than']);
        return words.filter(w => w.length > 2 && !stopWords.has(w));
    }

    // Calculate text similarity based on keyword overlap
    _textSimilarity(text1, text2) {
        const keywords1 = new Set(this._extractKeywords(text1));
        const keywords2 = new Set(this._extractKeywords(text2));
        
        if (keywords1.size === 0 || keywords2.size === 0) return 0;
        
        let overlap = 0;
        for (const word of keywords1) {
            if (keywords2.has(word)) overlap++;
        }
        
        const maxSize = Math.max(keywords1.size, keywords2.size);
        return overlap / maxSize;
    }

    async findMatchesForPost(postId) {
        console.log(`🔍 Finding matches for post: ${postId}`);
        
        const post = await postRepository.findById(postId);
        if (!post) {
            console.error('❌ Post not found:', postId);
            throw new Error('Post not found');
        }

        console.log(`📝 Post: "${post.title}"`);

        const images = await imageRepository.findAll();
        console.log(`📸 Found ${images.length} images`);

        // Skip if no images
        if (images.length === 0) {
            console.log('⚠️ No images found in database');
            return {
                post,
                matches: []
            };
        }

        const scoredImages = [];
        const postText = post.title + ' ' + (post.content || '').substring(0, 300);

        for (const image of images) {
            const imageText = (image.subject || '') + ' ' + (image.caption || '');
            
            // Calculate similarity based on keyword overlap
            const similarity = this._textSimilarity(postText, imageText);
            
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
                guardResult: recommendation.guardResult
            });
        }

        // Sort by similarity score (descending)
        scoredImages.sort((a, b) => b.similarity - a.similarity);

        console.log(`📊 Top match: ${scoredImages.length > 0 ? scoredImages[0].image.subject : 'None'}`);

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

    async getMatchesForPost(postId) {
        return await matchRepository.findByPost(postId);
    }

    async getPendingMatches() {
        return await matchRepository.getPendingMatches();
    }

    async approveMatch(matchId) {
        return await matchRepository.updateStatus(matchId, 'approved');
    }

    async rejectMatch(matchId) {
        return await matchRepository.updateStatus(matchId, 'rejected');
    }
}

module.exports = new MatchingService();
