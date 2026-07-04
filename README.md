# MM2 Predictor — BloxLuck Coinflip Prediction Tool

For authorized security testing only.

## How it works

A bookmarklet that intercepts Socket.IO traffic on bloxluck.com, logs coinflip results, predicts patterns, and optionally auto-bets on the predicted side.

## Setup

1. Host these files on any web server (GitHub Pages, Vercel, Netlify, etc.)
2. Open `index.html` on your phone/PC
3. Copy the bookmarklet code
4. Create a new bookmark in your browser, paste the code as the URL
5. Go to bloxluck.com, log in, tap the bookmarklet
6. Play coinflips to discover event names
7. Configure event names at `/config.html`
8. Enable tracking and profit

## Files

- `index.html` — Landing page with setup instructions
- `config.html` — Configuration panel for event names
- `dashboard.html` — Live stats dashboard
- `engine.js` — The Socket.IO interceptor and prediction engine
- `README.md` — This file

## Requirements

- Any modern browser (Kiwi, Chrome, Firefox, Edge)
- BloxLuck account (logged in)

## Legal

For authorized testing only. Only use on platforms you own or have explicit permission to test.
