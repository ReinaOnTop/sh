class NGLMessageSender {
  constructor() {
    this.isRunning = false;
    this.isPremium = false;
    this.rushMode = false;
    this.stats = {
      sent: 0,
      failed: 0,
      total: 0
    };
    this.rushIntervals = [];
    
    this.initializeElements();
    this.attachEventListeners();
    this.loadPremiumStatus();
  }

  initializeElements() {
    this.nglLink = document.getElementById('nglLink');
    this.message = document.getElementById('message');
    this.delay = document.getElementById('delay');
    this.count = document.getElementById('count');
    this.startBtn = document.getElementById('startBtn');
    this.rushBtn = document.getElementById('rushBtn');
    this.stopBtn = document.getElementById('stopBtn');
    this.progress = document.getElementById('progress');
    this.sentCount = document.getElementById('sentCount');
    this.failedCount = document.getElementById('failedCount');
    this.successRate = document.getElementById('successRate');
    this.results = document.getElementById('results');
    this.premiumStatus = document.getElementById('premiumStatus');
    this.promoCodeInput = document.getElementById('promoCodeInput');
    this.claimCodeBtn = document.getElementById('claimCodeBtn');
    this.premiumMsg = document.getElementById('premiumMsg');
  }

  attachEventListeners() {
    this.startBtn.addEventListener('click', () => this.startSending(false));
    this.rushBtn.addEventListener('click', () => this.startSending(true));
    this.stopBtn.addEventListener('click', () => this.stopSending());
    this.claimCodeBtn.addEventListener('click', () => this.claimPremiumCode());
  }

  // Premium Code System
  loadPremiumStatus() {
    const premiumData = localStorage.getItem('nglPremium');
    if (premiumData) {
      const data = JSON.parse(premiumData);
      this.isPremium = data.isPremium;
      this.premiumCode = data.code;
      this.updatePremiumUI();
    }
  }

  claimPremiumCode() {
    const code = this.promoCodeInput.value.trim().toUpperCase();
    
    if (!code) {
      this.showPremiumMessage('Please enter a code', false);
      return;
    }

    if (this.validatePremiumCode(code)) {
      this.activatePremium(code);
    } else {
      this.showPremiumMessage('Invalid code. Contact @ujangkraz for premium access', false);
    }
  }

  validatePremiumCode(code) {
    // Premium code validation system
    const validCodes = this.getValidCodes();
    return validCodes.includes(code);
  }

  getValidCodes() {
    // Enhanced code system with different tiers
    const baseCodes = ['UJANGKRAZ2024', 'NGLPREMIUM', 'PREMIUM123'];
    const dynamicCodes = this.generateDynamicCodes();
    
    return [...baseCodes, ...dynamicCodes];
  }

  generateDynamicCodes() {
    // Generate date-based codes (changes daily)
    const today = new Date();
    const dateString = today.toISOString().slice(0, 10).replace(/-/g, '');
    const codes = [];
    
    // Format: PREMIUM-YYYYMMDD
    codes.push(`PREMIUM-${dateString}`);
    
    // Format: NGL-YYYY-MM-DD
    const dateParts = today.toISOString().slice(0, 10).split('-');
    codes.push(`NGL-${dateParts[0]}-${dateParts[1]}-${dateParts[2]}`);
    
    // Special codes
    const specialCodes = [
      'UJANGKRAZ-PRO',
      'NGL-VIP-2024',
      'SPAM-MASTER'
    ];
    
    return [...codes, ...specialCodes];
  }

  activatePremium(code) {
    this.isPremium = true;
    this.premiumCode = code;
    
    // Save to localStorage
    localStorage.setItem('nglPremium', JSON.stringify({
      isPremium: true,
      code: code,
      activatedAt: new Date().toISOString()
    }));
    
    this.updatePremiumUI();
    this.showPremiumMessage('Premium activated! Rush mode unlocked! 🚀', true);
  }

  updatePremiumUI() {
    if (this.isPremium) {
      this.premiumStatus.textContent = 'Mode: Premium ⭐';
      this.premiumStatus.style.color = '#ffd700';
      this.rushBtn.disabled = false;
      this.promoCodeInput.disabled = true;
      this.claimCodeBtn.disabled = true;
    } else {
      this.premiumStatus.textContent = 'Mode: Free';
      this.premiumStatus.style.color = 'white';
      this.rushBtn.disabled = true;
    }
  }

  showPremiumMessage(message, isSuccess) {
    this.premiumMsg.textContent = message;
    this.premiumMsg.style.color = isSuccess ? '#00ff00' : '#ff6b6b';
    
    setTimeout(() => {
      this.premiumMsg.textContent = '';
    }, 3000);
  }

  // Main sending functionality
  async startSending(rushMode) {
    if (this.isRunning) return;
    
    if (rushMode && !this.isPremium) {
      this.showPremiumMessage('Rush mode requires premium access!', false);
      return;
    }
    
    this.isRunning = true;
    this.rushMode = rushMode;
    this.resetStats();
    
    const username = this.extractUsername(this.nglLink.value);
    const message = this.message.value;
    const delay = parseInt(this.delay.value);
    const count = rushMode ? 100 : parseInt(this.count.value); // Rush mode always does 100
    
    if (!username || !message) {
      alert('Please fill in all fields');
      this.isRunning = false;
      return;
    }
    
    this.startBtn.disabled = true;
    this.rushBtn.disabled = true;
    this.stopBtn.disabled = false;
    
    if (rushMode) {
      this.runRushMode(username, message, delay);
    } else {
      await this.runNormalMode(username, message, delay, count);
    }
  }

  async runNormalMode(username, message, delay, count) {
    for (let i = 0; i < count && this.isRunning; i++) {
      await this.sendMessage(username, message);
      this.updateProgress(i + 1, count);
      
      if (i < count - 1) {
        await this.sleep(delay);
      }
    }
    this.finishSending();
  }

  runRushMode(username, message, delay) {
    // Rush mode: runs 2 functions every second
    const rushInterval = setInterval(() => {
      if (!this.isRunning) {
        clearInterval(rushInterval);
        return;
      }
      
      // Run 2 functions simultaneously every second
      this.sendMessage(username, message);
      this.sendMessage(username, message + " 🚀"); // Add rush indicator
      
    }, 1000); // Every second
    
    this.rushIntervals.push(rushInterval);
  }

  async sendMessage(username, message) {
    const deviceId = this.generateDeviceId();
    const formData = new URLSearchParams({
      username: username,
      question: message,
      deviceId: deviceId,
      gameSlug: '',
      style: '',
      referrer: ''
    });

    try {
      const response = await fetch('https://ngl.link/api/submit', {
        method: 'POST',
        headers: {
          'Accept': '*/*',
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'Sec-Fetch-Site': 'same-origin',
          'Origin': 'https://ngl.link',
          'Sec-Fetch-Mode': 'cors',
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5.2 Mobile/15E148 Safari/604.1',
          'Referer': `https://ngl.link/${username}`,
          'Sec-Fetch-Dest': 'empty',
          'X-Requested-With': 'XMLHttpRequest',
          'Accept-Language': 'en-AU,en;q=0.9',
          'Priority': 'u=3, i',
          'Accept-Encoding': 'gzip, deflate, br, zstd',
          'Connection': 'close'
        },
        body: formData.toString()
      });

      if (response.ok) {
        this.stats.sent++;
        this.addResult('Message sent successfully', true);
      } else {
        this.stats.failed++;
        this.addResult(`Failed: ${response.status}`, false);
      }
    } catch (error) {
      this.stats.failed++;
      this.addResult(`Error: ${error.message}`, false);
    }

    this.updateStats();
  }

  generateDeviceId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  extractUsername(input) {
    if (input.includes('ngl.link/')) {
      return input.split('ngl.link/')[1].split('/')[0];
    }
    return input;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  updateProgress(current, total) {
    const percentage = (current / total) * 100;
    this.progress.style.width = percentage + '%';
  }

  updateStats() {
    this.sentCount.textContent = `Sent: ${this.stats.sent}`;
    this.failedCount.textContent = `Failed: ${this.stats.failed}`;
    this.stats.total = this.stats.sent + this.stats.failed;
    const successRate = this.stats.total > 0 ? ((this.stats.sent / this.stats.total) * 100).toFixed(2) : 0;
    this.successRate.textContent = `Success: ${successRate}%`;
  }

  addResult(message, isSuccess) {
    const resultItem = document.createElement('div');
    resultItem.className = `result-item ${isSuccess ? 'result-success' : 'result-error'}`;
    resultItem.textContent = `${new Date().toLocaleTimeString()} - ${message}`;
    this.results.insertBefore(resultItem, this.results.firstChild);
    
    // Limit results to last 50
    if (this.results.children.length > 50) {
      this.results.removeChild(this.results.lastChild);
    }
  }

  resetStats() {
    this.stats = {
      sent: 0,
      failed: 0,
      total: 0
    };
    this.updateStats();
    this.results.innerHTML = '';
    this.progress.style.width = '0%';
  }

  finishSending() {
    this.isRunning = false;
    this.rushMode = false;
    this.startBtn.disabled = false;
    this.rushBtn.disabled = !this.isPremium;
    this.stopBtn.disabled = true;
    
    // Clear rush intervals
    this.rushIntervals.forEach(interval => clearInterval(interval));
    this.rushIntervals = [];
  }

  stopSending() {
    this.isRunning = false;
    this.rushMode = false;
    
    // Clear rush intervals
    this.rushIntervals.forEach(interval => clearInterval(interval));
    this.rushIntervals = [];
    
    this.startBtn.disabled = false;
    this.rushBtn.disabled = !this.isPremium;
    this.stopBtn.disabled = true;
  }
}

// Initialize the application
const sender = new NGLMessageSender();
