/* =========================================================
   LOVE-OS v5.0 // Hacker Terminal + Live P2P WebRTC Engine
   ========================================================= */

(function () {
    'use strict';

    // 1. DEFAULT STATE & CONFIG
    const STORAGE_KEY = 'love_os_v5_p2p_state';

    // Parse URL Params
    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = urlParams.get('room');
    const roleParam = urlParams.get('role'); // 'partner2' or null

    const isGuest = Boolean(roomParam);
    const currentRoomId = roomParam || ('5y-' + Math.random().toString(36).substring(2, 8));

    const defaultState = {
        partner1: isGuest ? 'Akhil' : 'Akhil',
        partner2: isGuest ? 'My Sweetheart' : 'My Sweetheart',
        myRole: isGuest ? 'partner2' : 'partner1',
        anniversaryDate: '2021-08-31T00:00:00',
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
                text: 'LOVE-OS v5.0 initialized. Live P2P ready.',
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
                const parsed = JSON.parse(saved);
                return Object.assign({}, defaultState, parsed);
            }
        } catch (e) {
            console.warn('LocalStorage error', e);
        }
        return JSON.parse(JSON.stringify(defaultState));
    }

    function saveState() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (e) {}
    }

    function getMyName() {
        return state.myRole === 'partner1' ? state.partner1 : state.partner2;
    }

    function getPartnerName() {
        return state.myRole === 'partner1' ? state.partner2 : state.partner1;
    }

    // 2. DOM ELEMENTS
    const outputEl = document.getElementById('output');
    const inputEl = document.getElementById('cli-input');
    const terminalBody = document.getElementById('terminal-body');
    const hudUptime = document.getElementById('hud-uptime');
    const hudWallet = document.getElementById('hud-wallet-balance');
    const hudPartners = document.getElementById('hud-partner-names');
    const hudSysStatus = document.getElementById('hud-sys-status');
    const hudP2PStatus = document.getElementById('hud-p2p-status');
    const promptUser = document.getElementById('prompt-user');
    const p2pBadge = document.getElementById('p2p-badge');
    const p2pStatusLight = document.getElementById('p2p-status-light');

    const btnInvite = document.getElementById('btn-invite');
    const btnSound = document.getElementById('btn-sound-toggle');
    const btnMusic = document.getElementById('btn-music-toggle');
    const themeSelect = document.getElementById('theme-selector');
    const quickBar = document.getElementById('quick-bar');

    // Modal elements
    const inviteModal = document.getElementById('invite-modal');
    const btnCloseModal = document.getElementById('btn-close-modal');
    const btnCopyLink = document.getElementById('btn-copy-link');
    const inviteLinkInput = document.getElementById('invite-link-input');
    const modalRoomId = document.getElementById('modal-room-id');
    const qrContainer = document.getElementById('qrcode');

    // Command history
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

    // 6. LIVE UPTIME & HUD REFRESH
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
        hudUptime.textContent = `UPTIME: ${years}Y ${remDays}D ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;

        hudWallet.textContent = `${state.wallet['$KISSES'].toLocaleString()} $KISSES`;
        hudPartners.innerHTML = `${state.partner1.toUpperCase()} &hearts; ${state.partner2.toUpperCase()}`;
        promptUser.textContent = `${getMyName().toLowerCase()}@love-os`;
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

    // 8. REAL-TIME P2P WEBRTC CONNECTION ENGINE
    let peer = null;
    let peerConn = null;
    let isPeerConnected = false;

    // Cross-tab BroadcastChannel fallback
    let broadcast = null;
    try {
        broadcast = new BroadcastChannel('love_os_p2p_channel');
        broadcast.onmessage = (event) => {
            handleIncomingPacket(event.data);
        };
    } catch (e) {}

    function generateShareUrl() {
        const url = new URL(window.location.href);
        url.searchParams.set('room', currentRoomId);
        url.searchParams.set('role', 'partner2');
        return url.toString();
    }

    function initP2P() {
        const hostPeerId = `love-os-room-${currentRoomId}-host`;
        const myPeerId = isGuest ? `love-os-room-${currentRoomId}-guest-${Math.random().toString(36).substring(2,6)}` : hostPeerId;

        p2pBadge.textContent = `ROOM: ${currentRoomId.toUpperCase()}`;
        p2pStatusLight.className = 'status-indicator waiting';
        hudP2PStatus.textContent = isGuest ? 'CONNECTING_TO_HOST...' : 'WAITING_FOR_HER...';

        if (typeof Peer === 'undefined') {
            console.warn('PeerJS CDN not reachable, falling back to BroadcastChannel');
            hudP2PStatus.textContent = 'LOCAL_CHANNEL_ACTIVE';
            return;
        }

        try {
            peer = new Peer(myPeerId, {
                debug: 1,
                config: {
                    iceServers: [
                        { urls: 'stun:stun.l.google.com:19302' },
                        { urls: 'stun:global.stun.twilio.com:3478' }
                    ]
                }
            });

            peer.on('open', (id) => {
                console.log('PeerJS initialized with ID:', id);
                if (isGuest) {
                    // Guest connects to Host
                    connectToPeer(hostPeerId);
                }
            });

            peer.on('connection', (conn) => {
                setupConnection(conn);
            });

            peer.on('error', (err) => {
                console.warn('PeerJS error:', err);
                if (isGuest && err.type === 'peer-unavailable') {
                    hudP2PStatus.textContent = 'HOST_OFFLINE';
                    printLine('⚠️ Could not connect to host. Make sure the host terminal is open in another tab or device.', 'text-accent');
                }
            });
        } catch (e) {
            console.warn('PeerJS init failed:', e);
        }
    }

    function connectToPeer(targetId) {
        if (!peer) return;
        const conn = peer.connect(targetId, { reliable: true });
        setupConnection(conn);
    }

    function setupConnection(conn) {
        peerConn = conn;

        peerConn.on('open', () => {
            isPeerConnected = true;
            p2pStatusLight.className = 'status-indicator connected';
            p2pBadge.textContent = 'PEER: CONNECTED 🟢';
            hudP2PStatus.textContent = 'LIVE_ENCRYPTED_LINK_ACTIVE';
            hudSysStatus.textContent = 'PAIRED_TOGETHER';

            playCelebrateFanfare();
            launchCelebration(60);

            // Send Handshake
            sendP2PPacket({
                type: 'HANDSHAKE',
                senderRole: state.myRole,
                senderName: getMyName(),
                anniversaryDate: state.anniversaryDate
            });

            printLine(`⚡ [HEART-LINK ESTABLISHED]: Connected with ${getPartnerName()}! Live chatting & payments active.`, 'text-success');
        });

        peerConn.on('data', (data) => {
            handleIncomingPacket(data);
        });

        peerConn.on('close', () => {
            isPeerConnected = false;
            p2pStatusLight.className = 'status-indicator waiting';
            p2pBadge.textContent = 'PEER: DISCONNECTED 🟡';
            hudP2PStatus.textContent = 'WAITING_FOR_RECONNECT';
            printLine(`⚡ [HEART-LINK]: Partner disconnected. Re-waiting for connection...`, 'text-accent');
        });
    }

    function sendP2PPacket(packet) {
        if (peerConn && peerConn.open) {
            peerConn.send(packet);
        }
        if (broadcast) {
            try { broadcast.postMessage(packet); } catch (e) {}
        }
    }

    function handleIncomingPacket(packet) {
        if (!packet || !packet.type) return;

        // Ignore packets sent by ourselves in cross-tab broadcast
        if (packet.senderRole === state.myRole) return;

        switch (packet.type) {
            case 'HANDSHAKE':
                if (packet.senderName) {
                    if (state.myRole === 'partner1') {
                        state.partner2 = packet.senderName;
                    } else {
                        state.partner1 = packet.senderName;
                    }
                    saveState();
                    updateHUD();
                }
                playBeep(990, 'triangle', 0.12);
                printLine(`💖 [LINK]: ${escapeHTML(packet.senderName || 'Your Partner')} is in the terminal!`, 'text-highlight');
                break;

            case 'CHAT':
                playBeep(1200, 'sine', 0.1);
                state.chatMessages.push({
                    from: packet.senderName,
                    text: packet.text,
                    time: packet.time
                });
                saveState();

                const replyHTML = `
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
                printRawHTML(replyHTML);
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
    <div class="receipt-status">✔ CREDITED TO YOUR WALLET!</div>
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
                printLine(`🎟️ [COUPON CLAIMED]: ${escapeHTML(packet.senderName)} redeemed '${escapeHTML(packet.title)}'! Time to deliver!`, 'text-gold');
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
        <div class="help-desc">Generate Live WebRTC link & QR code for her phone!</div>
    </div>
    <div class="help-card">
        <span class="help-cmd" onclick="window.runTerminalCmd('chat')">💬 chat [message]</span>
        <div class="help-desc">Live chat directly across both devices in real-time.</div>
    </div>
    <div class="help-card">
        <span class="help-cmd" onclick="window.runTerminalCmd('pay 500 $KISSES for being my world')">💸 pay &lt;amt&gt; &lt;currency&gt; [for &lt;reason&gt;]</span>
        <div class="help-desc">Transfer $KISSES, $HUGS, $LOVECOIN live to her screen!</div>
    </div>
    <div class="help-card">
        <span class="help-cmd" onclick="window.runTerminalCmd('balance')">💰 balance</span>
        <div class="help-desc">View current balances across all romantic wallets.</div>
    </div>
    <div class="help-card">
        <span class="help-cmd" onclick="window.runTerminalCmd('uptime')">⏳ uptime</span>
        <div class="help-desc">5-year relationship uptime, SLA %, & live stats.</div>
    </div>
    <div class="help-card">
        <span class="help-cmd" onclick="window.runTerminalCmd('decrypt')">🔓 decrypt / letter</span>
        <div class="help-desc">Decrypt the top-secret 5th-anniversary love letter.</div>
    </div>
    <div class="help-card">
        <span class="help-cmd" onclick="window.runTerminalCmd('coupons')">🎟️ coupons / redeem [id]</span>
        <div class="help-desc">View & redeem romantic coupons (Dinner, Massage, etc.).</div>
    </div>
    <div class="help-card">
        <span class="help-cmd" onclick="window.runTerminalCmd('sudo marry-again')">💍 sudo marry-again</span>
        <div class="help-desc">Renew 5-year vows with synchronized fireworks!</div>
    </div>
    <div class="help-card">
        <span class="help-cmd" onclick="window.runTerminalCmd('customize')">⚙️ customize</span>
        <div class="help-desc">Set names & anniversary start date.</div>
    </div>
    <div class="help-card">
        <span class="help-cmd" onclick="window.runTerminalCmd('theme')">🎨 theme [cyberpunk|matrix|amber|vaporwave]</span>
        <div class="help-desc">Change terminal visual theme.</div>
    </div>
    <div class="help-card">
        <span class="help-cmd" onclick="window.runTerminalCmd('music')">🎵 music</span>
        <div class="help-desc">Toggle 8-bit romantic synthwave audio generator.</div>
    </div>
    <div class="help-card">
        <span class="help-cmd" onclick="window.runTerminalCmd('clear')">🧹 clear</span>
        <div class="help-desc">Clear the terminal screen buffer.</div>
    </div>
