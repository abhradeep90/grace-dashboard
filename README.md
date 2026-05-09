# 🎹 Grace Music Academy - Quick Start

## What is this?
A complete dashboard app for managing your piano music institute:
- 👥 Student management
- 📅 Lesson scheduling (weekly + one-time)
- 💰 Fee tracking
- 📊 Financial reports
- ✅ Attendance tracking

## Quick Setup Summary

### You Need:
1. **Free MongoDB Atlas account** → https://mongodb.com/atlas
2. **Free Render.com account** → https://render.com

### 3 Steps:
1. Create MongoDB Atlas (free) → Get connection string
2. Deploy to Render.com (free) → Your app goes live
3. Install on your devices → Works like a native app

**Detailed instructions:** See `COMPLETE_SETUP_GUIDE.md`

## Project Structure

```
grace-music-academy/
├── backend/                 # Python FastAPI server
│   ├── server.py           # Main API code
│   ├── requirements.txt    # Python dependencies
│   └── .env.example        # Environment variables template
│
├── frontend/               # React app
│   ├── public/            # Static files & PWA assets
│   │   ├── manifest.json  # PWA configuration
│   │   ├── service-worker.js
│   │   └── icons/         # App icons
│   ├── src/               # React source code
│   │   ├── pages/         # Page components
│   │   ├── components/    # UI components
│   │   └── lib/           # API utilities
│   └── package.json       # Node dependencies
│
├── COMPLETE_SETUP_GUIDE.md  # Detailed setup instructions
└── README.md               # This file
```

## Default Login
- **Email:** admin@gracemusic.com
- **Password:** admin123

## Features
- ✅ Student CRUD operations
- ✅ Weekly recurring schedules
- ✅ One-time lesson entry
- ✅ Lesson rescheduling
- ✅ Attendance marking
- ✅ Fee management
- ✅ Fixed expenses tracking
- ✅ Financial reports with charts
- ✅ Excel export
- ✅ PWA - Install on any device

## Tech Stack
- **Frontend:** React, Tailwind CSS, Shadcn UI
- **Backend:** Python FastAPI
- **Database:** MongoDB
- **Auth:** JWT tokens

## Environment Variables

### Backend (.env)
```
MONGO_URL=mongodb+srv://user:pass@cluster.mongodb.net/dbname
DB_NAME=grace_music_db
JWT_SECRET=your-secret-key
CORS_ORIGINS=*
```

### Frontend (.env)
```
REACT_APP_BACKEND_URL=https://your-backend-url.com
```

## Support
See `COMPLETE_SETUP_GUIDE.md` for troubleshooting tips.
