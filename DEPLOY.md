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

We have already configured database resolution in `backend/bahub_backend/settings.py` to check for `DATABASE_URL`, parse it, force relative local SQLite paths to resolve relative to `BASE_DIR`, and fall back to SQLite when running locally:
```python
import dj_database_url

if IS_TESTING:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": ":memory:",
        }
    }
else:
    db_url = os.getenv("DATABASE_URL", "").strip()
    db_url = db_url.strip('"').strip("'").strip()
    try:
        if not db_url:
            raise ValueError("Empty DATABASE_URL")
        conn_max_age = int(os.getenv("CONN_MAX_AGE", "600"))
        parsed_db = dj_database_url.parse(
            db_url,
            conn_max_age=conn_max_age,
            ssl_require=True if db_url.startswith("postgres") else False
        )
    except ValueError:
        db_url = f"sqlite:///{BASE_DIR / 'db.sqlite3'}"
        parsed_db = dj_database_url.parse(
            db_url,
            conn_max_age=0,
            ssl_require=False
        )
    # Ensure relative SQLite paths always resolve relative to BASE_DIR
    if parsed_db.get("ENGINE") == "django.db.backends.sqlite3" and parsed_db.get("NAME") != ":memory:":
        from pathlib import Path
        db_path = Path(parsed_db["NAME"])
        if not db_path.is_absolute():
            parsed_db["NAME"] = str(BASE_DIR / db_path)

    DATABASES = {
        "default": parsed_db
    }
```
*(This is fully configured and ready in your codebase).*

---

## 💡 Troubleshooting & Tips
* **Cold Starts**: Render's free tier spins down the backend web service after 15 minutes of inactivity. The first API call from your frontend can take ~50 seconds to respond as the backend wakes up. Once awake, it will be fast and responsive.
* **WebSocket Port**: Render maps WebSockets automatically over standard ports (`80`/`443`). Always use `wss://` for production WebSockets to bypass security blocks.

---

## 🔴 Known Limitation: WebSocket Scaling (InMemoryChannelLayer)

### The Problem

By default (when `REDIS_URL` is **not** set), Django Channels uses `InMemoryChannelLayer`. This works fine for **a single server instance**, but has a critical limitation:

> If Render (or any host) scales to **more than one instance**, WebSocket messages will only be delivered to users connected to the *same* instance. Real-time collaboration between users on different instances will silently break.

### The Fix — Redis Channel Layer

The codebase **already supports Redis** — the switch is automatic when `REDIS_URL` is present (see `settings.py`):

```python
REDIS_URL = os.getenv("REDIS_URL", "")
if REDIS_URL:
    # Uses channels_redis.core.RedisChannelLayer — multi-instance safe ✅
    CHANNEL_LAYERS = { "default": { "BACKEND": "channels_redis.core.RedisChannelLayer", ... } }
else:
    # Falls back to InMemoryChannelLayer — single-instance only ⚠️
    CHANNEL_LAYERS = { "default": { "BACKEND": "channels.layers.InMemoryChannelLayer" } }
```

### Free Redis Options

| Provider | Free Tier | Setup |
|---|---|---|
| [Upstash Redis](https://upstash.com/) | 10k req/day, 256MB | Sign up → create DB → copy `redis://` URL |
| [Railway Redis](https://railway.app/) | $5 credit/month (covers Redis) | New project → Add Redis → copy URL |

### Steps to Enable

1. Sign up for **Upstash** (recommended for free tier).
2. Create a Redis database → copy the connection string (format: `rediss://default:password@host:port`).
3. In your Render dashboard, add the environment variable:
   ```
   REDIS_URL=rediss://default:<password>@<host>:<port>
   ```
4. Redeploy — Channels will automatically switch to `RedisChannelLayer`.

> **Priority**: If you are running a single Render instance, `InMemoryChannelLayer` is safe. Upgrade to Redis before scaling to multiple instances.

