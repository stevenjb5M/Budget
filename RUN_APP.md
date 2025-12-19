# Running the Offline App

## MacOS (Recommended)

### Quick Start
1. Open **Finder**
2. Navigate to your Budget Planner folder
3. **Double-click** `run-offline-app` (no file extension)
   - If prompted about an unidentified developer, click **"Open"**
4. A terminal window will open and your browser will launch automatically
5. The app runs at `http://localhost:4173`

**Note:** Use `run-offline-app` for double-clicking. The `.sh` version is for terminal use.

### First Time Setup
If it's your first time, the script will:
- Install dependencies
- Build the app
- Start the server
- Open your browser

### Subsequent Runs
The script will:
- Check if a rebuild is needed
- Start the server
- Open your browser

**Keep the terminal window open while using the app. Close it to stop the server.**

---

## Windows

### Quick Start
1. Open **File Explorer**
2. Navigate to your Budget Planner folder
3. **Double-click** `run-offline-app.bat`
4. A command window will open and your browser will launch
5. The app runs at `http://localhost:4173`

### First Time Setup
The batch file will automatically:
- Install dependencies
- Build the app
- Start the server
- Open your browser

**Keep the command window open. Close it to stop the server.**

---

## Linux

### Quick Start
1. Open **Terminal**
2. Navigate to your Budget Planner folder
3. Double-click `run-offline-app.sh` (or run: `./run-offline-app.sh`)
4. Your browser will launch automatically
5. The app runs at `http://localhost:4173`

---

## What These Scripts Do

1. **Check Dependencies** - Installs npm packages if needed
2. **Build App** - Creates optimized production build
3. **Start Server** - Runs a local HTTP server
4. **Open Browser** - Automatically launches the app in your default browser
5. **Keep Running** - Server stays active as long as the window is open

---

## Manual Alternative (Terminal)

If you prefer to run from terminal:

```bash
cd frontend
npm run preview
```

Or to build and serve:

```bash
cd frontend
npm run build
npx serve dist
```

---

## Troubleshooting

### Port Already in Use
If port 4173 is already in use, the script will find the next available port.

### Node Not Installed
Make sure you have Node.js installed:
```bash
node --version
```

### Browser Doesn't Open
Manually navigate to `http://localhost:4173`

### Changes Not Appearing
The app rebuilds automatically when source files change. Refresh your browser.

---

## Data Storage

- ✅ All data stored in browser's **IndexedDB**
- ✅ No internet required
- ✅ Data persists across browser sessions
- ✅ Private - stays on your computer

To reset data, open browser DevTools (F12) → Application → IndexedDB → Delete database
