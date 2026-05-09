# Grace Music Academy Dashboard

## Project Overview
Admin dashboard for Grace Music Academy built with React (frontend) + FastAPI (backend) + MongoDB Atlas (database).

## Live URLs
- **Frontend**: https://grace-dashboard-orcin.vercel.app
- **Backend**: https://grace-dashboard-gjad.onrender.com
- **GitHub**: https://github.com/abhradeep90/grace-dashboard

## Tech Stack
- **Frontend**: React 19, CRACO (Create React App override), Tailwind CSS, shadcn/ui, Recharts, React Router v7, Axios
- **Backend**: Python FastAPI, Motor (async MongoDB driver), JWT auth, openpyxl (Excel export)
- **Database**: MongoDB Atlas — cluster `grace-music-cluster.c6ycjn7.mongodb.net`, database `grace_music_db`
- **Hosting**: Vercel (frontend) + Render (backend, free tier)

## Repository Structure
```
grace-dashboard/
├── frontend/          ← Vercel root directory (set in Vercel project settings)
│   ├── src/
│   ├── scripts/
│   │   └── patch-ajv.js   ← CRITICAL: postinstall compatibility patcher
│   ├── craco.config.js
│   ├── vercel.json
│   └── package.json
├── backend/
│   ├── server.py
│   └── requirements.txt
└── render.yaml        ← Render deployment config
```

## Deployment Configuration

### Vercel (Frontend)
- **Root Directory**: `frontend`
- **Build Command**: `yarn build` (calls `DISABLE_ESLINT_PLUGIN=true craco build`)
- **Output Directory**: `build`
- **Node Version**: 20.x (set via `engines` in package.json)
- **Framework**: Other (not Next.js)
- Rewrites configured in `frontend/vercel.json` for SPA routing

### Render (Backend)
- Configured via `render.yaml`
- **Environment variables to set on Render**:
  - `MONGO_URL` = `mongodb+srv://gracemusic:fha0hD4bCaIfl6W8@grace-music-cluster.c6ycjn7.mongodb.net/`
  - `DB_NAME` = `grace_music_db`
  - `JWT_SECRET` = (long random string)
  - `CORS_ORIGINS` = `https://grace-dashboard-orcin.vercel.app`

### Frontend Environment Variable
- `REACT_APP_BACKEND_URL` = `https://grace-dashboard-gjad.onrender.com`
- Set in Vercel project → Settings → Environment Variables

## Known Fixes Applied (Node 20 + CRA 5 Compatibility)

CRA (Create React App) 5.0.1 was designed for Node 14–16. Running on Node 20 requires several patches. All are automated via `frontend/scripts/patch-ajv.js` which runs as a `postinstall` hook.

### Problem 1: `Cannot find module 'ajv/dist/compile/codegen'`
webpack 5 needs ajv@8 but fork-ts-checker-webpack-plugin pulls in ajv@6.
**Fix**: `"overrides": { "ajv": "^8.0.0" }` in package.json.

### Problem 2: `TypeError in _formatLimit.js` (ajv-keywords@3 + ajv@8)
ajv-keywords@3 uses internal ajv@6 APIs (`_formats`) that don't exist in v8.
**Fix**: `"overrides": { "ajv-keywords": "^5.0.0" }` + postinstall patches all copies.

### Problem 3: `TypeError: ajvKeywords is not a function`
schema-utils@3 (in terser-webpack-plugin, babel-loader, file-loader) calls ajv-keywords. The resolved module isn't callable due to ESM/CJS export mismatch.
**Fix**: postinstall recursively patches ALL `schema-utils/dist/validate.js` copies, replacing `require("ajv-keywords")` with an inline no-op function.

### Problem 4: `[eslint] Cannot set properties of undefined (setting 'defaultMeta')`
devDependencies has eslint@9 but react-scripts@5 uses eslint@8 internally — incompatible Linter APIs.
**Fix**: Build script uses `DISABLE_ESLINT_PLUGIN=true craco build`.

### Problem 5: ForkTsCheckerWebpackPlugin crash
The TypeScript checker plugin has its own bundled ajv@6 which crashes at load time.
**Fix**: postinstall replaces the plugin's main entry with a no-op webpack plugin class.

## Making Changes

### Frontend Changes
1. Edit files in `frontend/src/`
2. `git add`, `git commit`, `git push origin main`
3. Vercel auto-deploys on push to `main`

### Backend Changes
1. Edit `backend/server.py` or `backend/requirements.txt`
2. `git add`, `git commit`, `git push origin main`
3. Render auto-deploys on push to `main`

### Adding a New Page/Feature
- Frontend components live in `frontend/src/components/`
- Pages live in `frontend/src/pages/`
- API base URL comes from `process.env.REACT_APP_BACKEND_URL`
- Backend routes are in `backend/server.py` (FastAPI endpoints)

## Git Remote
```
git remote: https://github.com/abhradeep90/grace-dashboard.git
Branch: main
```

To push (uses classic PAT stored by the user):
```bash
git -c gpg.format=openpgp -c commit.gpgsign=false commit -m "message"
git push -u origin main
```

## MongoDB Atlas
- **Cluster**: grace-music-cluster.c6ycjn7.mongodb.net
- **Database**: grace_music_db
- **Collections**: students, teachers, payments, etc. (existing data preserved)
- **Connection string**: `mongodb+srv://gracemusic:<password>@grace-music-cluster.c6ycjn7.mongodb.net/`

## Render Free Tier Note
Render free tier spins down after 15 minutes of inactivity. First request after sleep takes ~30 seconds. This is normal behavior for the free tier.
