const visionService = require('../services/visionService');
const imageRepository = require('../repositories/imageRepository');
const { validateImageMetadata } = require('../services/schemaValidation');

class ImageProcessor {
    async processAllImages() {
        console.log('📸 Starting image processing job...');
        
        const images = await imageRepository.getUnprocessedImages();
        
        if (images.length === 0) {
            console.log('✅ No unprocessed images found');
            return { processed: 0, errors: 0 };
        }
        
        console.log(`📊 Found ${images.length} images to process`);
        
        let processed = 0;
        let errors = 0;
        
        for (const image of images) {
            console.log(`\n--- Processing image ${processed + 1}/${images.length} ---`);
            console.log(`📸 Image: ${image.filename}`);
            console.log(`📁 Path: ${image.url}`);
            
            const fs = require('fs');
            if (!fs.existsSync(image.url)) {
                console.error(`❌ File not found: ${image.url}`);
                await imageRepository.markProcessed(image.id, 'File not found');
                errors++;
                continue;
            }
            
            try {
                const result = await visionService.analyzeImage(image.url);
                
                if (!result.success) {
                    console.error(`❌ Vision analysis failed:`, result.error);
                    if (result.details) {
                        console.error(`   Details:`, JSON.stringify(result.details, null, 2));
                    }
                    await imageRepository.markProcessed(image.id, result.error || 'Vision analysis failed');
                    errors++;
                    continue;
                }
                
                console.log(`✅ Vision result:`, JSON.stringify(result.data, null, 2));
                
                const metadataValidation = validateImageMetadata(result.data);
                if (!metadataValidation.valid) {
                    console.error(`❌ Metadata validation failed:`, metadataValidation.errors);
                    await imageRepository.markProcessed(image.id, 'Metadata validation failed');
                    errors++;
                    continue;
                }
                
                // Update image with metadata - attributes will be converted to PG array by repository
                await imageRepository.updateImage(image.id, {
                    subject: result.data.subject,
                    category: result.data.category,
                    attributes: result.data.attributes, // Array will be converted to PG format
                    caption: result.data.caption,
                    confidence: result.data.confidence,
                    tags: result.data,
                    processed: true
                });
                
                await visionService.logCost(
                    image.id,
                    'vision',
                    result.tokensUsed || 0,
                    result.cost || 0,
                    result.model || 'unknown'
                );
                
                console.log(`✅ Processed: ${result.data.subject} (${result.data.category})`);
                if (result.lowConfidence) {
                    console.log(`⚠️  Low confidence: ${result.data.confidence}`);
                }
                
                processed++;
                
            } catch (error) {
                console.error(`❌ Error processing ${image.filename}:`, error.message);
                console.error(`   Stack:`, error.stack);
                await imageRepository.markProcessed(image.id, error.message);
                errors++;
            }
        }
        
        console.log(`\n📊 Processing complete: ${processed} processed, ${errors} errors`);
        return { processed, errors };
    }
}

module.exports = new ImageProcessor();
