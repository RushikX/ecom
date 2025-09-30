# Quick Setup Guide

## Option 1: Using MongoDB Atlas (Recommended for Demo)

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free account
3. Create a new cluster
4. Get your connection string
5. Update `backend/.env.development` with your Atlas connection string:
   ```
   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
   ```

## Option 2: Using Local MongoDB

### Windows

1. Download MongoDB Community Server from [MongoDB Download Center](https://www.mongodb.com/try/download/community)
2. Install MongoDB
3. Start MongoDB service:
   ```cmd
   net start MongoDB
   ```

### macOS

```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb/brew/mongodb-community
```

### Linux (Ubuntu/Debian)

```bash
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
```

## Running the Application

1. **Start Backend:**

   ```bash
   cd backend
   go run ./cmd/main.go
   ```

2. **Start Frontend:**

   ```bash
   cd frontend
   npm run dev
   ```

3. **Access the Application:**
   - Frontend: http://localhost:5174 (or check your terminal output)
   - Backend API: http://localhost:8080 (or check your terminal output)

## Demo Accounts

- **Admin**: `admin@demo.com` / `Admin@123`
- **Delivery Agent**: `delivery@demo.com` / `Delivery@123`
- **Customer**: Sign up with any email/password

## Troubleshooting

### Backend Issues

- Make sure MongoDB is running
- Check if port 8080 is available
- Verify environment variables are set correctly

### Frontend Issues

- Make sure Node.js is installed
- Run `npm install` in the frontend directory
- Check if port 5174 is available

### Database Issues

- For Atlas: Check your connection string and network access settings
- For local: Ensure MongoDB service is running
- Check firewall settings if using local MongoDB
