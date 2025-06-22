# 🚀 XHere.world Deployment Guide (Render)

## Overview
This guide will help you deploy your XHere.world application to production using **Render** for hosting and GoDaddy for DNS management. We will use Render's "Blueprint" feature, which sets up all our services from a single `render.yaml` file.

## 📋 Prerequisites
- A **Render.com** account (you can sign up with your GitHub account).
- A GoDaddy account with the `xhere.world` domain.
- A Google Cloud Platform project with API keys for Google Maps and Google OAuth.

---

## 🚂 Step 1: Deploying with the Render Blueprint

Our repository now contains a `render.yaml` file. This file automatically defines our three required services: a PostgreSQL database, a Node.js backend, and a React frontend.

1.  **Sign up or log in** to [render.com](https://render.com).
2.  On your main dashboard, click the **"New"** button.
3.  Select **"Blueprint"**.
4.  **Connect your GitHub account** and select your `XHere-Web` repository.
5.  Render will automatically detect and parse the `render.yaml` file. You will see the `xhere-database`, `xhere-backend`, and `xhere-frontend` services listed.
6.  Click **"Apply"** to create and deploy all three services.

Render will now build and deploy your entire application. It may take several minutes.

---

## 🔑 Step 2: Add Your Secret Environment Variables

The `render.yaml` file links the database and backend automatically, but for security, we must add our secret keys manually in the Render dashboard.

1.  Navigate to your new `xhere-backend` service in Render.
2.  Go to the **"Environment"** tab.
3.  Under "Secret Files & Environment Variable Groups", click **"Add Environment Variable"** for each of the following keys. These must be kept secret.
    *   `JWT_SECRET`
    *   `GOOGLE_CLIENT_ID`
    *   `GOOGLE_CLIENT_SECRET`
    *   `GOOGLE_MAPS_API_KEY`

4.  Navigate to your `xhere-frontend` service.
5.  Go to its **"Environment"** tab.
6.  Add the following secrets:
    *   `REACT_APP_GOOGLE_MAPS_API_KEY`
    *   `REACT_APP_GOOGLE_CLIENT_ID`
    *   `REACT_APP_GOOGLE_MAPS_MAP_ID`

Adding or changing these variables will trigger a new deployment automatically.

---

## 🌍 Step 3: DNS and Custom Domains

After the deployment is successful, Render will provide public URLs for your services (e.g., `xhere-backend.onrender.com`). We now need to point your `xhere.world` domain to them.

1.  In Render, navigate to the **"Settings"** tab for your `xhere-frontend` service.
2.  Click **"Add Custom Domain"** and enter `xhere.world` (and `www.xhere.world`). Render will give you DNS verification values.
3.  In Render, navigate to the **"Settings"** tab for your `xhere-backend` service.
4.  Click **"Add Custom Domain"** and enter `api.xhere.world`. Render will provide another DNS value.

5.  **In GoDaddy**, go to the DNS management page for `xhere.world` and add the `CNAME` or `A` records provided by Render. This will connect your domain to the running services.

---

## 🗄️ Step 4: Database Migration

Your backend is running, but the database is empty. We need to run our database migrations to create the tables.

1.  In Render, navigate to your `xhere-backend` service.
2.  Click on the **"Shell"** tab to open a secure shell to your running backend.
3.  Run the migration command:
    ```bash
    npx sequelize-cli db:migrate
    ```
4.  (Optional) Run the seed command to add initial data:
    ```bash
    npx sequelize-cli db:seed:all
    ```
5.  Exit the shell.

---

## 🎉 Success!

Your application should now be fully deployed and accessible at `https://xhere.world`. Congratulations! 🚀

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

## 🔒 Security Checklist

- [ ] JWT_SECRET is strong and unique
- [ ] Google API keys have proper restrictions
- [ ] CORS is configured for production domains
- [ ] Database connection uses SSL
- [ ] Environment variables are set in Render
- [ ] No sensitive data in code repository

## 🚨 Troubleshooting

### Common Issues
1. **CORS Errors**: Check API URL in frontend config
2. **Database Connection**: Verify DATABASE_URL in Render
3. **Google Maps Not Loading**: Check API key restrictions
4. **OAuth Not Working**: Verify redirect URIs in Google Console

### Render Logs
- Check Render dashboard for service logs
- Monitor database connection status
- Verify environment variables are loaded

## 📞 Support Resources
- [Render Documentation](https://render.com/docs)
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