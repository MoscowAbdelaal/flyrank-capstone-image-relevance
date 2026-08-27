const fs = require('fs');
const path = require('path');
const { pool } = require('../config/database');

async function runMigration() {
    const client = await pool.connect();
    try {
        console.log('📦 Running database migration...');
        
        const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
        await client.query(sql);
        
        console.log('✅ Migration completed successfully');
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        throw error;
    } finally {
        client.release();
    }
}

// Run if called directly
if (require.main === module) {
    runMigration()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}

module.exports = { runMigration };