</div>
`;
                printRawHTML(html);
            }
        },

        invite: {
            desc: 'Show QR Code and Link to connect her phone/device',
            exec: () => {
                openInviteModal();
            }
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
                    chatHTML += '</div><p class="text-dim">💡 Send a message by typing: <code>chat &lt;your message&gt;</code></p>';
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

                // Broadcast live over WebRTC
                sendP2PPacket({
                    type: 'CHAT',
                    senderRole: state.myRole,
                    senderName: myName,
                    text: userMsg,
                    time: timeNow
                });

                // If standalone (no peer connected), simulate sweet auto-response
                if (!isPeerConnected) {
                    setTimeout(() => {
                        const responses = [
                            `Aww, you always know how to make my heartbeat overclock! Happy 5th anniversary! ❤️`,
                            `5 years with you feels like the best infinite loop I never want to break out of. 🥰`,
                            `System response: My love for you has exceeded maximum buffer capacity! 🚀✨`,
                            `Sending 1,000,000 $KISSES right back to your heart address! 💋`,
                            `Access granted to my heart forever and always. Love you so much! 🔐💖`
                        ];
                        const autoReply = responses[Math.floor(Math.random() * responses.length)];
                        const replyTime = new Date().toLocaleTimeString();
                        const partnerName = getPartnerName();

                        state.chatMessages.push({
                            from: partnerName,
                            text: autoReply,
                            time: replyTime
                        });
                        saveState();

                        playBeep(1200, 'triangle', 0.12);
                        const replyHTML = `
