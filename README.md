# Reddit Vibe Check

A minimalist, sleek web application that analyzes the real-time sentiment of the top hot posts in any subreddit. 

Built with **React (Vite)** on the frontend and **Express (Node.js)** on the backend.

## Features
- **OLED Dark Mode UI:** High contrast, pitch-black aesthetic.
- **Sentiment Analysis:** Calculates an average vibe score (Positive, Neutral, Negative) from the top 50 subreddit posts.
- **Vercel Ready:** Pre-configured for easy deployment as a monolithic app on Vercel.

## Quick Start

### 1. Backend Setup
```bash
cd backend
npm install
node server.js
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## Deployment
Simply import the root repository into [Vercel](https://vercel.com/). The included `vercel.json` will automatically build the frontend and set up the backend serverless API routes.
