#!/bin/bash

# Script to run migrations on DEV database
# Usage: ./run-migration-dev.sh database/migrations/001_create_users.sql

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}  Migration DEV - Supabase${NC}"
echo -e "${YELLOW}========================================${NC}"

# Check if migration file is provided
if [ -z "$1" ]; then
    echo -e "${RED}❌ Error: No migration file specified${NC}"
    echo "Usage: ./run-migration-dev.sh database/migrations/XXX_description.sql"
    exit 1
fi

MIGRATION_FILE=$1

# Check if file exists
if [ ! -f "$MIGRATION_FILE" ]; then
    echo -e "${RED}❌ Error: Migration file not found: $MIGRATION_FILE${NC}"
    exit 1
fi

# Load environment variables
if [ ! -f .env.dev ]; then
    echo -e "${RED}❌ Error: .env.dev file not found${NC}"
    echo "Please create .env.dev with your Supabase DEV credentials"
    exit 1
fi

source .env.dev

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}❌ Error: DATABASE_URL not set in .env.dev${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Environment: DEV${NC}"
echo -e "${GREEN}✓ Migration file: $MIGRATION_FILE${NC}"
echo ""

# Confirmation prompt
echo -e "${YELLOW}⚠️  You are about to run a migration on the DEV database${NC}"
read -p "Continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo -e "${RED}❌ Migration cancelled${NC}"
    exit 0
fi

echo ""
echo -e "${YELLOW}Running migration...${NC}"

# Run the migration using psql
psql "$DATABASE_URL" -f "$MIGRATION_FILE"

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Migration completed successfully on DEV!${NC}"
    echo -e "${GREEN}========================================${NC}"
else
    echo ""
    echo -e "${RED}❌ Migration failed${NC}"
    exit 1
fi
