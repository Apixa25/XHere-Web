# 🛡️ Duplicate Detection System Documentation

## 📋 **Overview**

The Duplicate Detection System is an AI-powered spam prevention feature that intelligently detects and prevents duplicate locations from being created. It uses multiple detection methods to ensure data quality and prevent spam.

## 🎯 **Features**

### **1. Similar Coordinate Detection**
- Detects locations within a specified radius (default: 50m)
- Uses PostGIS spatial queries for efficient geographic searches
- Calculates exact distances between locations
- Configurable search radius

### **2. Fuzzy Text Matching**
- Compares location descriptions using string similarity algorithms
- Configurable similarity threshold (default: 0.7)
- Handles variations in text formatting and spelling
- Returns similarity scores for each match

### **3. Clustering Pattern Detection**
- Analyzes user posting patterns over time windows
- Detects suspicious activity patterns:
  - Excessive posting (>5 locations in 24 hours)
  - Geographic clustering (locations too close together)
  - Content similarity (very similar descriptions)
  - Rapid posting (<5 minutes between posts)
- Calculates risk scores based on multiple factors

### **4. Comprehensive Risk Assessment**
- Combines all detection methods into a unified risk score
- Categorizes locations as: `clean`, `low_risk`, `medium_risk`, `high_risk`
- Provides specific recommendations for each risk level
- Generates detailed analysis reports

## 🔧 **API Endpoints**

### **GET /api/duplicate-detection/check**
Check for duplicates before creating a location.

**Parameters:**
- `latitude` (required): Location latitude
- `longitude` (required): Location longitude  
- `text` (required): Location description
- `locationType` (optional): Type of location

**Response:**
```json
{
  "success": true,
  "analysis": {
    "duplicateStatus": "medium_risk",
    "totalRiskScore": 45,
    "duplicateFlags": [...],
    "similarCoordinates": [...],
    "similarText": [...],
    "clusteringAnalysis": {...},
    "recommendations": [...]
  }
}
```

### **POST /api/duplicate-detection/report**
Report a location as a duplicate.

**Body:**
```json
{
  "locationId": "uuid",
  "analysis": {...}
}
```

### **GET /api/duplicate-detection/similar-coordinates**
Find locations with similar coordinates.

**Parameters:**
- `latitude` (required): Target latitude
- `longitude` (required): Target longitude
- `radius` (optional): Search radius in meters (default: 50)

### **GET /api/duplicate-detection/similar-text**
Find locations with similar text content.

**Parameters:**
- `text` (required): Text to search for
- `threshold` (optional): Similarity threshold 0-1 (default: 0.7)

### **GET /api/duplicate-detection/clustering-analysis**
Analyze user's posting patterns for clustering.

**Parameters:**
- `userId` (optional): User ID to analyze
- `timeWindow` (optional): Time window in hours (default: 24)
- `maxLocations` (optional): Max locations per window (default: 5)

### **GET /api/duplicate-detection/stats**
Get duplicate detection statistics.

**Parameters:**
- `userId` (optional): User ID to filter

### **POST /api/duplicate-detection/validate-location**
Comprehensive validation for new location creation.

**Body:**
```json
{
  "latitude": 40.7128,
  "longitude": -74.0060,
  "text": "Location description",
  "locationType": "general"
}
```

## 🎮 **Frontend Integration**

### **DuplicateDetectionAlert Component**
Displays warnings and alerts for potential duplicate locations.

**Props:**
- `analysis`: Duplicate analysis results
- `onDismiss`: Function to dismiss the alert
- `onProceed`: Function to proceed despite warnings
- `onModify`: Function to modify the location
- `isVisible`: Whether the alert is visible

**Usage:**
```jsx
import DuplicateDetectionAlert from './components/DuplicateDetectionAlert';

<DuplicateDetectionAlert
  analysis={duplicateAnalysis}
  onDismiss={() => setShowAlert(false)}
  onProceed={handleProceed}
  onModify={handleModify}
  isVisible={showAlert}
/>
```

### **DuplicateDetectionService**
Frontend service for API interactions.

**Methods:**
- `checkDuplicates(locationData)`: Check for duplicates
- `reportDuplicate(locationId, analysis)`: Report duplicate
- `findSimilarCoordinates(lat, lng, radius)`: Find nearby locations
- `findSimilarText(text, threshold)`: Find similar text
- `analyzeClustering(userId, timeWindow, maxLocations)`: Analyze patterns
- `getStats(userId)`: Get statistics
- `validateLocation(locationData)`: Validate location
- `preCheckLocation(locationData)`: Lightweight pre-check

## 🛡️ **Risk Assessment Algorithm**

### **Risk Score Calculation**
The system calculates a total risk score based on multiple factors:

