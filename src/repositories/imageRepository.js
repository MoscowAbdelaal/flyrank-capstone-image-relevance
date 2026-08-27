const { pool } = require('../config/database');

class ImageRepository {
    async create(image) {
        const { filename, url, subject, category, attributes, caption, confidence, tags, embedding } = image;
        
        const result = await pool.query(
            `INSERT INTO images 
             (filename, url, subject, category, attributes, caption, confidence, tags, embedding, processed) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
             RETURNING id, created_at`,
            [filename, url, subject, category, attributes, caption, confidence, tags, embedding, true]
        );
        
        return result.rows[0];
    }

    async updateImage(id, updates) {
        const fields = [];
        const values = [];
        let paramCount = 1;
        
        for (const [key, value] of Object.entries(updates)) {
            if (key === 'attributes' && Array.isArray(value)) {
                // Convert array to PostgreSQL array format: {'value1','value2'}
                const pgArray = '{' + value.map(v => `"${v.replace(/"/g, '\\"')}"`).join(',') + '}';
                fields.push(`${key} = $${paramCount}::text[]`);
                values.push(pgArray);
            } else if (key === 'tags' && typeof value === 'object') {
                fields.push(`${key} = $${paramCount}::jsonb`);
                values.push(JSON.stringify(value));
            } else if (key === 'embedding' && Array.isArray(value)) {
                fields.push(`${key} = $${paramCount}::float[]`);
                values.push(value);
            } else {
                fields.push(`${key} = $${paramCount}`);
                values.push(value);
            }
            paramCount++;
        }
        
        const query = `
            UPDATE images 
            SET ${fields.join(', ')} 
            WHERE id = $${paramCount}
            RETURNING *
        `;
        values.push(id);
        
        const result = await pool.query(query, values);
        return result.rows[0];
    }

    async getUnprocessedImages() {
        const result = await pool.query(
            `SELECT * FROM images WHERE processed = false ORDER BY created_at ASC`
        );
        return result.rows;
    }

    async findById(id) {
        const result = await pool.query(
            'SELECT * FROM images WHERE id = $1',
            [id]
        );
        return result.rows[0];
    }

    async findAll() {
        const result = await pool.query(
            'SELECT * FROM images ORDER BY created_at DESC'
        );
        return result.rows;
    }

    async findByCategory(category) {
        const result = await pool.query(
            'SELECT * FROM images WHERE category = $1 ORDER BY created_at DESC',
            [category]
        );
        return result.rows;
    }

    async markProcessed(id, error = null) {
        const result = await pool.query(
            `UPDATE images 
             SET processed = true, processing_error = $2 
             WHERE id = $1 
             RETURNING id`,
            [id, error]
        );
        return result.rows[0];
    }
}

module.exports = new ImageRepository();
