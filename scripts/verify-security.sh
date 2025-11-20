#!/bin/bash

# CipherShare Security Verification Script
# Run this after deploying security fixes

set -e

echo "🔒 CipherShare Security Verification"
echo "===================================="
echo ""

API_URL="${1:-http://localhost:3001}"

echo "Testing API: $API_URL"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Security Headers
echo -n "1. Testing Security Headers... "
HEADERS=$(curl -s -I "$API_URL/api/health" 2>/dev/null)
if echo "$HEADERS" | grep -q "Strict-Transport-Security"; then
    if echo "$HEADERS" | grep -q "X-Content-Type-Options"; then
        echo -e "${GREEN}✓ PASS${NC}"
    else
        echo -e "${YELLOW}⚠ PARTIAL${NC} (Missing X-Content-Type-Options)"
    fi
else
    echo -e "${RED}✗ FAIL${NC} (Security headers missing)"
fi

# Test 2: Health Endpoint
echo -n "2. Testing Health Endpoint... "
HEALTH=$(curl -s "$API_URL/api/health" 2>/dev/null)
if echo "$HEALTH" | grep -q '"status":"ok"'; then
    echo -e "${GREEN}✓ PASS${NC}"
else
    echo -e "${RED}✗ FAIL${NC}"
fi

# Test 3: Metadata Endpoint
echo -n "3. Testing Metadata Endpoint... "
METADATA=$(curl -s "$API_URL/api/config/metadata" 2>/dev/null)
if echo "$METADATA" | grep -q 'captchaEnabled'; then
    echo -e "${GREEN}✓ PASS${NC}"
else
    echo -e "${RED}✗ FAIL${NC}"
fi

# Test 4: Rate Limiting Headers
echo -n "4. Testing Rate Limit Headers... "
RATE_HEADERS=$(curl -s -I "$API_URL/api/health" 2>/dev/null)
if echo "$RATE_HEADERS" | grep -q "RateLimit-Limit"; then
    echo -e "${GREEN}✓ PASS${NC}"
else
    echo -e "${YELLOW}⚠ WARNING${NC} (Rate limit headers not found)"
fi

# Test 5: Large Payload Rejection
echo -n "5. Testing Request Size Limit... "
LARGE_PAYLOAD=$(dd if=/dev/zero bs=1024 count=200 2>/dev/null | base64)
RESPONSE=$(curl -s -X POST "$API_URL/api/requests" \
    -H "Content-Type: application/json" \
    -d "{\"data\":\"$LARGE_PAYLOAD\"}" \
    -w "%{http_code}" -o /dev/null 2>/dev/null)
if [ "$RESPONSE" = "413" ] || [ "$RESPONSE" = "400" ]; then
    echo -e "${GREEN}✓ PASS${NC} (Rejected)"
else
    echo -e "${YELLOW}⚠ WARNING${NC} (Got HTTP $RESPONSE)"
fi

# Test 6: CORS Headers
echo -n "6. Testing CORS Configuration... "
CORS=$(curl -s -I "$API_URL/api/health" -H "Origin: http://malicious.com" 2>/dev/null)
if echo "$CORS" | grep -q "Access-Control-Allow-Origin"; then
    ALLOWED_ORIGIN=$(echo "$CORS" | grep "Access-Control-Allow-Origin" | cut -d' ' -f2)
    if [ "$ALLOWED_ORIGIN" = "*" ]; then
        echo -e "${RED}✗ FAIL${NC} (Allows all origins)"
    else
        echo -e "${GREEN}✓ PASS${NC} (Restricted)"
    fi
else
    echo -e "${GREEN}✓ PASS${NC} (CORS blocked)"
fi

echo ""
echo "===================================="
echo "Verification Complete!"
echo ""
echo "Notes:"
echo "- For full security audit, use professional tools"
echo "- Test in staging before production"
echo "- Monitor logs for unusual activity"
echo ""