1. **Coordinate Similarity (0-40 points)**
   - Very close (<25m): 40 points
   - Close (<50m): 20 points
   - Moderate (<100m): 10 points

2. **Text Similarity (0-35 points)**
   - Very similar (>90%): 35 points
   - Similar (>70%): 15 points
   - Moderate (>50%): 5 points

3. **Clustering Patterns (0-30 points)**
   - Excessive posting: 30 points
   - Geographic clustering: 20 points
   - Content similarity: 15 points
   - Rapid posting: 25 points

### **Risk Categories**
- **Clean (0-19 points)**: No issues detected
- **Low Risk (20-39 points)**: Minor concerns
- **Medium Risk (40-69 points)**: Manual review recommended
- **High Risk (70+ points)**: Automatic rejection

## 🔍 **Detection Methods**

### **1. Geographic Detection**
```javascript
// Uses PostGIS ST_DWithin for efficient spatial queries
const similarLocations = await Location.findAll({
  where: {
    location: sequelize.literal(`
      ST_DWithin(
        location::geometry, 
        ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326), 
        ${radiusMeters}
      )
    `)
  }
});
```

### **2. Text Similarity**
```javascript
// Uses string-similarity library for fuzzy matching
const similarity = stringSimilarity.compareTwoStrings(
  normalizedText1,
  normalizedText2
);
```

### **3. Clustering Analysis**
```javascript
// Analyzes multiple patterns:
// - Time-based clustering
// - Geographic clustering  
// - Content similarity
// - Rapid posting patterns
```

## 📊 **Configuration Options**

### **Service Configuration**
```javascript
// Default settings in duplicateDetectionService.js
const DEFAULT_RADIUS = 50; // meters
const DEFAULT_SIMILARITY_THRESHOLD = 0.7;
const DEFAULT_TIME_WINDOW = 24; // hours
const DEFAULT_MAX_LOCATIONS = 5;
```

### **Risk Thresholds**
```javascript
const RISK_THRESHOLDS = {
  HIGH_RISK: 70,
  MEDIUM_RISK: 40,
  LOW_RISK: 20
};
```

## 🧪 **Testing**

### **Run Test Script**
```bash
cd backend
node test-duplicate-detection.js
```

### **Test Scenarios**
1. **Similar Coordinates**: Test geographic proximity detection
2. **Similar Text**: Test fuzzy text matching
3. **Clustering Patterns**: Test user behavior analysis
4. **Comprehensive Detection**: Test full duplicate analysis
5. **Distance Calculation**: Test Haversine formula
6. **Statistics**: Test data collection

## 🚀 **Performance Considerations**

### **Database Optimization**
- Uses PostGIS spatial indexes for geographic queries
- Limits text similarity searches to recent locations
- Implements pagination for large result sets
- Caches frequently accessed data

### **API Performance**
- Async/await for concurrent operations
- Efficient error handling
- Request validation and sanitization
- Rate limiting for API endpoints

## 🔒 **Security Features**

### **Input Validation**
- Validates all coordinate inputs
- Sanitizes text content
- Prevents SQL injection in spatial queries
- Rate limiting for API endpoints

### **User Privacy**
- Respects anonymous location settings
- Filters sensitive user data in responses
- Implements proper authentication checks

## 📈 **Monitoring and Analytics**

### **Statistics Tracking**
- Total locations processed
- Flagged locations count
- Flag rate percentage
- Detection method effectiveness

### **Performance Metrics**
- Query execution times
- API response times
- Error rates and types
- User interaction patterns

## 🎯 **Best Practices**

### **For Developers**
1. Always validate location data before processing
2. Use appropriate similarity thresholds for your use case
3. Monitor system performance and adjust parameters
4. Test with real-world data scenarios
5. Implement proper error handling

### **For Users**
1. Provide unique, detailed descriptions
2. Ensure locations are sufficiently spaced apart
3. Avoid rapid posting of multiple locations
4. Include photos to distinguish locations
5. Follow community guidelines

## 🔄 **Future Enhancements**

### **Planned Features**
1. **Machine Learning Integration**: Advanced pattern recognition
2. **Image Analysis**: Photo similarity detection
3. **Behavioral Analysis**: User reputation scoring
4. **Community Feedback**: User-reported duplicates
5. **Automated Resolution**: Smart duplicate merging

### **Performance Improvements**
1. **Caching Layer**: Redis for frequent queries
2. **Background Processing**: Async duplicate detection
3. **Database Optimization**: Advanced indexing strategies
4. **API Optimization**: Response compression and caching

---

**File Location**: `/backend/docs/duplicate-detection-system.md`
**Created**: [Current Date]
**Version**: 1.0
**Related**: Data Quality Implementation Guide, Location Trading Implementation Guide 