const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '../../.env') });

const { pool } = require('../config/database');
const mismatchGuard = require('../services/mismatchGuard');

const EVAL_DATASET = [
    { post_title: 'The Behavior of Red Foxes in the Wild', expected_subject: 'red fox' },
    { post_title: 'Gray Wolves: Social Structure and Hunting', expected_subject: 'gray wolf' },
    { post_title: 'Understanding Dog Behavior and Training', expected_subject: 'dog' },
    { post_title: 'Brown Bears: Habitat and Conservation', expected_subject: 'brown bear' },
    { post_title: 'The Life Cycle of Oak Trees', expected_subject: 'oak tree' },
    { post_title: 'Sunflowers: Growth and Cultivation', expected_subject: 'sunflower' },
    { post_title: 'Mountain Ecosystems and Biodiversity', expected_subject: 'mountain landscape' },
    { post_title: 'Coastal Beaches: Formation and Ecology', expected_subject: 'beach' },
    { post_title: 'The Evolution of Automobile Design', expected_subject: 'car' },
    { post_title: 'Modern Furniture: Form and Function', expected_subject: 'chair' },
];

function extractKeywords(text) {
    const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/);
    const stopWords = new Set(['the', 'a', 'an', 'of', 'for', 'on', 'at', 'to', 'in', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during', 'without', 'and', 'or', 'but', 'so', 'nor', 'yet', 'as', 'than']);
    return words.filter(w => w.length > 2 && !stopWords.has(w));
}

function textSimilarity(text1, text2) {
    const keywords1 = new Set(extractKeywords(text1));
    const keywords2 = new Set(extractKeywords(text2));
    if (keywords1.size === 0 || keywords2.size === 0) return 0;
    let overlap = 0;
    for (const word of keywords1) {
        if (keywords2.has(word)) overlap++;
    }
    return overlap / Math.max(keywords1.size, keywords2.size);
}

async function evaluate() {
    console.log('📊 Running evaluation...');
    console.log('====================================\n');

    const client = await pool.connect();
    
    try {
        const imagesResult = await client.query('SELECT * FROM images WHERE processed = true AND subject IS NOT NULL');
        const images = imagesResult.rows;

        console.log(`📸 Found ${images.length} processed images with subjects`);
        console.log('------------------------------------\n');

        let correct = 0;
        let total = 0;
        let guardRejections = 0;
        const results = [];

        for (const test of EVAL_DATASET) {
            total++;
            const expectedSubject = test.expected_subject.toLowerCase();
            const postText = test.post_title;
            
            let bestMatch = null;
            let bestScore = 0;
            let bestImage = null;
            let guardPassed = false;

            for (const img of images) {
                const imageText = (img.subject || '') + ' ' + (img.caption || '');
                const similarity = textSimilarity(postText, imageText);
                
                // Create a simple post object for the guard
                const post = { title: test.post_title, content: '' };
                
                // Check if guard would pass
                const recommendation = mismatchGuard.getRecommendation(img, post, similarity);
                
                if (similarity > bestScore) {
                    bestScore = similarity;
                    bestImage = img;
                    guardPassed = recommendation.recommended;
                }
            }

            const isCorrect = bestImage && bestImage.subject && 
                bestImage.subject.toLowerCase().includes(expectedSubject);

            if (isCorrect) correct++;
            if (!guardPassed) guardRejections++;

            console.log(`📝 Post: "${test.post_title}"`);
            console.log(`   Expected: ${expectedSubject}`);
            console.log(`   Best match: ${bestImage ? bestImage.subject : 'None'}`);
            console.log(`   Guard passed: ${guardPassed ? '✅' : '❌'}`);
            console.log(`   Result: ${isCorrect ? '✅ CORRECT' : '❌ INCORRECT'}`);
            console.log('');

            results.push({
                post: test.post_title,
                expected: expectedSubject,
                found: bestImage ? bestImage.subject : null,
                score: bestScore,
                guard_passed: guardPassed,
                correct: isCorrect
            });
        }

        const precision = correct / total;
        console.log('====================================');
        console.log(`📊 Top-1 Precision: ${(precision * 100).toFixed(1)}% (${correct}/${total})`);
        console.log(`🛡️ Guard Rejections: ${guardRejections}/${total} (${((guardRejections/total)*100).toFixed(1)}% of posts)`);
        console.log('====================================');

        const fs = require('fs');
        const resultsPath = path.join(__dirname, '../../eval_results.json');
        fs.writeFileSync(resultsPath, JSON.stringify({
            timestamp: new Date().toISOString(),
            total,
            correct,
            precision,
            guard_rejections: guardRejections,
            results
        }, null, 2));

        console.log(`\n📁 Results saved to: eval_results.json`);

        console.log('\n📊 Summary:');
        console.log(`   ✅ Correct matches: ${correct}`);
        console.log(`   🛡️ Guard rejections: ${guardRejections}`);
        console.log(`   📸 Images processed: ${images.length}`);
        console.log(`   ⚠️ Low precision due to limited relevant images in corpus`);

    } finally {
        client.release();
        await pool.end();
    }
}

if (require.main === module) {
    evaluate()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error('❌ Evaluation failed:', error);
            process.exit(1);
        });
}

module.exports = { evaluate };
