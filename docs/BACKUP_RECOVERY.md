# BAHub Backup and Disaster Recovery Guide

## Overview

This document outlines the backup strategy and disaster recovery procedures for BAHub production deployments.

## Backup Strategy

### Automated Database Backups

The `scripts/backup.sh` script performs automated PostgreSQL database backups with the following features:

- **Frequency**: Run via cron job (recommended: daily at 2 AM UTC)
- **Retention**: 30 days
- **Compression**: gzip compression
- **Storage**: Local filesystem + optional S3-compatible storage
- **Format**: Plain SQL dump (no owner/ACL for portability)

### Environment Variables

Configure these environment variables for backup operations:

```bash
# Database connection (required)
DATABASE_URL=postgres://user:password@host:port/dbname

# S3 storage (optional but recommended)
S3_BUCKET=your-bucket-name
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
```

### Setting Up Automated Backups

#### Using Cron (Linux)

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM UTC
0 2 * * * /path/to/scripts/backup.sh >> /var/log/bahub-backup.log 2>&1
```

#### Using Render Cron Jobs

Add a cron job in your Render dashboard:

- **Command**: `bash scripts/backup.sh`
- **Schedule**: `0 2 * * *` (daily at 2 AM UTC)
- **Environment**: Attach all required environment variables

## Manual Backup

To perform a manual backup:

```bash
cd /path/to/BAHub
bash scripts/backup.sh
```

## Disaster Recovery

### Restoring from Backup

#### From Local Backup File

```bash
# Decompress the backup
gunzip bahub_backup_YYYYMMDD_HHMMSS.sql.gz

# Restore to database
PGPASSWORD=your_password psql \
  -h your-db-host \
  -p your-db-port \
  -U your-db-user \
  -d your-db-name \
  -f bahub_backup_YYYYMMDD_HHMMSS.sql
```

#### From S3 Backup

```bash
# Download from S3
aws s3 cp s3://your-bucket/bahub-backups/bahub_backup_YYYYMMDD_HHMMSS.sql.gz .

# Decompress and restore
gunzip bahub_backup_YYYYMMDD_HHMMSS.sql.gz
PGPASSWORD=your_password psql \
  -h your-db-host \
  -p your-db-port \
  -U your-db-user \
  -d your-db-name \
  -f bahub_backup_YYYYMMDD_HHMMSS.sql
```

### Point-in-Time Recovery (PostgreSQL)

If your database supports WAL archiving, you can recover to any point in time:

```bash
# Configure PostgreSQL for PITR in postgresql.conf
wal_level = replica
archive_mode = on
archive_command = 'cp %p /path/to/archive/%f'
max_wal_senders = 3
```

## Backup Verification

Regularly verify backup integrity:

```bash
# Test backup decompression
gunzip -t bahub_backup_YYYYMMDD_HHMMSS.sql.gz

# Test backup restoration to a temporary database
createdb test_restore
PGPASSWORD=your_password psql -d test_restore -f bahub_backup_YYYYMMDD_HHMMSS.sql
dropdb test_restore
```

## Monitoring

Monitor backup operations:

- Check backup logs: `/var/log/bahub-backup.log`
- Verify backup file creation in backup directory
- Monitor S3 bucket for successful uploads
- Set up alerts for backup failures

## Recovery Time Objective (RTO)

- **Database Restoration**: 15-30 minutes (depending on database size)
- **Application Deployment**: 5-10 minutes (Render auto-deploy)
- **Total RTO**: 20-40 minutes

## Recovery Point Objective (RPO)

- **Maximum Data Loss**: 24 hours (daily backups)
- **Recommended**: Implement continuous archiving for 1-hour RPO

## Additional Recommendations

1. **Multi-Region Backups**: Store backups in a different AWS region for disaster resilience
2. **Encryption**: Enable S3 bucket encryption for backup files
3. **Access Control**: Restrict backup script access to authorized users only
4. **Testing**: Perform quarterly disaster recovery drills
5. **Documentation**: Keep this document updated with any changes to backup procedures

## Contact

For backup-related issues or questions, contact your DevOps team or system administrator.
