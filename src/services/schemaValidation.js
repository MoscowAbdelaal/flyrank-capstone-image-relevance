const { z } = require('zod');

// Define the image metadata schema
const ImageMetadataSchema = z.object({
    subject: z.string().min(2, 'Subject must be at least 2 characters'),
    category: z.enum(['animal', 'plant', 'landscape', 'object', 'person', 'other']),
    attributes: z.array(z.string()).min(1, 'At least one attribute required'),
    caption: z.string().min(5, 'Caption must be at least 5 characters'),
    confidence: z.number().min(0).max(1, 'Confidence must be between 0 and 1')
});

// Define the raw vision response schema (what Gemini returns)
const VisionResponseSchema = z.object({
    subject: z.string(),
    category: z.string(),
    attributes: z.array(z.string()),
    caption: z.string(),
    confidence: z.number()
});

function validateImageMetadata(data) {
    try {
        const result = ImageMetadataSchema.safeParse(data);
        if (!result.success) {
            return {
                valid: false,
                errors: result.error.errors.map(e => ({
                    field: e.path.join('.'),
                    message: e.message
                }))
            };
        }
        return {
            valid: true,
            data: result.data
        };
    } catch (error) {
        return {
            valid: false,
            errors: [{ field: 'unknown', message: error.message }]
        };
    }
}

function validateVisionResponse(data) {
    try {
        const result = VisionResponseSchema.safeParse(data);
        if (!result.success) {
            return {
                valid: false,
                errors: result.error.errors.map(e => ({
                    field: e.path.join('.'),
                    message: e.message
                }))
            };
        }
        return {
            valid: true,
            data: result.data
        };
    } catch (error) {
        return {
            valid: false,
            errors: [{ field: 'unknown', message: error.message }]
        };
    }
}

function isLowConfidence(confidence, threshold = 0.7) {
    return confidence < threshold;
}

module.exports = {
    ImageMetadataSchema,
    VisionResponseSchema,
    validateImageMetadata,
    validateVisionResponse,
    isLowConfidence
};
