# Deploying FeatherWiki to Vercel

## Quick Start

### 1. Install Vercel CLI (if not already installed)
```bash
npm install -g vercel
```

### 2. Login to Vercel
```bash
vercel login
```

### 3. Deploy
```bash
vercel
```

## Configuration

### Environment Variables

For authentication (recommended), set an environment variable in Vercel:

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add a new variable:
   - **Name**: `WIKI_AUTH`
   - **Value**: `username:password` (e.g., `admin:mySecurePassword123`)
   - **Environments**: Select all (Production, Preview, Development)

### Without Authentication

If you want to deploy without authentication (NOT RECOMMENDED for public sites):
- Simply don't set the `WIKI_AUTH` environment variable
- Anyone can view and edit your wiki

## Deployment Steps

### First Deployment

```bash
# From the project root
vercel

# Follow the prompts:
# - Set up and deploy? Y
# - Which scope? (choose your account)
# - Link to existing project? N
# - Project name? (featherwiki or your choice)
# - Directory? ./ (default)
# - Override settings? N
```

### Production Deployment

```bash
vercel --prod
```

## Custom Domain (Optional)

After deployment, you can add a custom domain:

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Domains**
3. Add your domain and follow DNS configuration instructions

## Important Notes

⚠️ **Vercel Filesystem Limitations**

Vercel's serverless functions run in a **read-only** filesystem environment. This means:
- **PUT requests (saving) won't work** with the current setup
- Each deployment resets the wiki to the version in your repository

### Solutions for Persistent Storage

If you need server-saving functionality, you have these options:

#### Option A: Use External Storage
Modify `api/wiki.js` to use:
- **Vercel KV** (Redis-based storage)
- **Vercel Postgres** database
- **AWS S3** or similar cloud storage
- **GitHub API** to commit changes back to your repo

#### Option B: Deploy to a Different Platform
For full file-write capabilities, consider:
- **Railway.app** (supports persistent storage)
- **Fly.io** (supports persistent volumes)
- **Your own VPS** (DigitalOcean, Linode, etc.)
- **Run locally** with `node nests/server.mjs`

## Alternative: Static-Only Deployment

For a simple, read-only deployment:

1. Build the wiki:
```bash
npm run build
```

2. Create `vercel.json`:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "nests/featherwiki.html",
      "use": "@vercel/static"
    }
  ],
  "routes": [
    {
      "src": "/",
      "dest": "/nests/featherwiki.html"
    }
  ]
}
```

3. Deploy:
```bash
vercel --prod
```

This serves your wiki as a static file without server-saving.

## Testing Locally

Before deploying, test locally:

```bash
# Install Vercel CLI
npm install -g vercel

# Run local development server
vercel dev

# Visit http://localhost:3000
```

## Troubleshooting

### "Module not found" errors
Make sure you're in the project root when running `vercel`.

### Authentication not working
Double-check the `WIKI_AUTH` environment variable format: `username:password`

### Can't save changes
Remember: Vercel serverless functions are read-only. Use external storage or a different platform for persistence.

## Support

For more help:
- [Vercel Documentation](https://vercel.com/docs)
- [FeatherWiki Repository](https://codeberg.org/Alamantus/FeatherWiki)



