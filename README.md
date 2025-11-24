# TeamInSync - Team Management Application

A modern team management application with resource tracking, polls, and event celebrations.

## Features

- 👥 **Resource Management** - Add, edit, and manage team members
- 📊 **Polls** - Create and vote on team polls
- 🎉 **Events** - Track birthdays and work anniversaries
- 📈 **Dashboard** - View team statistics and insights
- 🔐 **Role-based Access** - Manager and resource roles

## Tech Stack

- **Frontend**: React + Vite + TailwindCSS
- **Backend**: Node.js + Express
- **Database**: JSON file storage
- **Deployment**: Render.com

## Local Development

### Prerequisites
- Node.js 18+ installed
- Git installed

### Setup

1. Clone the repository:
```bash
git clone https://github.com/YOUR_USERNAME/team-insync.git
cd team-insync
```

2. Install dependencies:
```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

3. Start development servers:
```bash
# Terminal 1 - Start backend
cd server
npm start

# Terminal 2 - Start frontend
cd client
npm run dev
```

4. Open http://localhost:5173 in your browser

### Default Credentials

**Manager Account:**
- Mobile: `8142088088`
- Password: `8142088088`

**Resource Account:**
- Mobile: `7675878984`
- Password: `7675878984`

## Deployment

See [Deployment Guide](./DEPLOYMENT.md) for detailed instructions on deploying to Render.com.

## Environment Variables

### Backend (`server/.env`)
```
PORT=5000
CLIENT_URL=http://localhost:5173
```

### Frontend (`client/.env`)
```
VITE_API_BASE_URL=http://localhost:5000
```

## Project Structure

```
team-insync/
├── client/              # React frontend
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── pages/       # Page components
│   │   ├── services/    # API service
│   │   └── App.jsx      # Main app component
│   └── package.json
├── server/              # Node.js backend
│   ├── server.js        # Express server
│   ├── db.json          # JSON database
│   └── package.json
└── README.md
```

## License

MIT
