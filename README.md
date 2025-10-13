# Credit Card Tracker

A streamlined, minimal credit card tracking application built with vanilla JavaScript.

## Features

### Dashboard
- **6 Key Metrics**: Total Balance, Total Available, Total Remaining, Average Utilization, Due Soon, Over Limit Count
- **Utilization Order Table**: Sort cards by utilization percentage
- **Payment Calendar**: 4-week view with visual indicators for due dates
- **Cards Overview**: Detailed card panels with all key metrics

### Cards Management
- Add/edit/delete credit cards
- Configure: Name, Issuer, Limit, APR, Color, Utilization Target
- Color picker with preset colors

### Daily Log
- Log daily credit card balances and metrics
- Automatic "Suggest" feature for recurring dates
- Complete entry history with filtering
- Delete entries

### Features
- Light/Dark theme toggle
- Clean, minimal UI with pill-style navigation
- Responsive design
- Local storage persistence
- No dependencies (vanilla JS)

## File Structure

```
cc-tracker/
├── index.html           # Main entry point
└── src/
    ├── app.js          # Main app, state management, routing
    ├── cards.js        # Card management
    ├── dashboard.js    # Dashboard components
    ├── log.js          # Daily log entry and history
    ├── charts.js       # Bar and pie charts
    ├── storage.js      # localStorage wrapper
    ├── utils.js        # Helper functions
    ├── dom-utils.js    # DOM helpers
    ├── easing.js       # Animation easing
    └── styles.css      # Complete stylesheet
```

## Setup for Local Development

1. Open the `index.html` file in a web browser
2. Or serve via a local HTTP server:
   ```bash
   python3 -m http.server 8080
   # Then open http://localhost:8080
   ```

## Deploy to GitHub Pages

### Option 1: Manual Deployment

1. Create a new GitHub repository
2. Upload all files to the repository
3. Go to Settings → Pages
4. Under "Source", select "Deploy from a branch"
5. Select the `main` branch and `/ (root)` folder
6. Click Save
7. Your app will be available at: `https://your-username.github.io/your-repo-name/`

### Option 2: Using Git Commands

```bash
# Initialize git repository
git init
git add .
git commit -m "Initial commit: Credit Card Tracker"

# Create a new repository on GitHub, then:
git remote add origin https://github.com/your-username/your-repo-name.git
git branch -M main
git push -u origin main

# Enable GitHub Pages in repository settings
```

### Option 3: GitHub CLI

```bash
# Create repository and push
gh repo create credit-card-tracker --public --source=. --push

# Enable GitHub Pages
gh api repos/:owner/:repo/pages -X POST -f source[branch]=main -f source[path]=/
```

## Usage

### Adding a Card
1. Click "Cards" tab
2. Click "+ Add Card"
3. Fill in card details
4. Colors are automatically saved

### Logging an Entry
1. Click "Daily Log" tab
2. Select a card
3. Fill in the metrics (only Card, Date, and Current Balance are required)
4. Use "Suggest" buttons to auto-fill dates from previous entries
5. Click "Save Entry"

### Viewing Dashboard
1. Click "Dashboard" tab
2. See 6 key metrics at a glance
3. View utilization rankings
4. Check the payment calendar for upcoming due dates
5. Review detailed card panels

## Data Storage

All data is stored in the browser's localStorage under the key `credit-card-tracker-v1`. Data persists across sessions but is specific to the browser and device.

### Backing Up Data

To backup your data:
1. Open browser DevTools (F12)
2. Go to Console tab
3. Run: `console.log(localStorage.getItem('credit-card-tracker-v1'))`
4. Copy the output to a text file

### Restoring Data

To restore data:
1. Open browser DevTools (F12)
2. Go to Console tab
3. Run: `localStorage.setItem('credit-card-tracker-v1', 'YOUR_BACKUP_DATA_HERE')`
4. Refresh the page

## Browser Compatibility

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

Requires ES6+ JavaScript support.

## Customization

### Changing Colors
Edit the CSS variables in `src/styles.css`:

```css
:root {
  --primary: #4F7CFF;    /* Main accent color */
  --text: #1F2937;       /* Text color */
  --muted: #6B7280;      /* Muted text */
  --border: #E5E7EB;     /* Borders */
  --bg: #FFFFFF;         /* Background */
  --panel-bg: #FFFFFF;   /* Panel background */
}
```

### Adding New Metrics
1. Add calculation function to `src/utils.js`
2. Display in `src/dashboard.js` or card panels

## License

This project is open source and available for personal and commercial use.

## Credits

Built with vanilla JavaScript - no frameworks, no build tools, just clean code.
