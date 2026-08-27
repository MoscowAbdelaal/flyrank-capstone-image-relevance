# Design Document - AI Image Understanding & Content Matching Engine

## 1. Overview

A system that understands image content, organizes it automatically, and matches the right image to the right article. The core feature is a **mismatch guard** that rejects wrong matches with explanations.

**The 10x Claim:** What takes 30 minutes of manual image tagging and matching now takes 30 seconds with AI.

---

## 2. Data Models

### Images Table
```sql
CREATE TABLE images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    subject VARCHAR(100),
    category VARCHAR(50),
    attributes TEXT[],
    caption TEXT,
    confidence FLOAT,
    tags JSONB,
    embedding FLOAT[],
    processed BOOLEAN DEFAULT FALSE,
    processing_error TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
Posts Table

sql
CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    embedding FLOAT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
Matches Table

sql
CREATE TABLE matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    image_id UUID REFERENCES images(id) ON DELETE CASCADE,
    similarity_score FLOAT,
    status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected
    guard_result JSONB, -- { passed, reason, threshold_used }
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
Cost Log Table

sql
CREATE TABLE cost_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    operation VARCHAR(50), -- vision, embedding
    image_id UUID REFERENCES images(id),
    post_id UUID REFERENCES posts(id),
    model VARCHAR(100),
    tokens_used INT,
    cost FLOAT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
3. Image Metadata Schema (Structured Output)

The vision model must return this validated schema:

json
{
    "subject": "red fox",
    "category": "animal",
    "attributes": ["orange fur", "wild", "forest"],
    "caption": "A red fox standing in a forest clearing",
    "confidence": 0.94
}
Validation Rules:

subject: required, string, min 2 chars
category: required, one of: animal, plant, landscape, object, person
attributes: array of strings, min 1
caption: required, string, min 5 chars
confidence: required, float 0-1
4. Embedding Strategy

Image Embedding: Embed the caption text (not the image directly)

Post Embedding: Embed the post title + first 200 words

Similarity: Cosine similarity between embeddings

Threshold: 0.75 (tunable via eval set)

5. The Mismatch Guard

The guard decides if a match is good enough using three checks:

Check	What It Does	Fail Action
Category Match	Post subject category vs image category	Reject with "Category mismatch"
Confidence Check	Image confidence ≥ 0.7	Flag for review
Similarity Threshold	Cosine similarity ≥ 0.75	Reject with "Below similarity threshold"
Guard Response:

json
{
    "passed": false,
    "reason": "Category mismatch: expected fox, detected wolf",
    "threshold_used": 0.75,
    "similarity_score": 0.42
}
6. API Endpoints

Method	Endpoint	Description
POST	/api/images/upload	Upload image
POST	/api/images/process	Trigger batch processing
GET	/api/images	List images
GET	/api/images/:id	Get image metadata
POST	/api/posts	Create a post
GET	/api/posts	List posts
GET	/api/posts/:id/images	Get ranked image suggestions
POST	/api/matches/:id/approve	Approve a match
POST	/api/matches/:id/reject	Reject a match
GET	/api/cost-logs	View cost tracking
7. Background Job Flow

text
1. User uploads images
   ↓
2. Background job picks up unprocessed images
   ↓
3. For each image:
   a. Call Vision Model → structured tags
   b. Validate against schema
   c. If confidence < 0.7 → flag low confidence
   d. Generate embedding from caption
   e. Store in database
   f. Log cost
   ↓
4. Job completed → images ready for matching
8. Matching Flow

text
1. User creates a post
   ↓
2. Generate embedding from post content
   ↓
3. Find top 5 most similar images (cosine similarity)
   ↓
4. For each candidate:
   a. Run mismatch guard
   b. If guard passes → return as suggestion
   c. If guard fails → reject with explanation
   ↓
5. Return ranked suggestions with explanations
   ↓
6. User approves/rejects via review API
9. Non-Goal (What We Will NOT Build)

❌ No real CDN - local image serving is enough
❌ No complex frontend - API + simple test page
❌ No real production deployment - runs locally
❌ No multi-model comparison (stretch)
❌ No near-duplicate detection (stretch)
❌ No fallback image generation (stretch)
10. Timeline

Phase	Tasks	Time
Phase 0	Repository Setup	✅
Phase 1	Design Document	✅
Phase 2	Image Understanding Pipeline	14-20 hours
Phase 3	Matching Engine	12-16 hours
Phase 4	Production Layer	8-10 hours
11. Tech Stack

Layer	Choice
Backend	Node.js + Express
Database	PostgreSQL
Vision Model	Gemini Flash (free tier)
Embeddings	Gemini Embeddings
Validation	Zod
Background Jobs	Node-cron / Bull
Container	Docker Compose
