class MismatchGuard {
    constructor() {
        this.similarityThreshold = 0.05; // Very low threshold to allow matches
        this.confidenceThreshold = 0.3;
    }

    evaluate(image, post, similarityScore) {
        const guardResult = {
            passed: false,
            reasons: [],
            checks: {}
        };

        // Check 1: Confidence check
        guardResult.checks.confidence = {
            passed: image.confidence >= this.confidenceThreshold || image.confidence === null,
            value: image.confidence || 0.5,
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

        guardResult.passed = 
            guardResult.checks.confidence.passed &&
            guardResult.checks.similarity.passed &&
            guardResult.checks.category.passed;

        // If no reasons, add a default pass reason
        if (guardResult.passed && guardResult.reasons.length === 0) {
            guardResult.reasons.push('All checks passed');
        }

        return guardResult;
    }

    _extractCategories(post) {
        const categories = [];
        const text = (post.title + ' ' + (post.content || '')).toLowerCase();

        const categoryKeywords = {
            animal: ['animal', 'fox', 'wolf', 'dog', 'bear', 'deer', 'cat', 'wildlife', 'mammal', 'puppy', 'husky', 'retriever', 'terrier'],
            plant: ['plant', 'tree', 'flower', 'oak', 'sunflower', 'cactus', 'bamboo', 'garden', 'forest'],
            landscape: ['landscape', 'mountain', 'beach', 'forest', 'desert', 'valley', 'scenery', 'seascape', 'sunset', 'cloud'],
            object: ['object', 'car', 'chair', 'lamp', 'book', 'furniture', 'tool', 'bridge', 'bracelet', 'stool', 'jewelry']
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

    generateRejectionExplanation(image, post, guardResult) {
        const reasons = guardResult.reasons;
        
        if (reasons.length === 0) {
            return 'No specific reason provided';
        }

        let explanation = `Rejected: `;

        if (reasons.length === 1) {
            explanation += reasons[0];
        } else {
            explanation += reasons.join('; ');
        }

        explanation += `. Image: "${image.subject || 'Unknown'}" (${image.category || 'unknown'})`;
        explanation += `. Post: "${post.title}"`;

        return explanation;
    }

    getRecommendation(image, post, similarityScore) {
        const guardResult = this.evaluate(image, post, similarityScore);

        return {
            recommended: guardResult.passed,
            score: similarityScore,
            guardResult,
            explanation: guardResult.passed 
                ? `✅ Good match: "${image.subject || 'Unknown'}" matches "${post.title}"`
                : this.generateRejectionExplanation(image, post, guardResult)
        };
    }
}

module.exports = new MismatchGuard();
