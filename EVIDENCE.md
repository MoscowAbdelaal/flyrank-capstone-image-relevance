# Evidence - AI Image Understanding & Content Matching Engine

## Definition of Done Checklist

### AI Processing
- [x] Vision model produces structured output validated against schema
- [x] Low-confidence classifications flagged
- [x] Images processed through batch job with retries
- [x] Vision and embedding costs tracked

### Matching System
- [x] Image and post embeddings stored
- [x] Posts return ranked image suggestions
- [x] Semantic matching works for equivalent concepts

### Safety Layer
- [x] Mismatch guard rejects incorrect recommendations
- [x] Rejections include human-readable explanation
- [x] "No confident match" with reasons

### Backend
- [x] Database models for images, tags, embeddings, posts
- [x] API endpoints validated
- [x] Review workflow exists

### Quality & Documentation
- [x] Eval dataset measures top-1 precision
- [x] README with architecture diagram

---

## Evidence Per Requirement

### PROBE 1: Batch Processing
```bash
npm run process:images
Result: All images processed with structured tags

PROBE 2: Red Fox Match

Result: Fox image ranks first; wolf and dog rank lower

PROBE 3: Mismatch Guard

Result: Wolf image rejected for fox post with explanation

PROBE 4: No Confident Match

Result: "No confident match" with reasons

PROBE 5: Evaluation

bash
npm run eval
Result: Top-1 precision measured and reported

PROBE 6: Cost Tracking

bash
curl http://localhost:3000/api/cost-logs
Result: Every vision/embedding call attributed with cost
