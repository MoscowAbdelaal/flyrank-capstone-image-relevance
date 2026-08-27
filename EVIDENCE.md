# Evidence - AI Image Understanding & Content Matching Engine

## Definition of Done Checklist

### AI Processing
- [ ] Vision model produces structured output validated against schema
- [ ] Low-confidence classifications flagged
- [ ] Images processed through batch job with retries
- [ ] Vision and embedding costs tracked

### Matching System
- [ ] Image and post embeddings stored
- [ ] Posts return ranked image suggestions
- [ ] Semantic matching works for equivalent concepts

### Safety Layer
- [ ] Mismatch guard rejects incorrect recommendations
- [ ] Rejections include human-readable explanation
- [ ] "No confident match" with reasons

### Backend
- [ ] Database models for images, tags, embeddings, posts
- [ ] API endpoints validated
- [ ] Review workflow exists

### Quality & Documentation
- [ ] Eval dataset measures top-1 precision
- [ ] README with architecture diagram

## Evidence Per Requirement

[To be filled as we build]
