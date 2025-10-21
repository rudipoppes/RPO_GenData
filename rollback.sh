#!/bin/bash

# Rollback Script for RPO GenData Service
# Restores from a backup created during deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

TIMESTAMP=${1:-$(ls /tmp/backups/rpo_backup_*.tar.gz 2>/dev/null | tail -1 | sed 's/.*rpo_backup_\([^)]*\)\.tar\.gz/\1/')}
BACKUP_DIR="/tmp/backups"
BACKUP_FILE="$BACKUP_DIR/rpo_backup_$TIMESTAMP.tar.gz"

if [ -z "$TIMESTAMP" ]; then
    echo -e "${RED}Error: No backup timestamp specified and no backups found${NC}"
    echo "Usage: ./rollback.sh <timestamp>"
    echo "Available backups:"
    ls /tmp/backups/rpo_backup_*.tar.gz 2>/dev/null || echo "  No backups found"
    exit 1
fi

echo -e "${GREEN}=== RPO GenData Rollback ===${NC}"
echo -e "${YELLOW}Rolling back to: $TIMESTAMP${NC}"
echo

# Check if backup exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}Error: Backup file not found: $BACKUP_FILE${NC}"
    exit 1
fi

# Stop service if running
echo "1. Stopping service..."
pkill -f "start_server.py" || true
pkill -f "uvicorn" || true
echo -e "${GREEN}✓${NC} Service stopped"

# Extract backup
echo
echo "2. Restoring from backup..."
tar -xzf "$BACKUP_FILE" -C /
echo -e "${GREEN}✓${NC} Files restored from backup"

# Restart service
echo
echo "3. Restarting service..."
./start_service.sh
echo -e "${GREEN}✓${NC} Service restarted"

echo
echo -e "${GREEN}=== Rollback Complete ===${NC}"
echo "System restored to state from: $TIMESTAMP"