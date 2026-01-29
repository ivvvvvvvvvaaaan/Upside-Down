# Hawkins AI

Build clickable prototypes fast. No coding experience needed.

---

## Getting Started (One Time)

### 1. Install Node.js

Download and install from [nodejs.org](https://nodejs.org/) (choose LTS version).

### 2. Open Terminal

- **Mac**: Press `Cmd + Space`, type "Terminal", press Enter
- **Windows**: Press `Win + R`, type "cmd", press Enter

### 3. Navigate to Project Folder

```bash
cd path/to/this/folder
```

Or drag the folder into Terminal and press Enter.

### 4. Install Dependencies

```bash
npm install
```

Wait for it to finish (only needed once).

---

## Set Up Publishing (One Time)

To share your prototypes with a live URL, connect to Vercel (free):

### 1. Create a Vercel Account

Go to [vercel.com](https://vercel.com) and sign up with your GitHub account.

### 2. Import Your Project

- Click **"Add New Project"**
- Select your GitHub repo
- Click **"Deploy"**

That's it. Now every time you use **option 5** in the wizard, your changes go live automatically.

---

## Daily Workflow

### Step 1: Start the Wizard

```bash
npm run wizard
```

### Step 2: Create Your Prototype

Select **option 2** → "Create a new project"

The wizard will ask you:
- **Project name** — e.g., `my-prototype`
- **Navigation** — Vertical sidebar, Horizontal top bar, or None
- **Theme** — Dark or Light
- **Pages** — Pick which pages you want (Gallery, Search, etc.)

Your prototype is created at `localhost:3000/my-prototype`

### Step 3: View Your Work

Select **option 1** → "Start dev server"

Opens your browser to see the prototype.

### Step 4: Make Changes

Edit files in `src/app/your-project-name/` using any text editor.

The browser updates automatically when you save.

### Step 5: Publish

Select **option 5** → "Deploy/Save changes"

This saves your work to GitHub. If you've set up Vercel, your site auto-deploys in ~1 minute.

---

## Wizard Menu

```
1. 🚀 Start dev server
2. 🎨 Create new project   — Build a multi-page prototype
3. 📄 Quick single page    — Create one page (legacy)
4. 🗂️  Manage projects      — List or delete prototypes
5. 💾 Deploy/Save          — Publish your changes
```

---

## Quick Commands

| What you want | Command |
|---------------|---------|
| Start wizard | `npm run wizard` |
| Start server directly | `npm run dev` |
| Save & publish | `npm run save` |

---

## Need Help?

- **Prototype not showing?** Make sure the server is running (option 1)
- **Want to delete a project?** Use option 4 in the wizard
- **Made a mistake?** Your components are safe — only project folders get deleted
- **Publish not working?** Make sure you've set up Vercel (see above)

---

## File Structure (For Reference)

```
src/
├── app/                  ← Your prototypes live here
│   ├── my-prototype/     ← Each project is a folder
│   └── another-project/
└── components/           ← Shared components (don't delete!)
```

---

---

**First time?** See the [Setup Guide](SETUP.md) for a complete walkthrough.
