# LeaveSync Deployment Guide — Vercel Full-Stack Hosting

This guide provides step-by-step instructions to host both the **Frontend** and **Backend API** directly on **Vercel** with **MongoDB Atlas** as the database.

---

## Architecture at a Glance

* **Database:** MongoDB Atlas M0 Free Cluster &rarr; [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
* **Backend API:** Node.js + Express Serverless &rarr; Hosted on **Vercel** (`backend/`)
* **Frontend:** React + Vite + Tailwind CSS &rarr; Hosted on **Vercel** (`frontend/`)

---

## Step 1: Set Up MongoDB Atlas (Database)

1. Sign up or log in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Click **Create a Database** and select the **M0 Free Cluster**.
3. Create a **Database User**:
   - Username: e.g. `leavesync_admin`
   - Password: Choose a secure password (avoid special characters like `@`, `/`, `#` in the password or URL-encode them).
4. Configure **Network Access**:
   - Go to **Network Access** &rarr; **Add IP Address**.
   - Choose **Allow Access from Anywhere** (`0.0.0.0/0`) so Vercel serverless functions can connect.
5. Get your Connection String:
   - Go to **Database** &rarr; click **Connect** &rarr; choose **Drivers (Node.js)**.
   - Copy the URI:
     ```
     mongodb+srv://leavesync_admin:<password>@cluster0.xxxxx.mongodb.net/leave_management_db?retryWrites=true&w=majority
     ```
   - Replace `<password>` with your database user password.

---

## Step 2: Deploy Backend to Vercel

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **Add New...** &rarr; **Project**.
3. Import your GitHub repository: `https://github.com/01sathu/LeaveSync`.
4. Configure the project:
   - **Project Name:** `leavesync-backend` (or your choice)
   - **Framework Preset:** `Other`
   - **Root Directory:** Click *Edit* and select **`backend`**.
5. Under **Environment Variables**, add:
   | Key | Value | Notes |
   |---|---|---|
   | `MONGO_URI` | `mongodb+srv://...` | Your Atlas connection string from Step 1 |
   | `JWT_SECRET` | *(Random 32+ character string)* | e.g. `leavesync_super_secret_jwt_key_2026` |
   | `NODE_ENV` | `production` | Enables production optimizations |
   | `CLIENT_URL` | `*` | Enables CORS across Vercel deployments |
6. Click **Deploy**.
7. Once deployed, note down your live Backend URL (e.g. `https://leavesync-backend.vercel.app`).
   - Test it by visiting: `https://leavesync-backend.vercel.app/api/health`
   - It will return:
     ```json
     {"success":true,"message":"Leave Management System API is healthy", ...}
     ```

---

## Step 3: Deploy Frontend to Vercel

1. Go back to your [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **Add New...** &rarr; **Project**.
3. Import the same repository: `LeaveSync`.
4. Configure the project:
   - **Project Name:** `leavesync-frontend` (or `leavesync`)
   - **Framework Preset:** `Vite`
   - **Root Directory:** Click *Edit* and select **`frontend`**.
5. Under **Environment Variables**, add:
   | Key | Value |
   |---|---|
   | `VITE_API_URL` | `https://leavesync-backend.vercel.app/api` |
   *(Note: Use your actual Backend URL from Step 2 followed by `/api`)*
6. Click **Deploy**.
7. Vercel will build and deploy the frontend (e.g. `https://leavesync-frontend.vercel.app`).
   - Deep-linking and refreshing routes (`/dashboard`, `/admin/leaves`) are handled by `frontend/vercel.json`.

---

## Step 4: Seed the Database with Default Accounts

To populate your cloud database with the default Admin and Employee accounts:

In PowerShell:
```powershell
$env:MONGO_URI="mongodb+srv://leavesync_admin:<password>@cluster0.xxxxx.mongodb.net/leave_management_db?retryWrites=true&w=majority"
node backend/scripts/seed.js
```

Or in Bash / Linux:
```bash
MONGO_URI="mongodb+srv://leavesync_admin:<password>@cluster0.xxxxx.mongodb.net/leave_management_db?retryWrites=true&w=majority" node backend/scripts/seed.js
```

### Pre-configured Seed Accounts:
* **Admin:** `admin@example.com` / `Admin@123`
* **Employee 1:** `asha.rao@example.com` / `Employee@123`
* **Employee 2:** `rahul.verma@example.com` / `Employee@123`
