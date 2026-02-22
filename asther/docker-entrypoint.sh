#!/bin/sh
set -e

echo "Running database migrations..."
bun run db:push

echo "Seeding database..."
bun run db:seed

echo "Starting server..."
exec bun server.js
