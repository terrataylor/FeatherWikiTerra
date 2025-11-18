# Deploy FeatherWiki to Railway (Recommended)

Railway.app supports persistent storage, so your wiki changes will be saved!

## Steps:

### 1. **Sign up for Railway**
Visit [railway.app](https://railway.app) and sign up (free tier available)

### 2. **Create New Project**
- Click "New Project"
- Select "Deploy from GitHub repo"
- Connect your GitHub account and select this repository
- Or use "Deploy from local" and select this folder

### 3. **Configure Environment Variables** (Optional but recommended)
In Railway dashboard:
- Go to **Variables** tab
- Add variable: `WIKI_AUTH` = `username:password`
- Example: `admin:mySecurePass123`

### 4. **Configure Server Settings**
Edit `nests/server.mjs` to use Railway's environment:

```javascript
const hostname = "0.0.0.0"; // Change from "localhost"
const port = process.env.PORT || 4505; // Use Railway's PORT
```

### 5. **Deploy!**
Railway will automatically:
- Detect Node.js
- Install dependencies
- Run `node nests/server.mjs`
- Give you a public URL

### 6. **Access Your Wiki**
Visit the URL Railway provides (e.g., `https://yourwiki.railway.app`)

## Benefits of Railway:
✅ Persistent file storage (changes are saved!)
✅ Automatic HTTPS
✅ Easy deployment
✅ Free tier available
✅ Custom domains supported

## Cost:
- Free tier: $5 credit per month
- Hobby plan: $5/month for more resources



