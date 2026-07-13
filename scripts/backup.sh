#!/bin/bash

# BAHub Database Backup Script
# This script creates automated backups of the PostgreSQL database
# and uploads them to S3-compatible storage (optional)

set -e

# Configuration
BACKUP_DIR="/tmp/bahub-backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="bahub_backup_${TIMESTAMP}.sql.gz"
RETENTION_DAYS=30

# Environment variables (set these in your environment or .env file)
DATABASE_URL="${DATABASE_URL:-}"
S3_BUCKET="${S3_BUCKET:-}"
AWS_ACCESS_KEY_ID="${AWS_ACCESS_KEY_ID:-}"
AWS_SECRET_ACCESS_KEY="${AWS_SECRET_ACCESS_KEY:-}"

# Create backup directory
mkdir -p "$BACKUP_DIR"

echo "[$(date)] Starting BAHub database backup..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "ERROR: DATABASE_URL environment variable is not set"
    exit 1
fi

# Extract database connection details from DATABASE_URL
# Format: postgres://user:password@host:port/dbname
DB_HOST=$(echo "$DATABASE_URL" | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo "$DATABASE_URL" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_NAME=$(echo "$DATABASE_URL" | sed -n 's/.*\/\([^?]*\).*/\1/p')
DB_USER=$(echo "$DATABASE_URL" | sed -n 's/\/\/\([^:]*\):.*/\1/p')
DB_PASSWORD=$(echo "$DATABASE_URL" | sed -n 's/.*:\([^@]*\)@.*/\1/p')

# Perform database backup
echo "[$(date)] Dumping database..."
PGPASSWORD="$DB_PASSWORD" pg_dump \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    --no-owner \
    --no-acl \
    --format=plain \
    --compress=9 \
    > "$BACKUP_DIR/$BACKUP_FILE"

# Verify backup was created
if [ ! -f "$BACKUP_DIR/$BACKUP_FILE" ]; then
    echo "ERROR: Backup file was not created"
    exit 1
fi

BACKUP_SIZE=$(du -h "$BACKUP_DIR/$BACKUP_FILE" | cut -f1)
echo "[$(date)] Backup created: $BACKUP_FILE ($BACKUP_SIZE)"

# Upload to S3 if configured
if [ -n "$S3_BUCKET" ] && [ -n "$AWS_ACCESS_KEY_ID" ] && [ -n "$AWS_SECRET_ACCESS_KEY" ]; then
    echo "[$(date)] Uploading to S3 bucket: $S3_BUCKET"
    
    # Install AWS CLI if not present
    if ! command -v aws &> /dev/null; then
        echo "AWS CLI not found, installing..."
        pip install awscli --quiet
    fi
    
    # Configure AWS credentials for this session
    export AWS_ACCESS_KEY_ID="$AWS_ACCESS_KEY_ID"
    export AWS_SECRET_ACCESS_KEY="$AWS_SECRET_ACCESS_KEY"
    
    # Upload to S3
    aws s3 cp "$BACKUP_DIR/$BACKUP_FILE" "s3://$S3_BUCKET/bahub-backups/$BACKUP_FILE"
    
    if [ $? -eq 0 ]; then
        echo "[$(date)] Successfully uploaded to S3"
    else
        echo "WARNING: Failed to upload to S3, local backup retained"
    fi
fi

# Clean up old backups (local and S3)
echo "[$(date)] Cleaning up backups older than $RETENTION_DAYS days..."

# Remove local backups older than retention period
find "$BACKUP_DIR" -name "bahub_backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete

# Remove old S3 backups if S3 is configured
if [ -n "$S3_BUCKET" ] && command -v aws &> /dev/null; then
    aws s3 ls "s3://$S3_BUCKET/bahub-backups/" | while read -r line; do
        FILE_DATE=$(echo "$line" | awk '{print $1" "$2}')
        FILE_NAME=$(echo "$line" | awk '{print $4}')
        
        # Convert file date to seconds since epoch
        FILE_EPOCH=$(date -d "$FILE_DATE" +%s 2>/dev/null || echo 0)
        CUTOFF_EPOCH=$(date -d "$RETENTION_DAYS days ago" +%s)
        
        if [ "$FILE_EPOCH" -lt "$CUTOFF_EPOCH" ]; then
            echo "Deleting old S3 backup: $FILE_NAME"
            aws s3 rm "s3://$S3_BUCKET/bahub-backups/$FILE_NAME"
        fi
    done
fi

echo "[$(date)] Backup completed successfully"
