const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const imageRepository = require('../repositories/imageRepository');
const imageProcessor = require('../jobs/imageProcessor');

// Configure multer for image uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../../data/images/uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only JPEG and PNG images are allowed'));
        }
    }
});

// Upload image
router.post('/images/upload', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image file uploaded' });
        }

        const image = {
            filename: req.file.filename,
            url: req.file.path,
            processed: false
        };

        const result = await imageRepository.create(image);
        
        res.status(201).json({
            id: result.id,
            filename: req.file.filename,
            url: req.file.path,
            message: 'Image uploaded successfully. Processing will start shortly.'
        });

    } catch (error) {
        console.error('❌ Upload error:', error);
        res.status(500).json({ error: 'Failed to upload image' });
    }
});

// Trigger batch processing
router.post('/images/process', async (req, res) => {
    try {
        const result = await imageProcessor.processAllImages();
        res.json(result);
    } catch (error) {
        console.error('❌ Processing error:', error);
        res.status(500).json({ error: 'Failed to process images' });
    }
});

// Get all images
router.get('/images', async (req, res) => {
    try {
        const images = await imageRepository.findAll();
        res.json({ images });
    } catch (error) {
        console.error('❌ List error:', error);
        res.status(500).json({ error: 'Failed to fetch images' });
    }
});

// Get image by ID
router.get('/images/:id', async (req, res) => {
    try {
        const image = await imageRepository.findById(req.params.id);
        if (!image) {
            return res.status(404).json({ error: 'Image not found' });
        }
        res.json({ image });
    } catch (error) {
        console.error('❌ Get error:', error);
        res.status(500).json({ error: 'Failed to fetch image' });
    }
});

module.exports = router;
