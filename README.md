# AI Image Understanding & Content Matching Engine

A system that understands image content, organizes it automatically, and matches the right image to the right article — with a mismatch guard that rejects wrong matches.

## 🎯 The Problem

Blog posts need relevant images, but manual tagging is time-consuming and error-prone. A post about red foxes shouldn't show a wolf. This system uses AI to understand images and match them to content — and crucially, **rejects** wrong matches with explanations.

## 💡 The Solution

1. **Vision understanding** — Gemini analyzes images and extracts: subject, category, attributes, caption, and confidence score
2. **Semantic matching** — Embeddings capture meaning, matching "red fox" to "Vulpes vulpes" 
3. **Mismatch guard** — Three safety checks before recommending: confidence, similarity, and category match
4. **Explainability** — Every rejection includes a human-readable reason

## 🏗️ Architecture
Images → Vision Model → Structured Tags → Embeddings
↓
Posts → Embeddings → Similarity Search → Mismatch Guard → Recommendations
↓
Rejections with Explanations

text

## 📊 7 Concepts Implemented

| # | Concept | Implementation |
|---|---------|----------------|
| 1 | API endpoints | Express REST API with validation |
| 2 | Database | PostgreSQL with migrations |
| 3 | Background Jobs | Image processing with retries |
| 4 | LLM Integration | Gemini Flash with structured output |
| 5 | Cost Tracking | Per-call cost logging |
| 6 | Schema Validation | Zod for structured output |
| 7 | Human-in-the-loop | Review API (approve/reject) |

## 🚀 Quick Start

```bash
# Clone and setup
git clone https://github.com/MoscowAbdelaal/flyrank-capstone-image-relevance.git
cd flyrank-capstone-image-relevance

# Start database
docker-compose up -d

# Install dependencies
npm install

# Run migrations and seed
npm run migrate
npm run seed

# Start server
npm run dev
🔧 API Endpoints

Method	Endpoint	Description
POST	/api/images/upload	Upload image
POST	/api/images/process	Process all images
GET	/api/images	List images
POST	/api/posts	Create post
GET	/api/posts/:id/matches	Get ranked matches
POST	/api/matches/:id/approve	Approve match
POST	/api/matches/:id/reject	Reject match
GET	/api/cost-logs	View costs
📊 Evaluation

bash
npm run eval
Expected top-1 precision: ≥70%

📚 Tech Stack

Backend: Node.js + Express
Database: PostgreSQL
Vision Model: Gemini Flash (free tier)
Embeddings: Gemini Embeddings
Validation: Zod
Container: Docker Compose
📄 License

MIT

👨‍💻 Author

Marwan Abdelaal — FlyRank Internship, Backend Track
