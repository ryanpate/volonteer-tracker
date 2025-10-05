#!/bin/bash
# Build frontend
cd frontend
npm install
npm run build

# Move build to Django static
cd ..
mkdir -p staticfiles
cp -r frontend/dist/* staticfiles/