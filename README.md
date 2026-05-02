# TeamSync — Team Collaboration Platform

A real-time team collaboration and coordination platform built with **Next.js 15** and **Firebase**, powered by **Google Cloud**.

## Features

- **Kanban Board** — Drag-and-drop task management with priorities, due dates, and tags
- **Meeting Notes** — Track action items/todos per individual from scrums and meetups
- **Team Chat** — Real-time project-contextual messaging
- **Activity Feed** — Live timeline of all team actions
- **Analytics Dashboard** — Charts for task status and priority distribution
- **Google Sign-In** — Secure authentication via Firebase Auth
- **Real-time Sync** — All data syncs instantly across devices via Firestore

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Styling | Vanilla CSS (Custom Properties) |
| Auth | Firebase Authentication (Google) |
| Database | Cloud Firestore |
| Storage | Firebase Cloud Storage |
| Charts | Chart.js |
| Icons | Lucide React |
| Deployment | Firebase Hosting |

## Getting Started

### Prerequisites
- Node.js 18+
- A Firebase project (free tier works)

### 1. Clone and Install

```bash
git clone <repo-url>
cd hack2skill-team-collaboration-tool
npm install
```

### 2. Configure Firebase

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Authentication** → Google Sign-In
3. Enable **Cloud Firestore**
4. Enable **Cloud Storage**
5. Copy your Firebase config to `.env.local`:

```bash
cp .env.example .env.local
# Edit .env.local with your Firebase project values
```

### 3. Deploy Firestore Rules

```bash
npx firebase-tools deploy --only firestore:rules,storage
```

### 4. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 5. Deploy to Firebase Hosting

```bash
npm run build
npx next export
npx firebase-tools deploy --only hosting
```

## Security

- Firebase Security Rules enforce per-user and per-project access control
- All data access requires authentication
- File uploads are limited to 10MB with content type validation
- Security headers set via Firebase Hosting config (X-Frame-Options, CSP, etc.)

## Accessibility

- Semantic HTML with proper ARIA labels and roles
- Keyboard navigation support throughout
- Focus-visible outlines for all interactive elements
- Screen reader friendly with live regions for notifications
- Sufficient color contrast ratios

## License

MIT
