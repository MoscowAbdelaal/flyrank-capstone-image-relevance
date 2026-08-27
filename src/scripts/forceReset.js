const path = require('path');
const dotenv = require('dotenv');
const { pool } = require('../config/database');
const fs = require('fs');

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function forceReset() {
    const client = await pool.connect();
    try {
        console.log('🔄 Force resetting images...');
        
        // Delete in correct order (respect foreign keys)
        await client.query('DELETE FROM matches');
        await client.query('DELETE FROM cost_logs');
        await client.query('DELETE FROM images');
        
        console.log('🗑️ Deleted all images and related data from database');
        
        const imageDir = path.join(__dirname, '../../data/images');
        const categories = ['animal', 'plant', 'landscape', 'object'];
        let count = 0;
        
        for (const category of categories) {
            const categoryDir = path.join(imageDir, category);
            if (fs.existsSync(categoryDir)) {
                const files = fs.readdirSync(categoryDir);
                for (const file of files) {
                    if (file.match(/\.(jpg|jpeg|png)$/i)) {
                        const subject = file.replace(/\.[^.]+$/, '').replace(/_/g, ' ');
                        const filePath = path.join(categoryDir, file);
                        
                        await client.query(
                            `INSERT INTO images (filename, url, subject, category, processed) 
                             VALUES ($1, $2, $3, $4, false)`,
                            [file, filePath, subject, category]
                        );
                        count++;
                        console.log(`✅ Imported: ${file}`);
                    }
                }
            }
        }
        
        console.log(`\n✅ ${count} images imported and ready for processing`);
        console.log('\n📸 Now run: npm run process:images');
        
    } catch (error) {
        console.error('❌ Reset failed:', error.message);
    } finally {
        client.release();
        await pool.end();
    }
}

forceReset();