<div class="chat-thread">
    <div class="chat-bubble from-partner">
        <div class="chat-bubble-header">
            <span class="chat-bubble-author">[${escapeHTML(partnerName)}]</span>
            <span>${replyTime}</span>
        </div>
        <div class="chat-bubble-body">${escapeHTML(autoReply)}</div>
    </div>
</div>
`;
                        printRawHTML(replyHTML);
                    }, 800);
                }
            }
        },

        pay: {
            desc: 'Transfer romantic currency with an authentic cyber receipt',
            exec: (args) => {
                if (!args || args.length < 2) {
                    printLine('❌ Usage: pay <amount> <$KISSES|$HUGS|$LOVECOIN|$MASSAGE_PASS|$COFFEE_BUCKS> [for <reason>]', 'text-accent');
                    printLine('💡 Example: pay 500 $KISSES for being the sweetest partner', 'text-dim');
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
                    senderRole: state.myRole,
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

                // Broadcast live transaction over WebRTC
                sendP2PPacket(tx);

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
    <div class="receipt-status">✔ BROADCASTED TO PARTNER TERMINAL</div>
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
                
                const html = `
<div class="timeline-card">
    <div class="timeline-year">💖 RELATIONSHIP UPTIME REPORT // 5 YEARS COMPLETED</div>
    <div style="margin: 8px 0;">
        <p>▶ <strong>Pair:</strong> <span class="text-highlight">${state.partner1}</span> &amp; <span class="text-accent">${state.partner2}</span></p>
        <p>▶ <strong>Inception Date:</strong> ${start.toDateString()}</p>
        <p>▶ <strong>Total Active Days:</strong> <span class="text-success">${totalDays.toLocaleString()} days</span> (${totalHours.toLocaleString()} hours)</p>
        <p>▶ <strong>Love SLA Availability:</strong> <span class="text-accent">100.000% (Zero downtime recorded)</span></p>
        <p>▶ <strong>P2P Socket:</strong> <span class="text-gold">${isPeerConnected ? 'LIVE ENCRYPTED' : 'READY TO PAIR'}</span></p>
    </div>
    <p class="text-dim" style="font-size:12px;">"5 years of building dreams, debugging life together, and crafting infinite memories."</p>
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
                    { year: 'YEAR 1 (2021-2022)', title: 'THE INITIAL COMMIT & SPARK', desc: 'The moment our paths merged. Endless late-night talks, butterflies, discovering each other\'s worlds, and setting the foundation for something extraordinary.' },
                    { year: 'YEAR 2 (2022-2023)', title: 'EXPEDITIONS & SHARED ADVENTURES', desc: 'Exploring new places, mastering shared inside jokes, cooking experiments, and realizing that home isn\'t a place—it\'s being next to you.' },
                    { year: 'YEAR 3 (2023-2024)', title: 'UNBREAKABLE ENCRYPTION & SUPPORT', desc: 'Navigating life\'s highs and lows hand in hand. Strengthening our bond, supporting each other\'s ambitions, and standing as an unshakeable team.' },
                    { year: 'YEAR 4 (2024-2025)', title: 'GROWING DREAMS & EVERYDAY MAGIC', desc: 'Celebrating quiet cozy mornings, big wins, silly laughs, and building the future we always talked about. Growing deeper in love every single day.' },
                    { year: 'YEAR 5 (2025-2026)', title: 'HALF A DECADE & FOREVER AHEAD', desc: '5 full years of unconditional love, trust, and happiness. Today we celebrate half a decade of pure magic, and the adventure has only just begun.' }
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
    <div class="love-letter-title">💌 TOP SECRET // 5TH ANNIVERSARY LOVE LETTER 💌</div>
    <div class="love-letter-content">
