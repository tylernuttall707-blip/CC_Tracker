# Quick Start Guide

Get your Credit Card Tracker running in 2 minutes!

## Instant Local Testing

### Option 1: Direct File Opening
1. Download/extract the `cc-tracker` folder
2. Double-click `index.html`
3. Start tracking! 🎉

### Option 2: Python Server (Recommended)
```bash
cd cc-tracker
python3 -m http.server 8080
```
Then open: http://localhost:8080

### Option 3: Node.js Server
```bash
cd cc-tracker
npx serve
```

## GitHub Pages Deployment (3 steps)

### Prerequisites
- GitHub account
- Git installed

### Steps

1. **Create Repository**
   ```bash
   cd cc-tracker
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. **Push to GitHub**
   - Create a new repository on GitHub.com
   - Copy the commands they provide, like:
   ```bash
   git remote add origin https://github.com/YOUR-USERNAME/cc-tracker.git
   git branch -M main
   git push -u origin main
   ```

3. **Enable GitHub Pages**
   - Go to your repository Settings
   - Click "Pages" in the left sidebar
   - Under "Source", select "main" branch
   - Click "Save"
   - Wait 1-2 minutes
   - Your site will be live at: `https://YOUR-USERNAME.github.io/cc-tracker/`

## First Time Setup

When you first open the app:

1. You'll see a sample card already created
2. Click **"Cards"** to add your real cards
3. Click **"Daily Log"** to record your first entry
4. Return to **"Dashboard"** to see your overview

## Tips

- 💡 **Use the "Suggest" buttons** in Daily Log to copy dates from your last entry
- 🎨 **Customize card colors** to easily identify them in the calendar
- 🌙 **Toggle dark mode** with the sun/moon icon in the top right
- 💾 **Data is saved automatically** to your browser's local storage

## Troubleshooting

**App won't load?**
- Make sure you're serving it via HTTP (not just file://)
- Check browser console (F12) for errors

**Lost your data?**
- Data is stored per-browser, per-device
- Use the backup instructions in README.md

**GitHub Pages not working?**
- Make sure the repository is public
- Wait a few minutes after enabling Pages
- Check Settings → Pages for any error messages

## Need Help?

- Check the full README.md for detailed documentation
- All features are documented with examples
- Data structure is simple JSON in localStorage

---

Enjoy tracking! 🎯
