#!/bin/sh
set -e

# Create data directory if it doesn't exist
mkdir -p /app/data

# Initialize database
echo "Initializing database..."
cd /app
npx prisma db push --skip-generate 2>/dev/null || echo "Database already initialized"

# Start the server
echo "Starting server..."
exec node server.js