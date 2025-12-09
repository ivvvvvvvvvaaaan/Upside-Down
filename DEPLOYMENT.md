# Deployment Guide for Designers

This guide assumes you know nothing about git, GitHub, or deployment. Don't worry - it's easier than it looks!

## Prerequisites

Install these once (if you haven't already):
- [Node.js](https://nodejs.org/) - Download and install
- [Git](https://git-scm.com/) - Download and install
- [GitHub Account](https://github.com/signup) - Free signup
- [Vercel Account](https://vercel.com/signup) - Free signup (use your GitHub account)

## One-Time Setup (15 minutes)

### Step 1: Create GitHub Repository

1. Go to [github.com/new](https://github.com/new)
2. Name it (e.g., `my-prototype`)
3. Keep it **Public** (or Private if you prefer)
4. Click "Create repository"
5. **Don't add README** - we already have one

### Step 2: Connect Your Project to GitHub

Open your terminal in this project folder and run:

```bash
# Tell git who you are (first time only)
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Initialize git in this project
git init

# Add all your files
git add .

# Save your first version
git commit -m "Initial prototype"

# Connect to your GitHub repo (replace with YOUR repo URL)
git remote add origin https://github.com/YOUR_USERNAME/my-prototype.git

# Push to GitHub
git push -u origin main
```

**If the last command fails with "main" branch error:**
```bash
git branch -M main
git push -u origin main
```

### Step 3: Connect to Vercel (Auto-Deploy)

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New..." → "Project"
3. Click "Import" next to your GitHub repo
4. Click "Deploy" (don't change any settings)
5. Wait ~2 minutes
6. 🎉 Your site is live! Copy the URL

**Important:** Now every time you push to GitHub, Vercel auto-deploys. No manual work needed!

---

## Setting up Real Data (Supabase)

If you want your prototype to save data (instead of resetting on refresh), follow these steps:

1. **Create a Supabase Project:**
   - Go to [supabase.com](https://supabase.com) and sign up.
   - Click "New Project".
   - Name it (e.g., "Prototype DB").
   - Set a database password (save it somewhere safe!).

2. **Get API Keys:**
   - In your project dashboard, go to **Settings** (gear icon) -> **API**.
   - Find `Project URL` and `anon public` key.

3. **Add to Vercel (Production):**
   - Go to your project on Vercel.
   - Click **Settings** -> **Environment Variables**.
   - Add two variables:
     - `NEXT_PUBLIC_SUPABASE_URL`: (Paste your URL)
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: (Paste your anon key)
   - Redeploy your project for changes to take effect.

4. **Add Locally (Development):**
   - Create a file named `.env.local` in your project folder.
   - Add the same variables there.

5. **Create the Table:**
   - Go to Supabase -> **SQL Editor**.
   - Run this query:
     ```sql
     create table nodes (
       id uuid default gen_random_uuid() primary key,
       parent_id uuid references nodes(id),
       type text,
       name text,
       meta jsonb default '{}'::jsonb,
       created_at timestamptz default now()
     );
     ```

---

## Daily Workflow

### Saving Your Work

Instead of using git commands, just run:

```bash
npm run save
```

This will:
1. Ask "What did you change?" (optional, press Enter to skip)
2. Save all your changes
3. Push to GitHub
4. Auto-deploy to Vercel (~2 minutes)

**That's it!** Your live site updates automatically.

---

## Creating Versions (Snapshots)

Use this when you want to:
- Share a specific version with clients
- Create a snapshot for user testing
- Preserve a milestone before making big changes

```bash
npm run publish
```

This will:
1. Ask for a version name (e.g., "client-review-v1")
2. Create a permanent snapshot
3. Generate a unique URL for this version

**Example URLs:**
- Main site: `my-prototype.vercel.app`
- Client review: `my-prototype-client-review-v1.vercel.app`
- User testing: `my-prototype-user-testing.vercel.app`

Each version gets its own permanent URL that never changes!

---

## Quick Reference

| What I Want | Command | Result |
|-------------|---------|--------|
| Preview locally | `npm run dev` | Opens http://localhost:3000 |
| Save & deploy | `npm run save` | Updates your main URL |
| Create version snapshot | `npm run publish` | Creates new permanent URL |
| Manual deploy (no GitHub) | `npm run deploy` | Deploys directly to Vercel |

---

## Troubleshooting

### "git: command not found"
Install git: https://git-scm.com/downloads

### "npm: command not found"
Install Node.js: https://nodejs.org/

### "Permission denied" when pushing
You need to authenticate with GitHub:
```bash
# Use GitHub CLI (easier)
gh auth login

# OR use SSH key (more complex)
# Follow: https://docs.github.com/en/authentication/connecting-to-github-with-ssh
```

### "Vercel not deploying"
1. Check Vercel dashboard for errors
2. Make sure the build succeeds locally: `npm run build`
3. Check GitHub Actions tab in your repo

### "Branch already exists"
When publishing, if a version name is taken:
```bash
# List all versions
git branch -a

# Delete old version (if needed)
git branch -d old-version-name
```

---

## Advanced: Manual Git Commands

If you want to use git directly (not required):

```bash
# See what changed
git status

# Save changes
git add .
git commit -m "Description of changes"
git push

# Create a version manually
git checkout -b version-name
git push -u origin version-name
git checkout main
```

---

## Getting Help

- **Vercel Issues:** [vercel.com/support](https://vercel.com/support)
- **GitHub Issues:** [docs.github.com](https://docs.github.com)
- **This Template:** [Open an issue](#) (update with your repo URL)

---

## Tips for Non-Technical Designers

1. **Save often:** Run `npm run save` multiple times a day
2. **Use version snapshots** before major changes
3. **Don't edit directly in production** - always test locally first (`npm run dev`)
4. **Keep version names descriptive**: `client-feedback-round-2` not `version-2`
5. **Vercel dashboard** shows all your deployments - bookmark it!

---

**You're all set!** Focus on designing - deployment is now automatic. 🎨✨
