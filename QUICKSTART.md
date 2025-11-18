# 🚀 Quick Start Guide

This guide will help you get CipherShare up and running in under 5 minutes.

## Prerequisites Check

Before starting, ensure you have:

- ✅ Node.js 24 LTS (Iron) installed (`node --version`)
- ✅ npm 10+ installed (`npm --version`)
- ✅ Docker Desktop running (`docker --version`)

> 💡 **Using nvm?** This project includes a `.nvmrc` file. Just run:
>
> ```bash
> nvm use
> ```

## Step-by-Step Setup

### 1. Install Dependencies

```bash
npm install
```

This will install all required packages for both frontend and backend.

### 2. Start Redis Database

```bash
docker-compose up -d
```

Verify Redis is running:

```bash
docker ps
```

You should see `ciphershare-redis` in the list.

### 3. Configure Environment

The project comes with a working `.env` file for local development. For production or to enable email notifications, update these values:

```bash
# Optional: Generate a new system key (recommended for production)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Edit .env file
nano .env
```

Key settings:

- `SYSTEM_SECRET_KEY`: Your encryption key (change for production!)
- `SENDGRID_API_KEY`: Get from https://sendgrid.com/ (needed for email)
- `SENDGRID_FROM_EMAIL`: Your verified sender email

### 4. Start Development Servers

```bash
npm run dev
```

This starts:

- 🎨 **Frontend (Vite)**: http://localhost:5173
- 🔧 **Backend (Express)**: http://localhost:3001

### 5. Open in Browser

Navigate to: **http://localhost:5173**

You should see the CipherShare request generation page! 🎉

## Testing the Application

### Quick Test Flow

1. **Create a Request**

   - Go to http://localhost:5173
   - Enter your email
   - Describe the secret you want
   - Choose retention policy
   - Click "Generate Request Link"

2. **Submit a Secret**

   - Copy the shareable URL
   - Open it in a new tab (or share with someone)
   - Create a password
   - Enter the secret
   - Submit

3. **Retrieve the Secret**
   - Check the retrieval URL (shown after submission)
   - Enter the password
   - View the decrypted secret!

## Troubleshooting

### Redis Connection Failed

```bash
# Check if Redis is running
docker ps

# Restart Redis
docker-compose restart redis

# View Redis logs
docker logs ciphershare-redis
```

### Port Already in Use

If port 5173 or 3001 is already in use:

```bash
# Kill the process using the port (Linux/Mac)
lsof -ti:5173 | xargs kill -9
lsof -ti:3001 | xargs kill -9

# Or change ports in .env
PORT=3002
```

Then update `vite.config.ts` proxy target if you change the backend port.

### Dependencies Installation Failed

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

## Running Tests

This project uses a dual testing setup:

```bash
# Run all tests (Vitest + Jest in parallel)
npm test

# Frontend tests only (Vitest)
npm run test:frontend

# Backend tests only (Jest)
npm run test:unit

# Watch mode (Vitest)
npm run test:watch
```

## Next Steps

- 📖 Read the full [README.md](README.md) for detailed documentation
- 🔐 Configure SendGrid for email notifications
- 🚢 Check [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines
- 🐳 See Docker deployment options

## Need Help?

- Check the [README.md](README.md) for detailed docs
- Open an issue on GitHub
- Review error messages in the console

---

**Happy Secure Sharing! 🔐**
