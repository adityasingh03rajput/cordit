# Cordit

A self-hosted, real-time chat and voice platform. Think Discord, but simpler and completely yours.

![Cordit Banner](https://img.shields.io/badge/Cordit-Chat%20%26%20Voice-purple?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-green?style=for-the-badge)
![Docker](https://img.shields.io/badge/docker-ready-blue?style=for-the-badge)
---

## What is Cordit?

Cordit is a lightweight communication platform with text chat, voice channels, and a unique browser-based music sharing feature. Built with modern web technologies, it's designed to be easy to deploy and simple to use.

## Features

### 👥 Public Stranger Chat & Matching
- **Platform-Generated Numeric Public IDs:** Users are identified by clean 4-6 digit public IDs (e.g., #7368), decoupling internal MongoDB ObjectIds.
- **Mutual-Preference Matching Engine:** Real-time bidirectional gender-compatible matching (male, female, other vs male, female, any).
- **Direct Public ID Search & Matching:** Directly connect with any online user by numeric public ID.
- **100% Public Conversations & Observer Mode:** Every stranger chat is public. Third-party users can join in real-time as read-only observers without requiring approval.
- **Observer Suggestions System:** Spectators can submit real-time suggestions; conversation participants can toggle viewing or hiding spectator advice.
- **Server-Enforced Spectator Permissions:** Observers cannot transmit messages into the room; actions are strictly validated on the server.
- **Safety, Moderation & Reporting:**
  - One-click blocking: Blocked users are immediately prevented from direct requests or random matches.
  - User reporting: Violations are logged with room context and reported user ID.
  - Comprehensive Admin Panel: Live report review queue with direct user suspension and permanent ban controls.
- **Permanent Local Media Storage & Direct Streaming:** Fast, non-expiring media uploads with HTTP caching and fallback.

### 💬 Real-time Chat
- Instant messaging with typing indicators
- Multiple rooms/channels
- System notifications
- Message history

### 🎙️ Voice Channels
- High-quality voice chat powered by LiveKit
- Individual volume controls per participant
- Visual speaking indicators
- Low latency WebRTC connections

### 🎵 Music Sharing (Beta)
- Share audio from any browser tab (YouTube, Spotify, etc.)
- No server-side processing - streams directly from your browser
- Desktop only (Chrome/Firefox)
- Works with any audio source

### 🔐 Security & Admin
- JWT-based authentication
- Admin and user roles
- Invite code system
- Rate limiting protection

### 📱 Responsive Design
- Works on desktop and mobile
- Brutal/neobrutalism UI design
- Dark theme optimized

---

## Roadmap
- [x] Real-time messaging with Socket.io
- [x] Multiple chat rooms
- [x] Typing indicators
- [x] Message history
- [x] Voice channels with LiveKit
- [x] Individual volume controls
- [x] Speaking indicators
- [x] Music sharing from browser tabs
- [x] JWT authentication
- [x] Admin panel
- [x] Invite code system
- [x] Rate limiting
- [x] Responsive design
- [x] Docker deployment
- [ ] Create new channels (text & voice)
- [ ] File & image uploads
- [ ] Emoji reactions
- [ ] Edit/delete messages
- [ ] @mention system
- [ ] Direct messages (DM)
- [ ] User avatars & status
- [ ] Push notifications
- [ ] Screen sharing
- [ ] Role/permission system

---

## Quick Start

### Option 1: Docker (Recommended)

```bash
# Clone the repository
git clone https://github.com/yourusername/cordit.git
cd cordit

# Copy environment template
cp .env.sample .env

# Edit .env with your settings (see Configuration section)

# Start services
docker compose up -d
```

Access at: http://localhost:3000

### Option 2: Development Setup

**Prerequisites:**
- Node.js 20+
- MongoDB (running locally or Docker)
- LiveKit Server (optional, for voice features)
- Yarn or npm

**Backend:**
```bash
cd backend
cp .env.sample .env
yarn install
yarn dev
```

**Frontend:**
```bash
cd frontend
yarn install
yarn dev
```

**MongoDB (if using Docker):**
```bash
docker run -d -p 27017:27017 --name cordit-mongo mongo:latest
```

**LiveKit (if using Docker):**
```bash
docker run -d -p 7880:7880 \
  -e LIVEKIT_KEYS="devkey: secret" \
  --name cordit-livekit \
  livekit/livekit-server:latest --dev
```

---

## Configuration

Create a `.env` file in the project root:

```env
# Required
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:3000/api
LIVEKIT_URL=ws://localhost:7880

# Security - Change these!
ACCESS_TOKEN_SECRET=your-random-secret-key-at-least-32-chars
ADMIN_USERNAME=admin
ADMIN_PASSWORD=changeme

# LiveKit (for voice chat)
LIVEKIT_API_KEY=devkey
LIVEKIT_API_SECRET=secret
```

**Important:**
- `ACCESS_TOKEN_SECRET` must be at least 32 characters
- Change `ADMIN_PASSWORD` in production
- For production, use HTTPS URLs and WSS for LiveKit

---

## Project Structure

```
cordit/
├── backend/                 # Express.js API
│   ├── src/
│   │   ├── models/         # MongoDB schemas
│   │   ├── routes/         # API endpoints
│   │   ├── middlewares/    # Auth & validation
│   │   ├── utils/          # Socket.io & helpers
│   │   └── app.ts          # App entry point
│   └── Dockerfile
│
├── frontend/                # Next.js app
│   ├── app/                # Pages (App Router)
│   ├── components/         # React components
│   │   ├── VoiceChat.tsx   # Voice channel UI
│   │   └── MusicShare.tsx  # Music sharing feature
│   ├── lib/                # API client & state
│   └── Dockerfile
│
├── docker-compose.yml       # Container orchestration
└── .env.sample             # Environment template
```

---

## Tech Stack

**Frontend:**
- Next.js 15 (React 19)
- LiveKit Client SDK (voice/audio)
- Socket.io Client (real-time chat)
- Zustand (state management)

**Backend:**
- Express.js (Node.js)
- MongoDB + Mongoose
- Socket.io (WebSocket)
- LiveKit Server SDK
- JWT authentication

**Infrastructure:**
- Docker & Docker Compose
- LiveKit Server (WebRTC SFU)
- MongoDB

---

## Development

### Running Backend

```bash
cd backend
yarn dev          # Start with nodemon
yarn build        # Compile TypeScript
yarn start        # Run production build
```

### Running Frontend

```bash
cd frontend
yarn dev          # Start Next.js dev server
yarn build        # Build for production
yarn start        # Run production build
```

### Database Seeding

On first run, the backend automatically:
- Creates an admin user (from env variables)
- Creates a default "General" room

### Environment Variables

Backend reads from `.env` in project root. Frontend needs:
- `NEXT_PUBLIC_BACKEND_URL` (set via docker-compose build args)
- `NEXT_PUBLIC_LIVEKIT_URL` (set via docker-compose build args)

---

## Production Deployment

### Using Dokploy / Coolify / Portainer

1. Import `docker-compose.yml`
2. Set environment variables
3. Configure domains for each service:
   - `frontend` → your-domain.com
   - `backend` → api.your-domain.com
   - `livekit` → livekit.your-domain.com

**Important for LiveKit:**
- Enable WebSocket support in reverse proxy
- Add `Upgrade` and `Connection` headers
- If using Cloudflare: set to "DNS only" (not proxied)
---

## Contributing

We welcome contributions! Here's how:

1. **Fork** the repository
2. **Create a branch**: `git checkout -b feature/your-feature`
3. **Make your changes** and test locally
4. **Commit**: `git commit -m 'Add some feature'`
5. **Push**: `git push origin feature/your-feature`
6. **Open a Pull Request**

### Development Guidelines

- Follow existing code style
- Write clear commit messages
- Test your changes before submitting
- Update documentation if needed

### Found a bug?

Open an issue with:
- Description of the bug
- Steps to reproduce
- Expected vs actual behavior
- Screenshots (if applicable)

---

## License

MIT License - see [LICENSE](LICENSE) file for details.

---

## Acknowledgments

Built with:
- [LiveKit](https://livekit.io/) - Real-time audio/video ❤️
- [Socket.io](https://socket.io/) - WebSocket messaging ❤️
- [Next.js](https://nextjs.org/) - React framework ❤️
- [Express](https://expressjs.com/) - Node.js server ❤️
