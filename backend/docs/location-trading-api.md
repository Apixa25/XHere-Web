# 🏪 Location Trading API Documentation

## 📋 **Overview**
The Location Trading API provides endpoints for purchasing locations, managing ownership, and handling the credit-based economy. All prices use a doubling algorithm where each purchase doubles the price.

## 🔐 **Authentication**
All private endpoints require a valid JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## 💰 **Credit System**
- Base location price: 100 credits
- Price doubles with each purchase (100 → 200 → 400 → 800...)
- Making a location official costs 3 credits
- Platform takes 20% fee on sales, seller gets 80%

---

## 🛒 **Purchase Endpoints**

### **Purchase Location**
```http
POST /api/ownership/purchase
```

**Request Body:**
```json
{
  "locationId": "uuid-of-location"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Location purchased successfully!",
  "ownership": {
    "id": "uuid",
    "locationId": "uuid",
    "ownerId": "uuid",
    "currentPrice": 200,
    "purchaseCount": 1,
    "isOfficial": false,
    "owner": {
      "id": "uuid",
      "username": "buyer",
      "email": "buyer@example.com"
    },
    "location": {
      "id": "uuid",
      "title": "Cool Spot",
      "description": "Amazing location"
    }
  },
  "pricePaid": 100,
  "nextPrice": 200,
  "purchaseCount": 1
}
```

**Error Responses:**
- `400` - Insufficient credits, already owned, location not found
- `401` - Not authenticated
- `500` - Server error

---

## 📊 **Information Endpoints**

### **Get Location Ownership**
```http
GET /api/ownership/:locationId
```

**Response:**
```json
{
  "success": true,
  "ownership": {
    "id": "uuid",
    "locationId": "uuid",
    "ownerId": "uuid",
    "currentPrice": 100,
    "purchaseCount": 0,
    "isOfficial": false,
    "nextPrice": 200,
    "priceInfo": {
      "currentPrice": 100,
      "nextPrice": 200,
      "priceIncrease": 100,
      "priceIncreasePercentage": "100.0",
      "purchaseCount": 0,
      "basePrice": 100,
      "priceHistory": [...]
    },
    "owner": {...},
    "location": {...}
  }
}
```

### **Get Location Price Information**
```http
GET /api/ownership/:locationId/price
```

**Response:**
```json
{
  "success": true,
  "priceInfo": {
    "currentPrice": 100,
    "nextPrice": 200,
    "purchaseCount": 0,
    "isOfficial": false,
    "owner": {...},
    "location": {...},
    "priceInfo": {
      "currentPrice": 100,
      "nextPrice": 200,
      "priceIncrease": 100,
      "priceIncreasePercentage": "100.0",
      "purchaseCount": 0,
      "basePrice": 100,
      "priceHistory": [...]
    },
    "priceTrend": {
      "currentPrice": 100,
      "nextPrice": 200,
      "priceIncrease": 100,
      "priceIncreasePercentage": "100.0",
      "purchasesUntilMax": 13,
      "isNearMax": false,
      "trend": "early"
    }
  }
}
```

### **Validate Purchase**
```http
GET /api/ownership/:locationId/validate
```

**Response:**
```json
{
  "success": true,
  "validation": {
    "canPurchase": true,
    "currentPrice": 100,
    "currentPriceFormatted": "100 credits",
    "nextPrice": 200,
    "nextPriceFormatted": "200 credits",
    "userCredits": 500,
    "priceInfo": {
      "currentPrice": 100,
      "nextPrice": 200,
      "priceIncrease": 100,
      "priceIncreasePercentage": "100.0",
      "purchaseCount": 0,
      "basePrice": 100,
      "priceHistory": [...]
    },
    "userCredits": 500
  }
}
```

**Error Response (Insufficient Credits):**
```json
{
  "success": false,
  "validation": {
    "canPurchase": false,
    "reason": "Insufficient credits",
    "required": 100,
    "requiredFormatted": "100 credits",
    "available": 50
  }
}
```

---

## ✅ **Official Status Endpoints**

### **Make Location Official**
```http
POST /api/ownership/:locationId/official
```

**Response:**
```json
{
  "success": true,
  "message": "Location is now official!",
  "ownership": {
    "id": "uuid",
    "locationId": "uuid",
    "ownerId": "uuid",
    "currentPrice": 100,
    "purchaseCount": 0,
    "isOfficial": true
  }
}
```

**Error Responses:**
- `400` - Insufficient credits (need 3), don't own location, already official
- `401` - Not authenticated

---

## 📜 **History Endpoints**

### **Get Purchase History**
```http
GET /api/ownership/:locationId/history
```

**Response:**
```json
{
  "success": true,
  "history": [
    {
      "id": "uuid",
      "locationId": "uuid",
      "buyerId": "uuid",
      "pricePaid": 100,
      "purchasedAt": "2024-01-15T10:30:00.000Z",
      "buyer": {
        "id": "uuid",
        "username": "buyer1",
        "email": "buyer1@example.com"
      },
      "location": {
        "id": "uuid",
        "title": "Cool Spot",
        "description": "Amazing location"
      }
    }
  ]
}
```

---

## 👤 **User Endpoints**

### **Get User's Owned Locations**
```http
GET /api/ownership/user/me
```

**Response:**
```json
{
  "success": true,
  "ownedLocations": [
    {
      "id": "uuid",
      "locationId": "uuid",
      "ownerId": "uuid",
      "currentPrice": 200,
      "purchaseCount": 1,
      "isOfficial": false,
      "owner": {...},
      "location": {...}
    }
  ],
  "userCredits": 500
}
```

### **Get Specific User's Owned Locations**
```http
GET /api/ownership/user/:userId
```

**Note:** Users can only view their own owned locations.

---

## 🔢 **Price Calculation**

### **Doubling Algorithm**
- Purchase 0: 100 credits
- Purchase 1: 200 credits  
- Purchase 2: 400 credits
- Purchase 3: 800 credits
- Purchase 4: 1,600 credits
- And so on...

### **Formula**
```
Price = BasePrice × (2 ^ PurchaseCount)
```

### **Price Validation**
- Maximum reasonable price: 1,000,000 credits
- Maximum purchase count: ~13 (before price becomes unreasonable)

---

## 🚨 **Error Codes**

| Code | Description |
|------|-------------|
| `400` | Bad Request (insufficient credits, validation errors) |
| `401` | Unauthorized (missing or invalid token) |
| `403` | Forbidden (trying to access another user's data) |
| `404` | Not Found (location doesn't exist) |
| `500` | Internal Server Error |

---

## 📝 **Example Usage**

### **Complete Purchase Flow**
```javascript
// 1. Validate purchase
const validation = await fetch('/api/ownership/location-id/validate', {
  headers: { 'Authorization': `Bearer ${token}` }
});

// 2. Purchase location
const purchase = await fetch('/api/ownership/purchase', {
  method: 'POST',
  headers: { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ locationId: 'location-id' })
});

// 3. Make official (optional)
const official = await fetch('/api/ownership/location-id/official', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` }
});
```

---

## 🔧 **Rate Limiting**
- Purchase endpoints: 10 requests per minute per user
- Information endpoints: 100 requests per minute per user
- Validation endpoints: 50 requests per minute per user

---

**File Location**: `/backend/docs/location-trading-api.md`
**Version**: 1.0
**Last Updated**: [Current Date] 