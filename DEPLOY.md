# 🚀 Deploying BAHub for Free

This guide outlines a step-by-step approach to hosting the **BAHub** application (Vite React frontend and Django Channels/Daphne backend) on modern, production-grade cloud environments completely for free.

---

## 🏗️ Production Architecture

To host the full-stack system, we will split the application into three decoupled services:
1. **Database**: Managed **PostgreSQL** on [Neon](https://neon.tech/) or [Supabase](https://supabase.com/).
2. **Backend (ASGI WebSockets)**: [Render](https://render.com/) or [Koyeb](https://koyeb.com/) Web Services (supporting long-lived WebSocket protocols via Daphne).
3. **Frontend (React)**: [Vercel](https://vercel.com/) or [Netlify](https://netlify.com/) static web hosting.

```mermaid
graph TD
    Client[Browser Client]
    Vercel[Vercel/Netlify - React Frontend]
    Render[Render/Koyeb - ASGI Backend]
    Neon[Neon/Supabase - PostgreSQL]

    Client -->|Static Assets| Vercel
    Client -->|REST API / WebSockets| Render
    Render -->|Queries / Storage| Neon
```

---

## 💾 Step 1: Deploy a Free Database
Because hosting platforms (like Render or Fly.io) on the free tier have ephemeral filesystems, **SQLite databases will wipe on every restart**. A persistent remote database is required.

1. Sign up on [Neon Console](https://neon.tech/).
2. Create a new project and select **PostgreSQL 16**.
3. Copy the **Connection String** from the dashboard. It will look like:
   `postgres://user:password@ep-host-name.aws.neon.tech/neondb?sslmode=require`

---

## 🐍 Step 2: Deploy the Django ASGI Backend
For real-time co-authoring to work, the backend must run on an **ASGI server** (Daphne) that supports WebSockets.

### Option A: Render (Free Web Service)
1. Sign up at [Render](https://render.com/) and link your GitHub repository.
2. Click **New +** and select **Web Service**.
3. Connect your **BAHub** repository.
4. Configure the Web Service settings:
   - **Name**: `bahub-backend`
   - **Root Directory**: `backend`
   - **Runtime**: `Python`
   - **Build Command**: 
     ```bash
     pip install -r requirements.txt && python manage.py migrate
     ```
   - **Start Command** (Runs the Daphne ASGI server):
     ```bash
     daphne -b 0.0.0.0 -p $PORT bahub_backend.asgi:application
     ```
   - **Instance Type**: **Free**
5. Add the following **Environment Variables** under the **Environment** tab:
   - `DATABASE_URL`: *Your Neon/Supabase PostgreSQL connection string.*
   - `DEBUG`: `False`
   - `SECRET_KEY`: *A strong random string.*
   - `ALLOWED_HOSTS`: `*` (or your backend and frontend domains separated by commas).
   - `CORS_ALLOWED_ORIGINS`: `https://your-frontend.vercel.app` (your Vercel URL).
   - `JWT_SECRET_KEY`: *Another strong random string.*
   - `TIMEZONE`: `UTC`

---

## ⚛️ Step 3: Deploy the Vite React Frontend
Deploy the static build of the Vite application to Vercel for high-speed edge distribution.

1. Sign up at [Vercel](https://vercel.com/) and link your GitHub repository.
2. Click **Add New** > **Project** and select your **BAHub** repository.
3. Configure the Project settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add the following **Environment Variables**:
   - `VITE_API_URL`: `https://bahub-backend.onrender.com/api/v1` *(Replace with your Render backend URL)*
   - `VITE_WS_URL`: `wss://bahub-backend.onrender.com/ws` *(Replace with your Render backend URL, using `wss://` protocol)*
5. Click **Deploy**. Vercel will build and assign you a secure HTTPS URL (e.g. `https://bahub-analytics.vercel.app`).

---

## 🛠️ Step 4: Configure Django Production DB
Since we are using PostgreSQL in production instead of SQLite, we must tell Django to dynamically use the `DATABASE_URL` environment variable if it is set.

We have already configured database resolution in `backend/bahub_backend/settings.py` to check for `DATABASE_URL` and fall back to SQLite when running locally:
```python
import dj_database_url

DATABASES = {
    "default": dj_database_url.config(
        default=f"sqlite:///{BASE_DIR / 'db.sqlite3'}",
        conn_max_age=600,
        ssl_require=True if os.getenv("DATABASE_URL") else False
    )
}
```
*(This is fully configured and ready in your codebase).*

---

## 💡 Troubleshooting & Tips
* **Cold Starts**: Render's free tier spins down the backend web service after 15 minutes of inactivity. The first API call from your frontend can take ~50 seconds to respond as the backend wakes up. Once awake, it will be fast and responsive.
* **WebSocket Port**: Render maps WebSockets automatically over standard ports (`80`/`443`). Always use `wss://` for production WebSockets to bypass security blocks.
