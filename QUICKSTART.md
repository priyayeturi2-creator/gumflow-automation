# Quick Start Guide

## 🚀 Get Up and Running in 5 Minutes

### Prerequisites Check
```bash
node --version    # Should be v16+
npm --version     # Should be 8+
mongod --version  # MongoDB should be installed
```

### 1. Clone and Setup
```bash
git clone <repository-url>
cd gumflow-automation
```

### 2. Backend Setup (Terminal 1)
```bash
cd backend-node
npm install
cp .env.example .env
# Edit .env with your Gumloop API credentials
npm run dev
```

### 3. Frontend Setup (Terminal 2)
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

### 4. Access Application
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

### 5. Test the Flow
1. Register a new user account
2. Create a new flow with sample data
3. Monitor progress and manage workbooks

## 🔑 Required Environment Variables

### Backend (.env)
```env
GUMLOOP_API_KEY=your_api_key
GUMLOOP_USER_ID=your_user_id
JWT_SECRET=your_jwt_secret
```

### Frontend (.env)
```env
REACT_APP_API_BASE_URL=http://localhost:5000/api
```

## 🐛 Common Issues

| Issue | Solution |
|-------|----------|
| Port 5173 in use | App will auto-select next available port |
| MongoDB connection error | Start MongoDB: `sudo systemctl start mongod` |
| Gumloop API errors | Verify API key and user ID in .env |
| Process not defined | Restart frontend server after env changes |

## 📱 Sample Test Data

Use this data to test flow creation:

```json
{
  "founder_name": "John Doe",
  "company_name": "TechStart Inc",
  "interview_transcript": "We are building a revolutionary AI platform that helps businesses automate their document workflows. Our solution reduces manual work by 80% and improves accuracy significantly.",
  "tone": "Professional"
}
```

## 🏃‍♂️ Development Workflow

1. **Backend Changes**: Auto-reload with nodemon
2. **Frontend Changes**: Hot reload with Vite
3. **API Testing**: Use Postman or built-in browser tools
4. **Database**: Use MongoDB Compass for GUI access

## 🎯 Next Steps

- Review the full README.md for complete documentation
- Check API endpoints in Postman
- Explore the codebase architecture
- Start building your features!