const fs = require('fs');
const path = require('path');
const https = require('https');

// Sample image URLs (Unsplash public domain / free images)
const IMAGES = [
    // Animals
    { url: 'https://images.unsplash.com/photo-1548608101-3b6eaa2f9b39?w=400&h=400&fit=crop', name: 'red_fox.jpg', category: 'animal' },
    { url: 'https://images.unsplash.com/photo-1568572933382-74d440642117?w=400&h=400&fit=crop', name: 'gray_wolf.jpg', category: 'animal' },
    { url: 'https://images.unsplash.com/photo-1546527868-ccb7ee7dfa6a?w=400&h=400&fit=crop', name: 'brown_bear.jpg', category: 'animal' },
    { url: 'https://images.unsplash.com/photo-1534361960057-19889db9621e?w=400&h=400&fit=crop', name: 'white_tailed_deer.jpg', category: 'animal' },
    { url: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=400&h=400&fit=crop', name: 'dog.jpg', category: 'animal' },
    // Plants
    { url: 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?w=400&h=400&fit=crop', name: 'oak_tree.jpg', category: 'plant' },
    { url: 'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=400&h=400&fit=crop', name: 'sunflower.jpg', category: 'plant' },
    { url: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=400&h=400&fit=crop', name: 'cactus.jpg', category: 'plant' },
    // Landscapes
    { url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop', name: 'mountain_landscape.jpg', category: 'landscape' },
    { url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=400&fit=crop', name: 'beach.jpg', category: 'landscape' },
    { url: 'https://images.unsplash.com/photo-1542406775-5dea5f4e2c63?w=400&h=400&fit=crop', name: 'forest.jpg', category: 'landscape' },
    // Objects
    { url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400&h=400&fit=crop', name: 'car.jpg', category: 'object' },
    { url: 'https://images.unsplash.com/photo-1503602642458-232111445657?w=400&h=400&fit=crop', name: 'chair.jpg', category: 'object' },
];

function downloadImage(url, filepath) {
    return new Promise((resolve, reject) => {
        https.get(url, (response) => {
            if (response.statusCode === 200) {
                const file = fs.createWriteStream(filepath);
                response.pipe(file);
                file.on('finish', () => {
                    file.close();
                    resolve();
                });
            } else {
                reject(new Error(`Failed to download: ${response.statusCode}`));
            }
        }).on('error', reject);
    });
}

async function downloadAllImages() {
    console.log('📸 Downloading sample images...');
    
    const imageDir = path.join(__dirname, '../../data/images');
    
    for (const img of IMAGES) {
        const categoryDir = path.join(imageDir, img.category);
        if (!fs.existsSync(categoryDir)) {
            fs.mkdirSync(categoryDir, { recursive: true });
        }
        
        const filepath = path.join(categoryDir, img.name);
        console.log(`📥 Downloading: ${img.name} (${img.category})`);
        
        try {
            await downloadImage(img.url, filepath);
            console.log(`✅ Downloaded: ${img.name}`);
        } catch (error) {
            console.error(`❌ Failed to download ${img.name}:`, error.message);
        }
    }
    
    console.log('\n✅ All images downloaded!');
    console.log('📁 Location: data/images/{category}/');
}

downloadAllImages().catch(console.error);
