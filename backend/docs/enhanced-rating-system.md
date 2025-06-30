# Enhanced Rating System Documentation

## Overview

The Enhanced Rating System implements automatic location status management based on user ratings, providing a robust mechanism to maintain data quality and prevent misuse.

## Features

### 🎯 **Automatic Status Management**
- **5+ positive ratings** = Location becomes "verified"
- **5+ negative ratings** = Location becomes "flagged for removal"
- **Status tracking** with timestamps and reasons
- **General locations with 2+ points** are preserved from 7-day auto-delete

### 📊 **Status Types**
- `pending` - Default status for new locations
- `verified` - Location has received 5+ positive ratings
- `flagged` - Location has received 5+ negative ratings
- `removed` - Location has been manually removed by admin

### 🔄 **Status Transitions**
- Locations can improve from `flagged` to `pending` if ratings improve
- Status changes are logged with timestamps and reasons
- Manual admin overrides are supported

## Database Schema

### New Fields Added to Locations Table

```sql
-- Location status tracking
locationStatus ENUM('pending', 'verified', 'flagged', 'removed') DEFAULT 'pending'
statusUpdatedAt TIMESTAMP NULL
statusReason VARCHAR(255) NULL

-- Indexes for performance
INDEX idx_location_status (locationStatus)
INDEX idx_location_status_type (locationStatus, locationType)
```

## API Endpoints

### Vote System Integration
- **POST** `/votes/:locationId/vote` - Now includes status updates in response
- Status changes are triggered automatically when ratings reach thresholds

### Admin Management
- **GET** `/admin/location-status/stats` - Get status statistics
- **GET** `/admin/location-status/:status` - Get locations by status
- **PUT** `/admin/location-status/:locationId` - Manually update status
- **POST** `/admin/location-status/bulk-update` - Bulk update statuses
- **GET** `/admin/rating-analytics` - Get rating analytics

## Service Layer

### LocationStatusService

```javascript
// Update location status based on ratings
await locationStatusService.updateLocationStatus(locationId, options)

// Get status statistics
const stats = await locationStatusService.getStatusStats()

// Get locations by status
const locations = await locationStatusService.getLocationsByStatus('verified')

// Manual status update
await locationStatusService.manuallyUpdateStatus(locationId, 'removed', 'Reason')
```

## Frontend Integration

### Status Display
- Status badges with color coding and icons
- Status reason display for transparency
- Real-time status updates during voting

### Mobile App
- Status badges in marker content
- Status information in location cards
- Visual indicators for different statuses

## Rating Thresholds

| Action | Threshold | Result |
|--------|-----------|---------|
| Verify Location | 5+ upvotes | Status → `verified` |
| Flag Location | 5+ downvotes | Status → `flagged` |
| Preserve General | 2+ total points | Auto-delete disabled |
| Improve Status | <5 downvotes + 2+ upvotes | `flagged` → `pending` |

## General Location Preservation

General locations with 2+ total points are automatically preserved from the 7-day auto-delete system:

```javascript
if (location.locationType === 'general' && totalPoints >= 2) {
  location.autoDelete = false;
  location.deleteAt = null;
}
```

## Admin Tools

### Status Management Dashboard
- View locations by status
- Manual status updates with reasons
- Bulk operations for efficiency
- Analytics and reporting

### Rating Analytics
- Status distribution over time
- Rating patterns by location type
- Performance metrics
- Quality indicators

## Testing

### Test Script
Run the comprehensive test script:

```bash
node scripts/test-location-status.js
```

This script tests:
- Status transitions based on ratings
- General location preservation
- Manual status updates
- Statistics and analytics
- Error handling

## Migration

### Running the Migration
```bash
npx sequelize-cli db:migrate
```

### Rollback
```bash
npx sequelize-cli db:migrate:undo
```

## Monitoring

### Logs
Status changes are logged with detailed information:
```
📍 Location 123 status changed: pending → verified (6 positive ratings)
✅ General location 456 preserved from auto-delete (3 points)
🔧 Manual status update: Location 789 verified → removed (Manual admin update)
```

### Metrics
Track key metrics:
- Status distribution
- Rating patterns
- Quality improvements
- Admin intervention frequency

## Best Practices

### For Developers
1. Always use transactions for status updates
2. Include status information in API responses
3. Log status changes for audit trails
4. Handle edge cases gracefully

### For Admins
1. Review flagged locations regularly
2. Use manual updates sparingly
3. Monitor status distribution
4. Investigate unusual rating patterns

## Future Enhancements

### Planned Features
- **Reputation System** - User reputation affects rating weight
- **AI Spam Detection** - Machine learning for fake location detection
- **Community Moderation** - User-powered moderation tools
- **Advanced Analytics** - Detailed quality metrics and trends

### Integration Points
- **Notification System** - Alert users of status changes
- **Gamification** - Rewards for quality contributions
- **Reporting System** - Enhanced location reporting
- **Quality Scoring** - Algorithmic quality assessment

## Troubleshooting

### Common Issues

1. **Status not updating**
   - Check if location exists
   - Verify rating counts are correct
   - Ensure transaction is committed

2. **General locations still auto-deleting**
   - Verify totalPoints calculation
   - Check autoDelete field value
   - Confirm locationType is 'general'

3. **Admin routes not working**
   - Verify user has admin privileges
   - Check authentication middleware
   - Ensure proper route registration

### Debug Commands

```bash
# Check location status
node scripts/check-location-status.js

# Test status updates
node scripts/test-location-status.js

# View status statistics
curl -H "Authorization: Bearer TOKEN" http://localhost:3000/admin/location-status/stats
```

## Security Considerations

- Status updates require proper authentication
- Admin functions are restricted to admin users
- All changes are logged for audit purposes
- Rate limiting prevents abuse
- Input validation prevents injection attacks 