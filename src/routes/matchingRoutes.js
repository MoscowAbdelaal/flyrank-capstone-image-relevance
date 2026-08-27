const express = require('express');
const router = express.Router();
const matchingService = require('../services/matchingService');
const postRepository = require('../repositories/postRepository');
const matchRepository = require('../repositories/matchRepository');

// Create a post
router.post('/posts', async (req, res) => {
    try {
        const { title, content } = req.body;
        
        if (!title || !content) {
            return res.status(400).json({ error: 'Title and content are required' });
        }

        const post = await postRepository.create({ title, content });
        res.status(201).json(post);
    } catch (error) {
        console.error('❌ Post creation error:', error);
        res.status(500).json({ error: 'Failed to create post' });
    }
});

// Get all posts
router.get('/posts', async (req, res) => {
    try {
        const posts = await postRepository.findAll();
        res.json({ posts });
    } catch (error) {
        console.error('❌ List posts error:', error);
        res.status(500).json({ error: 'Failed to fetch posts' });
    }
});

// Get post by ID
router.get('/posts/:id', async (req, res) => {
    try {
        const post = await postRepository.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }
        res.json({ post });
    } catch (error) {
        console.error('❌ Get post error:', error);
        res.status(500).json({ error: 'Failed to fetch post' });
    }
});

// Generate embeddings for all posts
router.post('/posts/embed', async (req, res) => {
    try {
        const result = await matchingService.processPostEmbeddings();
        res.json(result);
    } catch (error) {
        console.error('❌ Post embedding error:', error);
        res.status(500).json({ error: 'Failed to generate embeddings' });
    }
});

// Find matches for a post
router.get('/posts/:id/matches', async (req, res) => {
    try {
        const result = await matchingService.findMatchesForPost(req.params.id);
        res.json(result);
    } catch (error) {
        console.error('❌ Matching error:', error);
        res.status(500).json({ error: error.message || 'Failed to find matches' });
    }
});

// Get all matches for a post
router.get('/posts/:id/matches/all', async (req, res) => {
    try {
        const matches = await matchRepository.findByPost(req.params.id);
        res.json({ matches });
    } catch (error) {
        console.error('❌ Get matches error:', error);
        res.status(500).json({ error: 'Failed to fetch matches' });
    }
});

// Get pending matches for review
router.get('/matches/pending', async (req, res) => {
    try {
        const matches = await matchingService.getPendingMatches();
        res.json({ matches });
    } catch (error) {
        console.error('❌ Pending matches error:', error);
        res.status(500).json({ error: 'Failed to fetch pending matches' });
    }
});

// Approve a match
router.post('/matches/:id/approve', async (req, res) => {
    try {
        const match = await matchingService.approveMatch(req.params.id);
        res.json({ match, status: 'approved' });
    } catch (error) {
        console.error('❌ Approve error:', error);
        res.status(500).json({ error: 'Failed to approve match' });
    }
});

// Reject a match
router.post('/matches/:id/reject', async (req, res) => {
    try {
        const match = await matchingService.rejectMatch(req.params.id);
        res.json({ match, status: 'rejected' });
    } catch (error) {
        console.error('❌ Reject error:', error);
        res.status(500).json({ error: 'Failed to reject match' });
    }
});

// Get cost logs
router.get('/cost-logs', async (req, res) => {
    try {
        const { pool } = require('../config/database');
        const result = await pool.query(
            'SELECT * FROM cost_logs ORDER BY created_at DESC LIMIT 50'
        );
        res.json({ costs: result.rows });
    } catch (error) {
        console.error('❌ Cost logs error:', error);
        res.status(500).json({ error: 'Failed to fetch cost logs' });
    }
});

module.exports = router;
