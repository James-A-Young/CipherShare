# 🔐 CipherShare

**CipherShare** is a secure secret sharing application that allows users to request, submit, and retrieve sensitive information with dual-layer encryption. Built with React, TypeScript, Tailwind CSS, Express, and Redis.

![CipherShare Banner](https://img.shields.io/badge/Security-Dual%20Encryption-blue?style=for-the-badge)
![Node.js](https://img.shields.io/badge/Node.js-24%20LTS-339933?style=for-the-badge&logo=node.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?style=for-the-badge&logo=typescript)
![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react)
![Redis](https://img.shields.io/badge/Redis-7-DC382D?style=for-the-badge&logo=redis)

## ✨ Features

### 🔒 Dual-Layer Encryption

- **Layer 1 (System Key)**: AES-256-GCM encryption using a system-level secret key
- **Layer 2 (User Password)**: Additional password-based encryption with PBKDF2 key derivation
- All secrets are encrypted before storage and can only be decrypted with the correct password

### 🎯 Three Core Workflows

1. **Request Generation (Creator Flow)**

   - Create a unique request for sensitive information
   - Configure retention policies (view-based or time-based)
   - Generate a shareable URL for submitters

2. **Secret Submission (Submitter Flow)**

   - Submit secrets with password protection
   - Automatic email notification to requestor
   - Secure side-channel password sharing

3. **Secret Retrieval (Requestor Flow)**
   - Decrypt and view secrets with the shared password
   - Automatic expiration based on retention policy
   - View count tracking

### ⏰ Automatic Expiration

- **View Limits**: 1 or 2 views before automatic deletion
- **Time Limits**: 3, 5, or 10 days before automatic deletion
- **Maximum Retention**: All secrets expire after 10 days regardless of policy

### 📧 Email Notifications

- SendGrid integration for sending retrieval links
- Secure HTML-formatted emails
- Automatic notification on secret submission

## 🏗️ Tech Stack

### Frontend

- **React 18.3** - Modern UI with functional components and hooks
- **TypeScript 5.7** - Type-safe development
- **Vite 6.0** - Fast build tool and dev server
- **Tailwind CSS 4.1** - Utility-first CSS framework with new v4 architecture
- **React Router 7.1** - Client-side routing

### Backend

- **Express 4.21** - RESTful API server
- **Node.js 24 LTS** - JavaScript runtime (latest LTS release)
- **TypeScript 5.7** - Type-safe backend

### Database & Caching

- **Redis 7** - In-memory data store with automatic expiration
- **Docker** - Containerized Redis deployment

### Security

- **AES-256-GCM** - Symmetric encryption algorithm
- **PBKDF2** - Password-based key derivation (100,000 iterations)
- **crypto (Node.js)** - Native cryptographic functions

### Testing

- **Vitest 4.0** - Fast frontend testing framework
- **Jest 29.7** - Backend/server testing framework
- **Testing Library** - React component testing
- **ts-jest** - TypeScript support for Jest

## 📋 Prerequisites

- **Node.js 24 LTS** (Iron) and npm 10+
- **Docker** and Docker Compose
- **SendGrid Account** (for email notifications)

> 💡 **Tip**: Use [nvm](https://github.com/nvm-sh/nvm) to manage Node.js versions. This project includes a `.nvmrc` file:
>
> ```bash
> nvm use
> ```

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/ciphershare.git
cd ciphershare
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# System Encryption Key (MUST be 64 hex characters = 32 bytes)
SYSTEM_SECRET_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef

# SendGrid Configuration
SENDGRID_API_KEY=your_actual_sendgrid_api_key_here
SENDGRID_FROM_EMAIL=noreply@yourdomain.com

# Server Configuration
PORT=3001
CLIENT_URL=http://localhost:5173
```

> ⚠️ **Important**: Generate a secure random system key for production:
>
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```

### 4. Start Redis with Docker

```bash
docker-compose up -d
```

Verify Redis is running:

```bash
docker ps
```

### 5. Start the Development Servers

```bash
npm run dev
```

This starts both the frontend (Vite) and backend (Express) servers concurrently:

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001

## 🧪 Testing

This project uses a dual testing setup optimized for different parts of the codebase:

- **Vitest** for frontend/React component tests
- **Jest** for backend/server tests

### Run All Tests

```bash
npm test
```

This runs both test suites in parallel.

### Run Specific Test Suites

```bash
# Frontend tests only (Vitest)
npm run test:frontend

# Backend tests only (Jest)
npm run test:unit
```

### Watch Mode

```bash
npm run test:watch
```

Runs Vitest in watch mode for rapid frontend development.

## 📚 API Documentation

### Base URL

```
http://localhost:3001/api
```

### Endpoints

#### 1. Create a Secret Request

**POST** `/api/requests`

Creates a new secret request and returns a shareable URL.

**Request Body:**

```json
{
  "requestorEmail": "requestor@example.com",
  "description": "The WiFi password for the New York Office",
  "retentionType": "time",
  "retentionValue": 5
}
```

**Response:**

```json
{
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "shareableUrl": "http://localhost:5173/request/550e8400-e29b-41d4-a716-446655440000"
}
```

#### 2. Get Request Details

**GET** `/api/requests/:requestId`

Retrieves information about a secret request.

**Response:**

```json
{
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "description": "The WiFi password for the New York Office",
  "status": "pending",
  "retentionType": "time",
  "retentionValue": 5
}
```

#### 3. Submit a Secret

**POST** `/api/requests/:requestId/submit`

Submits a secret for a request and sends notification email.

**Request Body:**

```json
{
  "submitterEmail": "submitter@example.com",
  "password": "StrongPassword123!",
  "confirmPassword": "StrongPassword123!",
  "secret": "The actual secret information"
}
```

**Response:**

```json
{
  "message": "Secret submitted successfully",
  "retrievalUrl": "http://localhost:5173/retrieve/7c9e6679-7425-40de-944b-e07fc1f90ae7"
}
```

#### 4. Retrieve a Secret

**POST** `/api/secrets/:retrievalId`

Retrieves and decrypts a secret using the password.

**Request Body:**

```json
{
  "password": "StrongPassword123!"
}
```

**Response:**

```json
{
  "secret": "The actual secret information",
  "viewsRemaining": 1
}
```

## 🔐 Security Architecture

### Dual Encryption Process

```
┌─────────────────┐
│  Plain Secret   │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Layer 2: User Password         │
│  - PBKDF2 key derivation        │
│  - AES-256-GCM encryption       │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Layer 1: System Key            │
│  - AES-256-GCM encryption       │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────┐
│  Redis Storage  │
└─────────────────┘
```

### Key Features

1. **Two-Layer Protection**: Even if the database is compromised, secrets remain encrypted with user passwords
2. **No Password Storage**: Only password hashes are stored, never plaintext passwords
3. **Automatic Expiration**: Redis TTL ensures data is automatically deleted
4. **View Counting**: Secrets can be configured to self-destruct after being viewed
5. **Side-Channel Password Sharing**: Passwords are never sent via email

## 🌐 Deployment

### Production Build

```bash
npm run build
```

### Docker Deployment

Build the Docker image:

```bash
docker build -t ciphershare:latest .
```

Run with Docker Compose:

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Environment Variables for Production

Ensure you set these in your production environment:

- `NODE_ENV=production`
- `SYSTEM_SECRET_KEY` - Generate a new random 64-character hex string
- `SENDGRID_API_KEY` - Your SendGrid API key
- `SENDGRID_FROM_EMAIL` - Verified sender email
- `CLIENT_URL` - Your production frontend URL
- `REDIS_HOST` - Redis host (use service name in Docker)
- `REDIS_PASSWORD` - Secure Redis password

## 🛠️ Project Structure

```
ciphershare/
├── src/                      # Frontend React application
│   ├── components/           # React components
│   │   ├── RequestGeneration.tsx
│   │   ├── SecretSubmission.tsx
│   │   └── SecretRetrieval.tsx
│   ├── __tests__/           # Frontend tests
│   ├── api.ts               # API client
│   ├── App.tsx              # Main app component
│   ├── main.tsx             # Entry point
│   └── index.css            # Global styles
├── server/                   # Backend Express server
│   ├── __tests__/           # Backend tests
│   ├── crypto.service.ts    # Encryption/decryption logic
│   ├── redis.service.ts     # Redis operations
│   ├── email.service.ts     # SendGrid email service
│   ├── types.ts             # TypeScript type definitions
│   └── index.ts             # Express app and routes
├── docker-compose.yml        # Docker configuration
├── Dockerfile               # Application container
├── package.json             # Dependencies and scripts
├── tsconfig.json            # TypeScript configuration
├── vite.config.ts           # Vite configuration
├── tailwind.config.js       # Tailwind CSS configuration
└── jest.config.js           # Jest test configuration
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔍 Troubleshooting

### Redis Connection Issues

```bash
# Check if Redis is running
docker ps

# View Redis logs
docker logs ciphershare-redis

# Restart Redis
docker-compose restart redis
```

### Email Not Sending

1. Verify your SendGrid API key is correct
2. Check that your sender email is verified in SendGrid
3. Review server logs for email errors

### Build Errors

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf node_modules/.vite
```

## 📧 Support

For issues, questions, or contributions, please open an issue on GitHub.

---

**Built with ❤️ and 🔐 for secure secret sharing**
