const { pool } = require('../config/database');
const fs = require('fs');
const path = require('path');

async function seedData() {
    const client = await pool.connect();
    try {
        console.log('🌱 Seeding sample data...');

        // Clear existing data
        await client.query('DELETE FROM matches');
        await client.query('DELETE FROM images');
        await client.query('DELETE FROM posts');

        // Find all images in data/images/
        const imageDir = path.join(__dirname, '../../data/images');
        const categories = ['animal', 'plant', 'landscape', 'object'];
        const images = [];

        for (const category of categories) {
            const categoryDir = path.join(imageDir, category);
            if (fs.existsSync(categoryDir)) {
                const files = fs.readdirSync(categoryDir);
                for (const file of files) {
                    if (file.match(/\.(jpg|jpeg|png)$/i)) {
                        const subject = file.replace(/\.[^.]+$/, '').replace(/_/g, ' ');
                        images.push({
                            filename: file,
                            url: path.join(categoryDir, file),
                            subject: subject,
                            category: category,
                            attributes: ['unknown', 'unknown', 'unknown'],
                            caption: `A ${subject}`,
                            confidence: 0.5,
                            processed: false
                        });
                    }
                }
            }
        }

        console.log(`📸 Found ${images.length} images`);

        for (const img of images) {
            const result = await client.query(
                `INSERT INTO images (filename, url, subject, category, attributes, caption, confidence, processed) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
                 RETURNING id`,
                [
                    img.filename, img.url, img.subject, img.category,
                    img.attributes, img.caption, img.confidence, img.processed
                ]
            );
            console.log(`✅ Seeded: ${img.filename} (${img.category})`);
        }

        // Create sample posts
        const samplePosts = [
            { title: 'The Behavior of Red Foxes in the Wild', content: 'Red foxes are fascinating creatures that inhabit forests and grasslands. They are known for their intelligence and adaptability.' },
            { title: 'Gray Wolves: Social Structure and Hunting', content: 'Gray wolves live in packs with complex social hierarchies. They are highly intelligent predators.' },
            { title: 'Understanding Dog Behavior and Training', content: 'Dogs are loyal companions that respond well to positive reinforcement training methods.' },
            { title: 'Brown Bears: Habitat and Conservation', content: 'Brown bears are found across North America and Eurasia. They are powerful omnivores.' },
            { title: 'The Life Cycle of Oak Trees', content: 'Oak trees are majestic trees that can live for hundreds of years. They support diverse ecosystems.' },
            { title: 'Mountain Ecosystems and Biodiversity', content: 'Mountain ranges support unique ecosystems with specialized plant and animal species.' },
        ];

        for (const post of samplePosts) {
            await client.query(
                `INSERT INTO posts (title, content) VALUES ($1, $2)`,
                [post.title, post.content]
            );
            console.log(`✅ Seeded post: ${post.title}`);
        }

        console.log('\n✅ Seed completed!');
        console.log(`📸 ${images.length} images seeded`);
        console.log(`📝 ${samplePosts.length} posts seeded`);
        console.log('\n🔗 Next steps:');
        console.log('   1. Process images: npm run process:images');
        console.log('   2. Generate embeddings: POST /api/posts/embed');
        console.log('   3. Find matches: GET /api/posts/:id/matches');

    } catch (error) {
        console.error('❌ Seed failed:', error.message);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

if (require.main === module) {
    seedData()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}

module.exports = { seedData };
