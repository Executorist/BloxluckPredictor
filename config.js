<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MM2 Predictor — Config</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', system-ui, sans-serif;
      background: #0a0a1a;
      color: #ddd;
      min-height: 100vh;
    }
    .nav {
      background: #12122a;
      border-bottom: 1px solid #2a2a5e;
      padding: 12px 20px;
      display: flex;
      gap: 20px;
      align-items: center;
    }
    .nav a {
      color: #888;
      text-decoration: none;
      font-size: 0.9em;
    }
    .nav a:hover { color: #4fc3f7; }
    .nav .brand { color: #e94560; font-weight: bold; font-size: 1.1em; }
    .container { max-width: 700px; margin: 0 auto; padding: 40px 20px; }
    .card {
      background: #12122a;
      border: 1px solid #2a2a5e;
      border-radius: 12px;
      padding: 30px;
      margin-bottom: 24px;
    }
    .card h2 {
      color: #4fc3f7;
      margin-bottom: 20px;
      font-size: 1.3em;
    }
    .field-group {
      margin-bottom: 18px;
    }
    .field-group label {
      display: block;
      font-size: 0.9em;
      color: #aaa;
      margin-bottom: 6px;
    }
    .field-group input, .field-group select {
      width: 100%;
      padding: 10px 14px;
      background: #0a0a1a;
      border: 1px solid #2a2a5e;
      border-radius: 6px;
      color: #fff;
      font-size: 0.95em;
      font-family: monospace;
    }
    .field-group input:focus, .field-group select:focus {
      outline: none;
      border-color: #e94560;
    }
    .field-group .hint {
      font-size: 0.8em;
      color: #666;
      margin-top: 4px;
    }
    .field-group .hint code {
      background: #1e1e3e;
      padding: 1px 6px;
      border-radius: 3px;
      color: #81c784;
    }
    .btn {
      background: #e94560;
      color: white;
      padding: 12px 28px;
      border-radius: 6px;
      border: none;
      cursor: pointer;
      font-weight: 600;
      font-size: 1em;
      transition: 0.2s;
    }
    .btn:hover { opacity: 0.85; }
    .btn-outline {
      background: transparent;
      border: 2px solid #666;
      color: #888;
      margin-left: 10px;
    }
    .btn-outline:hover { border-color: #e94560; color: #e94560; }
    .status-msg {
      margin-top: 16px;
      padding: 10px 16px;
      border-radius: 6px;
      font-size: 0.9em;
      display: none;
    }
    .status-msg.success { display: block; background: #1e3e2e; color: #81c784; border: 1px solid #2a5e3e; }
    .status-msg.error { display: block; background: #3e1e1e; color: #e94560; border: 1px solid #5e2a2a; }
    .strategy-desc {
      font-size: 0.85em;
      color: #666;
      margin-top: 6px;
      padding: 8px 12px;
      background: #0a0a1a;
      border-radius: 4px;
      border-left: 2px solid #2a2a5e;
    }
    .checkbox-group {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 18px;
    }
    .checkbox-group input[type="checkbox"] {
      width: 18px;
      height: 18px;
      accent-color: #e94560;
    }
    .checkbox-group label { color: #ddd; font-size: 0.95em; }
  </style>
</head>
<body>
  <div class="nav">
    <span class="brand">🎯 MM2 Predictor</span>
    <a href="index.html">Home</a>
    <a href="config.html" style="color:#4fc3f7;">Config</a>
    <a href="dashboard.html">Dashboard</a>
  </div>

  <div class="container">
    <div class="card">
      <h2>🔧 Configuration</h2>
      <p style="color:#888;margin-bottom:20px;">Set up the Socket.IO event names after discovering them via the bookmarklet.</p>

      <div class="field-group">
        <label>Bet Event (sent when you join a coinflip)</label>
        <input type="text" id="betEvent" placeholder="e.g. coinflip:join" value="coinflip:join">
        <div class="hint">The event name your browser sends when you accept/join a coinflip game.</div>
      </div>

      <div class="field-group">
        <label>Result Event (received with the outcome)</label>
        <input type="text" id="resultEvent" placeholder="e.g. coinflip:result" value="coinflip:result">
        <div class="hint">The event name the server sends back with the coinflip result.</div>
      </div>

      <div class="field-group">
        <label>Side Field Name</label>
        <input type="text" id="sideField" placeholder="e.g. side, choice, team" value="side">
        <div class="hint">The key name for heads/tails in the event data. Could be <code>side</code>, <code>choice</code>, <code>team</code>, etc.</div>
      </div>

      <div class="field-group">
        <label>Heads Value</label>
        <input type="text" id="headsValue" placeholder="e.g. heads, 0, blue" value="heads">
        <div class="hint">How "Heads" appears in the data (e.g., <code>heads</code>, <code>0</code>, <code>blue</code>)</div>
      </div>

      <div class="field-group">
        <label>Tails Value</label>
        <input type="text" id="tailsValue" placeholder="e.g. tails, 1, red" value="tails">
        <div class="hint">How "Tails" appears in the data (e.g., <code>tails</code>, <code>1</code>, <code>red</code>)</div>
      </div>

      <div class="field-group">
        <label>Prediction Strategy</label>
        <select id="strategy">
          <option value="streak">Streak Follow — Bet on what won last (catches hot streaks)</option>
          <option value="alternate">Alternation — Bet on switching sides (catches patterns)</option>
          <option value="frequency">Frequency Analysis — Bet on the most common outcome over last 20</option>
          <option value="adaptive">Adaptive — Auto-switches based on which strategy is performing best</option>
        </select>
        <div class="strategy-desc" id="strategyDesc">Bets on the same side as the last result. Good for catching hot streaks.</div>
      </div>

      <div class="checkbox-group">
        <input type="checkbox" id="autoBet">
        <label for="autoBet">Enable Auto-Bet — Automatically place bets on the predicted side</label>
      </div>

      <div class="field-group">
        <label>Min Confidence (%)</label>
        <input type="number" id="minConfidence" min="0" max="100" value="60">
        <div class="hint">Only auto-bet when prediction confidence is above this percentage.</div>
      </div>

      <div style="display:flex;align-items:center;margin-top:24px;">
        <button class="btn" id="saveBtn">💾 Save Config</button>
        <button class="btn btn-outline" id="resetBtn">Reset to Defaults</button>
      </div>

      <div class="status-msg" id="statusMsg"></div>
    </div>

    <div class="card">
      <h2>📡 Current Status</h2>
      <div id="statusDisplay">
        <p style="color:#888;">Not connected. Load the bookmarklet on BloxLuck to see live status.</p>
      </div>
    </div>
  </div>

  <script>
    // Load saved config
    const defaults = {
      betEvent: 'coinflip:join',
      resultEvent: 'coinflip:result',
      sideField: 'side',
      headsValue: 'heads',
      tailsValue: 'tails',
      strategy: 'streak',
      autoBet: false,
      minConfidence: 60
    };

    function loadConfig() {
      try {
        const saved = JSON.parse(localStorage.getItem('mm2PredictorConfig'));
        if (saved) {
          Object.keys(defaults).forEach(key => {
            if (saved[key] !== undefined) defaults[key] = saved[key];
          });
        }
      } catch(e) {}
      
      document.getElementById('betEvent').value = defaults.betEvent;
      document.getElementById('resultEvent').value = defaults.resultEvent;
      document.getElementById('sideField').value = defaults.sideField;
      document.getElementById('headsValue').value = defaults.headsValue;
      document.getElementById('tailsValue').value = defaults.tailsValue;
      document.getElementById('strategy').value = defaults.strategy;
      document.getElementById('autoBet').checked = defaults.autoBet;
      document.getElementById('minConfidence').value = defaults.minConfidence;
      
      updateStrategyDesc();
    }

    function updateStrategyDesc() {
      const descs = {
        streak: 'Bets on the same side as the last result. Good for catching hot streaks.',
        alternate: 'Bets on the opposite side of the last result. Good for catching alternating patterns.',
        frequency: 'Analyzes the last 20 results and bets on whichever side appeared most often.',
        adaptive: 'Tracks which strategy is performing best and auto-switches. Most advanced.'
      };
      document.getElementById('strategyDesc').textContent = descs[document.getElementById('strategy').value] || '';
    }

    document.getElementById('strategy').addEventListener('change', updateStrategyDesc);

    document.getElementById('saveBtn').addEventListener('click', () => {
      const config = {
        betEvent: document.getElementById('betEvent').value.trim(),
        resultEvent: document.getElementById('resultEvent').value.trim(),
        sideField: document.getElementById('sideField').value.trim(),
        headsValue: document.getElementById('headsValue').value.trim(),
        tailsValue: document.getElementById('tailsValue').value.trim(),
        strategy: document.getElementById('strategy').value,
        autoBet: document.getElementById('autoBet').checked,
        minConfidence: parseInt(document.getElementById('minConfidence').value) || 60
      };

      localStorage.setItem('mm2PredictorConfig', JSON.stringify(config));
      
      const msg = document.getElementById('statusMsg');
      msg.textContent = '✅ Config saved! The bookmarklet will use these settings.';
      msg.className = 'status-msg success';
      setTimeout(() => { msg.className = 'status-msg'; }, 3000);
    });

    document.getElementById('resetBtn').addEventListener('click', () => {
      localStorage.removeItem('mm2PredictorConfig');
      loadConfig();
      const msg = document.getElementById('statusMsg');
      msg.textContent = '🔄 Reset to defaults.';
      msg.className = 'status-msg success';
      setTimeout(() => { msg.className = 'status-msg'; }, 3000);
    });

    loadConfig();
  </script>
</body>
</html>
