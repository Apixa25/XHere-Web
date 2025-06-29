# 🧹 Cleanup System Documentation

## 📋 **Overview**
The cleanup system automatically removes expired locations to maintain data quality and prevent spam. It implements the 7-day auto-delete rule for general locations with a 2+ positive rating exception.

## 🎯 **Key Features**

### **General Locations (Free)**
- **7-day auto-delete**: Automatically deleted after 7 days
- **2+ rating exception**: Locations with 2+ positive ratings are preserved
- **Spam prevention**: Catches low-quality posts automatically

### **Paid Locations (100 credits)**
- **User-controlled deletion**: Users can set custom auto-delete times
- **No automatic expiration**: Only deleted if user sets auto-delete
- **Quality incentive**: Users pay credits, so they're less likely to post spam

## 🔧 **System Components**

### **1. CleanupService**
- `cleanupExpiredGeneralLocations()`: Handles 7-day rule for general locations
- `cleanupAllExpiredLocations()`: Handles all expired locations
- `getCleanupStats()`: Provides cleanup statistics

### **2. Scheduled Cleanup**
- `scheduledCleanup.js`: Script for cron job execution
- Runs daily to clean up expired locations
- Logs all cleanup activities

### **3. Admin Routes**
- `GET /api/admin/cleanup/stats`: Get cleanup statistics
- `POST /api/admin/cleanup/general`: Manual general cleanup
- `POST /api/admin/cleanup/all`: Manual full cleanup

## 🚀 **Usage**

### **Automatic Cleanup (Recommended)**
Set up a daily cron job:
```bash
# Run daily at 2 AM
0 2 * * * cd /path/to/backend && node scripts/scheduledCleanup.js
```

### **Manual Cleanup**
```bash
# Test the cleanup system
node scripts/test-cleanup.js

# Run scheduled cleanup manually
node scripts/scheduledCleanup.js
```

### **Admin Dashboard**
- Access cleanup stats via admin dashboard
- Monitor cleanup activities
- Run manual cleanup if needed

## 📊 **Cleanup Logic**

### **General Locations**
```javascript
if (locationType === 'general' && age > 7 days) {
  if (totalPoints >= 2) {
    preserve(); // Remove auto-delete flag
  } else {
    delete(); // Delete the location
  }
}
```

### **Paid Locations**
```javascript
if (autoDelete === true && deleteAt < now) {
  delete(); // Delete expired paid locations
}
```

## 🔍 **Monitoring**

### **Cleanup Statistics**
- Total general locations older than 7 days
- Number of expired locations
- Number of preserved locations (2+ ratings)
- Number of locations to be deleted

### **Logs**
- All cleanup activities are logged
- Preserved locations are logged with reason
- Deleted locations are logged with point count

## 🛡️ **Safety Features**

### **Transaction Safety**
- All cleanup operations use database transactions
- Rollback on errors to prevent data corruption
- Atomic operations for data consistency

### **Error Handling**
- Graceful error handling with detailed logging
- Continues processing even if individual locations fail
- Comprehensive error reporting

## 📈 **Performance**

### **Optimization**
- Efficient database queries with proper indexing
- Batch processing for large datasets
- Minimal database load during cleanup

### **Scalability**
- Handles large numbers of locations efficiently
- Configurable batch sizes
- Memory-efficient processing

## 🔧 **Configuration**

### **Environment Variables**
```bash
# Cleanup schedule (cron format)
CLEANUP_SCHEDULE="0 2 * * *"

# Batch size for processing
CLEANUP_BATCH_SIZE=100

# Log level
CLEANUP_LOG_LEVEL="info"
```

### **Database Indexes**
Ensure these indexes exist for optimal performance:
```sql
-- Location type and creation date
CREATE INDEX idx_locations_type_created ON Locations(locationType, createdAt);

-- Auto-delete and expiration
CREATE INDEX idx_locations_autodelete_expiry ON Locations(autoDelete, deleteAt);

-- Total points for general locations
CREATE INDEX idx_locations_general_points ON Locations(locationType, totalPoints) 
WHERE locationType = 'general';
```

## 🧪 **Testing**

### **Test Script**
```bash
node scripts/test-cleanup.js
```

### **Test Coverage**
- Database connection testing
- Cleanup statistics retrieval
- General locations cleanup
- All locations cleanup
- Error handling scenarios

## 📝 **Troubleshooting**

### **Common Issues**
1. **Cleanup not running**: Check cron job configuration
2. **Database errors**: Verify database connection and permissions
3. **Performance issues**: Check database indexes and batch sizes

### **Debug Mode**
Enable debug logging:
```bash
CLEANUP_LOG_LEVEL="debug" node scripts/scheduledCleanup.js
```

## 🔄 **Maintenance**

### **Regular Tasks**
- Monitor cleanup logs for errors
- Review cleanup statistics weekly
- Update cleanup rules as needed
- Optimize database queries periodically

### **Backup Considerations**
- Cleanup operations are destructive
- Ensure regular database backups
- Test cleanup in staging environment first

---

**File Location**: `/backend/docs/cleanup-system.md`
**Created**: [Current Date]
**Version**: 1.0 