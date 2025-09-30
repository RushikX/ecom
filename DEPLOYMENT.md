# Deployment Guide

This guide explains how to deploy the e-commerce application to production without hardcoded URLs.

## Environment Variables

### Backend Environment Variables

Set these in your Vercel backend project:

```bash
# Required
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/
JWT_SECRET=your-super-secret-jwt-key-here

# Optional
PORT=8080
MONGO_DB=ecom
FRONTEND_URL=https://your-frontend-url.vercel.app
```

### Frontend Environment Variables

Set these in your Vercel frontend project:

```bash
# Required
VITE_API_URL=https://your-backend-url.vercel.app/api
```

## Deployment Steps

### 1. Backend Deployment (Vercel)

1. Connect your GitHub repository to Vercel
2. Set the **Root Directory** to `backend`
3. Set the **Build Command** to `go build -o main ./api`
4. Set the **Output Directory** to `.`
5. Add the environment variables listed above

### 2. Frontend Deployment (Vercel)

1. Connect your GitHub repository to Vercel
2. Set the **Root Directory** to `frontend`
3. Set the **Build Command** to `npm run build`
4. Set the **Output Directory** to `dist`
5. Add the environment variables listed above

### 3. Environment Configuration

#### For Development

Create `backend/.env`:

```bash
MONGO_URI=mongodb://localhost:27017
JWT_SECRET=your-local-secret-key
FRONTEND_URL=http://localhost:5174
```

Create `frontend/.env.local`:

```bash
VITE_API_URL=http://localhost:8080/api
```

#### For Production

Set the environment variables in your Vercel dashboard for both projects.

## CORS Configuration

The backend automatically configures CORS based on the `FRONTEND_URL` environment variable:

- If `FRONTEND_URL` is set: Allows only the specified frontend URL + localhost for development
- If `FRONTEND_URL` is empty: Allows all origins (less secure, for testing only)

## Security Notes

1. **Never commit `.env` files** to version control
2. **Use strong JWT secrets** in production
3. **Set proper CORS origins** in production
4. **Use HTTPS** for all production URLs
5. **Rotate secrets regularly**

## Troubleshooting

### CORS Errors

- Ensure `FRONTEND_URL` is set correctly in backend environment
- Check that the frontend URL matches exactly (including protocol and port)

### API Connection Errors

- Verify `VITE_API_URL` is set correctly in frontend environment
- Ensure the backend is deployed and accessible
- Check that the API endpoints are working by visiting `/api/health`

### Database Connection Errors

- Verify `MONGO_URI` is correct and accessible
- Ensure the MongoDB cluster allows connections from Vercel's IP ranges
- Check that the database user has proper permissions