To my dearest ${escapeHTML(state.partner2)},

Happy 5th Anniversary! Five years ago, we began this incredible journey together, and every day since has been an absolute gift.

Through every laugh, every adventure, every quiet moment, and every challenge, you have been my rock, my favorite person, and my greatest blessing. Thank you for loving me, inspiring me, and filling our life with so much warmth and joy.

Five years down, a lifetime to go. I would choose you all over again in every lifetime, in every timeline, and in every universe.

Happy 5th Anniversary, my love! ❤️
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

                sendP2PPacket({
                    type: 'REDEEM',
                    senderRole: state.myRole,
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
    <div class="receipt-status">✔ REDEEMED BY ${escapeHTML(getMyName().toUpperCase())}!</div>
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
                    sendP2PPacket({
                        type: 'MARRY_AGAIN',
                        senderRole: state.myRole,
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
                    if (state.myRole === 'partner1') state.partner1 = p1.trim();
                    else state.partner2 = p1.trim();
                }

                const p2 = prompt('Enter Partner Name:', getPartnerName());
                if (p2) {
                    if (state.myRole === 'partner1') state.partner2 = p2.trim();
                    else state.partner1 = p2.trim();
                }

                const d = prompt('Enter Anniversary Date (YYYY-MM-DD):', state.anniversaryDate.split('T')[0]);
                if (d && !isNaN(new Date(d).getTime())) {
                    state.anniversaryDate = d + 'T00:00:00';
                }

                saveState();
                updateHUD();
                playBeep(880, 'sine', 0.15);
                printLine(`✔ Settings updated! Authenticated as ${getMyName()} & paired with ${getPartnerName()}`, 'text-success');

                sendP2PPacket({
                    type: 'HANDSHAKE',
                    senderRole: state.myRole,
                    senderName: getMyName(),
                    anniversaryDate: state.anniversaryDate
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
    function openInviteModal() {
        initAudio();
        const shareUrl = generateShareUrl();
        inviteLinkInput.value = shareUrl;
        modalRoomId.textContent = currentRoomId.toUpperCase();

        // Render QR Code
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
  ██████╗     ██╗   ██╗███████╗ █████╗ ██████╗ ███████╗
  ╚════██╗    ╚██╗ ██╔╝██╔════╝██╔══██╗██╔══██╗██╔════╝
   █████╔╝     ╚████╔╝ █████╗  ███████║██████╔╝███████╗
   ╚═══██╗      ╚██╔╝  ██╔══╝  ██╔══██║██╔══██╗╚════██║
  ██████╔╝       ██║   ███████╗██║  ██║██║  ██║███████║
  ╚═════╝        ╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝
   ⚡ LOVE-OS v5.0 // LIVE P2P 5TH ANNIVERSARY TERMINAL ⚡
`;
        printRawHTML(`<div class="ascii-banner">${asciiArt}</div>`);
        printLine(`🎉 Logged in as [${getMyName()}] in Room [${currentRoomId.toUpperCase()}]!`, 'text-highlight');
        if (isGuest) {
            printLine(`🔗 Connected as Partner 2! Start live chatting with 'chat <msg>' or pay with 'pay'.`, 'text-success');
        } else {
            printLine(`💡 Click 'INVITE HER' at the top right or type 'invite' to connect her phone/laptop live!`, 'text-accent');
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

    // Initialize P2P WebRTC
    initP2P();

    // Initial Print
    printWelcomeBanner();

})();
