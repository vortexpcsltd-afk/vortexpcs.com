# Strapi Backup and Restore Guide

## Automatic Database Backup

To prevent data loss, you can regularly backup your Strapi database:

### Create Backup
```powershell
# Navigate to your Strapi folder
cd "c:\Users\Gamer\Desktop\Vortex PCs Latest 191025\vortex-cms"

# Create backup with timestamp
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
Copy-Item ".tmp\data.db" "backups\data_backup_$timestamp.db"
```

### Restore Backup
```powershell
# Stop Strapi first, then restore
Copy-Item "backups\data_backup_YYYY-MM-DD_HH-mm-ss.db" ".tmp\data.db"
```

## Export/Import Content

You can also export content types and data:

### Export Data
```powershell
npx strapi export --file backup_$(Get-Date -Format "yyyy-MM-dd").tar.gz
```

### Import Data
```powershell
npx strapi import --file backup_YYYY-MM-DD.tar.gz
```

## Quick Recovery Steps

If you lose your admin account or data:
1. Stop Strapi
2. Restore database from backup
3. Restart Strapi
4. Your admin account and content will be restored

## Prevention

- **Always use port 1338** (now set permanently)
- **Regular backups** (weekly recommended)
- **Export content types** after major changes