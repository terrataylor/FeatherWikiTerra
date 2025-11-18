# FeatherWiki Deployment Guide

## 🚀 Deployment Options Comparison

| Platform | Server Saving | Difficulty | Cost | Best For |
|----------|--------------|------------|------|----------|
| **Railway** ⭐ | ✅ Yes | Easy | Free tier | Full-featured wiki |
| **Fly.io** | ✅ Yes | Medium | Free tier | Full-featured wiki |
| **Vercel** | ❌ No | Easy | Free | Read-only/static |
| **Netlify** | ❌ No | Easy | Free | Read-only/static |
| **Local** | ✅ Yes | Very Easy | Free | Development/testing |

---

## Option 1: Railway (⭐ Recommended for Full Features)

**Perfect for:** A wiki where you can save changes directly from the browser

### Quick Start:

1. **Update server configuration** (already done! ✅)

2. **Sign up & Deploy:**
   - Visit [railway.app](https://railway.app)
   - Click "New Project" → "Deploy from GitHub"
   - Connect your repository
   - Railway auto-detects Node.js and deploys!

3. **Set Authentication:**
   - In Railway dashboard, go to **Variables**
   - Add: `WIKI_AUTH` = `admin:yourPassword123`

4. **Access:** 
   - Railway gives you a URL like `https://yourwiki.railway.app`
   - Your wiki is live with full save functionality! 🎉

**Deployment command:**
```bash
git push origin main  # Railway auto-deploys on push
```

---

## Option 2: Run Locally

**Perfect for:** Personal use or testing

### Quick Start:

```bash
# Start the server
npm run serve

# Or directly:
node nests/server.mjs
```

**Access:** Visit `http://localhost:4505`

**Configure:** Edit `nests/server.mjs` lines 7-16 for authentication

---

## Option 3: Vercel (View-Only)

**Perfect for:** Sharing a static version of your wiki (no editing)

### Quick Start:

```bash
npm install -g vercel
vercel login
vercel --prod
```

**Limitation:** ⚠️ Users cannot save changes (Vercel's filesystem is read-only)

See `DEPLOYMENT.md` for details

---

## Option 4: Fly.io (Full Features)

**Perfect for:** Advanced users who want more control

### Quick Start:

1. **Install Fly CLI:**
```bash
curl -L https://fly.io/install.sh | sh
```

2. **Create fly.toml:**
```toml
app = "your-wiki-name"

[build]
  builder = "dockerfile"

[env]
  PORT = "8080"

[[services]]
  http_checks = []
  internal_port = 8080
  protocol = "tcp"

  [[services.ports]]
    handlers = ["http"]
    port = 80

  [[services.ports]]
    handlers = ["tls", "http"]
    port = 443
```

3. **Create Dockerfile:**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY nests/ ./nests/
COPY package*.json ./
RUN npm ci --only=production
CMD ["node", "nests/server.mjs"]
```

4. **Deploy:**
```bash
fly launch
fly deploy
```

---

## Choosing the Right Option

### Choose **Railway** if:
- ✅ You want server-saving with minimal setup
- ✅ You're okay with the free tier limits
- ✅ You want automatic HTTPS

### Choose **Local Server** if:
- ✅ You only need personal access
- ✅ You don't want to deal with hosting
- ✅ You want zero cost

### Choose **Vercel** if:
- ✅ You only need to share (not edit online)
- ✅ You want the fastest deployment
- ✅ You don't need persistence

### Choose **Fly.io** if:
- ✅ You need more control over infrastructure
- ✅ You're comfortable with Docker
- ✅ You want global edge deployment

---

## Security Notes

🔒 **Always set authentication** for public deployments:
- Set `WIKI_AUTH=username:password` environment variable
- Or edit `nests/server.mjs` line 7

🔒 **Use strong passwords** for production

🔒 **Use HTTPS** (Railway/Fly.io/Vercel provide this automatically)

---

## Need Help?

- Railway issues: See `RAILWAY_DEPLOYMENT.md`
- Vercel issues: See `DEPLOYMENT.md`
- General setup: Check `nests/README.md`



