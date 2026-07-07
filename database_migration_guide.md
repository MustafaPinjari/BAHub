# Guide: Deploying a Free Render PostgreSQL Database for BAHub

Yes! You can create a PostgreSQL database on Render completely for free. 

> [!WARNING]
> **Important Free Tier Limitation**: Render's free PostgreSQL databases expire and are deleted **90 days** after creation. For a database that never expires and is always free (up to 500 MB), you can use [Supabase](https://supabase.com/). However, Render is an excellent option for setting up and testing your workspace immediately.

Here are the step-by-step instructions to create the database on Render and link it to your backend.

---

## Step 1: Create a Free PostgreSQL Database on Render

1. Log in to your [Render Dashboard](https://dashboard.render.com/).
2. In the top-right corner of the screen, click the **+ New** button (located next to "Upgrade" in your dashboard).
3. Select **PostgreSQL** from the dropdown menu.
4. Configure your database details:
   * **Name**: `bahub-db`
   * **Database Name**: `bahub_db` (or any name you prefer)
   * **User**: (leave blank to let Render auto-generate a secure username)
   * **Region**: Select the **same region** where your `bahub-backend` service is hosted (e.g., Oregon, Frankfurt, Singapore) to ensure low latency.
   * **PostgreSQL Version**: Select the default (e.g., 15 or 16).
5. Scroll down to **Instance Type** and select the **Free** tier.
6. Click **Create Database** at the bottom of the page.

---

## Step 2: Retrieve the Connection String

1. Once the database is created, you will see its status page. Wait a minute for the status to change from *Creating* to **Available**.
2. Scroll down to the **Connections** section.
3. Find the **Internal Database URL** and click the copy button.
   * *Note: Using the **Internal** Database URL ensures your backend communicates with the database over Render's ultra-fast private network. Do NOT use the External Database URL unless connecting from your local computer.*
   * It will look similar to this:
     `postgres://bahub_db_user:password@dpg-xxxx-preview.oregon-postgres.render.com/bahub_db`

---

## Step 3: Link the Database to Your Backend Service

1. Go back to your Render Dashboard home page and click on your **`bahub-backend`** Web Service.
2. In the left-hand sidebar, click on the **Environment** tab.
3. Locate the environment variable named **`DATABASE_URL`**.
   * *If it doesn't exist, click **Add Environment Variable** and enter `DATABASE_URL` as the key.*
4. Paste your copied **Internal Database URL** into the value field.
5. Click **Save Changes** at the bottom of the page.

---

## Step 4: Verification (Automatic Redeployment)

Once you save the changes, Render will automatically trigger a new deployment of your backend:
1. The backend will rebuild and install dependencies.
2. The build command (`pip install -r requirements.txt && python manage.py migrate`) will **automatically run migrations** on your new Render PostgreSQL database, creating all required tables.
3. Once deployment is complete, registration will save new users to the PostgreSQL database and proceed smoothly.
