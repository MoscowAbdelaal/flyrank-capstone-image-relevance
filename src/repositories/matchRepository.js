const { pool } = require('../config/database');

class MatchRepository {
    async create(match) {
        const { post_id, image_id, similarity_score, guard_result } = match;
        
        const result = await pool.query(
            `INSERT INTO matches 
             (post_id, image_id, similarity_score, guard_result, status) 
             VALUES ($1, $2, $3, $4, $5) 
             RETURNING id, created_at`,
            [post_id, image_id, similarity_score, guard_result, 'pending']
        );
        
        return result.rows[0];
    }

    async findById(id) {
        const result = await pool.query(
            `SELECT m.*, p.title as post_title, i.filename as image_filename, i.subject as image_subject
             FROM matches m
             JOIN posts p ON m.post_id = p.id
             JOIN images i ON m.image_id = i.id
             WHERE m.id = $1`,
            [id]
        );
        return result.rows[0];
    }

    async findByPost(post_id) {
        const result = await pool.query(
            `SELECT m.*, i.filename, i.subject, i.category, i.caption, i.confidence
             FROM matches m
             JOIN images i ON m.image_id = i.id
             WHERE m.post_id = $1
             ORDER BY m.similarity_score DESC`,
            [post_id]
        );
        return result.rows;
    }

    async updateStatus(id, status) {
        const result = await pool.query(
            `UPDATE matches SET status = $1 WHERE id = $2 RETURNING *`,
            [status, id]
        );
        return result.rows[0];
    }

    async getPendingMatches() {
        const result = await pool.query(
            `SELECT m.*, p.title as post_title, i.filename as image_filename
             FROM matches m
             JOIN posts p ON m.post_id = p.id
             JOIN images i ON m.image_id = i.id
             WHERE m.status = 'pending'
             ORDER BY m.created_at ASC`
        );
        return result.rows;
    }
}

module.exports = new MatchRepository();
