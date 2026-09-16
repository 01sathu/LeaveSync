# LeaveSync Deployment Guide

This guide provides step-by-step instructions to deploy the **LeaveSync** full-stack system live to production using **MongoDB Atlas** (Database), **Render** (Backend API), and **Vercel** (Frontend SPA).

---

## Architecture at a Glance

* **Frontend:** React + Vite + Tailwind CSS &rarr; Hosted on **Vercel**
* **Backend:** Node.js + Express REST API &rarr; Hosted on **Render** (or Railway)
* **Database:** MongoDB Atlas M0 Free Cluster &rarr; Hosted on **MongoDB Cloud**

---

## Step 1: Set Up MongoDB Atlas (Database)

1. Sign up or log in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Click **Create a Database** and choose the **M0 Free Cluster**.
3. Create a **Database User**:
   - Username: e.g., `leavesync_admin`
   - Password: Choose a strong password and save it securely.
4. Configure **Network Access**:
   - Go to **Network Access** &rarr; **Add IP Address**.
   - Select **Allow Access from Anywhere** (`0.0.0.0/0`) so Render and local tools can connect securely with credentials.
5. Get your Connection String:
   - Go to **Database** &rarr; click **Connect** &rarr; select **Drivers (Node.js)**.
   - Copy the URI:
     ```
     mongodb+srv://leavesync_admin:<password>@cluster0.xxxxx.mongodb.net/leave_management_db?retryWrites=true&w=majority
     ```
   - Replace `<password>` with your database user password.

---

## Step 2: Deploy Backend to Render

1. Sign up or log in to [Render](https://render.com).
2. Click **New +** &rarr; **Web Service**.
3. Connect your GitHub repository: `https://github.com/01sathu/LeaveSync.git`.
4. Configure the service:
   - **Name:** `leavesync-api`
   - **Root Directory:** `backend`
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** `Free`
5. Under **Environment Variables**, add:
   | Key | Value | Notes |
   |---|---|---|
   | `NODE_ENV` | `production` | Enables production optimizations |
   | `PORT` | `5000` | Port listened to by Express |
   | `MONGO_URI` | `mongodb+srv://...` | Your Atlas connection string from Step 1 |
   | `JWT_SECRET` | *(Random 32+ char string)* | Secret for signing JWTs |
   | `CLIENT_URL` | `*` *(or your Vercel URL)* | CORS origin |
6. Click **Deploy Web Service**.
7. Once deployed, copy your public backend URL (e.g. `https://leavesync-api.onrender.com`).
   - Test it by visiting: `https://leavesync-api.onrender.com/api/health`
   - It should respond with:
     ```json
     {"success":true,"message":"Leave Management System API is healthy", ...}
     ```

---

## Step 3: Deploy Frontend to Vercel

1. Sign up or log in to [Vercel](https://vercel.com).
2. Click **Add New...** &rarr; **Project**.
3. Import your GitHub repository: `https://github.com/01sathu/LeaveSync`.
4. In the configuration screen:
   - **Framework Preset:** `Vite`
   - **Root Directory:** Click *Edit* and select **`frontend`**.
   - **Build and Output Settings:** (Leave default: `npm run build`, output: `dist`).
5. Under **Environment Variables**, add:
   | Key | Value |
   |---|---|
   | `VITE_API_URL` | `https://leavesync-api.onrender.com/api` |
   *(Note: Replace with your actual Render backend URL followed by `/api`)*
6. Click **Deploy**.
7. Vercel will build the frontend and provide a live URL (e.g. `https://leavesync.vercel.app`).
   - The included [`frontend/vercel.json`](./frontend/vercel.json) handles client-side routing automatically so refreshing `/dashboard` or `/admin/leaves` will never result in 404 errors.

---

## Step 4: Seed the Production Database (Optional)

To populate your cloud database with the default Admin and Employee accounts:

From your local terminal, run the seed script pointing to your Atlas connection string:
```bash
$env:MONGO_URI="mongodb+srv://leavesync_admin:<password>@cluster0.xxxxx.mongodb.net/leave_management_db?retryWrites=true&w=majority"
node backend/scripts/seed.js
```

Or run via Bash:
```bash
MONGO_URI="mongodb+srv://leavesync_admin:<password>@cluster0.xxxxx.mongodb.net/leave_management_db?retryWrites=true&w=majority" node backend/scripts/seed.js
```

### Pre-configured Seed Accounts:
* **Admin:** `admin@example.com` / `Admin@123`
* **Employee 1:** `asha.rao@example.com` / `Employee@123`
* **Employee 2:** `rahul.verma@example.com` / `Employee@123`
