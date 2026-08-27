class MismatchGuard {
    constructor() {
        // Default thresholds
        this.similarityThreshold = 0.75;
        this.confidenceThreshold = 0.7;
        this.categoryMismatchPenalty = 0.3;
    }

    /**
     * Evaluate if an image is a good match for a post
     */
    evaluate(image, post, similarityScore) {
        const guardResult = {
            passed: false,
            reasons: [],
            checks: {}
        };

        // Check 1: Confidence check
        guardResult.checks.confidence = {
            passed: image.confidence >= this.confidenceThreshold,
            value: image.confidence,
            threshold: this.confidenceThreshold
        };

        if (!guardResult.checks.confidence.passed) {
            guardResult.reasons.push(
                `Image confidence too low: ${image.confidence.toFixed(2)} < ${this.confidenceThreshold}`
            );
        }

        // Check 2: Similarity threshold
        guardResult.checks.similarity = {
            passed: similarityScore >= this.similarityThreshold,
            value: similarityScore,
            threshold: this.similarityThreshold
        };

        if (!guardResult.checks.similarity.passed) {
            guardResult.reasons.push(
                `Similarity score too low: ${similarityScore.toFixed(2)} < ${this.similarityThreshold}`
            );
        }

        // Check 3: Category match (if post has a category hint)
        // Extract category from post content
        const postCategories = this._extractCategories(post);
        guardResult.checks.category = {
            passed: postCategories.length === 0 || postCategories.includes(image.category),
            value: image.category,
            expected: postCategories
        };

        if (!guardResult.checks.category.passed) {
            guardResult.reasons.push(
                `Category mismatch: expected ${postCategories.join(' or ')}, got ${image.category}`
            );
        }

        // Overall decision
        guardResult.passed = 
            guardResult.checks.confidence.passed &&
            guardResult.checks.similarity.passed &&
            guardResult.checks.category.passed;

        return guardResult;
    }

    /**
     * Extract category hints from post content
     */
    _extractCategories(post) {
        const categories = [];
        const text = (post.title + ' ' + post.content).toLowerCase();

        const categoryKeywords = {
            animal: ['animal', 'fox', 'wolf', 'dog', 'bear', 'deer', 'cat', 'wildlife', 'mammal'],
            plant: ['plant', 'tree', 'flower', 'oak', 'sunflower', 'cactus', 'bamboo', 'garden'],
            landscape: ['landscape', 'mountain', 'beach', 'forest', 'desert', 'valley', 'scenery'],
            object: ['object', 'car', 'chair', 'lamp', 'book', 'furniture', 'tool'],
            person: ['person', 'people', 'human', 'man', 'woman', 'child']
        };

        for (const [category, keywords] of Object.entries(categoryKeywords)) {
            for (const keyword of keywords) {
                if (text.includes(keyword)) {
                    categories.push(category);
                    break;
                }
            }
        }

        return categories;
    }

    /**
     * Generate an explanation for rejection
     */
    generateRejectionExplanation(image, post, guardResult) {
        const reasons = guardResult.reasons;
        
        if (reasons.length === 0) {
            return 'No specific reason provided';
        }

        // Build a human-readable explanation
        let explanation = `Rejected: `;

        if (reasons.length === 1) {
            explanation += reasons[0];
        } else {
            explanation += reasons.join('; ');
        }

        // Add details about the image and post
        explanation += `. Image: "${image.subject}" (${image.category}, confidence: ${image.confidence.toFixed(2)})`;
        explanation += `. Post: "${post.title}"`;

        return explanation;
    }

    /**
     * Get a simple recommendation
     */
    getRecommendation(image, post, similarityScore) {
        const guardResult = this.evaluate(image, post, similarityScore);

        return {
            recommended: guardResult.passed,
            score: similarityScore,
            guardResult,
            explanation: guardResult.passed 
                ? `✅ Good match: "${image.subject}" matches "${post.title}"`
                : this.generateRejectionExplanation(image, post, guardResult)
        };
    }
}

module.exports = new MismatchGuard();
