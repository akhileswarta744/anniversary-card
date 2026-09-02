/* =========================================================
   LOVE-OS v5.0 // Live Cloud Relay Terminal Engine (MQTT/WSS)
   100% Guaranteed Inter-State Real-Time Sync (KA <-> KL)
   ========================================================= */

(function () {
    'use strict';

    // 1. URL CONFIG & PARAMS
    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = urlParams.get('room');
    const roleParam = urlParams.get('role'); // 'partner2' or 'partner1'

    const roomId = (roomParam || 'akhil-5y').toLowerCase().trim();
    const isGuest = roleParam === 'partner2';
    const myRole = isGuest ? 'partner2' : 'partner1';

    const STORAGE_KEY = `love_os_v5_${roomId}_state`;

    const defaultState = {
        partner1: 'Akhil',
        partner2: 'My Sweetheart',
        anniversaryDate: '2022-08-31T00:00:00',
        wallet: {
            '$KISSES': 9999,
            '$HUGS': 5000,
            '$LOVECOIN': 5555,
            '$MASSAGE_PASS': 50,
            '$COFFEE_BUCKS': 100
        },
        transactions: [],
        chatMessages: [
            {
                from: 'SYSTEM',
                text: 'LOVE-OS v5.0 initialized. Connected to inter-state cloud relay.',
                time: '00:00:01'
            }
        ],
        coupons: [
            { id: 'C1', title: 'Romantic Candlelight Dinner Out', desc: 'No dishes, no budget limit, full dessert included.', redeemed: false },
            { id: 'C2', title: '30-Min Ultimate Back & Shoulder Massage', desc: 'Scented oils, calming music, zero complaints guaranteed.', redeemed: false },
            { id: 'C3', title: 'Breakfast in Bed + Fresh Coffee', desc: 'Waffles/Pancakes and morning pampering.', redeemed: false },
            { id: 'C4', title: 'Movie & Snack Pick Veto Pass', desc: 'Immunity against all movie genre debates tonight.', redeemed: false },
            { id: 'C5', title: 'One Free Golden Wish', desc: 'Redeemable anytime for any romantic or fun favor.', redeemed: false }
        ],
        theme: 'theme-cyberpunk',
        sfx: true,
        music: false
    };

    let state = loadState();

    function loadState() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const loaded = Object.assign({}, defaultState, JSON.parse(saved));
                // Auto-migrate if previously set to 2021 or missing
                if (loaded.anniversaryDate === '2021-08-31T00:00:00' || !loaded.anniversaryDate) {
                    loaded.anniversaryDate = '2022-08-31T00:00:00';
                }
                return loaded;
            }
        } catch (e) {}
        return JSON.parse(JSON.stringify(defaultState));
    }

    function saveState() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (e) {}
    }

    function getMyName() {
        return myRole === 'partner1' ? state.partner1 : state.partner2;
    }

    function getPartnerName() {
        return myRole === 'partner1' ? state.partner2 : state.partner1;
    }

    // 2. DOM ELEMENTS
    const outputEl = document.getElementById('output');
    const inputEl = document.getElementById('cli-input');
    const terminalBody = document.getElementById('terminal-body');
    const hudUptime = document.getElementById('hud-uptime');
    const hudWallet = document.getElementById('hud-wallet-balance');
    const hudPartners = document.getElementById('hud-partner-names');
    const hudRelayStatus = document.getElementById('hud-relay-status');
    const hudActiveUsers = document.getElementById('hud-active-users');
    const hudRoomBadge = document.getElementById('hud-room-badge');
    const cloudStatusLight = document.getElementById('cloud-status-light');
    const promptUser = document.getElementById('prompt-user');

    const btnInvite = document.getElementById('btn-invite');
    const btnSound = document.getElementById('btn-sound-toggle');
    const btnMusic = document.getElementById('btn-music-toggle');
    const themeSelect = document.getElementById('theme-selector');
    const quickBar = document.getElementById('quick-bar');

    // Modal
    const inviteModal = document.getElementById('invite-modal');
    const btnCloseModal = document.getElementById('btn-close-modal');
    const btnCopyLink = document.getElementById('btn-copy-link');
    const inviteLinkInput = document.getElementById('invite-link-input');
    const modalRoomId = document.getElementById('modal-room-id');
    const modalRoomName = document.getElementById('modal-room-name');
    const qrContainer = document.getElementById('qrcode');

    // History
    let commandHistory = [];
    let historyIndex = -1;

    // 3. AUDIO SYNTHESIZER
    let audioCtx = null;

    function initAudio() {
        if (!audioCtx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) audioCtx = new AudioContext();
        }
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
    }

    function playKeyClick() {
        if (!state.sfx) return;
        initAudio();
        if (!audioCtx) return;
        try {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(600 + Math.random() * 300, audioCtx.currentTime);
            gain.gain.setValueAtTime(0.015, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.04);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.04);
        } catch (e) {}
    }

    function playBeep(freq = 880, type = 'sine', duration = 0.08, gainVal = 0.05) {
        if (!state.sfx) return;
        initAudio();
        if (!audioCtx) return;
        try {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
            gain.gain.setValueAtTime(gainVal, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + duration);
        } catch (e) {}
    }

    function playCoinSound() {
        if (!state.sfx) return;
        initAudio();
        if (!audioCtx) return;
        try {
            const now = audioCtx.currentTime;
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(987.77, now);
            osc.frequency.setValueAtTime(1318.51, now + 0.08);
            gain.gain.setValueAtTime(0.06, now);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(now);
            osc.stop(now + 0.35);
        } catch (e) {}
    }

    function playCelebrateFanfare() {
        if (!state.sfx) return;
        initAudio();
        if (!audioCtx) return;
        const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
        const now = audioCtx.currentTime;
        notes.forEach((freq, idx) => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + idx * 0.09);
            gain.gain.setValueAtTime(0.08, now + idx * 0.09);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.09 + 0.28);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(now + idx * 0.09);
            osc.stop(now + idx * 0.09 + 0.28);
        });
    }

    // 8-bit Synthwave Lo-fi Engine
    let bgmInterval = null;
    let bgmStep = 0;
    const synthChords = [
        [261.63, 329.63, 392.00, 523.25],
        [220.00, 261.63, 329.63, 440.00],
        [174.61, 220.00, 261.63, 349.23],
        [196.00, 246.94, 293.66, 392.00]
    ];

    function startMusic() {
        initAudio();
        if (!audioCtx) return;
        stopMusic();
        state.music = true;
        updateMusicButton();
        bgmStep = 0;
        bgmInterval = setInterval(() => {
            if (!state.music || !audioCtx) return;
            const chordIndex = Math.floor(bgmStep / 4) % synthChords.length;
            const noteIndex = bgmStep % 4;
            const freq = synthChords[chordIndex][noteIndex];

            const now = audioCtx.currentTime;
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now);
            gain.gain.setValueAtTime(0.03, now);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(now);
            osc.stop(now + 0.45);

            bgmStep++;
        }, 320);
    }

    function stopMusic() {
        if (bgmInterval) {
            clearInterval(bgmInterval);
            bgmInterval = null;
        }
        state.music = false;
        updateMusicButton();
    }

    function toggleMusic() {
        if (state.music) {
            stopMusic();
            printLine('🎵 Ambient BGM muted.', 'text-dim');
        } else {
            startMusic();
            printLine('🎵 Romantic 8-Bit Synthwave BGM activated.', 'text-accent');
        }
    }

    function updateMusicButton() {
        btnMusic.querySelector('.label').textContent = state.music ? 'BGM: ON' : 'BGM: OFF';
    }

    function updateSoundButton() {
        btnSound.querySelector('.label').textContent = state.sfx ? 'SFX: ON' : 'SFX: OFF';
    }

    // 4. MATRIX BACKGROUND ANIMATION
    const matrixCanvas = document.getElementById('matrix-canvas');
    const matrixCtx = matrixCanvas.getContext('2d');
    let matrixCols, matrixDrops;
    const matrixChars = '01♥♡<3AKHIL5YEARSLOVEFOREVER0123456789ABCDEF!@#$%&*';

    function initMatrix() {
        matrixCanvas.width = window.innerWidth;
        matrixCanvas.height = window.innerHeight;
        const fontSize = 14;
        matrixCols = Math.floor(matrixCanvas.width / fontSize);
        matrixDrops = Array.from({ length: matrixCols }, () => Math.floor(Math.random() * -50));
    }

    function drawMatrix() {
        matrixCtx.fillStyle = 'rgba(0, 0, 0, 0.08)';
        matrixCtx.fillRect(0, 0, matrixCanvas.width, matrixCanvas.height);

        const themeColor = getComputedStyle(document.body).getPropertyValue('--matrix-char').trim() || '#ff007f';
        matrixCtx.fillStyle = themeColor;
        matrixCtx.font = '14px monospace';

        for (let i = 0; i < matrixDrops.length; i++) {
            const text = matrixChars.charAt(Math.floor(Math.random() * matrixChars.length));
            const x = i * 14;
            const y = matrixDrops[i] * 14;

            matrixCtx.fillText(text, x, y);

            if (y > matrixCanvas.height && Math.random() > 0.975) {
                matrixDrops[i] = 0;
            }
            matrixDrops[i]++;
        }
        requestAnimationFrame(drawMatrix);
    }

    window.addEventListener('resize', initMatrix);
    initMatrix();
    requestAnimationFrame(drawMatrix);

    // 5. CELEBRATION CONFETTI & HEARTS
    const celebCanvas = document.getElementById('celebration-canvas');
    const celebCtx = celebCanvas.getContext('2d');
    let particles = [];

    function resizeCelebCanvas() {
        celebCanvas.width = window.innerWidth;
        celebCanvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resizeCelebCanvas);
    resizeCelebCanvas();

    function launchCelebration(count = 120) {
        playCelebrateFanfare();
        const colors = ['#ff007f', '#00f0ff', '#ffe600', '#05ffa1', '#ffffff', '#ff71ce'];
        for (let i = 0; i < count; i++) {
            particles.push({
                x: celebCanvas.width * (0.2 + Math.random() * 0.6),
                y: celebCanvas.height * 0.7,
                vx: (Math.random() - 0.5) * 16,
                vy: -Math.random() * 18 - 8,
                size: Math.random() * 12 + 6,
                color: colors[Math.floor(Math.random() * colors.length)],
                rotation: Math.random() * 360,
                vRot: (Math.random() - 0.5) * 12,
                type: Math.random() > 0.4 ? 'heart' : 'rect',
                alpha: 1,
                gravity: 0.4
            });
        }
    }

    function renderCelebration() {
        if (particles.length === 0) {
            celebCtx.clearRect(0, 0, celebCanvas.width, celebCanvas.height);
            requestAnimationFrame(renderCelebration);
            return;
        }

        celebCtx.clearRect(0, 0, celebCanvas.width, celebCanvas.height);

        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += p.gravity;
            p.rotation += p.vRot;
            p.alpha -= 0.007;

            if (p.alpha <= 0 || p.y > celebCanvas.height + 50) {
                particles.splice(i, 1);
                continue;
            }

            celebCtx.save();
            celebCtx.globalAlpha = Math.max(0, p.alpha);
            celebCtx.translate(p.x, p.y);
            celebCtx.rotate((p.rotation * Math.PI) / 180);

            if (p.type === 'heart') {
                celebCtx.fillStyle = p.color;
                celebCtx.font = `${p.size * 1.5}px sans-serif`;
                celebCtx.textAlign = 'center';
                celebCtx.textBaseline = 'middle';
                celebCtx.fillText('♥', 0, 0);
            } else {
                celebCtx.fillStyle = p.color;
                celebCtx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
            }

            celebCtx.restore();
        }

        requestAnimationFrame(renderCelebration);
    }
    requestAnimationFrame(renderCelebration);

    // 6. LIVE UPTIME & HUD
    function updateHUD() {
        const start = new Date(state.anniversaryDate).getTime();
        const now = new Date().getTime();
        const diff = Math.max(0, now - start);

        const totalSeconds = Math.floor(diff / 1000);
        const days = Math.floor(totalSeconds / 86400);
        const hours = Math.floor((totalSeconds % 86400) / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        const years = Math.floor(days / 365.25);
        const remDays = Math.floor(days % 365.25);

        const pad = (n) => String(n).padStart(2, '0');
        hudUptime.textContent = `UPTIME: ${years}Y ${remDays}D ${pad(hours)}:${pad(minutes)}:${pad(seconds)} (YEAR 5)`;

        hudWallet.textContent = `${state.wallet['$KISSES'].toLocaleString()} $KISSES`;
        hudPartners.innerHTML = `${state.partner1.toUpperCase()} &hearts; ${state.partner2.toUpperCase()}`;
        promptUser.textContent = `${getMyName().toLowerCase()}@love-os`;
        hudRoomBadge.textContent = `ROOM: ${roomId.toUpperCase()}`;
    }
    setInterval(updateHUD, 1000);
    updateHUD();

    // 7. TERMINAL OUTPUT UTILITIES
    function scrollToBottom() {
        setTimeout(() => {
            terminalBody.scrollTop = terminalBody.scrollHeight;
        }, 10);
    }

    function printRawHTML(html) {
        const div = document.createElement('div');
        div.className = 'term-line';
        div.innerHTML = html;
        outputEl.appendChild(div);
        scrollToBottom();
    }

    function printLine(text, className = '') {
        const p = document.createElement('p');
        p.className = `term-line ${className}`;
        p.textContent = text;
        outputEl.appendChild(p);
        scrollToBottom();
    }

    function printEcho(cmd) {
        const div = document.createElement('div');
        div.className = 'term-cmd-echo';
        div.innerHTML = `<span class="prefix">${getMyName().toLowerCase()}@love-os:~$</span> <span class="cmd-text">${escapeHTML(cmd)}</span>`;
        outputEl.appendChild(div);
        scrollToBottom();
    }

    function escapeHTML(str) {
        return str.replace(/[&<>'"]/g, 
            tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
        );
    }

    // 8. RELIABLE CLOUD RELAY (MQTT over WebSockets)
    // Works across Jio, Airtel, Vi, BSNL, 4G, 5G, Wi-Fi across states (KA <-> KL)
    const myClientId = `love_os_${myRole}_${Math.random().toString(36).substring(2, 8)}`;
    const topic = `love-os/5th-anniversary/room/${roomId}`;
    let mqttClient = null;
    let isCloudConnected = false;
    let partnerOnline = false;

    // Cross-tab broadcast backup
    let broadcast = null;
    try {
        broadcast = new BroadcastChannel(`love_os_room_${roomId}`);
        broadcast.onmessage = (e) => handleIncomingPacket(e.data);
    } catch (e) {}

    function initCloudRelay() {
        cloudStatusLight.className = 'status-indicator waiting';
        hudRelayStatus.textContent = 'CONNECTING...';

        // Connect to HiveMQ Public WebSocket Broker over TLS 8884 (port 443 compliant)
        const brokerUrl = 'wss://broker.hivemq.com:8884/mqtt';

        if (typeof mqtt === 'undefined') {
            console.warn('MQTT.js not loaded, using local broadcast channel');
            hudRelayStatus.textContent = 'LOCAL_CHANNEL';
            return;
        }

        try {
            mqttClient = mqtt.connect(brokerUrl, {
                clientId: myClientId,
                clean: true,
                connectTimeout: 8000,
                reconnectPeriod: 3000
            });

            mqttClient.on('connect', () => {
                isCloudConnected = true;
                cloudStatusLight.className = 'status-indicator connected';
                hudRelayStatus.textContent = 'CONNECTED_TO_RELAY_⚡';
                console.log('Connected to Cloud Relay on topic:', topic);

                mqttClient.subscribe(topic, { qos: 1 }, (err) => {
                    if (!err) {
                        // Announce Presence
                        sendPacket({
                            type: 'PRESENCE_JOIN',
                            senderId: myClientId,
                            senderRole: myRole,
                            senderName: getMyName(),
                            time: new Date().toLocaleTimeString()
                        });
                    }
                });
            });

            mqttClient.on('message', (msgTopic, payload) => {
                try {
                    const packet = JSON.parse(payload.toString());
                    handleIncomingPacket(packet);
                } catch (e) {
                    console.error('Error parsing MQTT message:', e);
                }
            });

            mqttClient.on('error', (err) => {
                console.warn('MQTT connection error:', err);
                hudRelayStatus.textContent = 'RECONNECTING...';
            });

            mqttClient.on('close', () => {
                isCloudConnected = false;
                cloudStatusLight.className = 'status-indicator waiting';
                hudRelayStatus.textContent = 'DISCONNECTED';
            });
        } catch (e) {
            console.warn('Cloud relay failed to initialize:', e);
        }

        // Send periodic heartbeat presence every 10 seconds
        setInterval(() => {
            if (isCloudConnected && mqttClient) {
                sendPacket({
                    type: 'HEARTBEAT',
                    senderId: myClientId,
                    senderRole: myRole,
                    senderName: getMyName()
                });
            }
        }, 10000);
    }

    function sendPacket(packet) {
        packet.senderId = myClientId;
        packet.senderRole = myRole;
        if (mqttClient && isCloudConnected) {
            mqttClient.publish(topic, JSON.stringify(packet), { qos: 1 });
        }
        if (broadcast) {
            try { broadcast.postMessage(packet); } catch (e) {}
        }
    }

    function handleIncomingPacket(packet) {
        if (!packet || !packet.type) return;
        // Ignore self packets
        if (packet.senderId === myClientId) return;

        switch (packet.type) {
            case 'PRESENCE_JOIN':
                partnerOnline = true;
                hudActiveUsers.textContent = `${state.partner1.toUpperCase()} + ${state.partner2.toUpperCase()} 🟢`;
                playCelebrateFanfare();
                launchCelebration(80);

                if (packet.senderName) {
                    if (myRole === 'partner1') state.partner2 = packet.senderName;
                    else state.partner1 = packet.senderName;
                    saveState();
                    updateHUD();
                }

                printLine(`⚡ [HEART-LINK ACTIVE]: ${escapeHTML(packet.senderName || 'Your Partner')} connected from Kerala!`, 'text-success');

                // Host responds with full state sync
                if (myRole === 'partner1') {
                    sendPacket({
                        type: 'STATE_SYNC',
                        wallet: state.wallet,
                        partner1: state.partner1,
                        partner2: state.partner2,
                        anniversaryDate: state.anniversaryDate,
                        coupons: state.coupons
                    });
                }
                break;

            case 'HEARTBEAT':
                partnerOnline = true;
                hudActiveUsers.textContent = `${state.partner1.toUpperCase()} + ${state.partner2.toUpperCase()} 🟢`;
                break;

            case 'STATE_SYNC':
                if (packet.wallet) state.wallet = Object.assign({}, state.wallet, packet.wallet);
                if (packet.coupons) state.coupons = packet.coupons;
                if (packet.partner1) state.partner1 = packet.partner1;
                if (packet.anniversaryDate) state.anniversaryDate = packet.anniversaryDate;
                saveState();
                updateHUD();
                break;

            case 'CHAT':
                playBeep(1200, 'sine', 0.1);
                state.chatMessages.push({
                    from: packet.senderName,
                    text: packet.text,
                    time: packet.time
                });
                saveState();

                const chatBubbleHTML = `
<div class="chat-thread">
    <div class="chat-bubble from-partner">
        <div class="chat-bubble-header">
            <span class="chat-bubble-author">[${escapeHTML(packet.senderName)}]</span>
            <span>${packet.time}</span>
        </div>
        <div class="chat-bubble-body">${escapeHTML(packet.text)}</div>
    </div>
</div>
`;
                printRawHTML(chatBubbleHTML);
                break;

            case 'PAY':
                playCoinSound();
                launchCelebration(70);

                if (!state.wallet[packet.currency]) state.wallet[packet.currency] = 0;
                state.wallet[packet.currency] += packet.amount;
                state.transactions.unshift(packet);
                saveState();
                updateHUD();

                const receiptHTML = `
<div class="cyber-receipt">
    <div class="receipt-title">⚡ INCOMING LOVE-PAYMENT RECEIVED ⚡</div>
    <div class="receipt-row"><span>SENDER:</span><strong class="text-accent">${escapeHTML(packet.senderName)}</strong></div>
    <div class="receipt-row"><span>RECIPIENT:</span><strong class="text-highlight">${escapeHTML(getMyName())}</strong></div>
    <div class="receipt-row"><span>AMOUNT RECEIVED:</span><strong class="text-gold">+${packet.amount.toLocaleString()} ${packet.currency}</strong></div>
    <div class="receipt-row"><span>MEMO:</span><em>"${escapeHTML(packet.reason)}"</em></div>
    <div class="receipt-row"><span>TIMESTAMP:</span><span>${packet.time}</span></div>
    <div class="receipt-divider"></div>
    <div class="receipt-hash">TX_HASH: ${packet.txHash}</div>
    <div class="receipt-status">✔ CREDITED DIRECTLY TO YOUR WALLET!</div>
</div>
`;
                printRawHTML(receiptHTML);
                break;

            case 'REDEEM':
                playCoinSound();
                launchCelebration(50);
                const coupon = state.coupons.find(c => c.id === packet.couponId);
                if (coupon) coupon.redeemed = true;
                saveState();
                printLine(`🎟️ [COUPON CLAIMED]: ${escapeHTML(packet.senderName)} redeemed '${escapeHTML(packet.title)}'!`, 'text-gold');
                break;

            case 'MARRY_AGAIN':
                launchCelebration(200);
                commands['sudo marry-again'].exec(true);
                break;
        }
    }

    // 9. COMMAND PROCESSOR
    const commands = {
        help: {
            desc: 'Display all available hacker commands & manual',
            exec: () => {
                playBeep(650, 'sine', 0.1);
                const html = `
<div class="help-grid">
    <div class="help-card">
        <span class="help-cmd" onclick="window.runTerminalCmd('invite')">🔗 invite</span>
        <div class="help-desc">Get WhatsApp share link & QR code for her phone in Kerala!</div>
    </div>
    <div class="help-card">
        <span class="help-cmd" onclick="window.runTerminalCmd('chat Happy 5th Anniversary my love!')">💬 chat [message]</span>
        <div class="help-desc">Send live messages across states in real-time.</div>
    </div>
    <div class="help-card">
        <span class="help-cmd" onclick="window.runTerminalCmd('pay 500 $KISSES for endless happiness')">💸 pay &lt;amt&gt; &lt;curr&gt; [for &lt;reason&gt;]</span>
        <div class="help-desc">Transfer $KISSES, $HUGS, $LOVECOIN live to her screen!</div>
    </div>
    <div class="help-card">
        <span class="help-cmd" onclick="window.runTerminalCmd('balance')">💰 balance</span>
        <div class="help-desc">View wallet balances across all currencies.</div>
    </div>
    <div class="help-card">
        <span class="help-cmd" onclick="window.runTerminalCmd('uptime')">⏳ uptime</span>
        <div class="help-desc">5-year relationship uptime & live statistics.</div>
    </div>
    <div class="help-card">
        <span class="help-cmd" onclick="window.runTerminalCmd('decrypt')">🔓 decrypt / letter</span>
        <div class="help-desc">Decrypt the secret 5th-anniversary love letter.</div>
    </div>
    <div class="help-card">
        <span class="help-cmd" onclick="window.runTerminalCmd('coupons')">🎟️ coupons / redeem [id]</span>
        <div class="help-desc">View & redeem romantic anniversary coupons.</div>
    </div>
    <div class="help-card">
        <span class="help-cmd" onclick="window.runTerminalCmd('sudo marry-again')">💍 sudo marry-again</span>
        <div class="help-desc">Renew 5-year vows with synchronized fireworks!</div>
    </div>
    <div class="help-card">
        <span class="help-cmd" onclick="window.runTerminalCmd('customize')">⚙️ customize</span>
        <div class="help-desc">Set names & anniversary date.</div>
    </div>
    <div class="help-card">
        <span class="help-cmd" onclick="window.runTerminalCmd('theme')">🎨 theme [cyberpunk|matrix|amber|vaporwave]</span>
        <div class="help-desc">Change terminal visual theme.</div>
    </div>
    <div class="help-card">
        <span class="help-cmd" onclick="window.runTerminalCmd('music')">🎵 music</span>
        <div class="help-desc">Toggle 8-bit romantic synthwave BGM.</div>
    </div>
    <div class="help-card">
        <span class="help-cmd" onclick="window.runTerminalCmd('clear')">🧹 clear</span>
        <div class="help-desc">Clear terminal screen buffer.</div>
    </div>
</div>
`;
                printRawHTML(html);
            }
        },

        invite: {
            desc: 'Show QR Code and Link to connect her phone/device',
            exec: () => openInviteModal()
        },

        chat: {
            desc: 'Chat with partner in real-time terminal',
            exec: (args) => {
                if (!args || args.length === 0) {
                    playBeep(600, 'sine', 0.1);
                    let chatHTML = '<div class="chat-thread">';
                    state.chatMessages.forEach(msg => {
                        const isMine = msg.from === getMyName();
                        chatHTML += `
<div class="chat-bubble ${!isMine && msg.from !== 'SYSTEM' ? 'from-partner' : ''}">
    <div class="chat-bubble-header">
        <span class="chat-bubble-author">[${escapeHTML(msg.from)}]</span>
        <span>${msg.time}</span>
    </div>
    <div class="chat-bubble-body">${escapeHTML(msg.text)}</div>
</div>
`;
                    });
                    chatHTML += '</div><p class="text-dim">💡 Send a message: <code>chat &lt;your message&gt;</code></p>';
                    printRawHTML(chatHTML);
                    return;
                }

                const userMsg = args.join(' ');
                const timeNow = new Date().toLocaleTimeString();
                const myName = getMyName();

                state.chatMessages.push({
                    from: myName,
                    text: userMsg,
                    time: timeNow
                });
                saveState();
                playBeep(880, 'sine', 0.08);

                const bubbleHTML = `
<div class="chat-thread">
    <div class="chat-bubble">
        <div class="chat-bubble-header">
            <span class="chat-bubble-author">[${escapeHTML(myName)}]</span>
            <span>${timeNow}</span>
        </div>
        <div class="chat-bubble-body">${escapeHTML(userMsg)}</div>
    </div>
</div>
`;
                printRawHTML(bubbleHTML);

                // Publish live message via Cloud Relay
                sendPacket({
                    type: 'CHAT',
                    senderName: myName,
                    text: userMsg,
                    time: timeNow
                });
            }
        },

        pay: {
            desc: 'Transfer romantic currency with live cyber receipt',
            exec: (args) => {
                if (!args || args.length < 2) {
                    printLine('❌ Usage: pay <amount> <$KISSES|$HUGS|$LOVECOIN|$MASSAGE_PASS|$COFFEE_BUCKS> [for <reason>]', 'text-accent');
                    printLine('💡 Example: pay 500 $KISSES for being the sweetest wife', 'text-dim');
                    return;
                }

                const amount = parseInt(args[0], 10);
                if (isNaN(amount) || amount <= 0) {
                    printLine('❌ Error: Amount must be a positive integer.', 'text-accent');
                    return;
                }

                let currency = args[1].toUpperCase();
                if (!currency.startsWith('$')) currency = '$' + currency;

                if (!state.wallet[currency]) state.wallet[currency] = 1000;

                let reason = 'Endless love & appreciation';
                const forIdx = args.findIndex(a => a.toLowerCase() === 'for');
                if (forIdx !== -1 && forIdx + 1 < args.length) {
                    reason = args.slice(forIdx + 1).join(' ').replace(/^["']|["']$/g, '');
                }

                const txHash = '0xLOVE' + Array.from({length: 24}, () => Math.floor(Math.random()*16).toString(16)).join('').toUpperCase();
                const timestamp = new Date().toLocaleTimeString();

                state.wallet[currency] += amount;
                const tx = {
                    type: 'PAY',
                    senderName: getMyName(),
                    recipientName: getPartnerName(),
                    txHash,
                    amount,
                    currency,
                    reason,
                    time: timestamp
                };
                state.transactions.unshift(tx);
                saveState();
                updateHUD();

                playCoinSound();
                launchCelebration(60);

                // Send live payment packet
                sendPacket(tx);

                const html = `
<div class="cyber-receipt">
    <div class="receipt-title">⚡ TRANSACTION CONFIRMED ON LOVE-CHAIN ⚡</div>
    <div class="receipt-row"><span>SENDER:</span><strong class="text-highlight">${escapeHTML(getMyName())}</strong></div>
    <div class="receipt-row"><span>RECIPIENT:</span><strong class="text-accent">${escapeHTML(getPartnerName())}</strong></div>
    <div class="receipt-row"><span>AMOUNT SENT:</span><strong class="text-gold">+${amount.toLocaleString()} ${currency}</strong></div>
    <div class="receipt-row"><span>MEMO / REASON:</span><em>"${escapeHTML(reason)}"</em></div>
    <div class="receipt-row"><span>TIMESTAMP:</span><span>${timestamp}</span></div>
    <div class="receipt-divider"></div>
    <div class="receipt-hash">TX_HASH: ${txHash}</div>
    <div class="receipt-status">✔ LIVE DELIVERED TO HER SCREEN!</div>
</div>
`;
                printRawHTML(html);
            }
        },

        uptime: {
            desc: 'Display relationship uptime & system statistics',
            exec: () => {
                playBeep(750, 'sine', 0.1);
                const start = new Date(state.anniversaryDate);
                const now = new Date();
                const totalDays = Math.floor((now - start) / (1000 * 60 * 60 * 24));
                const totalHours = totalDays * 24;
                const completedYears = Math.floor(totalDays / 365.25);
                
                const html = `
<div class="timeline-card">
    <div class="timeline-year">💖 RELATIONSHIP UPTIME REPORT // ENTERING YEAR 5</div>
    <div style="margin: 8px 0;">
        <p>▶ <strong>Pair:</strong> <span class="text-highlight">${state.partner1}</span> &amp; <span class="text-accent">${state.partner2}</span></p>
        <p>▶ <strong>Inception Date:</strong> August 31, 2022</p>
        <p>▶ <strong>Milestones:</strong> <span class="text-success">${completedYears} Years Completed</span> (${totalDays.toLocaleString()} active days)</p>
        <p>▶ <strong>Current Chapter:</strong> <span class="text-highlight">Officially entering Year 5 of love! 🚀❤️</span></p>
        <p>▶ <strong>Love SLA Availability:</strong> <span class="text-accent">100.000% (Zero downtime)</span></p>
        <p>▶ <strong>Cloud Relay Status:</strong> <span class="text-gold">${isCloudConnected ? 'ONLINE 🟢 (INTER-STATE)' : 'CONNECTING...'}</span></p>
    </div>
    <p class="text-dim" style="font-size:12px;">"Debugging life together since 31-Aug-2022. Infinite love loop active."</p>
</div>
`;
                printRawHTML(html);
            }
        },

        balance: {
            desc: 'View romantic wallet balances',
            exec: () => {
                playCoinSound();
                let rows = '';
                for (const [curr, amt] of Object.entries(state.wallet)) {
                    rows += `<div class="receipt-row"><span>${curr}</span><strong class="text-gold">${amt.toLocaleString()}</strong></div>`;
                }
                const html = `
<div class="cyber-receipt" style="max-width:380px;">
    <div class="receipt-title">LOVE-CHAIN WALLET LEDGER</div>
    ${rows}
    <div class="receipt-divider"></div>
    <p class="text-dim" style="font-size:11px;">Send currency anytime with: <code>pay &lt;amt&gt; &lt;currency&gt; [for reason]</code></p>
</div>
`;
                printRawHTML(html);
            }
        },

        memories: {
            desc: 'View 5-year milestone journey and logs',
            exec: (args) => {
                playBeep(700, 'sine', 0.1);
                const memoryLogs = [
                    { year: 'YEAR 1 (2022-2023)', title: 'THE INITIAL COMMIT & SPARK', desc: 'August 31, 2022: The moment our paths merged. Endless late-night talks, butterflies, discovering each other\'s worlds, and setting the foundation for something extraordinary.' },
                    { year: 'YEAR 2 (2023-2024)', title: 'EXPEDITIONS & SHARED ADVENTURES', desc: 'Exploring new places, mastering shared inside jokes, cooking experiments, and realizing that home isn\'t a place—it\'s being next to you.' },
                    { year: 'YEAR 3 (2024-2025)', title: 'UNBREAKABLE ENCRYPTION & SUPPORT', desc: 'Navigating life\'s highs and lows hand in hand. Strengthening our bond, supporting each other\'s ambitions, and standing as an unshakeable team.' },
                    { year: 'YEAR 4 (2025-2026)', title: 'GROWING DREAMS & 4 YEARS COMPLETED', desc: 'Celebrating quiet cozy mornings, big wins, silly laughs, and building the future we always talked about. 4 full years strong!' },
                    { year: 'YEAR 5 (2026+)', title: 'STEPPING INTO YEAR 5 & FOREVER AHEAD', desc: '4 completed years of unconditional love, trust, and happiness. Today we step into our 5th year together, and the best is yet to come!' }
                ];

                let targetLogs = memoryLogs;
                if (args && args[0]) {
                    const yr = parseInt(args[0], 10);
                    if (yr >= 1 && yr <= 5) targetLogs = [memoryLogs[yr - 1]];
                }

                let html = '<div style="margin: 12px 0;">';
                targetLogs.forEach(m => {
                    html += `
<div class="timeline-card">
    <div class="timeline-year">✨ ${m.year} :: ${m.title}</div>
    <p style="margin-top:6px; color:#e0e0e0; font-size:13.5px;">${m.desc}</p>
</div>
`;
                });
                html += '</div>';
                printRawHTML(html);
            }
        },

        decrypt: {
            desc: 'Decrypt secret 5th-anniversary love letter',
            exec: () => {
                printLine('⚙ Initiating 4096-bit RSA decryption on love_letter.gpg...', 'text-highlight');
                const scrambledSteps = [
                    '🔐 [CIPHER]: 8f#9a!k2*0xLL__5YRS__DECRYPTING...',
                    '⚡ [KEY_EXCHANGE]: Handshake verified with Heart-Key-ID: FOREVER_5_YEARS',
                    '✨ [STATUS]: Plaintext resolved successfully!'
                ];

                scrambledSteps.forEach((step, idx) => {
                    setTimeout(() => {
                        printLine(step, idx === 2 ? 'text-success' : 'text-dim');
                    }, (idx + 1) * 350);
                });

                setTimeout(() => {
                    launchCelebration(80);
                    const letterHTML = `
<div class="love-letter-box">
    <div class="love-letter-title">💌 TOP SECRET // LOVE LETTER 💌</div>
    <div class="love-letter-content">
To my dearest ${escapeHTML(state.partner2)},

Happy Anniversary! On August 31, 2022, our beautiful journey began, and every single day with you has been an absolute blessing.

Through every laugh, every late-night conversation, every adventure across states, and every hurdle we conquered hand-in-hand, you have been my rock, my favorite person, and my happiest home.

We have officially completed 4 wonderful years together, and today we step into our 5th year stronger and more in love than ever before. 

A lifetime to go, and I would choose you all over again in every lifetime, in every timeline, and in every universe.

Happy Anniversary, my love! ❤️
    </div>
    <div class="love-letter-seal">
        — Forever yours, ${escapeHTML(state.partner1)} &hearts;
    </div>
</div>
`;
                    printRawHTML(letterHTML);
                }, 1300);
            }
        },

        coupons: {
            desc: 'View and redeem romantic anniversary coupons',
            exec: () => {
                playBeep(650, 'sine', 0.1);
                let html = '<div style="margin: 12px 0;"><h4 class="text-highlight" style="margin-bottom:8px;">🎟️ 5TH ANNIVERSARY COUPON VAULT</h4>';
                state.coupons.forEach(c => {
                    const statusBadge = c.redeemed 
                        ? '<span style="color:#888; text-decoration:line-through;">[REDEEMED]</span>' 
                        : `<button class="quick-chip" style="display:inline; margin-left:6px;" onclick="window.runTerminalCmd('redeem ${c.id}')">Redeem ${c.id}</button>`;
                    html += `
<div class="timeline-card" style="border-left: 3px solid ${c.redeemed ? '#555' : 'var(--text-accent)'};">
    <div style="display:flex; justify-content:space-between; align-items:center;">
        <strong class="${c.redeemed ? 'text-dim' : 'text-gold'}">${c.id}: ${escapeHTML(c.title)}</strong>
        ${statusBadge}
    </div>
    <p style="font-size:12px; color:var(--text-dim); margin-top:4px;">${escapeHTML(c.desc)}</p>
</div>
`;
                });
                html += '</div>';
                printRawHTML(html);
            }
        },

        redeem: {
            desc: 'Redeem a coupon by ID (e.g. redeem C1)',
            exec: (args) => {
                if (!args || args.length === 0) {
                    printLine('❌ Usage: redeem <coupon_id> (e.g., redeem C1)', 'text-accent');
                    return;
                }
                const id = args[0].toUpperCase();
                const coupon = state.coupons.find(c => c.id === id);
                if (!coupon) {
                    printLine(`❌ Error: Coupon ID '${id}' not found. Type 'coupons' to view IDs.`, 'text-accent');
                    return;
                }

                if (coupon.redeemed) {
                    printLine(`⚠️ Coupon '${id}' has already been redeemed!`, 'text-gold');
                    return;
                }

                coupon.redeemed = true;
                saveState();
                playCoinSound();
                launchCelebration(60);

                sendPacket({
                    type: 'REDEEM',
                    senderName: getMyName(),
                    couponId: coupon.id,
                    title: coupon.title
                });

                const html = `
<div class="cyber-receipt">
    <div class="receipt-title">🎟️ COUPON REDEEMED SUCCESSFULLY 🎟️</div>
    <div class="receipt-row"><span>COUPON ID:</span><strong class="text-highlight">${coupon.id}</strong></div>
    <div class="receipt-row"><span>PERK:</span><strong class="text-accent">${escapeHTML(coupon.title)}</strong></div>
    <div class="receipt-row"><span>TERMS:</span><span>${escapeHTML(coupon.desc)}</span></div>
    <div class="receipt-divider"></div>
    <div class="receipt-status">✔ CLAIMED BY ${escapeHTML(getMyName().toUpperCase())}!</div>
</div>
`;
                printRawHTML(html);
            }
        },

        'sudo marry-again': {
            desc: 'Renew 5-year vows with full screen fireworks',
            exec: (isRemote = false) => {
                launchCelebration(200);
                if (!isRemote) {
                    sendPacket({
                        type: 'MARRY_AGAIN',
                        senderName: getMyName()
                    });
                }
                const html = `
<div class="ascii-banner" style="color:#05ffa1; text-shadow:0 0 15px #05ffa1;">
  .-''''-.       .-''''-.
 /        \\     /        \\
|  (O)  (O) |   |  (O)  (O) |
 \\   __   /     \\   __   /
  '--||--'       '--||--'
     ||             ||
  [💍 RING 1 ]   [💍 RING 2 ]
</div>
<div class="love-letter-box" style="border-color:#05ffa1; box-shadow: 0 0 30px rgba(5,255,161,0.4);">
    <div class="love-letter-title" style="color:#05ffa1;">💍 5-YEAR VOW RENEWAL AUTHORIZED 💍</div>
    <p style="font-size:15px; text-align:center; line-height:1.8;">
        <strong>SUDO PRIVILEGES GRANTED:</strong><br>
        5 Years of unconditional devotion, laughter, and partnership confirmed.<br>
        <strong>Decision:</strong> Renewed for the next 50+ years with infinite love! ❤️
    </p>
</div>
`;
                printRawHTML(html);
            }
        },

        customize: {
            desc: 'Customize partner names and anniversary start date',
            exec: () => {
                const p1 = prompt('Enter Your Name:', getMyName());
                if (p1) {
                    if (myRole === 'partner1') state.partner1 = p1.trim();
                    else state.partner2 = p1.trim();
                }

                const p2 = prompt('Enter Partner Name:', getPartnerName());
                if (p2) {
                    if (myRole === 'partner1') state.partner2 = p2.trim();
                    else state.partner1 = p2.trim();
                }

                const d = prompt('Enter Anniversary Date (YYYY-MM-DD):', state.anniversaryDate.split('T')[0]);
                if (d && !isNaN(new Date(d).getTime())) {
                    state.anniversaryDate = d + 'T00:00:00';
                }

                saveState();
                updateHUD();
                playBeep(880, 'sine', 0.15);
                printLine(`✔ Settings updated! Logged in as [${getMyName()}] paired with [${getPartnerName()}]`, 'text-success');

                sendPacket({
                    type: 'PRESENCE_JOIN',
                    senderName: getMyName()
                });
            }
        },

        theme: {
            desc: 'Switch color theme: cyberpunk, matrix, amber, vaporwave',
            exec: (args) => {
                if (!args || args.length === 0) {
                    printLine('Available themes: cyberpunk, matrix, amber, vaporwave', 'text-highlight');
                    return;
                }
                const themeName = 'theme-' + args[0].toLowerCase().replace('theme-', '');
                if (['theme-cyberpunk', 'theme-matrix', 'theme-amber', 'theme-vaporwave'].includes(themeName)) {
                    document.body.className = themeName;
                    state.theme = themeName;
                    themeSelect.value = themeName;
                    saveState();
                    playBeep(700, 'sine', 0.1);
                    printLine(`✔ Theme switched to '${themeName.replace('theme-', '')}'`, 'text-success');
                } else {
                    printLine(`❌ Invalid theme. Choose from: cyberpunk, matrix, amber, vaporwave`, 'text-accent');
                }
            }
        },

        music: {
            desc: 'Toggle ambient 8-bit Synthwave background music',
            exec: () => toggleMusic()
        },

        clear: {
            desc: 'Clear the terminal output',
            exec: () => {
                outputEl.innerHTML = '';
                printWelcomeBanner();
            }
        }
    };

    commands['letter'] = commands.decrypt;
    commands['msg'] = commands.chat;
    commands['transfer'] = commands.pay;
    commands['stats'] = commands.uptime;
    commands['cls'] = commands.clear;

    // 10. MODAL / INVITE HANDLER
    function getInviteUrl() {
        const url = new URL(window.location.href);
        url.searchParams.set('room', roomId);
        url.searchParams.set('role', 'partner2');
        return url.toString();
    }

    function openInviteModal() {
        initAudio();
        const shareUrl = getInviteUrl();
        inviteLinkInput.value = shareUrl;
        modalRoomId.textContent = roomId.toUpperCase();
        modalRoomName.textContent = roomId;

        qrContainer.innerHTML = '';
        if (typeof QRCode !== 'undefined') {
            new QRCode(qrContainer, {
                text: shareUrl,
                width: 190,
                height: 190,
                colorDark: '#0d021a',
                colorLight: '#ffffff',
                correctLevel: QRCode.CorrectLevel.M
            });
        }

        inviteModal.classList.remove('hidden');
        playBeep(750, 'sine', 0.1);
    }

    function closeInviteModal() {
        inviteModal.classList.add('hidden');
    }

    btnInvite.addEventListener('click', openInviteModal);
    btnCloseModal.addEventListener('click', closeInviteModal);
    inviteModal.addEventListener('click', (e) => {
        if (e.target === inviteModal) closeInviteModal();
    });

    btnCopyLink.addEventListener('click', () => {
        inviteLinkInput.select();
        navigator.clipboard.writeText(inviteLinkInput.value).then(() => {
            btnCopyLink.textContent = '✔ COPIED!';
            setTimeout(() => { btnCopyLink.textContent = '📋 COPY LINK'; }, 2000);
            playBeep(1000, 'sine', 0.08);
        }).catch(() => {
            document.execCommand('copy');
            btnCopyLink.textContent = '✔ COPIED!';
            setTimeout(() => { btnCopyLink.textContent = '📋 COPY LINK'; }, 2000);
        });
    });

    // 11. COMMAND EXECUTION DISPATCHER
    function executeCommand(inputStr) {
        const raw = inputStr.trim();
        if (!raw) return;

        printEcho(raw);
        commandHistory.push(raw);
        historyIndex = commandHistory.length;

        if (raw.toLowerCase() === 'sudo marry-again' || raw.toLowerCase() === 'marry-again') {
            commands['sudo marry-again'].exec();
            return;
        }

        const parts = raw.split(/\s+/);
        const cmdName = parts[0].toLowerCase();
        const args = parts.slice(1);

        if (commands[cmdName]) {
            commands[cmdName].exec(args);
        } else {
            playBeep(300, 'sawtooth', 0.15);
            printLine(`bash: command not found: ${escapeHTML(cmdName)}. Type 'help' to see all available commands.`, 'text-accent');
        }
    }

    window.runTerminalCmd = function (cmdText) {
        initAudio();
        inputEl.value = '';
        executeCommand(cmdText);
        inputEl.focus();
    };

    // 12. WELCOME BANNER
    function printWelcomeBanner() {
        const asciiArt = `
  ███████╗    ██╗   ██╗███████╗ █████╗ ██████╗ ███████╗
  ██╔════╝    ╚██╗ ██╔╝██╔════╝██╔══██╗██╔══██╗██╔════╝
  ███████╗     ╚████╔╝ █████╗  ███████║██████╔╝███████╗
  ╚════██║      ╚██╔╝  ██╔══╝  ██╔══██║██╔══██╗╚════██║
  ███████║       ██║   ███████╗██║  ██║██║  ██║███████║
  ╚══════╝       ╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝
   ⚡ LOVE-OS v5.0 // STEPPING INTO YEAR 5 (SINCE 31-AUG-2022) ⚡
`;
        printRawHTML(`<div class="ascii-banner">${asciiArt}</div>`);
        printLine(`🎉 Logged in as [${getMyName()}] in Secure Room [${roomId.toUpperCase()}]!`, 'text-highlight');
        if (isGuest) {
            printLine(`💖 Connected from Kerala! Type 'chat <msg>' or 'pay' to interact live with Akhil!`, 'text-success');
        } else {
            printLine(`💡 Click 'INVITE HER' or type 'invite' to share the live room link with her in Kerala!`, 'text-accent');
        }
    }

    // 13. EVENT LISTENERS
    inputEl.addEventListener('keydown', (e) => {
        playKeyClick();
        initAudio();

        if (e.key === 'Enter') {
            const val = inputEl.value;
            inputEl.value = '';
            executeCommand(val);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (commandHistory.length > 0) {
                historyIndex = Math.max(0, historyIndex - 1);
                inputEl.value = commandHistory[historyIndex] || '';
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (commandHistory.length > 0) {
                historyIndex = Math.min(commandHistory.length, historyIndex + 1);
                inputEl.value = commandHistory[historyIndex] || '';
            }
        } else if (e.key === 'Tab') {
            e.preventDefault();
            const current = inputEl.value.trim().toLowerCase();
            if (!current) return;
            const match = Object.keys(commands).find(c => c.startsWith(current));
            if (match) inputEl.value = match;
        }
    });

    btnSound.addEventListener('click', () => {
        state.sfx = !state.sfx;
        saveState();
        updateSoundButton();
        playBeep(600, 'sine', 0.08);
    });

    btnMusic.addEventListener('click', () => toggleMusic());

    themeSelect.addEventListener('change', (e) => {
        const theme = e.target.value;
        document.body.className = theme;
        state.theme = theme;
        saveState();
        playBeep(700, 'sine', 0.08);
    });

    quickBar.addEventListener('click', (e) => {
        const target = e.target.closest('.quick-chip');
        if (!target) return;
        const cmd = target.getAttribute('data-cmd');
        if (cmd) window.runTerminalCmd(cmd);
    });

    document.addEventListener('click', (e) => {
        if (!window.getSelection().toString() && !e.target.closest('button, select, input, .help-cmd, .modal-card')) {
            inputEl.focus();
        }
    });

    if (state.theme) {
        document.body.className = state.theme;
        themeSelect.value = state.theme;
    }
    updateSoundButton();
    updateMusicButton();

    // Start Cloud Relay
    initCloudRelay();

    // Initial Print
    printWelcomeBanner();

})();
