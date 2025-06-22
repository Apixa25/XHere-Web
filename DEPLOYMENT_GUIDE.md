# 🚀 XHere.world Deployment Guide

## Overview
This guide will help you deploy your XHere.world application to production using Railway for hosting and GoDaddy for DNS management.

## 📋 Prerequisites
- GoDaddy account with xhere.world domain
- GitHub account with your XHere-Web repository
- Google Cloud Console account (for Maps API and OAuth)
- Railway account (free tier available)

## 🚂 Step 1: Railway Setup

### 1.1 Create Railway Account
1. Visit [railway.app](https://railway.app)
2. Sign up with GitHub
3. Create a new project called "XHere-World"

### 1.2 Deploy Backend
1. **Add Service** → **GitHub Repo**
2. **Repository**: Select your XHere-Web repository
3. **Root Directory**: `backend/`
4. **Environment Variables**:
   ```env
   NODE_ENV=production
   JWT_SECRET=your-super-secret-jwt-key-here
   GOOGLE_CLIENT_ID=your-google-oauth-client-id
   GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret
   GOOGLE_MAPS_API_KEY=your-google-maps-api-key
   ```

### 1.3 Add PostgreSQL Database
1. **New** → **Database** → **PostgreSQL**
2. Railway auto-generates `DATABASE_URL`
3. Your backend will automatically connect

### 1.4 Deploy Frontend
1. **Add Service** → **GitHub Repo**
2. **Repository**: Select your XHere-Web repository
3. **Root Directory**: `frontend/`
4. **Build Command**: `npm run build`
5. **Start Command**: `npx serve -s build -l $PORT`
6. **Environment Variables**:
   ```env
   REACT_APP_API_URL=https://api.xhere.world
   REACT_APP_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
   REACT_APP_GOOGLE_CLIENT_ID=your-google-oauth-client-id
   REACT_APP_GOOGLE_MAPS_MAP_ID=your-google-maps-map-id
   REACT_APP_USE_ADVANCED_MARKER=true
   ```

## 🌍 Step 2: DNS Configuration

### 2.1 Get Railway URLs
After deployment, note your Railway URLs:
- Backend: `https://xhere-backend-production.up.railway.app`
- Frontend: `https://xhere-frontend-production.up.railway.app`

### 2.2 Configure GoDaddy DNS
1. Login to GoDaddy → Domain Management → xhere.world
2. Go to DNS Settings
3. Add these records:

```
Type: CNAME
Name: api
Value: xhere-backend-production.up.railway.app
TTL: 600

Type: CNAME
Name: @ (or leave blank)
Value: xhere-frontend-production.up.railway.app
TTL: 600
```

## 🔧 Step 3: Google Cloud Setup

### 3.1 Google Maps API
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable Maps JavaScript API
4. Create API key with restrictions:
   - HTTP referrers: `*.xhere.world/*`
   - API restrictions: Maps JavaScript API only

### 3.2 Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Enable Google+ API
3. Create OAuth 2.0 credentials
4. Add authorized origins:
   - `https://xhere.world`
   - `https://www.xhere.world`
5. Add authorized redirect URIs:
   - `https://xhere.world/auth`
   - `https://www.xhere.world/auth`

## 🗄️ Step 4: Database Migration

### 4.1 Run Migrations
After deployment, run database migrations:
```bash
# In Railway backend service terminal
npx sequelize-cli db:migrate
```

### 4.2 Seed Initial Data
```bash
# Seed badges and other initial data
npx sequelize-cli db:seed:all
```

## 🔍 Step 5: Testing

### 5.1 Test URLs
- Frontend: `https://xhere.world`
- API: `https://api.xhere.world/api/health`

### 5.2 Test Features
- User registration/login
- Location creation
- Map functionality
- File uploads
- Admin features

## 💰 Cost Estimation

### Railway Pricing (Free Tier)
- **Backend**: $5/month after free tier
- **Database**: $5/month after free tier
- **Frontend**: Free (static hosting)
- **Total**: ~$10/month for production

### Alternative: Render.com
- **Backend**: $7/month
- **Database**: $7/month
- **Frontend**: Free
- **Total**: ~$14/month

## 🔒 Security Checklist

- [ ] JWT_SECRET is strong and unique
- [ ] Google API keys have proper restrictions
- [ ] CORS is configured for production domains
- [ ] Database connection uses SSL
- [ ] Environment variables are set in Railway
- [ ] No sensitive data in code repository

## 🚨 Troubleshooting

### Common Issues
1. **CORS Errors**: Check API URL in frontend config
2. **Database Connection**: Verify DATABASE_URL in Railway
3. **Google Maps Not Loading**: Check API key restrictions
4. **OAuth Not Working**: Verify redirect URIs in Google Console

### Railway Logs
- Check Railway dashboard for service logs
- Monitor database connection status
- Verify environment variables are loaded

## 📞 Support Resources
- [Railway Documentation](https://docs.railway.app)
- [GoDaddy DNS Help](https://www.godaddy.com/help)
- [Google Cloud Console](https://console.cloud.google.com)

## 🎉 Success Metrics
- [ ] xhere.world loads successfully
- [ ] Users can register and login
- [ ] Locations can be created and viewed
- [ ] Maps display correctly
- [ ] File uploads work
- [ ] Admin features accessible

---

**Next Steps**: After deployment, consider setting up monitoring, backups, and scaling strategies for growth! 🚀 