#!/bin/bash

# Script to run migrations on PROD database
# Usage: ./run-migration-prod.sh database/migrations/001_create_users.sql

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${RED}========================================${NC}"
echo -e "${RED}  ⚠️  Migration PROD - Supabase ⚠️${NC}"
echo -e "${RED}========================================${NC}"

# Check if migration file is provided
if [ -z "$1" ]; then
    echo -e "${RED}❌ Error: No migration file specified${NC}"
    echo "Usage: ./run-migration-prod.sh database/migrations/XXX_description.sql"
    exit 1
fi

MIGRATION_FILE=$1

# Check if file exists
if [ ! -f "$MIGRATION_FILE" ]; then
    echo -e "${RED}❌ Error: Migration file not found: $MIGRATION_FILE${NC}"
    exit 1
fi

# Load environment variables
if [ ! -f .env.prod ]; then
    echo -e "${RED}❌ Error: .env.prod file not found${NC}"
    echo "Please create .env.prod with your Supabase PROD credentials"
    exit 1
fi

source .env.prod

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}❌ Error: DATABASE_URL not set in .env.prod${NC}"
    exit 1
fi

echo -e "${RED}⚠️  Environment: PRODUCTION${NC}"
echo -e "${GREEN}✓ Migration file: $MIGRATION_FILE${NC}"
echo ""

# STRONG WARNING
echo -e "${RED}╔════════════════════════════════════════════╗${NC}"
echo -e "${RED}║  ⚠️  WARNING: PRODUCTION DATABASE ⚠️       ║${NC}"
echo -e "${RED}║                                            ║${NC}"
echo -e "${RED}║  This will modify the PRODUCTION database ║${NC}"
echo -e "${RED}║  Make sure you have tested in DEV first!  ║${NC}"
echo -e "${RED}╚════════════════════════════════════════════╝${NC}"
echo ""

# Double confirmation
read -p "Type 'PROD' to confirm you want to run this migration in PRODUCTION: " CONFIRM

if [ "$CONFIRM" != "PROD" ]; then
    echo -e "${RED}❌ Migration cancelled (incorrect confirmation)${NC}"
    exit 0
fi

echo ""
read -p "Are you absolutely sure? Type 'yes' to continue: " CONFIRM2

if [ "$CONFIRM2" != "yes" ]; then
    echo -e "${RED}❌ Migration cancelled${NC}"
    exit 0
fi

echo ""
echo -e "${YELLOW}Running migration on PRODUCTION...${NC}"

# Run the migration using psql
psql "$DATABASE_URL" -f "$MIGRATION_FILE"

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Migration completed successfully on PRODUCTION!${NC}"
    echo -e "${GREEN}========================================${NC}"
else
    echo ""
    echo -e "${RED}❌ Migration failed${NC}"
    exit 1
fi
