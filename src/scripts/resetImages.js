const { pool } = require('../config/database');

async function resetImages() {
    const client = await pool.connect();
    try {
        console.log('🔄 Resetting images to unprocessed...');
        
        await client.query(
            `UPDATE images 
             SET processed = false, 
                 subject = NULL, 
                 category = NULL, 
                 attributes = NULL, 
                 caption = NULL, 
                 confidence = NULL, 
                 tags = NULL,
                 processing_error = NULL
             WHERE processed = true`
        );
        
        console.log('✅ All images reset to unprocessed');
        
        // Count unprocessed images
        const result = await client.query(
            'SELECT COUNT(*) FROM images WHERE processed = false'
        );
        console.log(`📸 ${result.rows[0].count} images ready for processing`);
        
    } catch (error) {
        console.error('❌ Reset failed:', error.message);
    } finally {
        client.release();
        await pool.end();
    }
}

resetImages();
