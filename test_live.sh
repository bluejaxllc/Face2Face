#!/bin/bash
BASE_URL="https://face2face-produuction-11ee.up.railway.app"
USER="verify_bot_$(date +%s)"

echo "1. Registering..."
curl -s -c cookies.txt -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"username\": \"$USER\", \"email\": \"$USER@test.com\", \"password\": \"password123\", \"firstName\": \"Test\", \"lastName\": \"Bot\", \"gender\": \"male\", \"age\": 25, \"selfRating\": 5}" > /dev/null

echo "2. Setting Location..."
curl -s -b cookies.txt -X POST "$BASE_URL/api/users/location" \
  -H "Content-Type: application/json" \
  -d "{\"latitude\": 32.8735, \"longitude\": -96.5305}" > /dev/null

echo "3. Updating Profile Preference..."
curl -s -b cookies.txt -X PATCH "$BASE_URL/api/users/profile" \
  -H "Content-Type: application/json" \
  -d "{\"datingPreference\": \"both\"}" > /dev/null

echo "4. Fetching Nearby Map Users..."
curl -s -b cookies.txt "$BASE_URL/api/users/nearby" > nearby.json

count=$(grep -o '"username"' nearby.json | wc -l)
echo "Nearby users found on map: $count"

if [ "$count" -gt 0 ]; then
  cat nearby.json | grep -o '"username":"[^"]*"' | cut -d'"' -f4
fi
