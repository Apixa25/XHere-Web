# ✅ XHere.world Deployment Checklist

## 🚂 Railway Setup
- [ ] Create Railway account at [railway.app](https://railway.app)
- [ ] Create new project "XHere-World"
- [ ] Connect GitHub repository
- [ ] Deploy backend service (root: `backend/`)
- [ ] Add PostgreSQL database service
- [ ] Deploy frontend service (root: `frontend/`)
- [ ] Configure environment variables for both services

## 🔧 Environment Variables
### Backend Variables
- [ ] `NODE_ENV=production`
- [ ] `JWT_SECRET=[strong-secret-key]`
- [ ] `GOOGLE_CLIENT_ID=[your-google-client-id]`
- [ ] `GOOGLE_CLIENT_SECRET=[your-google-client-secret]`
- [ ] `GOOGLE_MAPS_API_KEY=[your-maps-api-key]`
- [ ] `DATABASE_URL=[auto-generated-by-railway]`

### Frontend Variables
- [ ] `REACT_APP_API_URL=https://api.xhere.world`
- [ ] `REACT_APP_GOOGLE_MAPS_API_KEY=[your-maps-api-key]`
- [ ] `REACT_APP_GOOGLE_CLIENT_ID=[your-google-client-id]`
- [ ] `REACT_APP_GOOGLE_MAPS_MAP_ID=[your-maps-map-id]`
- [ ] `REACT_APP_USE_ADVANCED_MARKER=true`

## 🌍 DNS Configuration (GoDaddy)
- [ ] Login to GoDaddy account
- [ ] Navigate to xhere.world domain management
- [ ] Go to DNS settings
- [ ] Add CNAME record for `api` → `[backend-railway-url]`
- [ ] Add CNAME record for `@` → `[frontend-railway-url]`
- [ ] Set TTL to 600 for both records
- [ ] Wait for DNS propagation (up to 24 hours)

## 🔑 Google Cloud Setup
- [ ] Create/select Google Cloud project
- [ ] Enable Maps JavaScript API
- [ ] Create Maps API key with domain restrictions
- [ ] Enable Google+ API for OAuth
- [ ] Create OAuth 2.0 credentials
- [ ] Add authorized origins: `https://xhere.world`, `https://www.xhere.world`
- [ ] Add redirect URIs: `https://xhere.world/auth`, `https://www.xhere.world/auth`

## 🗄️ Database Setup
- [ ] Run database migrations: `npx sequelize-cli db:migrate`
- [ ] Seed initial data: `npx sequelize-cli db:seed:all`
- [ ] Verify database connection in Railway logs
- [ ] Test database operations

## 🔍 Testing
- [ ] Test health endpoint: `https://api.xhere.world/api/health`
- [ ] Test frontend loading: `https://xhere.world`
- [ ] Test user registration
- [ ] Test user login
- [ ] Test location creation
- [ ] Test map functionality
- [ ] Test file uploads
- [ ] Test admin features (if applicable)
- [ ] Test mobile responsiveness

## 🔒 Security Verification
- [ ] Verify JWT_SECRET is strong and unique
- [ ] Confirm API keys have proper domain restrictions
- [ ] Test CORS functionality
- [ ] Verify HTTPS is working
- [ ] Check for any exposed sensitive data
- [ ] Test authentication flow

## 📊 Performance & Monitoring
- [ ] Check Railway service logs
- [ ] Monitor database performance
- [ ] Test API response times
- [ ] Verify static file serving
- [ ] Check for any error logs

## 🎉 Final Steps
- [ ] Update any hardcoded URLs in code
- [ ] Test all user flows end-to-end
- [ ] Document any production-specific configurations
- [ ] Set up monitoring alerts (optional)
- [ ] Create backup strategy (optional)
- [ ] Share the live URL with stakeholders

## 🚨 Troubleshooting Notes
- [ ] CORS errors: Check allowed origins in backend
- [ ] Database connection: Verify DATABASE_URL in Railway
- [ ] Maps not loading: Check API key restrictions
- [ ] OAuth issues: Verify redirect URIs in Google Console
- [ ] DNS issues: Wait for propagation or check TTL settings

---

**Deployment Date**: _______________
**Deployed By**: _______________
**Notes**: _______________

🎉 **Congratulations on launching XHere.world!** 🚀 