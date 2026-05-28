# Crime Analysis System - Police Intelligence Unit

A professional, secure crime analysis dashboard built with React, Vite, Tailwind CSS, and Supabase.

## 🚀 Features

- **Secure Authentication**: Protected by Supabase Auth (Authorized Personnel Only).
- **Interactive Dashboard**: Real-time analytics with Column, Area, and Line charts.
- **Hotspot Mapping**: Visual representation of crime incidents using Leaflet.
- **Data Management**: Full CRUD capabilities for crime records.
- **Analytical Insights**: Yearly trends and monthly pattern analysis.

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS
- **Charts**: Recharts
- **Maps**: React Leaflet
- **Backend/Auth**: Supabase
- **Icons**: Lucide React
- **Animations**: Motion (Framer Motion)

## 📦 Deployment to GitHub Pages

To host this application on GitHub Pages, follow these steps:

### 1. Prepare your Repository
1. Create a new repository on GitHub.
2. Push your code to the `main` branch.

### 2. Configure Environment Variables
Since this app uses Supabase, you need to set up your environment variables in GitHub:
1. Go to your GitHub Repository **Settings** > **Secrets and variables** > **Actions**.
2. Add the following **Repository secrets**:
   - `VITE_SUPABASE_URL`: Your Supabase Project URL.
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase Anonymous Key.

### 3. GitHub Actions Deployment
The repository includes a GitHub Action (`.github/workflows/deploy.yml`) that automatically builds and deploys your app to the `gh-pages` branch whenever you push to `main`.

1. Go to **Settings** > **Pages**.
2. Under **Build and deployment** > **Source**, select **GitHub Actions**.
3. Once the Action finishes, your site will be live!

## 🔧 Local Development

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

## 🔐 Supabase Setup

1. Create a table named `crime_records` with the appropriate schema (refer to `src/types.ts`).
2. Enable **Authentication** in Supabase.
3. Create an admin user in the **Auth** section to log in to the system.
4. (Optional) Configure RLS policies to restrict data access.

---
*Authorized Personnel Only - Police Intelligence Unit*
