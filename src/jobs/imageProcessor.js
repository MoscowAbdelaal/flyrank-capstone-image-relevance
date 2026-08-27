const visionService = require('../services/visionService');
const imageRepository = require('../repositories/imageRepository');
const { validateImageMetadata } = require('../services/schemaValidation');

class ImageProcessor {
    async processAllImages() {
        console.log('📸 Starting image processing job...');
        
        // Get unprocessed images
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
            
            try {
                // Analyze image with vision model
                const result = await visionService.analyzeImage(image.url);
                
                if (!result.success) {
                    console.error(`❌ Failed to process ${image.filename}:`, result.error);
                    await imageRepository.markProcessed(image.id, result.error);
                    errors++;
                    continue;
                }
                
                // Validate the extracted metadata
                const metadataValidation = validateImageMetadata(result.data);
                if (!metadataValidation.valid) {
                    console.error(`❌ Metadata validation failed for ${image.filename}:`, metadataValidation.errors);
                    await imageRepository.markProcessed(image.id, 'Metadata validation failed');
                    errors++;
                    continue;
                }
                
                // Update image with metadata
                await imageRepository.updateImage(image.id, {
                    subject: result.data.subject,
                    category: result.data.category,
                    attributes: result.data.attributes,
                    caption: result.data.caption,
                    confidence: result.data.confidence,
                    tags: result.data,
                    processed: true
                });
                
                // Log cost
                await visionService.logCost(
                    image.id,
                    'vision',
                    result.tokensUsed,
                    result.cost,
                    result.model
                );
                
                console.log(`✅ Processed: ${result.data.subject} (${result.data.category})`);
                if (result.lowConfidence) {
                    console.log(`⚠️  Low confidence: ${result.data.confidence}`);
                }
                
                processed++;
                
            } catch (error) {
                console.error(`❌ Error processing ${image.filename}:`, error.message);
                await imageRepository.markProcessed(image.id, error.message);
                errors++;
            }
        }
        
        console.log(`\n📊 Processing complete: ${processed} processed, ${errors} errors`);
        return { processed, errors };
    }
}

module.exports = new ImageProcessor();
