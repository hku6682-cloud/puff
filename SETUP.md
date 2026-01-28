# PUFF - Complete Project Setup

## Quick Start Guide

### Prerequisites
- Node.js 16+ installed
- PostgreSQL 13+ running locally
- Redis running locally

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create .env file**
   ```bash
   cp .env.example .env
   ```

4. **Start backend**
   ```bash
   npm run dev
   ```
   - Server will run on `http://localhost:3000`
   - API available at `http://localhost:3000/api/v1`

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create .env file**
   ```bash
   cp .env.example .env
   ```

4. **Start frontend**
   ```bash
   npm run dev
   ```
   - App will run on `http://localhost:5173`

### Database Setup

The backend will automatically create all tables on first run. No manual setup needed!

### Test the App

1. **Signup**
   - Visit `http://localhost:5173`
   - Click "Sign up"
   - Create account with email, username, password

2. **Login**
   - Use your credentials to login

3. **Create a Post**
   - Click "Create" button
   - Add caption and image URL
   - Publish

4. **Add Coins (Testing)**
   - Go to Wallet
   - Click "Add Coins (Test)"
   - See balance update

5. **Like Posts**
   - On Feed, click like button
   - See like count increase

### API Endpoints (Test with Postman)

#### Auth
- `POST /api/v1/auth/signup` - Sign up
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/refresh` - Refresh token

#### Posts
- `GET /api/v1/posts` - Get feed (auth required)
- `POST /api/v1/posts` - Create post (auth required)
- `GET /api/v1/posts/:id` - Get post
- `PUT /api/v1/posts/:id` - Update post
- `DELETE /api/v1/posts/:id` - Delete post

#### Likes
- `POST /api/v1/likes/:postId/like` - Like post
- `DELETE /api/v1/likes/:postId/like` - Unlike post
- `GET /api/v1/likes/:postId/likes` - Get post likes

#### Wallet
- `GET /api/v1/wallet` - Get wallet info
- `GET /api/v1/wallet/transactions` - Get transactions
- `POST /api/v1/wallet/add-coins` - Add coins (testing)

#### Users
- `GET /api/v1/users/:id` - Get user profile
- `GET /api/v1/users/me/profile` - Get current user
- `PUT /api/v1/users/me/profile` - Update profile
- `POST /api/v1/users/:id/follow` - Follow user
- `DELETE /api/v1/users/:id/follow` - Unfollow user

### Troubleshooting

**"Cannot connect to database"**
- Make sure PostgreSQL is running
- Check DB_HOST, DB_USER, DB_PASSWORD in backend/.env

**"Module not found"**
- Delete node_modules and reinstall
- `rm -rf node_modules && npm install`

**"Port already in use"**
- Backend: Change PORT in .env
- Frontend: Close other Vite app or change port in vite.config.js

### Next Steps

1. Review the architectural documentation (in parent directory)
2. Read DEVELOPMENT_ROADMAP.md for next features
3. Implement remaining Phase 1 features
4. Add database indexes for performance
5. Setup CI/CD pipeline
6. Deploy to production

### Features Currently Implemented

✅ User Authentication (Signup/Login)
✅ Post Creation & Feed
✅ Like System
✅ Follow System
✅ Basic Wallet
✅ User Profiles
✅ Responsive Design

### Features In Progress

🚧 Comments System
🚧 Withdrawal System
🚧 Advanced Fraud Detection
🚧 Admin Panel
🚧 Email Verification
🚧 Image Upload

### Support

- Check API_SPECIFICATION.md for endpoint details
- Review DATABASE_SCHEMA.md for data structure
- See EARNING_LOGIC.md for business rules

Happy coding! 🚀
