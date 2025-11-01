# Netlify Deployment Checklist

## ✅ Fixed Issues

1. **Netlify Configuration** (`netlify.toml`)
   - Fixed build command from `npm run build:client` → `npm run build`
   - This ensures both client and server are built for Netlify functions

2. **Node Version Pinning** (`.nvmrc`)
   - Added `.nvmrc` file specifying Node 20
   - Ensures Netlify uses consistent Node version

3. **Package Manager**
   - Verified `package.json` exists and is valid at repo root
   - npm is properly configured with `legacy-peer-deps=true` in `.npmrc`

4. **Code Quality**
   - Fixed ethers.js imports in `client/hooks/useWalletConnect.ts`
   - Changed from `ethers.providers.Web3Provider` to `BrowserProvider`
   - Changed from `ethers.utils.*` to direct named imports
   - Removed warnings about missing ethers exports

5. **Environment Management**
   - `.env` and `.env.local` files are properly excluded from git via `.gitignore`
   - Created `.env.example` with template for all required variables
   - Enhanced security comments in `server/routes/env.ts`

## 🚀 Deployment Steps

### Step 1: Push Code to GitHub
Ensure all changes are committed and pushed to your main branch:
```bash
git status  # Verify only intended files changed
git push    # Push to origin
```

### Step 2: Configure Netlify Environment Variables
Go to your Netlify site settings and add these environment variables:

**Public Variables** (can be exposed to client):
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_COINGECKO_API=https://api.coingecko.com/api/v3
VITE_WALLET_CONNECT_PROJECT_ID=your_project_id
VITE_PUBLIC_BUILDER_KEY=your_builder_key
```

**Secret Variables** (server-side only):
```
NEXT_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
CRON_API_KEY=your_cron_api_key
```

**Optional Variables**:
```
PING_MESSAGE="ping pong"
```

### Step 3: Trigger Netlify Deploy
1. Go to your Netlify app
2. Click "Deploy site" (or it will auto-deploy when you push to main)
3. Monitor the build logs
4. Should see:
   - ✓ Dependencies installed
   - ✓ Client built to `dist/spa`
   - ✓ Server built to `dist/server`
   - ✓ Ready to deploy

### Step 4: Verify Deployment
After deployment completes:
1. Visit your Netlify site URL
2. Check that the app loads
3. If Supabase vars are set, verify auth works
4. If WalletConnect vars are set, verify wallet connection works

## 📋 Build Behavior

Local and Netlify builds now follow the same process:

```
npm run build
├── npm run build:client
│   └── Builds React SPA to dist/spa/
└── npm run build:server
    └── Builds Express server to dist/server/ for serverless functions
```

## ⚠️ Remaining Warnings (Non-fatal)

These warnings don't prevent deployment:
- "Chunk larger than 500kB" - Consider code splitting if needed
- Supabase environment messages - Normal if env vars not set locally

## 🔐 Security Notes

- No secrets are committed to git
- All sensitive data must be in Netlify environment variables
- The app gracefully degrades if some env vars are missing
- Server-side secrets are never exposed to the client

## 🆘 Troubleshooting

If deployment still fails:

1. **Check build logs** in Netlify UI
2. **Verify package.json exists** at repo root
3. **Check Node version** - should be 20.x (via .nvmrc)
4. **Verify env variables** are set in Netlify Site settings
5. **Check git status** - ensure .env files are NOT committed

For more help, refer to:
- `SECRETS_SETUP.md` - Environment variables guide
- `.env.example` - Template for all required variables
