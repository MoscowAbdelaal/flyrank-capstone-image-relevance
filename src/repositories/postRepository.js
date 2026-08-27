const { pool } = require('../config/database');

class PostRepository {
    async create(post) {
        const { title, content, embedding } = post;
        
        const result = await pool.query(
            `INSERT INTO posts (title, content, embedding) 
             VALUES ($1, $2, $3) 
             RETURNING id, created_at`,
            [title, content, embedding]
        );
        
        return result.rows[0];
    }

    async findById(id) {
        const result = await pool.query(
            'SELECT * FROM posts WHERE id = $1',
            [id]
        );
        return result.rows[0];
    }

    async findAll() {
        const result = await pool.query(
            'SELECT * FROM posts ORDER BY created_at DESC'
        );
        return result.rows;
    }

    async updateEmbedding(id, embedding) {
        const result = await pool.query(
            `UPDATE posts SET embedding = $1 WHERE id = $2 RETURNING *`,
            [embedding, id]
        );
        return result.rows[0];
    }

    async delete(id) {
        const result = await pool.query(
            'DELETE FROM posts WHERE id = $1 RETURNING id',
            [id]
        );
        return result.rows[0];
    }
}

module.exports = new PostRepository();
