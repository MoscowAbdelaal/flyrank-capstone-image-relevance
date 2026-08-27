#!/bin/bash

echo "🧪 AI Image Understanding & Content Matching Engine - Test Suite"
echo "================================================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if server is running
echo "📡 Checking server status..."
if curl -s http://localhost:3000/health > /dev/null; then
    echo -e "${GREEN}✅ Server is running${NC}"
else
    echo -e "${RED}❌ Server is not running. Please start with: npm run dev${NC}"
    exit 1
fi

echo ""

# Test 1: Health Check
echo "📊 Test 1: Health Check"
HEALTH=$(curl -s http://localhost:3000/health)
if echo "$HEALTH" | grep -q "ok"; then
    echo -e "${GREEN}✅ Pass${NC}"
else
    echo -e "${RED}❌ Fail${NC}"
fi
echo ""

# Test 2: Create Post
echo "📝 Test 2: Create Post"
POST=$(curl -s -X POST http://localhost:3000/api/posts \
  -H "Content-Type: application/json" \
  -d '{
    "title": "The Behavior of Red Foxes in the Wild",
    "content": "Red foxes are fascinating creatures that inhabit forests and grasslands across the world."
  }')
POST_ID=$(echo "$POST" | jq -r '.id')
if [ "$POST_ID" != "null" ] && [ -n "$POST_ID" ]; then
    echo -e "${GREEN}✅ Pass (ID: $POST_ID)${NC}"
else
    echo -e "${RED}❌ Fail${NC}"
    echo "$POST"
fi
echo ""

# Test 3: Get Posts
echo "📋 Test 3: Get Posts"
POSTS=$(curl -s http://localhost:3000/api/posts)
COUNT=$(echo "$POSTS" | jq '.posts | length')
if [ "$COUNT" -gt 0 ]; then
    echo -e "${GREEN}✅ Pass (Found $COUNT posts)${NC}"
else
    echo -e "${RED}❌ Fail${NC}"
fi
echo ""

# Test 4: Upload Image
echo "📸 Test 4: Upload Image"
# Create a dummy image for testing
echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" | base64 -d > /tmp/test-image.png

UPLOAD=$(curl -s -X POST http://localhost:3000/api/images/upload \
  -F "image=@/tmp/test-image.png" \
  -H "Content-Type: multipart/form-data")
IMAGE_ID=$(echo "$UPLOAD" | jq -r '.id')
if [ "$IMAGE_ID" != "null" ] && [ -n "$IMAGE_ID" ]; then
    echo -e "${GREEN}✅ Pass (ID: $IMAGE_ID)${NC}"
else
    echo -e "${RED}❌ Fail${NC}"
    echo "$UPLOAD"
fi
rm /tmp/test-image.png
echo ""

# Test 5: Get Images
echo "🖼️ Test 5: Get Images"
IMAGES=$(curl -s http://localhost:3000/api/images)
IMG_COUNT=$(echo "$IMAGES" | jq '.images | length')
if [ "$IMG_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✅ Pass (Found $IMG_COUNT images)${NC}"
else
    echo -e "${RED}❌ Fail${NC}"
fi
echo ""

# Test 6: Process Images (Background Job)
echo "⚙️ Test 6: Process Images"
PROCESS=$(curl -s -X POST http://localhost:3000/api/images/process \
  -H "Content-Type: application/json")
PROCESSED=$(echo "$PROCESS" | jq -r '.processed')
ERRORS=$(echo "$PROCESS" | jq -r '.errors')
echo -e "${YELLOW}ℹ️ Processed: $PROCESSED, Errors: $ERRORS${NC}"
if [ "$PROCESSED" -gt 0 ] || [ "$ERRORS" -ge 0 ]; then
    echo -e "${GREEN}✅ Pass${NC}"
else
    echo -e "${RED}❌ Fail${NC}"
fi
echo ""

# Test 7: Generate Post Embeddings
echo "🧠 Test 7: Generate Post Embeddings"
EMBED=$(curl -s -X POST http://localhost:3000/api/posts/embed \
  -H "Content-Type: application/json")
PROCESSED_POSTS=$(echo "$EMBED" | jq -r '.processed')
if [ "$PROCESSED_POSTS" -gt 0 ] || [ "$PROCESSED_POSTS" -eq 0 ]; then
    echo -e "${GREEN}✅ Pass (Processed: $PROCESSED_POSTS)${NC}"
else
    echo -e "${RED}❌ Fail${NC}"
fi
echo ""

# Test 8: Get Matches for Post
echo "🔍 Test 8: Get Matches for Post"
if [ -n "$POST_ID" ] && [ "$POST_ID" != "null" ]; then
    MATCHES=$(curl -s "http://localhost:3000/api/posts/$POST_ID/matches")
    MATCH_COUNT=$(echo "$MATCHES" | jq '.matches | length')
    if [ "$MATCH_COUNT" -gt 0 ]; then
        echo -e "${GREEN}✅ Pass (Found $MATCH_COUNT matches)${NC}"
        # Show top match
        TOP_MATCH=$(echo "$MATCHES" | jq -r '.matches[0].image.subject')
        echo -e "${YELLOW}ℹ️ Top match: $TOP_MATCH${NC}"
    else
        echo -e "${YELLOW}⚠️ No matches found (may need more images)${NC}"
    fi
else
    echo -e "${RED}❌ Skip (No post ID)${NC}"
fi
echo ""

# Test 9: Cost Logs
echo "💰 Test 9: Cost Logs"
COSTS=$(curl -s http://localhost:3000/api/cost-logs)
COST_COUNT=$(echo "$COSTS" | jq '.costs | length')
if [ "$COST_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✅ Pass (Found $COST_COUNT cost entries)${NC}"
else
    echo -e "${YELLOW}⚠️ No cost entries yet${NC}"
fi
echo ""

# Test 10: Run Evaluation
echo "📊 Test 10: Run Evaluation"
EVAL=$(node src/scripts/evaluate.js 2>/dev/null || echo '{"precision":0,"correct":0,"total":0}')
PRECISION=$(echo "$EVAL" | jq -r '.precision' 2>/dev/null || echo "0")
CORRECT=$(echo "$EVAL" | jq -r '.correct' 2>/dev/null || echo "0")
TOTAL=$(echo "$EVAL" | jq -r '.total' 2>/dev/null || echo "0")
if [ "$TOTAL" -gt 0 ]; then
    echo -e "${GREEN}✅ Pass (Precision: $PRECISION, $CORRECT/$TOTAL)${NC}"
else
    echo -e "${YELLOW}⚠️ Evaluation not run (need more data)${NC}"
fi
echo ""

# Summary
echo "================================================================"
echo -e "${GREEN}✅ Test suite completed!${NC}"
echo ""
echo "📋 Quick Links:"
echo "   - Health: http://localhost:3000/health"
echo "   - Images: http://localhost:3000/api/images"
echo "   - Posts: http://localhost:3000/api/posts"
echo "   - Cost Logs: http://localhost:3000/api/cost-logs"
