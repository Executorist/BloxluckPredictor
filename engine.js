// MM2 Predictor Engine v3.0
// Loaded via bookmarklet into bloxluck.com
(function() {
  'use strict';
  
  if (window.__mm2Predictor) return; // Already loaded
  
  const __mm2 = {
    history: [],
    config: {
      betEvent: 'coinflip:join',
      resultEvent: 'coinflip:result',
      sideField: 'side',
      headsValue: 'heads',
      tailsValue: 'tails',
      strategy: 'streak',
      autoBet: false,
      minConfidence: 60
    },
    prediction: null,
    currentGameId: null,
    myChoice: null,
    tracking: false,
    panel: null
  };

  // Load config from localStorage (set by config.html)
  function loadConfig() {
    try {
      const saved = JSON.parse(localStorage.getItem('mm2PredictorConfig'));
      if (saved) Object.assign(__mm2.config, saved);
    } catch(e) {}
  }
  loadConfig();

  // Load history
  function loadHistory() {
    try {
      const h = JSON.parse(localStorage.getItem('mm2History'));
      if (Array.isArray(h)) __mm2.history = h;
    } catch(e) {}
  }
  loadHistory();

  function saveHistory() {
    localStorage.setItem('mm2History', JSON.stringify(__mm2.history.slice(-500)));
    // Trigger dashboard update
    window.dispatchEvent(new Event('storage'));
  }

  // === Socket.IO Interception ===
  const OrigWS = window.WebSocket;
  
  window.WebSocket = function(url, protocols) {
    const ws = new OrigWS(url, protocols);
    const origSend = ws.send.bind(ws);
    
    ws.send = function(data) {
      try {
        if (typeof data === 'string' && data.startsWith('42')) {
          const parsed = JSON.parse(data.substring(2));
          const event = parsed[0];
          const payload = parsed[1] || {};
          
          // Detect bet placement
          if (event === __mm2.config.betEvent) {
            __mm2.currentGameId = payload.gameId || payload.id || Date.now();
            __mm2.myChoice = payload[__mm2.config.sideField] || payload.choice || payload.side;
            
            // Auto-bet override if prediction is active
            if (__mm2.tracking && __mm2.prediction && __mm2.config.autoBet) {
              const confidence = __mm2.prediction.confidence || 0;
              if (confidence >= __mm2.config.minConfidence) {
                // Override the side with prediction
                const newPayload = Object.assign({}, payload);
                newPayload[__mm2.config.sideField] = __mm2.prediction.side;
                addLog('🤖 Auto-bet: ' + __mm2.prediction.side);
                return origSend(JSON.stringify(parsed[0]) + JSON.stringify([event, newPayload]));
              }
            }
          }
          
          // Log all outgoing events for discovery
          addLog('📤 ' + event, 'out');
        }
      } catch(e) {}
      return origSend(data);
    };
    
    ws.addEventListener('message', (msg) => {
      try {
        if (typeof msg.data === 'string' && msg.data.startsWith('42')) {
          const parsed = JSON.parse(msg.data.substring(2));
          const event = parsed[0];
          const payload = parsed[1] || {};
          
          // Detect result
          if (event === __mm2.config.resultEvent) {
            const resultSide = (payload[__mm2.config.sideField] || payload.result || payload.winner || '').toLowerCase();
            
            let won = false;
            if (resultSide && __mm2.myChoice) {
              if (resultSide === __mm2.myChoice.toLowerCase() ||
                  payload.youWon === true || payload.won === true ||
                  payload.winnerId === 'me') {
                won = true;
              }
            }
            
            const entry = {
              timestamp: Date.now(),
              side: resultSide,
              myChoice: __mm2.myChoice,
              won: won,
              gameId: __mm2.currentGameId
            };
            
            __mm2.history.push(entry);
            saveHistory();
            
            // Generate next prediction
            generatePrediction();
            
            addLog(`🎲 ${resultSide.toUpperCase()} — ${won ? '✅ WIN' : '❌ LOSS'}`, won ? 'win' : 'loss');
            
            __mm2.currentGameId = null;
            __mm2.myChoice = null;
          }
          
          // Log incoming events for discovery
          if (!['ping', 'pong'].includes(event)) {
            addLog('📥 ' + event, 'in');
          }
        }
      } catch(e) {}
    });
    
    return ws;
  };
  
  window.WebSocket.prototype = OrigWS.prototype;
  window.WebSocket.CONNECTING = 0;
  window.WebSocket.OPEN = 1;
  window.WebSocket.CLOSING = 2;
  window.WebSocket.CLOSED = 3;

  // === Prediction Engine ===
  function generatePrediction() {
    if (__mm2.history.length < 2) {
      __mm2.prediction = null;
      updatePanel();
      return;
    }
    
    const history = __mm2.history;
    const last = history[history.length - 1];
    const last10 = history.slice(-10);
    const strategy = __mm2.config.strategy;
    let predictedSide, confidence;
    
    switch(strategy) {
      case 'streak': {
        predictedSide = last.side;
        let streak = 1;
        for (let i = history.length - 2; i >= 0; i--) {
          if (history[i].side === last.side) streak++;
          else break;
        }
        confidence = Math.min(50 + streak * 8, 92);
        break;
      }
      case 'alternate': {
        predictedSide = last.side === __mm2.config.headsValue ? __mm2.config.tailsValue : __mm2.config.headsValue;
        const alternations = last10.filter((h, i) => i > 0 && h.side !== last10[i-1].side).length;
        confidence = Math.min(50 + (alternations / Math.max(last10.length - 1, 1)) * 30, 88);
        break;
      }
      case 'frequency': {
        const heads = last10.filter(h => h.side === __mm2.config.headsValue).length;
        const tails = last10.length - heads;
        predictedSide = heads > tails ? __mm2.config.headsValue : __mm2.config.tailsValue;
        confidence = Math.min(50 + Math.abs(heads - tails) * 5, 90);
        break;
      }
      case 'adaptive': {
        // Test all strategies on last 5 results
        const testWindow = history.slice(-8, -1);
        if (testWindow.length < 3) {
          predictedSide = last.side;
          confidence = 50;
        } else {
          // Simple: use frequency for now
          const h = testWindow.filter(x => x.side === __mm2.config.headsValue).length;
          const t = testWindow.length - h;
          predictedSide = h > t ? __mm2.config.headsValue : __mm2.config.tailsValue;
          confidence = 60;
        }
        break;
      }
      default: {
        predictedSide = last.side;
        confidence = 50;
      }
    }
    
    __mm2.prediction = { side: predictedSide, confidence };
    updatePanel();
  }

  // === Floating UI Panel ===
  function createPanel() {
    if (document.getElementById('mm2-predictor-panel')) return;
    
    const panel = document.createElement('div');
    panel.id = 'mm2-predictor-panel';
    panel.innerHTML = `
      <div id="mm2-header">
        <span>🎯 MM2 Predictor</span>
        <span id="mm2-toggle">${__mm2.tracking ? '🟢 ON' : '⭕ OFF'}</span>
      </div>
      <div id="mm2-body">
        <div id="mm2-prediction">
          <div id="mm2-pred-side">—</div>
          <div id="mm2-pred-conf">Confidence: 0%</div>
        </div>
        <div id="mm2-stats">
          <span>W: <span id="mm2-wins">0</span></span>
          <span>L: <span id="mm2-losses">0</span></span>
          <span>G: <span id="mm2-games">0</span></span>
        </div>
        <div id="mm2-logs"></div>
      </div>
      <div id="mm2-footer">
        <button id="mm2-start-btn">${__mm2.tracking ? 'Stop' : 'Start'} Tracking</button>
        <button id="mm2-clear-btn">Clear Logs</button>
        <button id="mm2-close-btn">✕</button>
      </div>
    `;
    
    // Styles
    const style = document.createElement('style');
    style.textContent = `
      #mm2-predictor-panel {
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 320px;
        max-height: 400px;
        background: #0f0f23;
        border: 1px solid #2a2a5e;
        border-radius: 12px;
        z-index: 999999;
        font-family: 'Segoe UI', system-ui, sans-serif;
        color: #ddd;
        font-size: 13px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.6);
        overflow: hidden;
      }
      #mm2-header {
        background: linear-gradient(135deg, #1a1a3e, #0f0f23);
        padding: 10px 14px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid #2a2a5e;
        font-weight: bold;
        color: #e94560;
        cursor: move;
      }
      #mm2-toggle { font-size: 11px; color: #888; }
      #mm2-body { padding: 10px 14px; }
      #mm2-prediction { text-align: center; padding: 8px; margin-bottom: 8px; }
      #mm2-pred-side { font-size: 28px; font-weight: bold; }
      #mm2-pred-side.heads { color: #4fc3f7; }
      #mm2-pred-side.tails { color: #ffb74d; }
      #mm2-pred-conf { font-size: 12px; color: #888; margin-top: 2px; }
      #mm2-stats { display: flex; justify-content: center; gap: 16px; font-size: 12px; margin-bottom: 8px; color: #888; }
      #mm2-stats span { color: #aaa; }
      #mm2-logs {
        max-height: 160px;
        overflow-y: auto;
        background: #0a0a1a;
        border-radius: 6px;
        padding: 6px 8px;
        font-size: 11px;
        font-family: monospace;
      }
      #mm2-logs div { padding: 2px 0; border-bottom: 1px solid #15153a; }
      #mm2-logs .out { color: #4fc3f7; }
      #mm2-logs .in { color: #81c784; }
      #mm2-logs .win { color: #81c784; font-weight: bold; }
      #mm2-logs .loss { color: #e94560; font-weight: bold; }
      #mm2-footer {
        padding: 8px 14px;
        display: flex;
        gap: 6px;
        border-top: 1px solid #2a2a5e;
        background: #0a0a1a;
      }
      #mm2-footer button {
        background: #2a2a5e;
        color: #ddd;
        border: none;
        padding: 4px 12px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 11px;
        transition: 0.2s;
      }
      #mm2-footer button:hover { background: #3a3a7e; }
      #mm2-close-btn { margin-left: auto; background: transparent !important; color: #666 !important; }
      #mm2-close-btn:hover { color: #e94560 !important; }
      #mm2-footer #mm2-start-btn { background: #e94560; color: white; }
      #mm2-footer #mm2-start-btn:hover { opacity: 0.85; }
      ::-webkit-scrollbar { width: 3px; }
      ::-webkit-scrollbar-track { background: #0a0a1a; }
      ::-webkit-scrollbar-thumb { background: #2a2a5e; border-radius: 2px; }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(panel);
    
    // Event listeners
    document.getElementById('mm2-start-btn').addEventListener('click', toggleTracking);
    document.getElementById('mm2-clear-btn').addEventListener('click', () => {
      document.getElementById('mm2-logs').innerHTML = '';
    });
    document.getElementById('mm2-close-btn').addEventListener('click', () => {
      panel.remove();
      style.remove();
    });
    
    // Draggable
    let isDragging = false, startX, startY, origX, origY;
    const header = document.getElementById('mm2-header');
    header.addEventListener('mousedown', (e) => {
      isDragging = true;
      startX = e.clientX; startY = e.clientY;
      origX = panel.offsetLeft; origY = panel.offsetTop;
      panel.style.cursor = 'grabbing';
    });
    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      panel.style.left = (origX + e.clientX - startX) + 'px';
      panel.style.top = (origY + e.clientY - startY) + 'px';
      panel.style.right = 'auto';
      panel.style.bottom = 'auto';
    });
    document.addEventListener('mouseup', () => {
      isDragging = false;
      panel.style.cursor = '';
    });
    
    updatePanel();
  }

  function updatePanel() {
    const sideEl = document.getElementById('mm2-pred-side');
    const confEl = document.getElementById('mm2-pred-conf');
    const toggleEl = document.getElementById('mm2-toggle');
    const winsEl = document.getElementById('mm2-wins');
    const lossesEl = document.getElementById('mm2-losses');
    const gamesEl = document.getElementById('mm2-games');
    
    if (toggleEl) toggleEl.textContent = __mm2.tracking ? '🟢 ON' : '⭕ OFF';
    
    const wins = __mm2.history.filter(h => h.won).length;
    const losses = __mm2.history.filter(h => !h.won).length;
    if (winsEl) winsEl.textContent = wins;
    if (lossesEl) lossesEl.textContent = losses;
    if (gamesEl) gamesEl.textContent = __mm2.history.length;
    
    if (__mm2.prediction && sideEl) {
      sideEl.textContent = __mm2.prediction.side.toUpperCase();
      sideEl.className = 'heads tails'.includes(__mm2.prediction.side) ? __mm2.prediction.side : '';
      if (confEl) confEl.textContent = `Confidence: ${__mm2.prediction.confidence}%`;
    } else if (sideEl) {
      sideEl.textContent = '—';
      sideEl.className = '';
      if (confEl) confEl.textContent = 'Waiting for data...';
    }
  }

  function addLog(msg, className = '') {
    const logs = document.getElementById('mm2-logs');
    if (!logs) return;
    const div = document.createElement('div');
    div.textContent = msg;
    if (className) div.className = className;
    logs.appendChild(div);
    logs.scrollTop = logs.scrollHeight;
    // Keep last 50
    while (logs.children.length > 50) logs.firstChild.remove();
  }

  function toggleTracking() {
    __mm2.tracking = !__mm2.tracking;
    const btn = document.getElementById('mm2-start-btn');
    if (btn) btn.textContent = __mm2.tracking ? 'Stop Tracking' : 'Start Tracking';
    updatePanel();
    addLog(__mm2.tracking ? '▶️ Tracking started' : '⏹️ Tracking stopped');
  }

  // === Public API ===
  window.__mm2Predictor = {
    init: function() {
      loadConfig();
      loadHistory();
      createPanel();
      addLog('🚀 Engine loaded. Config: ' + __mm2.config.strategy);
      if (__mm2.history.length > 0) {
        addLog(`📊 Loaded ${__mm2.history.length} historical results`);
        generatePrediction();
      } else {
        addLog('📊 No history found. Play some games!');
      }
    },
    getPrediction: function() {
      return __mm2.prediction;
    },
    getHistory: function() {
      return __mm2.history.slice();
    },
    getConfig: function() {
      return Object.assign({}, __mm2.config);
    },
    reloadConfig: function() {
      loadConfig();
      addLog('🔄 Config reloaded');
    }
  };

  console.log('[MM2 Predictor] Engine loaded. Use window.__mm2Predictor.init() if not auto-loaded.');
  
})();
