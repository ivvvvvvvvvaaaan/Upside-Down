# Setup Guide

Complete walkthrough for first-time users. Takes about 10 minutes.

---

## Part 1: Install Tools

### Install Node.js

1. Go to [nodejs.org](https://nodejs.org/)
2. Click the **LTS** button (green)
3. Open the downloaded file
4. Click through the installer (use all defaults)
5. Restart your computer

### Verify It Worked

Open Terminal:
- **Mac**: `Cmd + Space` → type "Terminal" → Enter
- **Windows**: `Win + R` → type "cmd" → Enter

Type this and press Enter:
```bash
node --version
```

You should see something like `v20.11.0`. If you see an error, restart your computer and try again.

---

## Part 2: Set Up the Project

### Open Terminal in the Project Folder

**Option A** (easiest): Drag the project folder onto the Terminal icon

**Option B**: Type `cd ` (with a space), then drag the folder into Terminal, then press Enter

### Install Dependencies

```bash
npm install
```

Wait for it to finish. You'll see a lot of text — that's normal.

---

## Part 3: Create Your First Prototype

### Start the Wizard

```bash
npm run wizard
```

### Create a Project

1. Press `2` then Enter (Create a new project)
2. Type a name like `my-first-prototype` and press Enter
3. Press Enter to accept defaults for navigation, theme, etc.
4. Select which pages you want (use numbers, like `1,2` for multiple)

### View It

1. Press `1` then Enter (Start dev server)
2. Open your browser to `http://localhost:3000/my-first-prototype`

You should see your prototype!

---

## Part 4: Make Changes

### Edit Files

Open the project in any text editor:
- **Free options**: [VS Code](https://code.visualstudio.com/), [Sublime Text](https://www.sublimetext.com/)
- Navigate to `src/app/my-first-prototype/`
- Edit any `.tsx` file
- Save the file

The browser updates automatically when you save.

### What to Edit

| File | What it does |
|------|--------------|
| `page.tsx` | Main page content |
| `view.tsx` | Interactive parts |
| `nav-config.ts` | Navigation links |

---

## Part 5: Publish Online

### Create GitHub Account (if needed)

1. Go to [github.com](https://github.com)
2. Sign up for free

### Push Your Code to GitHub

1. Create a new repository on GitHub
2. Follow GitHub's instructions to push existing code

### Connect to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click **Sign Up** → **Continue with GitHub**
3. Click **Add New Project**
4. Find and select your repository
5. Click **Deploy**

Wait about 1 minute. Vercel gives you a live URL like `your-project.vercel.app`.

### Publish Updates

From now on, just use the wizard:

```bash
npm run wizard
```

Select **option 5** → "Deploy/Save changes"

Your changes go live automatically!

---

## Quick Reference

| Task | Command |
|------|---------|
| Start wizard | `npm run wizard` |
| Start server | `npm run dev` |
| Save & publish | `npm run save` |

---

## Troubleshooting

### "command not found: node"
Node.js isn't installed. Go back to Part 1.

### "command not found: npm"
Same as above — install Node.js.

### Browser shows error
Make sure the server is running. Run `npm run wizard` and select option 1.

### Changes not showing
- Save your file
- Check the browser is on the right URL
- Try refreshing with `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)

### Can't publish
- Make sure you've set up GitHub and Vercel (Part 5)
- Check that your repo is connected to Vercel

---

## Getting Help

Stuck? Check these:
1. Read the error message — it often tells you what's wrong
2. Try restarting the server (`Ctrl+C` then `npm run dev`)
3. Try restarting Terminal
4. Try restarting your computer

---

You're all set! Run `npm run wizard` to get started.
