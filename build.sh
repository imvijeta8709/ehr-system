#!/bin/bash
set -e

echo "📦 Building React frontend..."
cd frontend
npm install
npm run build

echo "📁 Copying build to backend/client..."
cd ..
rm -rf backend/client
cp -r frontend/build backend/client

echo "✅ Build complete! Now run: cd backend && npm start"
