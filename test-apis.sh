#!/bin/bash

echo "🧪 Testing Admin API Endpoints..."
echo ""

# Get the server URL
SERVER_URL="http://localhost:3000"

# Test admin/stats endpoint
echo "1️⃣ Testing Admin Stats API:"
curl -s "$SERVER_URL/api/admin/stats" | jq . || echo "Stats API failed"
echo ""

# Test admin/users endpoint  
echo "2️⃣ Testing Admin Users API:"
curl -s "$SERVER_URL/api/admin/users" | jq '[.[] | {id, name, email, balance}]' || echo "Users API failed"
echo ""

# Test admin/calls endpoint
echo "3️⃣ Testing Admin Calls API:"
curl -s "$SERVER_URL/api/admin/calls" | jq '[.[] | {id, user: .user.name, fromNumber, toNumber, status, cost}]' || echo "Calls API failed"
echo ""

# Test admin/payments endpoint
echo "4️⃣ Testing Admin Payments API:"
curl -s "$SERVER_URL/api/admin/payments" | jq '[.[] | {id, user: .user.name, amount, status}]' || echo "Payments API failed"
echo ""

# Test admin/rates endpoint
echo "5️⃣ Testing Admin Rates API:"
curl -s "$SERVER_URL/api/admin/rates" | jq '[.[] | {id, country, countryCode, rate, isActive}] | sort_by(.country) | .[0:5]' || echo "Rates API failed"
echo ""

# Test admin/providers endpoint
echo "6️⃣ Testing Admin Providers API:"
curl -s "$SERVER_URL/api/admin/providers" | jq '[.[] | {id, provider, isActive, successRate, avgResponseTime}]' || echo "Providers API failed"
echo ""

echo "✅ API testing completed!"