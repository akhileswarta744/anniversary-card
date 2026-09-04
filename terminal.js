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

    const roomId = (roomParam || 'akhil-4y').toLowerCase().trim();
    const isGuest = roleParam === 'partner2';
    const myRole = isGuest ? 'partner2' : 'partner1';

    const STORAGE_KEY = `love_os_v4_${roomId}_state`;

    const defaultState = {
        partner1: 'Akhil',
        partner2: 'Her',
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
        theme: 'theme-romantic',
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
                if (!loaded.theme || loaded.theme === 'theme-cyberpunk') {
                    loaded.theme = 'theme-romantic';
                }
                // Ensure pair is always Akhil & Her, never Akhil & Akhil
                loaded.partner1 = 'Akhil';
                if (!loaded.partner2 || loaded.partner2.toLowerCase() === 'akhil' || loaded.partner2.toLowerCase() === 'my sweetheart') {
                    loaded.partner2 = 'Her';
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
        return myRole === 'partner1' ? 'Akhil' : (state.partner2 || 'Her');
    }

    function getPartnerName() {
        return myRole === 'partner1' ? (state.partner2 || 'Her') : 'Akhil';
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
    const btnSend = document.getElementById('btn-send');
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

    // Network State
    let isCloudConnected = false;
    let partnerOnline = false;

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

    function playSlapSound(mood = 'angry') {
        if (!state.sfx) return;
        initAudio();
        if (!audioCtx) return;
        try {
            const now = audioCtx.currentTime;
            if (mood === 'sad') {
                // Sad slide: sliding cartoon wobble (480Hz -> 110Hz)
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(480, now);
                osc.frequency.exponentialRampToValueAtTime(110, now + 0.38);
                gain.gain.setValueAtTime(0.25, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.start(now);
                osc.stop(now + 0.4);
            } else if (mood === 'happy') {
                // Happy boing: comic upward chirp
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(260, now);
                osc.frequency.exponentialRampToValueAtTime(780, now + 0.15);
                gain.gain.setValueAtTime(0.3, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.start(now);
                osc.stop(now + 0.22);
            }

            // Slap whip & impact crack
            const bufferSize = Math.floor(audioCtx.sampleRate * 0.09);
            const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.22));
            }
            const noise = audioCtx.createBufferSource();
            noise.buffer = buffer;
            const noiseFilter = audioCtx.createBiquadFilter();
            noiseFilter.type = 'bandpass';
            noiseFilter.frequency.setValueAtTime(mood === 'angry' ? 1300 : 1800, now);
            const noiseGain = audioCtx.createGain();
            noiseGain.gain.setValueAtTime(mood === 'angry' ? 0.45 : 0.3, now);
            noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
            noise.connect(noiseFilter);
            noiseFilter.connect(noiseGain);
            noiseGain.connect(audioCtx.destination);
            noise.start(now);

            // Low impact thump
            const thump = audioCtx.createOscillator();
            const thumpGain = audioCtx.createGain();
            thump.type = 'triangle';
            thump.frequency.setValueAtTime(mood === 'angry' ? 320 : 250, now);
            thump.frequency.exponentialRampToValueAtTime(mood === 'angry' ? 35 : 55, now + 0.22);
            thumpGain.gain.setValueAtTime(mood === 'angry' ? 0.45 : 0.28, now);
            thumpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.23);
            thump.connect(thumpGain);
            thumpGain.connect(audioCtx.destination);
            thump.start(now);
            thump.stop(now + 0.23);
        } catch (e) {}
    }

    function triggerSlapAnimation(isIncoming, senderName, reason, mood) {
        initAudio();

        // Auto-detect mood if not provided
        if (!mood) {
            const lower = (reason || '').toLowerCase();
            if (/poda\s*patti|angry|bad|dog/i.test(lower)) mood = 'angry';
            else if (/ni\s*poda|happy\s*aa|sad|neutral/i.test(lower)) mood = 'sad';
            else if (/happy|good|ok/i.test(lower)) mood = 'happy';
            else mood = 'angry';
        }

        playSlapSound(mood);

        // Vibration patterns
        if (navigator.vibrate) {
            try {
                if (mood === 'angry') navigator.vibrate([180, 50, 180, 50, 220]);
                else if (mood === 'sad') navigator.vibrate([120, 80, 120]);
                else navigator.vibrate([80, 40, 80]);
            } catch (e) {}
        }

        // Screen shake
        document.body.classList.remove('screen-shake');
        const wrapper = document.querySelector('.terminal-wrapper');
        if (wrapper) wrapper.classList.remove('screen-shake');
        
        void document.body.offsetWidth; // force reflow

        document.body.classList.add('screen-shake');
        if (wrapper) wrapper.classList.add('screen-shake');
        setTimeout(() => {
            document.body.classList.remove('screen-shake');
            if (wrapper) wrapper.classList.remove('screen-shake');
        }, 580);

        // Mood-specific Flash
        const flash = document.createElement('div');
        flash.className = `slap-flash slap-flash-${mood}`;
        document.body.appendChild(flash);
        setTimeout(() => flash.remove(), 650);

        // Visual overlay setup
        let overlay = document.getElementById('slap-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'slap-overlay';
            overlay.className = 'slap-overlay';
            document.body.appendChild(overlay);
        }

        let handIcon = '👋';
        let impactText = '💥 SMACK! 💥';
        let moodClass = 'text-angry';
        let tagBorder = '#ff0033';
        let tagColor = '#ff5577';
        let defaultQuote = reason;

        if (mood === 'angry') {
            handIcon = '😡👋';
            impactText = '💥 PODA PATTI! 💥';
            moodClass = 'text-angry';
            tagBorder = '#ff0033';
            tagColor = '#ff5577';
            if (!reason || reason === 'being too cute') defaultQuote = 'Poda patti! 🐕💨';
        } else if (mood === 'sad') {
            handIcon = '🥺👋';
            impactText = '💔 NI PODA! 💔';
            moodClass = 'text-sad';
            tagBorder = '#00d4ff';
            tagColor = '#80d8ff';
            if (!reason || reason === 'being too cute') defaultQuote = 'Ni poda 🥺🌧️';
        } else if (mood === 'happy') {
            handIcon = '😄👋';
            impactText = '✨ AA OK! ✨';
            moodClass = 'text-happy';
            tagBorder = '#ffd700';
            tagColor = '#ffe57f';
            if (!reason || reason === 'being too cute') defaultQuote = 'Aa ok! 😄💖';
        }

        overlay.innerHTML = `
            <div class="slap-animation-box">
                <div class="slap-hand-anim">${handIcon}</div>
                <div class="slap-smack-text ${moodClass}">${impactText}</div>
                <div class="slap-reason-tag" style="border-color:${tagBorder}; color:${tagColor};">
                    ${isIncoming ? `FROM ${escapeHTML(senderName).toUpperCase()}: ` : 'SLAP DELIVERED: '}
                    <em>"${escapeHTML(defaultQuote)}"</em>
                </div>
            </div>
        `;
        setTimeout(() => {
            if (overlay) overlay.innerHTML = '';
        }, 1600);
    }

    function playKissSound() {
        if (!state.sfx) return;
        initAudio();
        if (!audioCtx) return;
        try {
            const now = audioCtx.currentTime;
            // 1. Sweet kissing smooch (frequency sweep 360 -> 1100 -> 750 Hz)
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(360, now);
            osc.frequency.exponentialRampToValueAtTime(1100, now + 0.08);
            osc.frequency.exponentialRampToValueAtTime(750, now + 0.18);
            gain.gain.setValueAtTime(0.35, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(now);
            osc.stop(now + 0.22);

            // 2. High sparkle chime
            const chime = audioCtx.createOscillator();
            const chimeGain = audioCtx.createGain();
            chime.type = 'triangle';
            chime.frequency.setValueAtTime(1567.98, now + 0.08); // G6
            chime.frequency.setValueAtTime(2093.00, now + 0.15); // C7
            chimeGain.gain.setValueAtTime(0.12, now + 0.08);
            chimeGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
            chime.connect(chimeGain);
            chimeGain.connect(audioCtx.destination);
            chime.start(now + 0.08);
            chime.stop(now + 0.35);
        } catch (e) {}
    }

    function playHugSound() {
        if (!state.sfx) return;
        initAudio();
        if (!audioCtx) return;
        try {
            const now = audioCtx.currentTime;
            // Warm cuddle chime (gentle ascending chord: C4, E4, G4, C5)
            const chord = [261.63, 329.63, 392.00, 523.25];
            chord.forEach((freq, idx) => {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, now + idx * 0.07);
                gain.gain.setValueAtTime(0.1, now + idx * 0.07);
                gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.07 + 0.45);
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.start(now + idx * 0.07);
                osc.stop(now + idx * 0.07 + 0.45);
            });
        } catch (e) {}
    }

    function triggerKissAnimation(isIncoming, senderName, reason) {
        initAudio();
        playKissSound();

        if (navigator.vibrate) {
            try { navigator.vibrate([80, 40, 80, 40, 120]); } catch (e) {}
        }

        // Slap/Kiss Flash
        const flash = document.createElement('div');
        flash.className = 'kiss-flash';
        document.body.appendChild(flash);
        setTimeout(() => flash.remove(), 700);

        // Visual overlay
        let overlay = document.getElementById('slap-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'slap-overlay';
            overlay.className = 'slap-overlay';
            document.body.appendChild(overlay);
        }

        // Generate 16 floating radiating hearts
        let heartParticlesHTML = '';
        const heartIcons = ['💕', '💖', '💗', '💓', '💋', '💘', '✨', '💝'];
        for (let i = 0; i < 16; i++) {
            const angle = (i / 16) * 2 * Math.PI;
            const distance = Math.floor(Math.random() * 140 + 160);
            const tx = Math.cos(angle) * distance;
            const ty = Math.sin(angle) * distance;
            const rot = Math.floor(Math.random() * 60 - 30) + 'deg';
            const icon = heartIcons[i % heartIcons.length];
            heartParticlesHTML += `<span class="kiss-heart-particle" style="--tx:${tx}px; --ty:${ty}px; --rot:${rot};">${icon}</span>`;
        }

        overlay.innerHTML = `
            <div class="slap-animation-box" style="position:relative;">
                ${heartParticlesHTML}
                <div class="kiss-lips-anim">💋</div>
                <div class="kiss-mwah-text">💋 MWAH! 💋</div>
                <div class="slap-reason-tag" style="border-color:#ff007f; color:#ff66cc;">
                    ${isIncoming ? `FROM ${escapeHTML(senderName).toUpperCase()}: ` : 'KISS DELIVERED: '}
                    <em>"${escapeHTML(reason)}"</em>
                </div>
            </div>
        `;
        setTimeout(() => {
            if (overlay) overlay.innerHTML = '';
        }, 1500);
    }

    function triggerHugAnimation(isIncoming, senderName, reason) {
        initAudio();
        playHugSound();

        if (navigator.vibrate) {
            try { navigator.vibrate([150, 80, 220]); } catch (e) {}
        }

        // Hug Glow Flash
        const flash = document.createElement('div');
        flash.className = 'hug-flash';
        document.body.appendChild(flash);
        setTimeout(() => flash.remove(), 800);

        // Visual overlay
        let overlay = document.getElementById('slap-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'slap-overlay';
            overlay.className = 'slap-overlay';
            document.body.appendChild(overlay);
        }

        let sparkleParticlesHTML = '';
        const sparkleIcons = ['✨', '🌟', '💖', '💫', '💛', '🌸'];
        for (let i = 0; i < 14; i++) {
            const angle = (i / 14) * 2 * Math.PI;
            const distance = Math.floor(Math.random() * 130 + 140);
            const tx = Math.cos(angle) * distance;
            const ty = Math.sin(angle) * distance;
            const rot = Math.floor(Math.random() * 50 - 25) + 'deg';
            const icon = sparkleIcons[i % sparkleIcons.length];
            sparkleParticlesHTML += `<span class="kiss-heart-particle" style="--tx:${tx}px; --ty:${ty}px; --rot:${rot}; font-size:28px;">${icon}</span>`;
        }

        overlay.innerHTML = `
            <div class="slap-animation-box" style="position:relative;">
                ${sparkleParticlesHTML}
                <div class="hug-bear-anim">🤗</div>
                <div class="hug-text">🤗 WARM HUG! 🤗</div>
                <div class="slap-reason-tag" style="border-color:#ffd700; color:#ffd700;">
                    ${isIncoming ? `FROM ${escapeHTML(senderName).toUpperCase()}: ` : 'HUG DELIVERED: '}
                    <em>"${escapeHTML(reason)}"</em>
                </div>
            </div>
        `;
        setTimeout(() => {
            if (overlay) overlay.innerHTML = '';
        }, 1500);
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

    function playNotificationChime() {
        if (!state.sfx) return;
        initAudio();
        if (!audioCtx) return;
        try {
            const now = audioCtx.currentTime;

            // Note 1 (E5: 659.25Hz)
            const osc1 = audioCtx.createOscillator();
            const gain1 = audioCtx.createGain();
            osc1.type = 'sine';
            osc1.frequency.setValueAtTime(659.25, now);
            gain1.gain.setValueAtTime(0.12, now);
            gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
            osc1.connect(gain1);
            gain1.connect(audioCtx.destination);
            osc1.start(now);
            osc1.stop(now + 0.32);

            // Note 2 (B5: 987.77Hz)
            const osc2 = audioCtx.createOscillator();
            const gain2 = audioCtx.createGain();
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(987.77, now + 0.1);
            gain2.gain.setValueAtTime(0.16, now + 0.1);
            gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.52);
            osc2.connect(gain2);
            gain2.connect(audioCtx.destination);
            osc2.start(now + 0.1);
            osc2.stop(now + 0.52);
        } catch (e) {}
    }

    // =========================================================
    // 90s ROMANTIC VINYL AUDIO ENGINE & PLAYLIST
    // =========================================================
    const RETRO_90S_PLAYLIST = [
        // --- ICONIC ALL-TIME 90s GOLDEN ROMANCE ---
        {
            id: 'bombay-theme',
            title: 'Bombay Theme (1995)',
            movie: 'Bombay',
            artist: 'A.R. Rahman',
            year: '1995',
            sub: 'A.R. Rahman &bull; Evergreen Love Symphony',
            src: 'audio/track1_bombay_theme.mp3',
            tag: 'A.R. Rahman'
        },
        {
            id: 'hi-pehla-nasha',
            title: 'Pehla Nasha',
            movie: 'Jo Jeeta Wohi Sikandar (1992)',
            artist: 'Udit Narayan & Sadhana Sargam',
            year: '1992',
            sub: 'Udit Narayan & Sadhana Sargam &bull; 1992',
            src: 'audio/hi_track01_pehla_nasha.mp3',
            tag: '90s Hindi Classic'
        },
        {
            id: 'ennavale',
            title: 'Ennavale Adi Ennavale',
            movie: 'Kadhalan (1994)',
            artist: 'P. Unnikrishnan & A.R. Rahman',
            year: '1994',
            sub: 'P. Unnikrishnan & A.R. Rahman &bull; 1994',
            src: 'audio/track3_ennavale.mp3',
            tag: '90s South Melody'
        },
        {
            id: 'jiya-jale',
            title: 'Jiya Jale (Punjiri Thanji)',
            movie: 'Dil Se (1998)',
            artist: 'Lata Mangeshkar, Preetha & A.R. Rahman',
            year: '1998',
            sub: 'Lata Mangeshkar & A.R. Rahman &bull; 1998',
            src: 'audio/track4_jiya_jale.mp3',
            tag: 'KA ↔ KL Anthem'
        },
        {
            id: 'hi-tujhe-dekha-toh',
            title: 'Tujhe Dekha Toh',
            movie: 'Dilwale Dulhania Le Jayenge (1995)',
            artist: 'Kumar Sanu & Lata Mangeshkar',
            year: '1995',
            sub: 'Kumar Sanu & Lata Mangeshkar &bull; 1995',
            src: 'audio/hi_track02_tujhe_dekha_toh.mp3',
            tag: '90s Hindi Romance'
        },
        {
            id: 'pudhu-vellai-mazhai',
            title: 'Pudhu Vellai Mazhai',
            movie: 'Roja (1992)',
            artist: 'Unni Menon, Sujatha & A.R. Rahman',
            year: '1992',
            sub: 'Unni Menon, Sujatha & A.R. Rahman &bull; 1992',
            src: 'audio/track6_pudhu_vellai_mazhai.mp3',
            tag: 'Roja Classic'
        },
        {
            id: 'malare-mounama',
            title: 'Malare Mounama',
            movie: 'Karna (1995)',
            artist: 'S.P.B & S. Janaki (Vidyasagar)',
            year: '1995',
            sub: 'S.P.B & S. Janaki &bull; 1995 Evergreen Melody',
            src: 'audio/track7_malare_mounama.mp3',
            tag: 'S.P.B & Janaki'
        },
        {
            id: 'ml-samayam',
            title: 'Samayamithapoorva Sayahnam',
            movie: 'Harikrishnans (1998)',
            artist: 'K.J. Yesudas & K.S. Chithra',
            year: '1998',
            sub: 'K.J. Yesudas & K.S. Chithra &bull; 1998',
            src: 'audio/ml_track02_samayamithapoorva.mp3',
            tag: 'Malayalam Romance'
        },
        // --- 90s MALAYALAM EVERGREEN CLASSICS ---
        {
            id: 'ml-ambalappuzhe',
            title: 'Ambalappuzhe Unni Kannanodu',
            movie: 'Adhwaytham (1992)',
            artist: 'M.G. Sreekumar & K.S. Chithra',
            year: '1992',
            sub: 'M.G. Sreekumar & K.S. Chithra &bull; 1992',
            src: 'audio/ml_track01_ambalappuzhe.mp3',
            tag: 'Malayalam Evergreen'
        },
        {
            id: 'ml-aalilamanjalil',
            title: 'Aalilamanjalil',
            movie: 'Surya Gayathri (1992)',
            artist: 'K.J. Yesudas & K.S. Chithra',
            year: '1992',
            sub: 'K.J. Yesudas & K.S. Chithra &bull; Raveendran',
            src: 'audio/ml_track03_aalilamanjalil.mp3',
            tag: 'Malayalam Classic'
        },
        {
            id: 'ml-sreeragamo',
            title: 'Sreeragamo',
            movie: 'Pavithram (1994)',
            artist: 'K.J. Yesudas & Sharreth',
            year: '1994',
            sub: 'K.J. Yesudas &bull; Sharreth &bull; 1994',
            src: 'audio/ml_track04_sreeragamo.mp3',
            tag: 'Malayalam Soul'
        },
        {
            id: 'ml-chandanacholayil',
            title: 'Chandanacholayil Mungi',
            movie: 'Oru Maravathoor Kanavu (1998)',
            artist: 'K.J. Yesudas & Sujatha Mohan',
            year: '1998',
            sub: 'K.J. Yesudas & Sujatha &bull; Vidyasagar',
            src: 'audio/ml_track05_chandanacholayil.mp3',
            tag: 'Malayalam Melody'
        },
        {
            id: 'ml-pranayamani',
            title: 'Pranayamani Thooval',
            movie: 'Azhakiya Ravanan (1996)',
            artist: 'K.J. Yesudas & Sujatha',
            year: '1996',
            sub: 'K.J. Yesudas &bull; Vidyasagar &bull; 1996',
            src: 'audio/ml_track06_pranayamani_thooval.mp3',
            tag: 'Malayalam Pure Gold'
        },
        {
            id: 'ml-manjakkiliyude',
            title: 'Manjakkiliyude Moolippattunde',
            movie: 'Kanmadam (1998)',
            artist: 'K.J. Yesudas & K.S. Chithra',
            year: '1998',
            sub: 'K.J. Yesudas & K.S. Chithra &bull; Raveendran',
            src: 'audio/ml_track07_manjakkiliyude.mp3',
            tag: 'Malayalam Evergreen'
        },
        {
            id: 'ml-kilukkam',
            title: 'Kilukkam Kilu Kilukkam',
            movie: 'Kilukkam (1991)',
            artist: 'M.G. Sreekumar & K.S. Chithra',
            year: '1991',
            sub: 'M.G. Sreekumar & K.S. Chithra &bull; 1991',
            src: 'audio/ml_track08_kilukkam.mp3',
            tag: 'Kilukkam Magic'
        },
        {
            id: 'ml-etho-nidrathan',
            title: 'Etho Nidrathan',
            movie: 'Ayal Kadha Ezhuthukayanu (1998)',
            artist: 'K.J. Yesudas & K.S. Chithra',
            year: '1998',
            sub: 'K.J. Yesudas & K.S. Chithra &bull; Raveendran',
            src: 'audio/ml_track09_etho_nidrathan.mp3',
            tag: 'Malayalam Twilight'
        },
        {
            id: 'ml-harimuraleeravam',
            title: 'Harimuraleeravam',
            movie: 'Aaraam Thampuran (1997)',
            artist: 'K.J. Yesudas & Raveendran',
            year: '1997',
            sub: 'K.J. Yesudas &bull; Raveendran Masterpiece',
            src: 'audio/ml_track10_harimuraleeravam.mp3',
            tag: 'Malayalam Legendary'
        }
    ];

    let currentTrackIndex = 0;
    const realAudioEl = document.getElementById('vinyl-real-audio');
    let notesInterval = null;

    function spawnFloatingMusicNote() {
        const container = document.getElementById('floating-music-notes');
        if (!container) return;
        const notes = ['♪', '♫', '♩', '♬', '💕', '✨', '💖', '🌸'];
        const note = document.createElement('span');
        note.className = 'floating-note';
        note.textContent = notes[Math.floor(Math.random() * notes.length)];
        note.style.left = Math.floor(Math.random() * 80 + 10) + '%';
        container.appendChild(note);
        setTimeout(() => note.remove(), 2600);
    }

    function initTrack(idx, autoPlay = false) {
        currentTrackIndex = (idx + RETRO_90S_PLAYLIST.length) % RETRO_90S_PLAYLIST.length;
        const track = RETRO_90S_PLAYLIST[currentTrackIndex];
        if (!track) return;

        if (realAudioEl) {
            realAudioEl.src = track.src;
            realAudioEl.load();
        }

        const titleEl = document.getElementById('vinyl-song-title');
        const artistEl = document.getElementById('vinyl-artist-sub');
        const labelText = document.getElementById('vinyl-center-label-text');
        if (titleEl) titleEl.textContent = track.title;
        if (artistEl) artistEl.innerHTML = track.sub;
        if (labelText) labelText.textContent = track.year;

        renderPlaylistDrawer();

        if (autoPlay) {
            startMusic();
        }
    }

    function startMusic() {
        initAudio();
        const track = RETRO_90S_PLAYLIST[currentTrackIndex];
        if (realAudioEl) {
            if (!realAudioEl.src || !realAudioEl.src.includes(track.src)) {
                realAudioEl.src = track.src;
            }
            realAudioEl.play().then(() => {
                state.music = true;
                updateMusicButton();
                if (!notesInterval) {
                    notesInterval = setInterval(spawnFloatingMusicNote, 650);
                }
                printLine(`🎵 Playing 90s Classic: ${track.title} (${track.artist})`, 'text-accent');
            }).catch(err => {
                console.log('Audio playback waiting for user click:', err);
            });
        }
    }

    function stopMusic() {
        if (realAudioEl) {
            realAudioEl.pause();
        }
        if (notesInterval) {
            clearInterval(notesInterval);
            notesInterval = null;
        }
        state.music = false;
        updateMusicButton();
    }

    function toggleMusic() {
        if (state.music) {
            stopMusic();
            printLine('🎵 90s Vinyl Music paused.', 'text-dim');
        } else {
            startMusic();
        }
    }

    function playNextTrack() {
        initAudio();
        playKeyClick();
        initTrack(currentTrackIndex + 1, true);
    }

    function playPrevTrack() {
        initAudio();
        playKeyClick();
        initTrack(currentTrackIndex - 1, true);
    }

    function updateMusicButton() {
        const lbl = document.getElementById('music-label') || (btnMusic ? btnMusic.querySelector('.label') : null);
        if (lbl) lbl.textContent = state.music ? '🎵 ON' : '🎵';

        // Update Vinyl player UI
        const vinylDisc = document.getElementById('vinyl-disc');
        const vinylTonearm = document.getElementById('vinyl-tonearm');
        const vinylBadge = document.getElementById('vinyl-live-badge');
        const vinylIcon = document.getElementById('vinyl-play-icon');

        if (vinylDisc) {
            if (state.music) vinylDisc.classList.add('playing');
            else vinylDisc.classList.remove('playing');
        }
        if (vinylTonearm) {
            if (state.music) vinylTonearm.classList.add('playing');
            else vinylTonearm.classList.remove('playing');
        }
        if (vinylBadge) {
            if (state.music) vinylBadge.classList.add('playing');
            else vinylBadge.classList.remove('playing');
        }
        if (vinylIcon) {
            vinylIcon.textContent = state.music ? '❚❚' : '▶';
        }
    }

    function updateSoundButton() {
        const lbl = document.getElementById('sound-label') || (btnSound ? btnSound.querySelector('.label') : null);
        if (lbl) lbl.textContent = state.sfx ? '🔊' : '🔇';
    }

    // 4. CLEAN MINIMALIST ROMANTIC BACKGROUND (No heavy cyberpunk/matrix canvas)
    const matrixCanvas = document.getElementById('matrix-canvas');
    if (matrixCanvas) {
        matrixCanvas.remove();
    }

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
        if (hudUptime) {
            hudUptime.textContent = `${days.toLocaleString()} Days Together 💕`;
        }

        if (hudWallet) {
            hudWallet.textContent = `${state.wallet['$KISSES'].toLocaleString()} Kisses`;
        }
        if (hudPartners) {
            const p1 = 'Akhil';
            const p2 = (state.partner2 && state.partner2.toLowerCase() !== 'akhil' && state.partner2.toLowerCase() !== 'my sweetheart') ? state.partner2 : 'Her';
            hudPartners.innerHTML = `${escapeHTML(p1)} &amp; ${escapeHTML(p2)}`;
        }
        if (promptUser) promptUser.textContent = `💌`;
        if (hudRoomBadge) hudRoomBadge.textContent = `KA ↔ KL LIVE`;
        if (hudRelayStatus) {
            hudRelayStatus.innerHTML = isCloudConnected ? '🟢 Connected' : '🟡 Connecting...';
        }
    }
    setInterval(updateHUD, 1000);
    updateHUD();

    // 7. TERMINAL OUTPUT UTILITIES
    function scrollToBottom() {
        setTimeout(() => {
            if (terminalBody) terminalBody.scrollTop = terminalBody.scrollHeight;
        }, 10);
    }

    function printRawHTML(html) {
        if (!outputEl) return;
        const div = document.createElement('div');
        div.className = 'term-line';
        div.innerHTML = html;
        outputEl.appendChild(div);
        scrollToBottom();
    }

    function printLine(text, className = '') {
        if (!outputEl) return;
        const p = document.createElement('p');
        p.className = `term-line ${className}`;
        p.textContent = text;
        outputEl.appendChild(p);
        scrollToBottom();
    }

    function printEcho(cmd) {
        // Suppress technical command echoes for minimalist romantic feel
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

    // Cross-tab broadcast backup
    let broadcast = null;
    try {
        broadcast = new BroadcastChannel(`love_os_room_${roomId}`);
        broadcast.onmessage = (e) => handleIncomingPacket(e.data);
    } catch (e) {}

    function initCloudRelay() {
        if (cloudStatusLight) cloudStatusLight.className = 'status-indicator waiting';
        if (hudRelayStatus) hudRelayStatus.innerHTML = '🟡 Connecting...';

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
                if (cloudStatusLight) cloudStatusLight.className = 'status-indicator connected';
                if (hudRelayStatus) hudRelayStatus.innerHTML = '🟢 Connected';
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
                if (hudRelayStatus) hudRelayStatus.innerHTML = '🟡 Connecting...';
            });

            mqttClient.on('close', () => {
                isCloudConnected = false;
                if (cloudStatusLight) cloudStatusLight.className = 'status-indicator waiting';
                if (hudRelayStatus) hudRelayStatus.innerHTML = '🟡 Reconnecting...';
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
                if (hudActiveUsers) hudActiveUsers.textContent = `AKHIL + HER 🟢`;
                playCelebrateFanfare();
                launchCelebration(80);

                if (packet.senderName) {
                    if (myRole === 'partner1') {
                        state.partner2 = (packet.senderName.toLowerCase() !== 'akhil') ? packet.senderName : 'Her';
                    } else {
                        state.partner1 = 'Akhil';
                    }
                    saveState();
                    updateHUD();
                }

                printLine(`💌 ${escapeHTML(packet.senderName || 'Your Partner')} connected live across states!`, 'text-success');

                // Host responds with full state sync
                if (myRole === 'partner1') {
                    sendPacket({
                        type: 'STATE_SYNC',
                        wallet: state.wallet,
                        partner1: 'Akhil',
                        partner2: (state.partner2 && state.partner2.toLowerCase() !== 'akhil') ? state.partner2 : 'Her',
                        anniversaryDate: state.anniversaryDate,
                        coupons: state.coupons
                    });
                }
                break;

            case 'HEARTBEAT':
                partnerOnline = true;
                if (hudActiveUsers) hudActiveUsers.textContent = `AKHIL + HER 🟢`;
                break;

            case 'STATE_SYNC':
                if (packet.wallet) state.wallet = Object.assign({}, state.wallet, packet.wallet);
                if (packet.coupons) state.coupons = packet.coupons;
                state.partner1 = 'Akhil';
                state.partner2 = (packet.partner2 && packet.partner2.toLowerCase() !== 'akhil') ? packet.partner2 : 'Her';
                if (packet.anniversaryDate) state.anniversaryDate = packet.anniversaryDate;
                saveState();
                updateHUD();
                break;

            case 'CHAT':
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

                // In-App Notification Toast, chime, unread badge & browser push alert
                if (typeof triggerChatNotification === 'function') {
                    triggerChatNotification(packet.senderName, packet.text);
                }
                break;

            case 'GALLERY_ADD_PHOTO':
                if (packet.photo && typeof handleIncomingGalleryPhoto === 'function') {
                    handleIncomingGalleryPhoto(packet.photo, packet.senderName);
                }
                break;

            case 'GALLERY_LIKE_PHOTO':
                if (packet.photoId && typeof handleIncomingPhotoLike === 'function') {
                    handleIncomingPhotoLike(packet.photoId);
                }
                break;

            case 'LOCATION_UPDATE':
                playBeep(920, 'sine', 0.1);
                if (packet.lat && packet.lng) {
                    const place = packet.place || `${packet.lat.toFixed(2)}°, ${packet.lng.toFixed(2)}°`;
                    if (myRole === 'partner1') {
                        p2Coords = { lat: packet.lat, lng: packet.lng, place };
                    } else {
                        p1Coords = { lat: packet.lat, lng: packet.lng, place };
                    }
                    if (typeof updateLiveDistanceUI === 'function') updateLiveDistanceUI();
                    const locFooter = document.getElementById('loc-status-footer');
                    if (locFooter) {
                        locFooter.innerHTML = `📍 ${escapeHTML(packet.senderName)} shared their live location!`;
                    }
                    launchCelebration(40);
                }
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

            case 'SLAP':
                const incomingMood = packet.mood || (
                    /poda\s*patti|angry|bad/i.test(packet.reason || '') ? 'angry' :
                    /ni\s*poda|happy\s*aa|sad|neutral/i.test(packet.reason || '') ? 'sad' : 'happy'
                );

                triggerSlapAnimation(true, packet.senderName, packet.reason, incomingMood);

                let inCardClass = 'slap-angry';
                let inTitle = '🔥 😡 INCOMING ANGRY SLAP: PODA PATTI! 😡 🔥';
                let inAscii = '💥 (╬ಠ益ಠ) 💥 PODA PATTI!';
                let inMoodLabel = 'BAD / ANGRY 😡';

                if (incomingMood === 'sad') {
                    inCardClass = 'slap-sad';
                    inTitle = '🌧️ 🥺 INCOMING SAD SLAP: NI PODA! 🥺 🌧️';
                    inAscii = '💔 ( ╥﹏╥ ) 💔 NI PODA!';
                    inMoodLabel = 'NEUTRAL / SAD 🥺';
                } else if (incomingMood === 'happy') {
                    inCardClass = 'slap-happy';
                    inTitle = '✨ 😄 INCOMING HAPPY SLAP: AA OK! 😄 ✨';
                    inAscii = '✨ (≧◡≦) ✨ AA OK!';
                    inMoodLabel = 'GOOD / HAPPY 😄';
                }

                const slapReceiptHTML = `
<div class="slap-card ${inCardClass}">
    <div class="slap-card-title">${inTitle}</div>
    <div style="font-family: monospace; text-align:center; font-size:18px; margin: 6px 0; font-weight:bold;">
        ${inAscii}
    </div>
    <div style="margin: 6px 0;">
        <p>From: <strong class="text-accent">${escapeHTML(packet.senderName)}</strong></p>
        <p>Mood: <strong>${inMoodLabel}</strong></p>
        <p>Dialogue: <em class="text-highlight">"${escapeHTML(packet.reason || (incomingMood === 'angry' ? 'Poda patti!' : incomingMood === 'sad' ? 'Ni poda' : 'Aa ok!'))}"</em></p>
    </div>
    <div class="slap-actions">
        <button class="action-btn" onclick="window.runTerminalCmd('slap angry')">😡 PODA PATTI BACK</button>
        <button class="action-btn" onclick="window.runTerminalCmd('slap sad')">🥺 NI PODA BACK</button>
        <button class="action-btn" onclick="window.runTerminalCmd('slap happy')">😄 AA OK!</button>
        <button class="action-btn" onclick="window.runTerminalCmd('kiss for sweet comfort')">💋 APOLOGIZE WITH KISS</button>
    </div>
</div>
`;
                printRawHTML(slapReceiptHTML);
                break;

            case 'DATE_PLAN_CONFIRMED':
                launchCelebration(180);
                playCelebrateFanfare();
                let answersList = '';
                if (Array.isArray(packet.answers)) {
                    answersList = packet.answers.map(a => `<li style="margin-bottom:4px;"><strong>${escapeHTML(a.step)}:</strong> <span class="text-accent">${escapeHTML(a.answer)}</span></li>`).join('');
                }
                const datePlanHTML = `
<div class="letter-card" style="border: 2px solid #ec4899; background: #fff0f6; border-radius: 20px; padding: 16px; margin: 10px 0;">
    <div style="font-family: var(--font-serif); font-size: 20px; font-weight: bold; color: #d946ef; text-align: center; margin-bottom: 8px;">
        💌 DATE OFFICIALLY SCHEDULED! 💌
    </div>
    <p style="text-align: center; font-size: 13px; color: #6b7280; margin-bottom: 12px;">
        <strong>${escapeHTML(packet.senderName)}</strong> completed the date questionnaire!
    </p>
    <ul style="list-style: none; padding: 0; font-size: 13.5px; color: #2d1e2e;">
        ${answersList}
    </ul>
    <div style="text-align: center; margin-top: 14px;">
        <button class="action-btn" onclick="window.runTerminalCmd('kiss for endless love')">💋 SEAL WITH 1,000 KISSES</button>
    </div>
</div>
`;
                printRawHTML(datePlanHTML);
                break;

            case 'KISS':
                triggerKissAnimation(true, packet.senderName, packet.reason);

                const kissReceiptHTML = `
<div class="kiss-card">
    <div class="kiss-card-title">💋 INCOMING SWEET KISS RECEIVED 💋</div>
    <div style="font-family: monospace; color:#ff007f; text-align:center; font-size:18px; margin: 6px 0; font-weight:bold;">
        (づ￣ ³￣)づ 💖 MWAHHH!
    </div>
    <div style="margin: 6px 0;">
        <p>From: <strong class="text-highlight">${escapeHTML(packet.senderName)}</strong></p>
        <p>Reason: <em class="text-accent">"${escapeHTML(packet.reason)}"</em></p>
        <p>Affection Level: <span class="text-gold">10,000% Pure Romance 💕</span></p>
    </div>
    <div class="slap-actions">
        <button class="action-btn" onclick="window.runTerminalCmd('kiss for endless love')">💋 KISS BACK</button>
        <button class="action-btn" onclick="window.runTerminalCmd('hug for warm embrace')">🤗 SEND BIG HUG</button>
        <button class="action-btn" onclick="window.runTerminalCmd('pay 500 $KISSES for joy')">💸 SEND 500 $KISSES</button>
    </div>
</div>
`;
                printRawHTML(kissReceiptHTML);
                break;

            case 'HUG':
                triggerHugAnimation(true, packet.senderName, packet.reason);

                const hugReceiptHTML = `
<div class="hug-card">
    <div class="hug-card-title">🤗 INCOMING WARM CUDDLE HUG RECEIVED 🤗</div>
    <div style="font-family: monospace; color:#ffd700; text-align:center; font-size:18px; margin: 6px 0; font-weight:bold;">
        (つˆДˆ)つ｡☆ BIG WARM EMBRACE
    </div>
    <div style="margin: 6px 0;">
        <p>From: <strong class="text-highlight">${escapeHTML(packet.senderName)}</strong></p>
        <p>Reason: <em class="text-gold">"${escapeHTML(packet.reason)}"</em></p>
        <p>Cozy Level: <span class="text-accent">Warm, safe, and infinite cuddles 💛</span></p>
    </div>
    <div class="slap-actions">
        <button class="action-btn" onclick="window.runTerminalCmd('hug for tight embrace')">🤗 HUG BACK TIGHTER</button>
        <button class="action-btn" onclick="window.runTerminalCmd('kiss for sweet love')">💋 SEND SWEET KISS</button>
        <button class="action-btn" onclick="window.runTerminalCmd('pay 100 $HUGS for warmth')">💸 SEND 100 $HUGS</button>
    </div>
</div>
`;
                printRawHTML(hugReceiptHTML);
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
        <span class="help-cmd" onclick="window.runTerminalCmd('chat Happy 4th Anniversary my love!')">💬 chat [message]</span>
        <div class="help-desc">Send live messages across states in real-time.</div>
    </div>
    <div class="help-card">
        <span class="help-cmd" onclick="window.runTerminalCmd('kiss for being the love of my life')">💋 kiss [reason]</span>
        <div class="help-desc">Send sweet kisses with flying hearts & smooch sound!</div>
    </div>
    <div class="help-card">
        <span class="help-cmd" onclick="window.runTerminalCmd('hug for always supporting me')">🤗 hug [reason]</span>
        <div class="help-desc">Send warm embrace with cuddle aura & chime!</div>
    </div>
    <div class="help-card">
        <span class="help-cmd" onclick="window.runTerminalCmd('slap for being too cute')">👋 slap [reason]</span>
        <div class="help-desc">Send playful slap across states with screen shake & smack sound!</div>
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
        <div class="help-desc">4-year relationship uptime & live statistics.</div>
    </div>
    <div class="help-card">
        <span class="help-cmd" onclick="window.runTerminalCmd('decrypt')">🔓 decrypt / letter</span>
        <div class="help-desc">Decrypt the secret 4th-anniversary love letter.</div>
    </div>
    <div class="help-card">
        <span class="help-cmd" onclick="window.runTerminalCmd('coupons')">🎟️ coupons / redeem [id]</span>
        <div class="help-desc">View & redeem romantic anniversary coupons.</div>
    </div>
    <div class="help-card">
        <span class="help-cmd" onclick="window.runTerminalCmd('marry')">💍 marry</span>
        <div class="help-desc">Renew 4-year vows with synchronized fireworks!</div>
    </div>
    <div class="help-card">
        <span class="help-cmd" onclick="window.runTerminalCmd('customize')">⚙️ customize</span>
        <div class="help-desc">Set names & anniversary date.</div>
    </div>
    <div class="help-card">
        <span class="help-cmd" onclick="window.runTerminalCmd('theme')">🎨 theme [romantic|lavender|cotton-candy|champagne|midnight]</span>
        <div class="help-desc">Switch romantic color theme.</div>
    </div>
    <div class="help-card">
        <span class="help-cmd" onclick="window.runTerminalCmd('music')">🎵 music</span>
        <div class="help-desc">Toggle sweet romantic background music.</div>
    </div>
    <div class="help-card">
        <span class="help-cmd" onclick="window.runTerminalCmd('clear')">🧹 clear</span>
        <div class="help-desc">Clear the message screen.</div>
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

        kiss: {
            desc: 'Send sweet romantic kisses with flying hearts & smooch sound',
            exec: (args) => {
                const rawReason = (args && args.length > 0) ? args.join(' ') : 'being the love of my life';
                const reason = rawReason.replace(/^for\s+/i, '').replace(/^["']|["']$/g, '');
                const senderName = getMyName();
                const recipientName = getPartnerName();
                const timestamp = new Date().toLocaleTimeString();

                triggerKissAnimation(false, senderName, reason);

                // Send live kiss packet over MQTT
                sendPacket({
                    type: 'KISS',
                    senderName,
                    recipientName,
                    reason,
                    time: timestamp
                });

                const html = `
<div class="kiss-card">
    <div class="kiss-card-title">💋 SWEET KISS DISPATCHED 💋</div>
    <div style="font-family: monospace; color:#ff007f; text-align:center; font-size:18px; margin: 6px 0; font-weight:bold;">
        (づ￣ ³￣)づ 💖 MWAHHH!
    </div>
    <div style="margin: 6px 0;">
        <p>Target: <strong class="text-accent">${escapeHTML(recipientName)}</strong></p>
        <p>Reason: <em class="text-highlight">"${escapeHTML(reason)}"</em></p>
        <p>Status: <span class="text-success">Delivered straight to their screen with flying heart burst! 💋</span></p>
    </div>
</div>
`;
                printRawHTML(html);
            }
        },

        hug: {
            desc: 'Send a big warm cuddle hug with glowing embrace & chime',
            exec: (args) => {
                const rawReason = (args && args.length > 0) ? args.join(' ') : 'always supporting me';
                const reason = rawReason.replace(/^for\s+/i, '').replace(/^["']|["']$/g, '');
                const senderName = getMyName();
                const recipientName = getPartnerName();
                const timestamp = new Date().toLocaleTimeString();

                triggerHugAnimation(false, senderName, reason);

                // Send live hug packet over MQTT
                sendPacket({
                    type: 'HUG',
                    senderName,
                    recipientName,
                    reason,
                    time: timestamp
                });

                const html = `
<div class="hug-card">
    <div class="hug-card-title">🤗 WARM HUG DISPATCHED 🤗</div>
    <div style="font-family: monospace; color:#ffd700; text-align:center; font-size:18px; margin: 6px 0; font-weight:bold;">
        (つˆДˆ)つ｡☆ BIG WARM EMBRACE
    </div>
    <div style="margin: 6px 0;">
        <p>Target: <strong class="text-accent">${escapeHTML(recipientName)}</strong></p>
        <p>Reason: <em class="text-gold">"${escapeHTML(reason)}"</em></p>
        <p>Status: <span class="text-success">Delivered straight to their screen with warm cozy aura! 💛</span></p>
    </div>
</div>
`;
                printRawHTML(html);
            }
        },

        slap: {
            desc: 'Playful slap with 3 moods: angry (poda patti), sad (ni poda happy aa), happy (ok)',
            exec: (args) => {
                const recipientName = getPartnerName();

                // If called with NO args, display the Mood Selector menu in the terminal!
                if (!args || args.length === 0) {
                    playBeep(650, 'sine', 0.1);
                    const pickerHTML = `
<div class="slap-mood-box">
    <div class="slap-mood-title">⚡ CHOOSE SLAP MOOD (KA ↔ KL) ⚡</div>
    <p class="text-dim" style="font-size:12.5px; margin-bottom:12px;">Select a teasing mood to send across to <strong class="text-accent">${escapeHTML(recipientName)}</strong>:</p>
    
    <button class="slap-mood-btn mood-angry" onclick="window.runTerminalCmd('slap angry')">
        <span>😡 <strong>BAD / ANGRY:</strong> <em>"Poda patti!"</em></span>
        <span style="font-size:18px;">🔥</span>
    </button>
    <button class="slap-mood-btn mood-sad" onclick="window.runTerminalCmd('slap sad')">
        <span>🥺 <strong>NEUTRAL / SAD:</strong> <em>"Ni poda, happy aa?"</em></span>
        <span style="font-size:18px;">🌧️</span>
    </button>
    <button class="slap-mood-btn mood-happy" onclick="window.runTerminalCmd('slap happy')">
        <span>😄 <strong>GOOD / HAPPY:</strong> <em>"Ok!"</em></span>
        <span style="font-size:18px;">✨</span>
    </button>
</div>
`;
                    printRawHTML(pickerHTML);
                    return;
                }

                let mood = 'angry';
                const first = args[0].toLowerCase();
                let reason = '';

                if (first === 'angry' || first === 'bad' || first === 'poda' || first === 'patti') {
                    mood = 'angry';
                    reason = args.length > 1 ? args.slice(1).join(' ') : 'Poda patti!';
                } else if (first === 'sad' || first === 'neutral' || first === 'ni') {
                    mood = 'sad';
                    reason = args.length > 1 ? args.slice(1).join(' ') : 'Ni poda';
                } else if (first === 'happy' || first === 'good' || first === 'ok' || first === 'aa_ok' || first === 'aa') {
                    mood = 'happy';
                    reason = args.length > 1 ? args.slice(1).join(' ') : 'Aa ok';
                } else {
                    const fullText = args.join(' ');
                    if (/poda\s*patti|angry|bad/i.test(fullText)) {
                        mood = 'angry';
                        reason = fullText;
                    } else if (/ni\s*poda|sad|neutral/i.test(fullText)) {
                        mood = 'sad';
                        reason = fullText;
                    } else if (/aa\s*ok|happy|good|ok/i.test(fullText)) {
                        mood = 'happy';
                        reason = fullText;
                    } else {
                        mood = 'angry';
                        reason = fullText.replace(/^for\s+/i, '').replace(/^["']|["']$/g, '');
                    }
                }

                const senderName = getMyName();
                const timestamp = new Date().toLocaleTimeString();

                triggerSlapAnimation(false, senderName, reason, mood);

                // Send live packet over MQTT
                sendPacket({
                    type: 'SLAP',
                    senderName,
                    recipientName,
                    reason,
                    mood,
                    time: timestamp
                });

                let cardClass = 'slap-angry';
                let titleText = '🔥 😡 ANGRY SLAP DISPATCHED: PODA PATTI! 😡 🔥';
                let asciiFace = '(╬ಠ益ಠ) ︵ 💥 PODA PATTI! 🐕💨';
                let moodLabel = 'BAD / ANGRY 😡';

                if (mood === 'sad') {
                    cardClass = 'slap-sad';
                    titleText = '🌧️ 🥺 SAD SLAP DISPATCHED: NI PODA! 🥺 🌧️';
                    asciiFace = '( ╥﹏╥) ︵ 💔 NI PODA! 🌧️';
                    moodLabel = 'NEUTRAL / SAD 🥺';
                } else if (mood === 'happy') {
                    cardClass = 'slap-happy';
                    titleText = '✨ 😄 HAPPY SLAP DISPATCHED: AA OK! 😄 ✨';
                    asciiFace = '(≧◡≦) ︵ ✨ AA OK! 💖';
                    moodLabel = 'GOOD / HAPPY 😄';
                }

                const html = `
<div class="slap-card ${cardClass}">
    <div class="slap-card-title">${titleText}</div>
    <div style="font-family: monospace; text-align:center; font-size:17px; margin: 6px 0; font-weight:bold;">
        ${asciiFace}
    </div>
    <div style="margin: 6px 0;">
        <p>Target: <strong class="text-accent">${escapeHTML(recipientName)}</strong></p>
        <p>Mood: <strong>${moodLabel}</strong></p>
        <p>Dialogue: <em class="text-highlight">"${escapeHTML(reason)}"</em></p>
        <p>Status: <span class="text-success">Delivered straight to their screen! 💥</span></p>
    </div>
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
    <div class="timeline-year">💖 RELATIONSHIP UPTIME REPORT // 4 YEARS COMPLETED</div>
    <div style="margin: 8px 0;">
        <p>▶ <strong>Pair:</strong> <span class="text-highlight">${state.partner1}</span> &amp; <span class="text-accent">${state.partner2}</span></p>
        <p>▶ <strong>Inception Date:</strong> August 31, 2022</p>
        <p>▶ <strong>Milestones:</strong> <span class="text-success">${completedYears} Years Completed</span> (${totalDays.toLocaleString()} active days)</p>
        <p>▶ <strong>Love SLA Availability:</strong> <span class="text-accent">100.000% (Zero downtime)</span></p>
        <p>▶ <strong>Cloud Relay Status:</strong> <span class="text-gold">${isCloudConnected ? 'ONLINE 🟢 (INTER-STATE)' : 'CONNECTING...'}</span></p>
    </div>
    <p class="text-dim" style="font-size:12px;">"4 magnificent years of building dreams, debugging life together, and crafting infinite memories."</p>
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
            desc: 'View 4-year milestone journey and logs',
            exec: (args) => {
                playBeep(700, 'sine', 0.1);
                const memoryLogs = [
                    { year: 'YEAR 1 (2022-2023)', title: 'THE INITIAL COMMIT & SPARK', desc: 'August 31, 2022: The moment our paths merged. Endless late-night talks, butterflies, discovering each other\'s worlds, and setting the foundation for something extraordinary.' },
                    { year: 'YEAR 2 (2023-2024)', title: 'EXPEDITIONS & SHARED ADVENTURES', desc: 'Exploring new places, mastering shared inside jokes, cooking experiments, and realizing that home isn\'t a place—it\'s being next to you.' },
                    { year: 'YEAR 3 (2024-2025)', title: 'UNBREAKABLE ENCRYPTION & SUPPORT', desc: 'Navigating life\'s highs and lows hand in hand. Strengthening our bond, supporting each other\'s ambitions, and standing as an unshakeable team.' },
                    { year: 'YEAR 4 (2025-2026)', title: '4 YEARS STRONG & FOREVER AHEAD', desc: 'August 31, 2026: 4 full years of unconditional love, trust, and happiness. Today we celebrate 4 years of us, and forever is just getting started!' }
                ];

                let targetLogs = memoryLogs;
                if (args && args[0]) {
                    const yr = parseInt(args[0], 10);
                    if (yr >= 1 && yr <= 4) targetLogs = [memoryLogs[yr - 1]];
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
    <div class="love-letter-title">💌 TOP SECRET // 4TH ANNIVERSARY LOVE LETTER 💌</div>
    <div class="love-letter-content">
To my dearest ${escapeHTML(state.partner2)},

Happy 4th Anniversary! On August 31, 2022, our beautiful journey began, and every single day with you has been an absolute blessing.

Through every laugh, every late-night conversation, every adventure across states, and every hurdle we conquered hand-in-hand, you have been my rock, my favorite person, and my happiest home.

We have officially completed 4 wonderful years together, and I would choose you all over again in every lifetime, in every timeline, and in every universe.

Happy 4th Anniversary, my love! ❤️
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
                let html = '<div style="margin: 12px 0;"><h4 class="text-highlight" style="margin-bottom:8px;">🎟️ 4TH ANNIVERSARY COUPON VAULT</h4>';
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
            desc: 'Renew 4-year vows with full screen fireworks',
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
    <div class="love-letter-title" style="color:#05ffa1;">💍 4-YEAR VOW RENEWAL AUTHORIZED 💍</div>
    <p style="font-size:15px; text-align:center; line-height:1.8;">
        <strong>SUDO PRIVILEGES GRANTED:</strong><br>
        4 Years of unconditional devotion, laughter, and partnership confirmed.<br>
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
            desc: 'Switch romantic aesthetic theme (romantic, lavender, cotton-candy, champagne, midnight)',
            exec: (args) => {
                const valid = ['romantic', 'lavender', 'cotton-candy', 'champagne', 'midnight'];
                if (!args || args.length === 0) {
                    printLine(`Available styles: ${valid.join(', ')}`, 'text-highlight');
                    return;
                }
                const choice = args[0].toLowerCase().replace('theme-', '');
                if (valid.includes(choice)) {
                    const themeName = 'theme-' + choice;
                    document.body.className = themeName;
                    state.theme = themeName;
                    themeSelect.value = themeName;
                    saveState();
                    playBeep(700, 'sine', 0.1);
                    printLine(`✔ Theme updated to '${choice}'!`, 'text-success');
                } else {
                    printLine(`Choose from: ${valid.join(', ')}`, 'text-accent');
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

    if (btnInvite) btnInvite.addEventListener('click', openInviteModal);
    if (btnCloseModal) btnCloseModal.addEventListener('click', closeInviteModal);
    if (inviteModal) {
        inviteModal.addEventListener('click', (e) => {
            if (e.target === inviteModal) closeInviteModal();
        });
    }

    if (btnCopyLink) {
        btnCopyLink.addEventListener('click', () => {
            inviteLinkInput.select();
            navigator.clipboard.writeText(inviteLinkInput.value).then(() => {
                btnCopyLink.textContent = '✔ Copied!';
                setTimeout(() => { btnCopyLink.textContent = '📋 Copy Link'; }, 2000);
                playBeep(1000, 'sine', 0.08);
            }).catch(() => {
                document.execCommand('copy');
                btnCopyLink.textContent = '✔ Copied!';
                setTimeout(() => { btnCopyLink.textContent = '📋 Copy Link'; }, 2000);
            });
        });
    }

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
            // Friendly Auto-Chat: deliver plain text messages straight to her screen!
            commands.chat.exec([raw]);
        }
    }

    window.runTerminalCmd = function (cmdText) {
        initAudio();
        if (inputEl) inputEl.value = '';
        executeCommand(cmdText);
        if (inputEl) inputEl.focus();
    };

    // 12. WELCOME GREETING
    function printWelcomeBanner() {
        const welcomeMsgHTML = `
<div class="chat-thread">
    <div class="chat-bubble from-partner" style="background:#ffffff; border:1.5px solid rgba(255, 182, 193, 0.6);">
        <div class="chat-bubble-header">
            <span class="chat-bubble-author">💌 Love Notes</span>
            <span>KA ↔ KL</span>
        </div>
        <div class="chat-bubble-body">
            Connected live with ${escapeHTML(getPartnerName())}! Tap any quick action above or send a sweet note below 💕
        </div>
    </div>
</div>`;
        printRawHTML(welcomeMsgHTML);
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

    if (btnSend) {
        btnSend.addEventListener('click', () => {
            initAudio();
            playKeyClick();
            const val = inputEl.value;
            inputEl.value = '';
            executeCommand(val);
            inputEl.focus();
        });
    }

    btnSound.addEventListener('click', () => {
        state.sfx = !state.sfx;
        saveState();
        updateSoundButton();
        playBeep(600, 'sine', 0.08);
    });

    btnMusic.addEventListener('click', () => toggleMusic());

    if (themeSelect) {
        themeSelect.addEventListener('change', (e) => {
            const theme = e.target.value;
            document.body.className = theme;
            state.theme = theme;
            saveState();
            playBeep(700, 'sine', 0.08);
        });
    }

    if (quickBar) {
        quickBar.addEventListener('click', (e) => {
            const target = e.target.closest('.quick-chip');
            if (!target) return;
            const cmd = target.getAttribute('data-cmd');
            if (cmd) window.runTerminalCmd(cmd);
        });
    }

    // 13. PRETTY LOVE ACTIONS & ACCESSIBLE MODALS
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.action-tile, .dock-btn');
        if (!btn) return;
        const action = btn.getAttribute('data-action');
        if (action) handleDockAction(action);
    });

    window.sendSlapMood = function (mood) {
        initAudio();
        commands.slap.exec([mood]);
    };

    function handleDockAction(action) {
        initAudio();
        if (action === 'kiss') {
            commands.kiss.exec();
        } else if (action === 'hug') {
            commands.hug.exec();
        } else if (action === 'marry') {
            commands['sudo marry-again'].exec();
        } else if (action === 'slap-modal') {
            openModal('slap-mood-modal');
        } else if (action === 'letter-modal') {
            openLetterModal();
        } else if (action === 'coupons-modal') {
            openCouponsModal();
        } else if (action === 'story-modal') {
            openStoryModal();
        } else if (action === 'send-love-modal') {
            openModal('send-love-modal');
        }
    }

    function openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('hidden');
            playBeep(700, 'sine', 0.08);
        }
    }

    function closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    // Modal Close Button Handlers & Click-Outside Handlers
    document.addEventListener('click', (e) => {
        const closeBtn = e.target.closest('[data-close]');
        if (closeBtn) {
            const targetId = closeBtn.getAttribute('data-close');
            closeModal(targetId);
            return;
        }

        const overlay = e.target.closest('.modal-overlay');
        if (overlay && e.target === overlay) {
            overlay.classList.add('hidden');
        }
    });

    function openLetterModal() {
        const authorEl = document.getElementById('modal-letter-author');
        if (authorEl) {
            authorEl.textContent = `${state.partner1} ❤️`;
        }
        openModal('letter-modal');
    }

    function openCouponsModal() {
        renderCouponsModal();
        openModal('coupons-modal');
    }

    function renderCouponsModal() {
        const grid = document.getElementById('modal-coupons-grid');
        if (!grid) return;
        let html = '';
        state.coupons.forEach(c => {
            const btn = c.redeemed 
                ? `<span class="voucher-claimed-tag">✔ REDEEMED</span>` 
                : `<button class="voucher-claim-btn" onclick="window.claimCouponModal('${c.id}')">🎁 CLAIM COUPON</button>`;
            html += `
                <div class="voucher-card ${c.redeemed ? 'redeemed' : ''}">
                    <div class="voucher-left">
                        <div class="voucher-title">🎟️ ${c.id}: ${escapeHTML(c.title)}</div>
                        <div class="voucher-desc">${escapeHTML(c.desc)}</div>
                    </div>
                    <div>${btn}</div>
                </div>
            `;
        });
        grid.innerHTML = html;
    }

    window.claimCouponModal = function(id) {
        initAudio();
        commands.redeem.exec([id]);
        renderCouponsModal();
    };

    function openStoryModal() {
        const start = new Date(state.anniversaryDate);
        const now = new Date();
        const totalDays = Math.floor((now - start) / (1000 * 60 * 60 * 24));
        const elDays = document.getElementById('story-days-count');
        if (elDays) elDays.textContent = totalDays.toLocaleString();
        openModal('story-modal');
    }

    window.sendLovePreset = function(amount, currency, reason) {
        initAudio();
        commands.pay.exec([amount, currency, 'for', reason]);
        closeModal('send-love-modal');
    };

    const btnLetterKiss = document.getElementById('btn-letter-kiss');
    if (btnLetterKiss) {
        btnLetterKiss.addEventListener('click', () => {
            commands.kiss.exec(['sealing our 4-year love letter']);
            closeModal('letter-modal');
        });
    }

    const btnStoryMarry = document.getElementById('btn-story-marry');
    if (btnStoryMarry) {
        btnStoryMarry.addEventListener('click', () => {
            commands['sudo marry-again'].exec();
            closeModal('story-modal');
        });
    }

    // Global Button Ripple & Animation for EVERY button
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('button, .action-tile, .pill-btn, .love-send-btn, .quick-emoji-btn, .modal-close, .love-card-btn, .slap-choice-card, .voucher-claim-btn');
        if (!btn) return;
        initAudio();
        playKeyClick();

        const rect = btn.getBoundingClientRect();
        const circle = document.createElement('span');
        const diameter = Math.max(rect.width, rect.height);
        const radius = diameter / 2;
        circle.style.width = circle.style.height = `${diameter}px`;
        circle.style.left = `${e.clientX - rect.left - radius}px`;
        circle.style.top = `${e.clientY - rect.top - radius}px`;
        circle.className = 'btn-ripple';
        btn.appendChild(circle);
        setTimeout(() => circle.remove(), 550);
    });

    // 14. LIVE LOCATION & LEAFLET COUPLE MAP (Karnataka ↔ Kerala)
    const btnShareLoc = document.getElementById('btn-share-loc');
    const locDistanceBadge = document.getElementById('loc-distance-badge');
    const locStatusFooter = document.getElementById('loc-status-footer');

    let p1Coords = { lat: 12.9716, lng: 77.5946, place: 'Karnataka (KA)' }; // Bangalore
    let p2Coords = { lat: 9.9312, lng: 76.2673, place: 'Kerala (KL)' };     // Kochi

    let coupleMap = null;
    let markerP1 = null;
    let markerP2 = null;
    let polylineRoute = null;

    function calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return Math.round(R * c);
    }

    function initCoupleMap() {
        const mapContainer = document.getElementById('couple-map');
        if (!mapContainer || typeof L === 'undefined') return;

        try {
            coupleMap = L.map('couple-map', {
                center: [11.45, 76.9],
                zoom: 6,
                zoomControl: true,
                scrollWheelZoom: false
            });

            L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
                maxZoom: 18
            }).addTo(coupleMap);

            const iconP1 = L.divIcon({
                className: 'custom-map-icon',
                html: `
                    <div class="leaflet-couple-pin">
                        <div class="couple-pin-bubble">❤️</div>
                        <div class="couple-pin-label">${escapeHTML(state.partner1)}</div>
                    </div>
                `,
                iconSize: [42, 58],
                iconAnchor: [21, 48]
            });

            const iconP2 = L.divIcon({
                className: 'custom-map-icon',
                html: `
                    <div class="leaflet-couple-pin">
                        <div class="couple-pin-bubble" style="border-color:#e91e63;">💕</div>
                        <div class="couple-pin-label">${escapeHTML(state.partner2)}</div>
                    </div>
                `,
                iconSize: [42, 58],
                iconAnchor: [21, 48]
            });

            markerP1 = L.marker([p1Coords.lat, p1Coords.lng], { icon: iconP1 }).addTo(coupleMap);
            markerP1.bindPopup(`<strong>❤️ ${escapeHTML(state.partner1)}</strong><br>${p1Coords.place || 'Karnataka'}`);

            markerP2 = L.marker([p2Coords.lat, p2Coords.lng], { icon: iconP2 }).addTo(coupleMap);
            markerP2.bindPopup(`<strong>💕 ${escapeHTML(state.partner2)}</strong><br>${p2Coords.place || 'Kerala'}`);

            polylineRoute = L.polyline([[p1Coords.lat, p1Coords.lng], [p2Coords.lat, p2Coords.lng]], {
                color: '#ff4081',
                weight: 3.5,
                dashArray: '8, 8',
                opacity: 0.85
            }).addTo(coupleMap);

            coupleMap.fitBounds(polylineRoute.getBounds(), { padding: [40, 40] });

            setTimeout(() => {
                if (coupleMap) coupleMap.invalidateSize();
            }, 450);
        } catch (e) {
            console.warn('Error initializing Leaflet map:', e);
        }
    }

    function updateLiveDistanceUI() {
        const dist = calculateDistance(p1Coords.lat, p1Coords.lng, p2Coords.lat, p2Coords.lng);
        if (locDistanceBadge) {
            locDistanceBadge.textContent = `📍 ${dist.toLocaleString()} km apart`;
        }

        if (coupleMap && markerP1 && markerP2 && polylineRoute) {
            if (typeof markerP1.setLatLng === 'function') markerP1.setLatLng([p1Coords.lat, p1Coords.lng]);
            if (typeof markerP1.setPopupContent === 'function') markerP1.setPopupContent(`<strong>❤️ ${escapeHTML(state.partner1)}</strong><br>${p1Coords.place || 'Karnataka'}`);

            if (typeof markerP2.setLatLng === 'function') markerP2.setLatLng([p2Coords.lat, p2Coords.lng]);
            if (typeof markerP2.setPopupContent === 'function') markerP2.setPopupContent(`<strong>💕 ${escapeHTML(state.partner2)}</strong><br>${p2Coords.place || 'Kerala'}`);

            if (typeof polylineRoute.setLatLngs === 'function') polylineRoute.setLatLngs([[p1Coords.lat, p1Coords.lng], [p2Coords.lat, p2Coords.lng]]);
            if (typeof coupleMap.fitBounds === 'function' && typeof polylineRoute.getBounds === 'function') {
                coupleMap.fitBounds(polylineRoute.getBounds(), { padding: [40, 40], maxZoom: 10 });
            }
        }
    }

    function requestLiveLocation() {
        initAudio();
        playBeep(880, 'sine', 0.1);
        closeModal('location-modal');

        if (!navigator.geolocation) {
            if (locStatusFooter) locStatusFooter.innerHTML = '📍 Geolocation not supported on this browser. Default KA ↔ KL active!';
            return;
        }

        if (btnShareLoc) btnShareLoc.textContent = '📡 Locating...';

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;
                const myPlace = `${lat.toFixed(2)}°N, ${lng.toFixed(2)}°E`;
                if (myRole === 'partner1') {
                    p1Coords = { lat, lng, place: myPlace };
                } else {
                    p2Coords = { lat, lng, place: myPlace };
                }
                updateLiveDistanceUI();
                if (btnShareLoc) {
                    btnShareLoc.textContent = '✔ Shared!';
                    setTimeout(() => { btnShareLoc.textContent = '📡 Share Location'; }, 3500);
                }

                sendPacket({
                    type: 'LOCATION_UPDATE',
                    senderName: getMyName(),
                    lat,
                    lng,
                    place: myPlace
                });
                if (locStatusFooter) {
                    locStatusFooter.innerHTML = `📍 Live location updated on the map! Distance: ${calculateDistance(p1Coords.lat, p1Coords.lng, p2Coords.lat, p2Coords.lng)} km 💕`;
                }
                launchCelebration(60);
            },
            (err) => {
                console.warn('Geolocation error:', err);
                if (btnShareLoc) btnShareLoc.textContent = '📡 Share Location';
                if (locStatusFooter) {
                    locStatusFooter.innerHTML = '📍 Default Karnataka ↔ Kerala connection active! Distance is only physical 💕';
                }
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
        );
    }

    if (btnShareLoc) {
        btnShareLoc.addEventListener('click', () => {
            openModal('location-modal');
        });
    }

    const btnAllowLoc = document.getElementById('btn-allow-location');
    if (btnAllowLoc) {
        btnAllowLoc.addEventListener('click', () => {
            requestLiveLocation();
        });
    }

    initCoupleMap();
    updateLiveDistanceUI();

    // 15. DATE SCHEDULER (VIRAL REFERENCE DESIGN)
    const dateSteps = [
        {
            num: "01 / 08",
            label: "A TINY QUESTION",
            percent: 12.5,
            badge: "+ YOUR INVITATION",
            title: "Let's\nschedule\na date!",
            sub: "Be a good girl & answer all the questions. I'll worry about the rest.",
            florkType: "finger-guns",
            options: [
                { text: "Yes", type: "pink", icon: "↗" },
                { text: "Yes, Of course", type: "white", icon: "→" }
            ],
            note: "♡ Every choice with you is my favorite choice."
        },
        {
            num: "02 / 08",
            label: "PICK A DAY",
            percent: 25,
            badge: "+ DATE NIGHT",
            title: "When are\nyou free?",
            sub: "Don't say you're busy, I'm already clearing my schedule for you.",
            florkType: "calendar",
            options: [
                { text: "Choose a Date 🗓️", type: "pink", icon: "📅", action: "open-calendar" },
                { text: "This Weekend", type: "white", icon: "✨" },
                { text: "Whenever you say", type: "white", icon: "💖" }
            ],
            note: "♡ Any day with you is my favorite day."
        },
        {
            num: "03 / 08",
            label: "FOOD FIRST",
            percent: 37.5,
            badge: "+ OUR FAVORITE",
            title: "What are we\neating?",
            sub: "Whatever you pick, I'm still stealing bites from your plate.",
            florkType: "food",
            options: [
                { text: "Candlelight Dinner 🍝", type: "pink", icon: "✨" },
                { text: "Street Food & Shakes 🍦", type: "white", icon: "🍨" }
            ],
            note: "♡ Dessert is 100% mandatory."
        },
        {
            num: "04 / 08",
            label: "THE VIBE",
            percent: 50,
            badge: "+ AFTER DINNER",
            title: "What's the\nplan after?",
            sub: "Pick wisely, I have very romantic plans in mind.",
            florkType: "vibe",
            options: [
                { text: "Cozy Movie & Cuddles 🍿", type: "pink", icon: "🤗" },
                { text: "Long Drive & Music 🚗", type: "white", icon: "🎵" }
            ],
            note: "♡ Cuddles are non-negotiable."
        },
        {
            num: "05 / 08",
            label: "AFFECTION CHECK",
            percent: 62.5,
            badge: "+ KISS POLICY",
            title: "Who gets\nmore kisses?",
            sub: "Be honest, or face an immediate cuddle assault.",
            florkType: "kisses",
            options: [
                { text: "Me obviously 💋", type: "pink", icon: "👑" },
                { text: "Akhil gets them all 🥰", type: "white", icon: "💖" }
            ],
            note: "♡ Minimum 1,000 kisses guaranteed."
        },
        {
            num: "06 / 08",
            label: "TEASING CHECK",
            percent: 75,
            badge: "+ PLAYFUL BANTER",
            title: "If you show\nup late?",
            sub: "The Kerala ↔ Karnataka penalty system is active.",
            florkType: "banter",
            options: [
                { text: "Poda patti! 😡👋", type: "pink", icon: "💥" },
                { text: "Ni poda... Aa ok! 🥺", type: "white", icon: "✨" }
            ],
            note: "♡ Being late earns an extra tight hug."
        },
        {
            num: "07 / 08",
            label: "ANNIVERSARY VOW",
            percent: 87.5,
            badge: "+ 4 YEARS & BEYOND",
            title: "One promise\nfor year 5?",
            sub: "4 beautiful years together, forever more to go.",
            florkType: "vow",
            options: [
                { text: "Never stop holding my hand 💍", type: "pink", icon: "❤️" },
                { text: "Stay my favorite person 💕", type: "white", icon: "✨" }
            ],
            note: "♡ August 31, 2022 — Forever & Always."
        },
        {
            num: "08 / 08",
            label: "IT'S OFFICIAL",
            percent: 100,
            badge: "+ DATE LOCKED IN",
            title: "It's a\ndate! 💕",
            sub: "You answered perfectly. Now sit back and look pretty — I'm taking care of everything!",
            florkType: "celebrate",
            options: [
                { text: "Lock In & Send to Akhil 💌", type: "pink", icon: "🚀" }
            ],
            note: "♡ Can't wait for our date with you!"
        }
    ];

    let currentStepIndex = 0;
    const selectedDateAnswers = [];

    function getFlorkSVG(type) {
        switch (type) {
            case 'finger-guns':
            default:
                return `<svg viewBox="0 0 200 200" width="160" height="160" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M 68 180 L 68 120 C 68 65, 75 42, 105 42 C 135 42, 142 65, 142 120 L 142 180" stroke="#1c1917" stroke-width="4.5" stroke-linecap="round" fill="#ffffff" />
    <path d="M 82 62 Q 91 56 99 62" stroke="#1c1917" stroke-width="4" stroke-linecap="round" />
    <circle cx="118" cy="62" r="4.5" fill="#1c1917" />
    <path d="M 90 78 Q 104 88 118 78" stroke="#1c1917" stroke-width="4" stroke-linecap="round" fill="#ffffff" />
    <path d="M 68 125 L 42 100 L 78 88" stroke="#1c1917" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
    <path d="M 78 88 L 88 88" stroke="#1c1917" stroke-width="4" stroke-linecap="round" />
    <path d="M 142 125 L 168 100 L 132 88" stroke="#1c1917" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
    <path d="M 132 88 L 122 88" stroke="#1c1917" stroke-width="4" stroke-linecap="round" />
</svg>`;

            case 'calendar':
                return `<svg viewBox="0 0 200 200" width="160" height="160" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M 68 180 L 68 120 C 68 65, 75 42, 105 42 C 135 42, 142 65, 142 120 L 142 180" stroke="#1c1917" stroke-width="4.5" stroke-linecap="round" fill="#ffffff" />
    <circle cx="88" cy="62" r="4.5" fill="#1c1917" />
    <circle cx="122" cy="62" r="4.5" fill="#1c1917" />
    <path d="M 94 76 Q 105 88 116 76" stroke="#1c1917" stroke-width="4" stroke-linecap="round" fill="#ffffff" />
    <rect x="72" y="98" width="56" height="48" rx="8" fill="#ffffff" stroke="#1c1917" stroke-width="4" />
    <rect x="72" y="98" width="56" height="14" rx="4" fill="#ec4899" />
    <text x="100" y="132" font-size="16" text-anchor="middle">❤️</text>
    <path d="M 68 125 L 74 125" stroke="#1c1917" stroke-width="4" stroke-linecap="round" />
    <path d="M 142 125 L 128 125" stroke="#1c1917" stroke-width="4" stroke-linecap="round" />
</svg>`;

            case 'food':
                return `<svg viewBox="0 0 200 200" width="160" height="160" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M 68 180 L 68 120 C 68 65, 75 42, 105 42 C 135 42, 142 65, 142 120 L 142 180" stroke="#1c1917" stroke-width="4.5" stroke-linecap="round" fill="#ffffff" />
    <path d="M 80 58 Q 88 52 96 58" stroke="#1c1917" stroke-width="4" stroke-linecap="round" />
    <path d="M 114 58 Q 122 52 130 58" stroke="#1c1917" stroke-width="4" stroke-linecap="round" />
    <ellipse cx="105" cy="80" rx="12" ry="8" fill="#ec4899" stroke="#1c1917" stroke-width="3.5" />
    <polygon points="100,105 70,145 130,145" fill="#fbbf24" stroke="#1c1917" stroke-width="4" stroke-linejoin="round" />
    <circle cx="95" cy="130" r="4" fill="#ef4444" />
    <circle cx="108" cy="135" r="3.5" fill="#ef4444" />
    <path d="M 68 120 L 80 135" stroke="#1c1917" stroke-width="4" stroke-linecap="round" />
    <path d="M 142 120 L 125 135" stroke="#1c1917" stroke-width="4" stroke-linecap="round" />
</svg>`;

            case 'vibe':
                return `<svg viewBox="0 0 200 200" width="160" height="160" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M 68 180 L 68 120 C 68 65, 75 42, 105 42 C 135 42, 142 65, 142 120 L 142 180" stroke="#1c1917" stroke-width="4.5" stroke-linecap="round" fill="#ffffff" />
    <rect x="74" y="55" width="24" height="16" rx="4" fill="#1c1917" />
    <rect x="108" y="55" width="24" height="16" rx="4" fill="#1c1917" />
    <line x1="98" y1="62" x2="108" y2="62" stroke="#1c1917" stroke-width="3.5" />
    <path d="M 94 82 Q 105 90 120 78" stroke="#1c1917" stroke-width="4" stroke-linecap="round" />
    <path d="M 68 125 L 45 95 L 42 75" stroke="#1c1917" stroke-width="4" stroke-linecap="round" />
    <path d="M 45 95 L 56 75" stroke="#1c1917" stroke-width="4" stroke-linecap="round" />
    <path d="M 142 125 L 165 95 L 168 75" stroke="#1c1917" stroke-width="4" stroke-linecap="round" />
    <path d="M 165 95 L 154 75" stroke="#1c1917" stroke-width="4" stroke-linecap="round" />
</svg>`;

            case 'kisses':
                return `<svg viewBox="0 0 200 200" width="160" height="160" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M 68 180 L 68 120 C 68 65, 75 42, 105 42 C 135 42, 142 65, 142 120 L 142 180" stroke="#1c1917" stroke-width="4.5" stroke-linecap="round" fill="#ffffff" />
    <path d="M 80 62 Q 88 54 96 62" stroke="#1c1917" stroke-width="4" stroke-linecap="round" />
    <path d="M 114 62 Q 122 54 130 62" stroke="#1c1917" stroke-width="4" stroke-linecap="round" />
    <path d="M 98 78 Q 90 83 98 88" stroke="#1c1917" stroke-width="3.5" stroke-linecap="round" />
    <text x="145" y="65" font-size="20">💖</text>
    <text x="135" y="40" font-size="14">💋</text>
    <path d="M 68 125 L 45 105 L 85 105" stroke="#1c1917" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
    <path d="M 142 125 L 165 105 L 125 105" stroke="#1c1917" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
</svg>`;

            case 'banter':
                return `<svg viewBox="0 0 200 200" width="160" height="160" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M 68 180 L 68 120 C 68 65, 75 42, 105 42 C 135 42, 142 65, 142 120 L 142 180" stroke="#1c1917" stroke-width="4.5" stroke-linecap="round" fill="#ffffff" />
    <circle cx="88" cy="62" r="4.5" fill="#1c1917" />
    <circle cx="122" cy="62" r="4.5" fill="#1c1917" />
    <path d="M 90 82 Q 105 74 120 82" stroke="#1c1917" stroke-width="4" stroke-linecap="round" />
    <circle cx="45" cy="100" r="14" fill="#ef4444" stroke="#1c1917" stroke-width="4" />
    <circle cx="160" cy="100" r="14" fill="#ef4444" stroke="#1c1917" stroke-width="4" />
    <path d="M 68 120 L 52 106" stroke="#1c1917" stroke-width="4" stroke-linecap="round" />
    <path d="M 142 120 L 152 106" stroke="#1c1917" stroke-width="4" stroke-linecap="round" />
</svg>`;

            case 'vow':
                return `<svg viewBox="0 0 200 200" width="160" height="160" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M 68 180 L 68 120 C 68 65, 75 42, 105 42 C 135 42, 142 65, 142 120 L 142 180" stroke="#1c1917" stroke-width="4.5" stroke-linecap="round" fill="#ffffff" />
    <path d="M 80 62 Q 88 55 96 62" stroke="#1c1917" stroke-width="4" stroke-linecap="round" />
    <path d="M 114 62 Q 122 55 130 62" stroke="#1c1917" stroke-width="4" stroke-linecap="round" />
    <path d="M 94 76 Q 105 86 116 76" stroke="#1c1917" stroke-width="4" stroke-linecap="round" />
    <text x="90" y="130" font-size="24">🌹</text>
    <path d="M 68 125 L 85 125" stroke="#1c1917" stroke-width="4" stroke-linecap="round" />
    <path d="M 142 125 L 125 125" stroke="#1c1917" stroke-width="4" stroke-linecap="round" />
</svg>`;

            case 'celebrate':
                return `<svg viewBox="0 0 200 200" width="160" height="160" fill="none" xmlns="http://www.w3.org/2000/svg">
    <polygon points="105,15 90,45 120,45" fill="#ec4899" stroke="#1c1917" stroke-width="3.5" />
    <circle cx="105" cy="14" r="4" fill="#ffd700" />
    <path d="M 68 180 L 68 120 C 68 65, 75 42, 105 42 C 135 42, 142 65, 142 120 L 142 180" stroke="#1c1917" stroke-width="4.5" stroke-linecap="round" fill="#ffffff" />
    <path d="M 80 60 Q 88 52 96 60" stroke="#1c1917" stroke-width="4" stroke-linecap="round" />
    <path d="M 114 60 Q 122 52 130 60" stroke="#1c1917" stroke-width="4" stroke-linecap="round" />
    <path d="M 92 76 Q 105 92 118 76" stroke="#1c1917" stroke-width="4" stroke-linecap="round" fill="#ec4899" />
    <path d="M 68 120 L 45 80 L 38 60" stroke="#1c1917" stroke-width="4" stroke-linecap="round" />
    <path d="M 142 120 L 165 80 L 172 60" stroke="#1c1917" stroke-width="4" stroke-linecap="round" />
    <text x="30" y="55" font-size="16">✨</text>
    <text x="165" y="55" font-size="16">🎉</text>
</svg>`;
        }
    }

    function renderDateStep() {
        const step = dateSteps[currentStepIndex];
        if (!step) return;

        const lblStep = document.getElementById('date-step-label');
        const countStep = document.getElementById('date-step-count');
        const fillProgress = document.getElementById('date-progress-fill');
        const florkBox = document.getElementById('flork-container');
        const badgeEl = document.getElementById('date-badge');
        const headingEl = document.getElementById('date-heading');
        const subEl = document.getElementById('date-sub');
        const optionsRow = document.getElementById('date-options-row');
        const noteEl = document.getElementById('date-footer-note');

        if (lblStep) lblStep.textContent = step.label;
        if (countStep) countStep.textContent = step.num;
        if (fillProgress) fillProgress.style.width = `${step.percent}%`;
        if (florkBox) florkBox.innerHTML = getFlorkSVG(step.florkType);
        if (badgeEl) badgeEl.innerHTML = `<span>${escapeHTML(step.badge)}</span>`;
        if (headingEl) headingEl.innerHTML = step.title.replace(/\n/g, '<br>');
        if (subEl) subEl.textContent = step.sub;
        if (noteEl) noteEl.textContent = step.note;

        if (optionsRow) {
            optionsRow.innerHTML = step.options.map((opt, idx) => `
                <button class="${opt.type === 'pink' ? 'pill-btn-pink' : 'pill-btn-white'}" data-choice-index="${idx}">
                    <span>${escapeHTML(opt.text)}</span>
                    <div class="btn-circle-icon">${opt.icon}</div>
                </button>
            `).join('');
        }
    }

    // Handle date question option clicks
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('#date-options-row button');
        if (!btn) return;
        initAudio();
        playBeep(750, 'sine', 0.08);

        const choiceIndex = parseInt(btn.getAttribute('data-choice-index') || '0', 10);
        const step = dateSteps[currentStepIndex];
        const option = step.options[choiceIndex];

        if (option && option.action === 'open-calendar') {
            openModal('calendar-modal');
            renderCalendar();
            return;
        }

        const chosen = option ? option.text : 'Yes';
        selectedDateAnswers.push({ step: step.label, answer: chosen });

        if (currentStepIndex < dateSteps.length - 1) {
            currentStepIndex++;
            renderDateStep();
            launchCelebration(35);
        } else {
            // Step 8 completed: Grand Celebration & Date Confirmation!
            launchCelebration(180);
            playCelebrateFanfare();

            // Send packet to partner over MQTT
            sendPacket({
                type: 'DATE_PLAN_CONFIRMED',
                senderName: getMyName(),
                answers: selectedDateAnswers,
                time: new Date().toLocaleTimeString()
            });

            printLine(`💌 [DATE OFFICIALLY LOCKED IN]: ${escapeHTML(getMyName())} confirmed the date plan!`, 'text-gold');
            
            const optionsRow = document.getElementById('date-options-row');
            if (optionsRow) {
                optionsRow.innerHTML = `
                    <div style="background: #fff0f6; border: 1.5px solid #ec4899; border-radius: 999px; padding: 12px 24px; font-weight: 800; color: #ec4899; display: flex; align-items: center; gap: 8px;">
                        <span>✔ Date Confirmed & Sent to ${escapeHTML(getMyPartnerName())}! 💕</span>
                    </div>
                `;
            }
        }
    });

    // =========================================================
    // POPUP CALENDAR CONTROLLER
    // =========================================================
    let calDate = new Date();
    let calYear = calDate.getFullYear();
    let calMonth = calDate.getMonth();
    let calSelectedDay = calDate.getDate();

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    function getFormattedSelectedDate() {
        const d = new Date(calYear, calMonth, calSelectedDay);
        const dayName = dayNames[d.getDay()];
        const monthName = monthNames[calMonth];
        return `${dayName}, ${monthName} ${calSelectedDay}, ${calYear}`;
    }

    function updateCalBanner() {
        const banner = document.getElementById('cal-selected-text');
        if (banner) {
            banner.textContent = getFormattedSelectedDate();
        }
    }

    function renderCalendar() {
        const monthLabel = document.getElementById('cal-month-year-label');
        const grid = document.getElementById('calendar-days-grid');
        if (!grid) return;

        if (monthLabel) {
            monthLabel.textContent = `${monthNames[calMonth]} ${calYear}`;
        }

        const firstDayIndex = new Date(calYear, calMonth, 1).getDay();
        const totalDays = new Date(calYear, calMonth + 1, 0).getDate();

        const today = new Date();
        const isCurrentMonth = today.getFullYear() === calYear && today.getMonth() === calMonth;
        const todayDate = today.getDate();

        let html = '';

        // Empty padding cells
        for (let i = 0; i < firstDayIndex; i++) {
            html += '<div class="cal-day-cell empty"></div>';
        }

        // Day cells
        for (let day = 1; day <= totalDays; day++) {
            const isSelected = (day === calSelectedDay);
            const isToday = isCurrentMonth && (day === todayDate);
            const classes = ['cal-day-cell'];
            if (isSelected) classes.push('selected');
            if (isToday) classes.push('today');

            html += `<div class="${classes.join(' ')}" data-day="${day}">${day}</div>`;
        }

        grid.innerHTML = html;
        updateCalBanner();
    }

    // Calendar grid click listener
    document.addEventListener('click', (e) => {
        const cell = e.target.closest('.cal-day-cell:not(.empty)');
        if (!cell) return;
        const day = parseInt(cell.getAttribute('data-day'), 10);
        if (day) {
            calSelectedDay = day;
            initAudio();
            playBeep(820, 'sine', 0.08);
            renderCalendar();
        }
    });

    // Calendar month nav listeners
    const btnPrevMonth = document.getElementById('cal-prev-month');
    if (btnPrevMonth) {
        btnPrevMonth.addEventListener('click', () => {
            initAudio();
            playKeyClick();
            calMonth--;
            if (calMonth < 0) {
                calMonth = 11;
                calYear--;
            }
            const maxDays = new Date(calYear, calMonth + 1, 0).getDate();
            if (calSelectedDay > maxDays) calSelectedDay = maxDays;
            renderCalendar();
        });
    }

    const btnNextMonth = document.getElementById('cal-next-month');
    if (btnNextMonth) {
        btnNextMonth.addEventListener('click', () => {
            initAudio();
            playKeyClick();
            calMonth++;
            if (calMonth > 11) {
                calMonth = 0;
                calYear++;
            }
            const maxDays = new Date(calYear, calMonth + 1, 0).getDate();
            if (calSelectedDay > maxDays) calSelectedDay = maxDays;
            renderCalendar();
        });
    }

    // Calendar Shortcuts
    const btnShortcutWeekend = document.getElementById('cal-shortcut-weekend');
    if (btnShortcutWeekend) {
        btnShortcutWeekend.addEventListener('click', () => {
            initAudio();
            playBeep(880, 'sine', 0.1);
            const now = new Date();
            const daysUntilSaturday = (6 - now.getDay() + 7) % 7 || 7;
            const saturday = new Date(now);
            saturday.setDate(now.getDate() + daysUntilSaturday);
            calYear = saturday.getFullYear();
            calMonth = saturday.getMonth();
            calSelectedDay = saturday.getDate();
            renderCalendar();
        });
    }

    const btnShortcutAnniv = document.getElementById('cal-shortcut-anniversary');
    if (btnShortcutAnniv) {
        btnShortcutAnniv.addEventListener('click', () => {
            initAudio();
            playBeep(880, 'sine', 0.1);
            calMonth = 7; // August
            calSelectedDay = 31;
            renderCalendar();
        });
    }

    // Confirm Date Button
    const btnCalConfirm = document.getElementById('cal-confirm-btn');
    if (btnCalConfirm) {
        btnCalConfirm.addEventListener('click', () => {
            initAudio();
            playCelebrateFanfare();
            const formatted = getFormattedSelectedDate();
            selectedDateAnswers.push({ step: 'PICK A DAY', answer: `🗓️ ${formatted}` });

            closeModal('calendar-modal');
            launchCelebration(60);

            // If currently on Step 2 (index 1), advance!
            if (currentStepIndex === 1) {
                currentStepIndex++;
                renderDateStep();
            }
        });
    }

    // Tapping calendar Flork container also opens calendar on Step 2
    document.addEventListener('click', (e) => {
        if (e.target.closest('#flork-container') && currentStepIndex === 1) {
            initAudio();
            playBeep(880, 'sine', 0.1);
            openModal('calendar-modal');
            renderCalendar();
        }
    });

    // Handle feature tab switcher
    function switchToFeatureTab(targetId) {
        if (!targetId) return;
        document.querySelectorAll('.feature-tab').forEach(b => {
            if (b.getAttribute('data-target') === targetId) b.classList.add('active');
            else b.classList.remove('active');
        });
        document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
        const activePanel = document.getElementById(targetId);
        if (activePanel) {
            activePanel.classList.add('active');
            if (targetId === 'panel-live-map' && coupleMap) {
                setTimeout(() => coupleMap.invalidateSize(), 150);
            }
        }
        if (targetId === 'panel-live-chat') {
            if (typeof clearChatNotifications === 'function') clearChatNotifications();
            setTimeout(() => {
                const termBody = document.getElementById('terminal-body');
                if (termBody) termBody.scrollTop = termBody.scrollHeight;
                const input = document.getElementById('cli-input');
                if (input) input.focus();
            }, 100);
        }
    }
    window.switchToFeatureTab = switchToFeatureTab;

    document.addEventListener('click', (e) => {
        const tabBtn = e.target.closest('.feature-tab');
        if (!tabBtn) return;
        initAudio();
        playKeyClick();
        const targetId = tabBtn.getAttribute('data-target');
        if (targetId) switchToFeatureTab(targetId);
    });

    // Initialize the date card
    renderDateStep();

    // =========================================================
    // 16. AESTHETIC 90s VINYL PLAYER CONTROLS & PLAYLIST
    // =========================================================
    const btnVinylPlay = document.getElementById('btn-vinyl-play');
    if (btnVinylPlay) {
        btnVinylPlay.addEventListener('click', toggleMusic);
    }

    const btnVinylPrev = document.getElementById('btn-vinyl-prev');
    if (btnVinylPrev) {
        btnVinylPrev.addEventListener('click', playPrevTrack);
    }

    const btnVinylNext = document.getElementById('btn-vinyl-next');
    if (btnVinylNext) {
        btnVinylNext.addEventListener('click', playNextTrack);
    }

    const btnVinylListToggle = document.getElementById('btn-vinyl-list-toggle');
    const playlistDrawer = document.getElementById('vinyl-playlist-drawer');
    const btnClosePlaylist = document.getElementById('btn-close-playlist');

    if (btnVinylListToggle) {
        btnVinylListToggle.addEventListener('click', () => {
            initAudio();
            playKeyClick();
            if (playlistDrawer) playlistDrawer.classList.toggle('hidden');
        });
    }

    if (btnClosePlaylist) {
        btnClosePlaylist.addEventListener('click', () => {
            if (playlistDrawer) playlistDrawer.classList.add('hidden');
        });
    }

    // Audio element real time updates
    if (realAudioEl) {
        realAudioEl.addEventListener('timeupdate', () => {
            if (!realAudioEl.duration) return;
            const cur = realAudioEl.currentTime;
            const dur = realAudioEl.duration;
            const curM = Math.floor(cur / 60);
            const curS = Math.floor(cur % 60).toString().padStart(2, '0');
            const durM = Math.floor(dur / 60);
            const durS = Math.floor(dur % 60).toString().padStart(2, '0');

            const curTimeEl = document.getElementById('vinyl-current-time');
            const totalTimeEl = document.getElementById('vinyl-total-time');
            const fillEl = document.getElementById('vinyl-progress-fill');

            if (curTimeEl) curTimeEl.textContent = `${curM}:${curS}`;
            if (totalTimeEl) totalTimeEl.textContent = `${durM}:${durS}`;
            if (fillEl) fillEl.style.width = `${(cur / dur) * 100}%`;
        });

        realAudioEl.addEventListener('ended', () => {
            playNextTrack();
        });
    }

    // Scrub on progress track
    const vinylTrack = document.getElementById('vinyl-progress-track');
    if (vinylTrack) {
        vinylTrack.addEventListener('click', (e) => {
            if (!realAudioEl || !realAudioEl.duration) return;
            const rect = vinylTrack.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const fraction = Math.max(0, Math.min(1, clickX / rect.width));
            realAudioEl.currentTime = fraction * realAudioEl.duration;
            if (!state.music) startMusic();
        });
    }

    function renderPlaylistDrawer() {
        const listContainer = document.getElementById('playlist-items-list');
        if (!listContainer) return;
        let html = '';
        RETRO_90S_PLAYLIST.forEach((t, i) => {
            const isActive = (i === currentTrackIndex);
            html += `
                <div class="playlist-item ${isActive ? 'active' : ''}" onclick="window.select90sTrack(${i})">
                    <div class="playlist-item-left">
                        <span class="playlist-disc-icon">${isActive && state.music ? '💿' : '📻'}</span>
                        <div class="playlist-song-meta">
                            <span class="playlist-song-name">${escapeHTML(t.title)}</span>
                            <span class="playlist-song-artist">${escapeHTML(t.artist)} &bull; ${escapeHTML(t.movie)}</span>
                        </div>
                    </div>
                    <div class="playlist-item-right">
                        <span class="playlist-tag">${escapeHTML(t.tag)}</span>
                    </div>
                </div>
            `;
        });
        listContainer.innerHTML = html;
    }

    window.select90sTrack = function(idx) {
        initTrack(idx, true);
    };

    // Initialize first track
    initTrack(0, false);

    // Music Mode Switcher: Vinyl vs Spotify
    const btnModeVinyl = document.getElementById('btn-mode-vinyl');
    const btnModeSpotify = document.getElementById('btn-mode-spotify');
    const vinylWidget = document.getElementById('vinyl-player-widget');
    const spotifyWidget = document.getElementById('spotify-player-widget');

    if (btnModeVinyl && btnModeSpotify) {
        btnModeVinyl.addEventListener('click', () => {
            initAudio();
            playKeyClick();
            btnModeVinyl.classList.add('active');
            btnModeSpotify.classList.remove('active');
            if (vinylWidget) vinylWidget.classList.remove('hidden');
            if (spotifyWidget) spotifyWidget.classList.add('hidden');
        });

        btnModeSpotify.addEventListener('click', () => {
            initAudio();
            playKeyClick();
            stopMusic();
            btnModeSpotify.classList.add('active');
            btnModeVinyl.classList.remove('active');
            if (vinylWidget) vinylWidget.classList.add('hidden');
            if (playlistDrawer) playlistDrawer.classList.add('hidden');
            if (spotifyWidget) spotifyWidget.classList.remove('hidden');
        });
    }

    // =========================================================
    // 17. POLAROID MEMORY SCRAPBOOK CONTROLLER
    // =========================================================
    const memories = [
        {
            year: "2022 • August 31",
            caption: "Where our universe collided and our story officially began ✨",
            location: "📍 Karnataka ↔ Kerala",
            emoji: "💫",
            tag: "Day One"
        },
        {
            year: "2023 • Year 1",
            caption: "Late night drives, endless laughs, and realizing you're my person 🚗",
            location: "📍 Endless Memories",
            emoji: "🥰",
            tag: "Sweet Smiles"
        },
        {
            year: "2024 • Year 2",
            caption: "Distance is just physical — every kilometer made our bond unbreakable 💕",
            location: "📍 KA ✈️ KL Love Route",
            emoji: "💌",
            tag: "Unbreakable"
        },
        {
            year: "2025 • Year 3",
            caption: "Through every laugh, tease, and quiet moment — always my favorite home 🏡",
            location: "📍 My Favorite Person",
            emoji: "🧸",
            tag: "Safe Haven"
        },
        {
            year: "2026 • 4th Anniversary",
            caption: "4 magnificent years together, and I would choose you in every lifetime 💍",
            location: "📍 August 31, 2026",
            emoji: "👑",
            tag: "Forever & Always"
        }
    ];

    let currentMemoryIndex = 0;
    let memoryLikes = parseInt(localStorage.getItem('memoryLikes') || '1464', 10);

    function renderMemory() {
        const mem = memories[currentMemoryIndex];
        if (!mem) return;

        const imgEl = document.getElementById('polaroid-img');
        const placeholderEl = document.getElementById('polaroid-placeholder');
        const emojiEl = document.getElementById('placeholder-emoji');
        const tagEl = document.getElementById('placeholder-tag');
        const yearEl = document.getElementById('polaroid-year');
        const captionEl = document.getElementById('polaroid-caption');
        const locationEl = document.getElementById('polaroid-location');
        const likesEl = document.getElementById('memory-likes-count');

        if (yearEl) yearEl.textContent = mem.year;
        if (captionEl) captionEl.textContent = mem.caption;
        if (locationEl) locationEl.textContent = mem.location;
        if (emojiEl) emojiEl.textContent = mem.emoji;
        if (tagEl) tagEl.textContent = mem.tag;
        if (likesEl) likesEl.textContent = memoryLikes.toLocaleString();

        // Check if custom photo exists in localStorage
        const customPhoto = localStorage.getItem('custom_memory_' + currentMemoryIndex);
        if (customPhoto && imgEl && placeholderEl) {
            imgEl.src = customPhoto;
            imgEl.classList.remove('hidden');
            placeholderEl.style.display = 'none';
        } else if (imgEl && placeholderEl) {
            imgEl.src = '';
            imgEl.classList.add('hidden');
            placeholderEl.style.display = 'flex';
        }

        // Update dots
        document.querySelectorAll('.scrap-dot').forEach((dot, idx) => {
            if (idx === currentMemoryIndex) dot.classList.add('active');
            else dot.classList.remove('active');
        });
    }

    // Scrapbook event listeners
    const btnPrevMem = document.getElementById('btn-polaroid-prev');
    if (btnPrevMem) {
        btnPrevMem.addEventListener('click', () => {
            initAudio();
            playKeyClick();
            currentMemoryIndex = (currentMemoryIndex - 1 + memories.length) % memories.length;
            renderMemory();
        });
    }

    const btnNextMem = document.getElementById('btn-polaroid-next');
    if (btnNextMem) {
        btnNextMem.addEventListener('click', () => {
            initAudio();
            playKeyClick();
            currentMemoryIndex = (currentMemoryIndex + 1) % memories.length;
            renderMemory();
        });
    }

    document.addEventListener('click', (e) => {
        const dot = e.target.closest('.scrap-dot');
        if (!dot) return;
        const idx = parseInt(dot.getAttribute('data-index') || '0', 10);
        currentMemoryIndex = idx;
        initAudio();
        playKeyClick();
        renderMemory();
    });

    // Upload custom photo to polaroid
    const fileInput = document.getElementById('polaroid-file-input');
    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files && e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (evt) => {
                const dataUrl = evt.target.result;
                try {
                    localStorage.setItem('custom_memory_' + currentMemoryIndex, dataUrl);
                } catch (err) {
                    console.warn('Storage quota exceeded, displaying in session:', err);
                }
                initAudio();
                playCelebrateFanfare();
                launchCelebration(40);
                renderMemory();
            };
            reader.readAsDataURL(file);
        });
    }

    // Like memory button
    const btnLikeMemory = document.getElementById('btn-love-memory');
    if (btnLikeMemory) {
        btnLikeMemory.addEventListener('click', () => {
            initAudio();
            playBeep(880, 'sine', 0.1);
            memoryLikes++;
            localStorage.setItem('memoryLikes', memoryLikes.toString());
            const likesEl = document.getElementById('memory-likes-count');
            if (likesEl) likesEl.textContent = memoryLikes.toLocaleString();
            launchCelebration(25);
        });
    }

    // Initialize the scrapbook
    renderMemory();

    // =========================================================
    // 18. CHAT NOTIFICATION & ALERT SYSTEM
    // =========================================================
    let unreadChatCount = 0;
    let chatAlertsEnabled = (localStorage.getItem('chat_alerts_enabled') !== 'false');
    let titleBlinkInterval = null;
    const defaultAppTitle = document.title || 'Akhil & Her | 4 Years Together 💕';
    let toastTimeout = null;

    const chatToastBanner = document.getElementById('chat-toast-banner');
    const toastSenderEl = document.getElementById('toast-sender');
    const toastTextEl = document.getElementById('toast-text');
    const toastReplyBtn = document.getElementById('toast-reply-btn');
    const toastCloseBtn = document.getElementById('toast-close-btn');
    const chatUnreadBadge = document.getElementById('chat-unread-badge');
    const btnChatAlerts = document.getElementById('btn-chat-alerts');
    const chatAlertIcon = document.getElementById('chat-alert-icon');
    const chatAlertText = document.getElementById('chat-alert-text');

    function updateAlertButtonUI() {
        if (!btnChatAlerts) return;
        if (chatAlertsEnabled) {
            btnChatAlerts.classList.remove('muted');
            if (chatAlertIcon) chatAlertIcon.textContent = '🔔';
            if (chatAlertText) chatAlertText.textContent = 'Alerts ON';
        } else {
            btnChatAlerts.classList.add('muted');
            if (chatAlertIcon) chatAlertIcon.textContent = '🔕';
            if (chatAlertText) chatAlertText.textContent = 'Alerts Muted';
        }
    }
    updateAlertButtonUI();

    if (btnChatAlerts) {
        btnChatAlerts.addEventListener('click', () => {
            initAudio();
            playKeyClick();
            chatAlertsEnabled = !chatAlertsEnabled;
            localStorage.setItem('chat_alerts_enabled', chatAlertsEnabled ? 'true' : 'false');
            updateAlertButtonUI();

            if (chatAlertsEnabled && window.Notification && Notification.permission === 'default') {
                Notification.requestPermission().then(permission => {
                    if (permission === 'granted') {
                        printLine('🔔 Browser push notifications enabled for our love chat!', 'text-success');
                    }
                });
            }
        });
    }

    function triggerChatNotification(senderName, text) {
        if (!chatAlertsEnabled) return;

        const chatPanel = document.getElementById('panel-live-chat');
        const isChatActive = chatPanel && chatPanel.classList.contains('active') && !document.hidden;

        if (isChatActive) {
            playKeyClick();
            return;
        }

        // 1. Play musical double chime
        playNotificationChime();

        // 2. Vibrate phone
        if ('vibrate' in navigator) {
            try { navigator.vibrate([100, 50, 150]); } catch (e) {}
        }

        // 3. Update unread counter badge
        unreadChatCount++;
        if (chatUnreadBadge) {
            chatUnreadBadge.textContent = unreadChatCount > 9 ? '9+' : unreadChatCount;
            chatUnreadBadge.classList.remove('hidden');
        }

        // 4. Show In-App Floating Toast Banner
        if (chatToastBanner && toastSenderEl && toastTextEl) {
            toastSenderEl.textContent = senderName || 'Her';
            toastTextEl.textContent = text || 'Sent a sweet love note 💕';
            chatToastBanner.classList.remove('hidden');

            if (toastTimeout) clearTimeout(toastTimeout);
            toastTimeout = setTimeout(() => {
                if (chatToastBanner) chatToastBanner.classList.add('hidden');
            }, 6500);
        }

        // 5. Document title notification blink
        startTitleFlashing(senderName);

        // 6. Browser Push / System Notification (if backgrounded or minimized)
        if (document.hidden && window.Notification && Notification.permission === 'granted') {
            try {
                const notif = new Notification(`${senderName || 'Your Love'} 💕`, {
                    body: text || 'Sent you a new love message!',
                    icon: 'icons/icon-192.png',
                    badge: 'icons/icon-192.png',
                    tag: 'love-msg-alert'
                });
                notif.onclick = () => {
                    window.focus();
                    switchToFeatureTab('panel-live-chat');
                    notif.close();
                };
            } catch (e) {}
        }
    }
    window.triggerChatNotification = triggerChatNotification;

    function clearChatNotifications() {
        unreadChatCount = 0;
        if (chatUnreadBadge) chatUnreadBadge.classList.add('hidden');
        if (chatToastBanner) chatToastBanner.classList.add('hidden');
        if (toastTimeout) clearTimeout(toastTimeout);

        if (titleBlinkInterval) {
            clearInterval(titleBlinkInterval);
            titleBlinkInterval = null;
        }
        document.title = defaultAppTitle;
    }
    window.clearChatNotifications = clearChatNotifications;

    function startTitleFlashing(senderName) {
        if (titleBlinkInterval) return;
        let toggle = false;
        titleBlinkInterval = setInterval(() => {
            toggle = !toggle;
            document.title = toggle ? `💌 (1) New message from ${senderName || 'Her'}!` : defaultAppTitle;
        }, 1200);
    }

    if (toastReplyBtn) {
        toastReplyBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            initAudio();
            playKeyClick();
            switchToFeatureTab('panel-live-chat');
        });
    }

    if (chatToastBanner) {
        chatToastBanner.addEventListener('click', () => {
            initAudio();
            playKeyClick();
            switchToFeatureTab('panel-live-chat');
        });
    }

    if (toastCloseBtn) {
        toastCloseBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (chatToastBanner) chatToastBanner.classList.add('hidden');
            if (toastTimeout) clearTimeout(toastTimeout);
        });
    }

    // =========================================================
    // 19. ROMANTIC PHOTO GALLERY & MEMORY VAULT
    // =========================================================
    const DEFAULT_GALLERY_PHOTOS = [
        {
            id: 'photo_1',
            isUploaded: false,
            emoji: '💫',
            quote: 'Where our universe collided and forever began ✨',
            caption: 'August 31, 2022 • The Day We Began',
            date: '2022 • Aug 31',
            location: '📍 Karnataka ↔ Kerala',
            category: 'milestones',
            likes: 1464
        },
        {
            id: 'photo_2',
            isUploaded: false,
            emoji: '🚗',
            quote: 'Every kilometer between KA & KL only made us closer 💕',
            caption: 'KA ✈️ KL • Long Distance Love Route',
            date: '2023 • Year 1',
            location: '📍 Karnataka ↔ Kerala',
            category: 'long_distance',
            likes: 1280
        },
        {
            id: 'photo_3',
            isUploaded: false,
            emoji: '🎶',
            quote: 'Falling asleep on calls listening to 90s melodies 🌙',
            caption: 'Late Night Calls & 90s Songs',
            date: '2024 • Year 2',
            location: '📍 Endless Memories',
            category: 'memories',
            likes: 1395
        },
        {
            id: 'photo_4',
            isUploaded: false,
            emoji: '🥰',
            quote: 'Two cute Flork beans conquering life together 🌸',
            caption: 'A ❤️ M • Flork Couple Hugs',
            date: '2025 • Year 3',
            location: '📍 Safe Haven',
            category: 'favorites',
            likes: 1520
        },
        {
            id: 'photo_5',
            isUploaded: false,
            emoji: '💍',
            quote: '4 magnificent years together, and I choose you forever 👑',
            caption: 'August 31, 2026 • 4 Years Together',
            date: '2026 • 4th Anniversary',
            location: '📍 Forever & Always',
            category: 'milestones',
            likes: 2026
        },
        {
            id: 'photo_6',
            isUploaded: false,
            emoji: '🧸',
            quote: 'In your embrace is my absolute favorite place in the world 🏡',
            caption: 'My Comfort & My Home',
            date: 'Special Moments',
            location: '📍 In Each Other\'s Hearts',
            category: 'favorites',
            likes: 1110
        }
    ];

    let galleryPhotos = [];
    try {
        const savedPhotos = localStorage.getItem('akhil_her_gallery_photos');
        if (savedPhotos) {
            galleryPhotos = JSON.parse(savedPhotos);
        } else {
            galleryPhotos = [...DEFAULT_GALLERY_PHOTOS];
        }
    } catch (e) {
        galleryPhotos = [...DEFAULT_GALLERY_PHOTOS];
    }

    function saveGalleryPhotos() {
        try {
            localStorage.setItem('akhil_her_gallery_photos', JSON.stringify(galleryPhotos));
        } catch (e) {}
    }

    let activeGalleryFilter = 'all';
    let currentLightboxPhotoIndex = 0;

    // View Switcher: Grid vs Polaroid
    const btnViewGrid = document.getElementById('btn-view-grid');
    const btnViewPolaroid = document.getElementById('btn-view-polaroid');
    const galleryGridWrapper = document.getElementById('gallery-grid-wrapper');
    const scrapbookPolaroidWrapper = document.getElementById('scrapbook-polaroid-wrapper');

    if (btnViewGrid && btnViewPolaroid) {
        btnViewGrid.addEventListener('click', () => {
            initAudio();
            playKeyClick();
            btnViewGrid.classList.add('active');
            btnViewPolaroid.classList.remove('active');
            if (galleryGridWrapper) galleryGridWrapper.classList.remove('hidden');
            if (scrapbookPolaroidWrapper) scrapbookPolaroidWrapper.classList.add('hidden');
        });

        btnViewPolaroid.addEventListener('click', () => {
            initAudio();
            playKeyClick();
            btnViewPolaroid.classList.add('active');
            btnViewGrid.classList.remove('active');
            if (galleryGridWrapper) galleryGridWrapper.classList.add('hidden');
            if (scrapbookPolaroidWrapper) scrapbookPolaroidWrapper.classList.remove('hidden');
            renderMemory();
        });
    }

    // Filter Chips
    document.addEventListener('click', (e) => {
        const chip = e.target.closest('.filter-chip');
        if (!chip) return;
        initAudio();
        playKeyClick();
        document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        activeGalleryFilter = chip.getAttribute('data-filter') || 'all';
        renderGalleryGrid();
    });

    function renderGalleryGrid() {
        const gridContainer = document.getElementById('photo-cards-grid');
        if (!gridContainer) return;

        let filtered = galleryPhotos;
        if (activeGalleryFilter === 'favorites') {
            filtered = galleryPhotos.filter(p => p.category === 'favorites' || p.likes >= 1400);
        } else if (activeGalleryFilter === 'milestones') {
            filtered = galleryPhotos.filter(p => p.category === 'milestones');
        } else if (activeGalleryFilter === 'long_distance') {
            filtered = galleryPhotos.filter(p => p.category === 'long_distance');
        } else if (activeGalleryFilter === 'custom') {
            filtered = galleryPhotos.filter(p => p.isUploaded);
        }

        if (filtered.length === 0) {
            gridContainer.innerHTML = `
                <div style="grid-column: 1 / -1; text-align:center; padding: 36px 16px; color:#9ca3af;">
                    <span style="font-size:36px; display:block; margin-bottom:8px;">📸</span>
                    <p style="margin:0; font-size:13px; font-weight:600;">No photos in this category yet!</p>
                    <small>Tap "+ Add Photo" above to upload your first sweet memory 💕</small>
                </div>
            `;
            return;
        }

        let html = '';
        filtered.forEach((p) => {
            const originalIndex = galleryPhotos.findIndex(item => item.id === p.id);
            const thumbContent = p.src
                ? `<img src="${p.src}" alt="${escapeHTML(p.caption)}" class="card-thumb-img" loading="lazy">`
                : `
                    <div class="card-thumb-art">
                        <span class="card-art-emoji">${p.emoji || '✨'}</span>
                        <div class="card-art-quote">${escapeHTML(p.quote || '')}</div>
                    </div>
                `;

            html += `
                <div class="photo-card" onclick="window.openPhotoLightbox(${originalIndex})">
                    <div class="card-thumb-wrap">
                        ${thumbContent}
                        <button class="card-heart-badge" onclick="window.likeGalleryPhoto(event, '${p.id}')" title="Like photo">
                            <span>❤️</span> <span>${p.likes.toLocaleString()}</span>
                        </button>
                    </div>
                    <div class="card-info">
                        <div class="card-tag-row">
                            <span>${escapeHTML(p.date || 'Memory')}</span>
                        </div>
                        <div class="card-caption">${escapeHTML(p.caption)}</div>
                        <div class="card-location">${escapeHTML(p.location || '📍 Karnataka ↔ Kerala')}</div>
                    </div>
                </div>
            `;
        });
        gridContainer.innerHTML = html;
    }

    // Like Photo
    window.likeGalleryPhoto = function(e, photoId) {
        if (e) e.stopPropagation();
        initAudio();
        playCelebrateFanfare();
        const photo = galleryPhotos.find(p => p.id === photoId);
        if (photo) {
            photo.likes++;
            saveGalleryPhotos();
            renderGalleryGrid();
            spawnFloatingHeartsAtClick(e);

            sendPacket({
                type: 'GALLERY_LIKE_PHOTO',
                photoId: photoId
            });
        }
    };

    window.handleIncomingPhotoLike = function(photoId) {
        const photo = galleryPhotos.find(p => p.id === photoId);
        if (photo) {
            photo.likes++;
            saveGalleryPhotos();
            renderGalleryGrid();
            launchCelebration(35);
        }
    };

    function spawnFloatingHeartsAtClick(e) {
        const x = (e && e.clientX) ? e.clientX : window.innerWidth / 2;
        const y = (e && e.clientY) ? e.clientY : window.innerHeight / 2;
        for (let i = 0; i < 6; i++) {
            const h = document.createElement('span');
            h.textContent = ['❤️', '💕', '💖', '✨'][Math.floor(Math.random() * 4)];
            h.style.position = 'fixed';
            h.style.left = (x + Math.random() * 20 - 10) + 'px';
            h.style.top = (y + Math.random() * 20 - 10) + 'px';
            h.style.pointerEvents = 'none';
            h.style.fontSize = (16 + Math.random() * 10) + 'px';
            h.style.transition = 'all 1s cubic-bezier(0.16, 1, 0.3, 1)';
            h.style.zIndex = '99999';
            document.body.appendChild(h);
            requestAnimationFrame(() => {
                h.style.transform = `translate(${Math.random() * 60 - 30}px, ${-60 - Math.random() * 40}px) scale(1.3)`;
                h.style.opacity = '0';
            });
            setTimeout(() => h.remove(), 1000);
        }
    }

    // Photo Upload
    let pendingUploadDataUrl = null;
    const galleryFileInput = document.getElementById('gallery-file-input');
    const uploadPreviewImg = document.getElementById('upload-preview-img');
    const uploadCaptionInput = document.getElementById('upload-caption-input');
    const uploadDateInput = document.getElementById('upload-date-input');
    const btnSaveUploadedPhoto = document.getElementById('btn-save-uploaded-photo');

    if (galleryFileInput) {
        galleryFileInput.addEventListener('change', (e) => {
            const file = e.target.files && e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (ev) => {
                pendingUploadDataUrl = ev.target.result;
                if (uploadPreviewImg) uploadPreviewImg.src = pendingUploadDataUrl;
                if (uploadCaptionInput) uploadCaptionInput.value = '';
                if (uploadDateInput) uploadDateInput.value = `2026 • ${myRole === 'partner1' ? 'Akhil' : 'Her'} Added`;
                openModal('add-photo-caption-modal');
            };
            reader.readAsDataURL(file);
        });
    }

    if (btnSaveUploadedPhoto) {
        btnSaveUploadedPhoto.addEventListener('click', () => {
            if (!pendingUploadDataUrl) return;
            initAudio();
            playCelebrateFanfare();

            const caption = (uploadCaptionInput && uploadCaptionInput.value.trim()) || 'Our Beautiful Memory 💕';
            const dateStr = (uploadDateInput && uploadDateInput.value.trim()) || '2026';

            const newPhoto = {
                id: 'custom_' + Date.now(),
                isUploaded: true,
                src: pendingUploadDataUrl,
                caption: caption,
                date: dateStr,
                location: '📍 Captured with Love',
                category: 'custom',
                likes: 1
            };

            galleryPhotos.unshift(newPhoto);
            saveGalleryPhotos();
            closeModal('add-photo-caption-modal');
            renderGalleryGrid();
            launchCelebration(60);

            // Broadcast to partner!
            sendPacket({
                type: 'GALLERY_ADD_PHOTO',
                photo: newPhoto,
                senderName: myRole === 'partner1' ? 'Akhil' : 'Her'
            });

            printLine('📸 New photo added to Our Gallery & synced across devices!', 'text-success');
        });
    }

    window.handleIncomingGalleryPhoto = function(photo, senderName) {
        if (!photo || !photo.id) return;
        if (!galleryPhotos.some(p => p.id === photo.id)) {
            galleryPhotos.unshift(photo);
            saveGalleryPhotos();
            renderGalleryGrid();
            playNotificationChime();
            if (typeof triggerChatNotification === 'function') {
                triggerChatNotification(senderName || 'Her', '📸 Added a new photo to Our Gallery!');
            }
        }
    };

    // Lightbox Modal Logic
    const photoLightboxModal = document.getElementById('photo-lightbox-modal');
    const lightboxTitle = document.getElementById('lightbox-title');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxArtPlaceholder = document.getElementById('lightbox-art-placeholder');
    const lightboxCaption = document.getElementById('lightbox-caption');
    const lightboxDate = document.getElementById('lightbox-date');
    const lightboxLocation = document.getElementById('lightbox-location');
    const lightboxLikesCount = document.getElementById('lightbox-likes-count');
    const btnCloseLightbox = document.getElementById('btn-close-lightbox');
    const btnLightboxPrev = document.getElementById('btn-lightbox-prev');
    const btnLightboxNext = document.getElementById('btn-lightbox-next');
    const btnLightboxLike = document.getElementById('btn-lightbox-like');
    const btnLightboxDownload = document.getElementById('btn-lightbox-download');
    const btnLightboxDelete = document.getElementById('btn-lightbox-delete');

    window.openPhotoLightbox = function(index) {
        initAudio();
        playKeyClick();
        currentLightboxPhotoIndex = index;
        renderLightboxPhoto();
        if (photoLightboxModal) photoLightboxModal.classList.remove('hidden');
    };

    function renderLightboxPhoto() {
        const p = galleryPhotos[currentLightboxPhotoIndex];
        if (!p) return;

        if (lightboxTitle) lightboxTitle.textContent = p.caption;
        if (lightboxCaption) lightboxCaption.textContent = p.caption;
        if (lightboxDate) lightboxDate.textContent = `🗓️ ${p.date || 'Memory'}`;
        if (lightboxLocation) lightboxLocation.textContent = p.location || '📍 Karnataka ↔ Kerala';
        if (lightboxLikesCount) lightboxLikesCount.textContent = p.likes.toLocaleString();

        if (p.src) {
            if (lightboxImg) {
                lightboxImg.src = p.src;
                lightboxImg.classList.remove('hidden');
            }
            if (lightboxArtPlaceholder) lightboxArtPlaceholder.style.display = 'none';
        } else {
            if (lightboxImg) lightboxImg.classList.add('hidden');
            if (lightboxArtPlaceholder) {
                lightboxArtPlaceholder.style.display = 'flex';
                lightboxArtPlaceholder.innerHTML = `
                    <span class="card-art-emoji" style="font-size:60px;">${p.emoji || '✨'}</span>
                    <div class="card-art-quote" style="font-size:15px; margin-top:10px;">${escapeHTML(p.quote || '')}</div>
                `;
            }
        }

        if (btnLightboxDelete) {
            if (p.isUploaded) btnLightboxDelete.classList.remove('hidden');
            else btnLightboxDelete.classList.add('hidden');
        }
    }

    if (btnCloseLightbox) {
        btnCloseLightbox.addEventListener('click', () => {
            if (photoLightboxModal) photoLightboxModal.classList.add('hidden');
        });
    }

    if (photoLightboxModal) {
        photoLightboxModal.addEventListener('click', (e) => {
            if (e.target === photoLightboxModal) {
                photoLightboxModal.classList.add('hidden');
            }
        });
    }

    if (btnLightboxPrev) {
        btnLightboxPrev.addEventListener('click', () => {
            initAudio();
            playKeyClick();
            currentLightboxPhotoIndex = (currentLightboxPhotoIndex - 1 + galleryPhotos.length) % galleryPhotos.length;
            renderLightboxPhoto();
        });
    }

    if (btnLightboxNext) {
        btnLightboxNext.addEventListener('click', () => {
            initAudio();
            playKeyClick();
            currentLightboxPhotoIndex = (currentLightboxPhotoIndex + 1) % galleryPhotos.length;
            renderLightboxPhoto();
        });
    }

    if (btnLightboxLike) {
        btnLightboxLike.addEventListener('click', (e) => {
            const p = galleryPhotos[currentLightboxPhotoIndex];
            if (p) {
                window.likeGalleryPhoto(e, p.id);
                if (lightboxLikesCount) lightboxLikesCount.textContent = p.likes.toLocaleString();
            }
        });
    }

    if (btnLightboxDownload) {
        btnLightboxDownload.addEventListener('click', () => {
            const p = galleryPhotos[currentLightboxPhotoIndex];
            if (!p) return;
            initAudio();
            playKeyClick();
            if (p.src) {
                const a = document.createElement('a');
                a.href = p.src;
                a.download = `akhil_her_memory_${p.id}.png`;
                a.click();
            } else {
                printLine('📸 Image saved to memory!', 'text-success');
            }
        });
    }

    if (btnLightboxDelete) {
        btnLightboxDelete.addEventListener('click', () => {
            const p = galleryPhotos[currentLightboxPhotoIndex];
            if (!p || !p.isUploaded) return;
            if (confirm('Delete this photo from Our Gallery?')) {
                galleryPhotos.splice(currentLightboxPhotoIndex, 1);
                saveGalleryPhotos();
                renderGalleryGrid();
                if (photoLightboxModal) photoLightboxModal.classList.add('hidden');
            }
        });
    }

    // Initial render of gallery grid
    renderGalleryGrid();

    // 18. QUICK 1-TAP CHAT REACTION EMOJIS
    document.addEventListener('click', (e) => {
        const emojiBtn = e.target.closest('.quick-emoji-btn');
        if (!emojiBtn) return;
        const emoji = emojiBtn.getAttribute('data-emoji');
        if (emoji) {
            initAudio();
            commands.chat.exec([emoji]);
        }
    });

    document.addEventListener('click', (e) => {
        if (!window.getSelection().toString() && !e.target.closest('button, select, input, .help-cmd, .modal-card')) {
            if (inputEl) inputEl.focus();
        }
    });

    if (state.theme && themeSelect) {
        document.body.className = state.theme;
        themeSelect.value = state.theme;
    }
    updateSoundButton();
    updateMusicButton();

    // Start Cloud Relay
    initCloudRelay();

    // =========================================================
    // 19. PROGRESSIVE WEB APP (PWA) MOBILE INSTALL CONTROLLER
    // =========================================================
    let deferredPrompt = null;
    const btnInstallHeader = document.getElementById('btn-install-app');
    const btnNativeInstall = document.getElementById('btn-native-install');

    // Register Service Worker for offline support & standalone app launch
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js')
                .then((reg) => console.log('PWA Service Worker registered:', reg.scope))
                .catch((err) => console.warn('Service Worker registration failed:', err));
        });
    }

    // Capture Android / Chrome PWA install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        if (btnInstallHeader) {
            btnInstallHeader.style.display = 'inline-flex';
        }
    });

    if (btnInstallHeader) {
        btnInstallHeader.addEventListener('click', () => {
            initAudio();
            playKeyClick();
            openModal('install-modal');
        });
    }

    if (btnNativeInstall) {
        btnNativeInstall.addEventListener('click', async () => {
            initAudio();
            playCelebrateFanfare();
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                if (outcome === 'accepted') {
                    printLine('📲 App successfully installed to your home screen! 💕', 'text-gold');
                    launchCelebration(60);
                    closeModal('install-modal');
                }
                deferredPrompt = null;
            } else {
                const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
                if (isIOS) {
                    alert("On iPhone:\n1. Tap 'Share' ⎋ at bottom of Safari\n2. Scroll down & tap 'Add to Home Screen' ➕\n3. Tap 'Add'!");
                } else {
                    alert("To install:\nTap your browser menu (⋮ or ⋯) and select 'Install app' or 'Add to Home Screen'!");
                }
            }
        });
    }

    window.addEventListener('appinstalled', () => {
        printLine('🎉 Welcome to the official Akhil & Her Mobile App!', 'text-accent');
        launchCelebration(100);
        playCelebrateFanfare();
        if (btnInstallHeader) btnInstallHeader.style.display = 'none';
    });

    // Check if running as standalone installed app
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
        if (btnInstallHeader) btnInstallHeader.style.display = 'none';
        console.log('Running as installed standalone mobile app!');
    }

    // =========================================================
    // 20. BIOMETRIC & PASSCODE APP LOCK CONTROLLER
    // =========================================================
    const lockScreen = document.getElementById('app-lock-screen');
    const lockStatusIcon = document.getElementById('lock-status-icon');
    const lockStatusWrap = document.getElementById('lock-icon-wrap');
    const lockStatusText = document.getElementById('lock-status-text');
    const scannerRing = document.getElementById('scanner-ring');
    const scannerFill = document.getElementById('scanner-progress-fill');
    const scannerPrompt = document.getElementById('scanner-prompt');

    const btnTabBio = document.getElementById('btn-tab-bio');
    const btnTabPin = document.getElementById('btn-tab-pin');
    const viewBio = document.getElementById('view-biometric');
    const viewPin = document.getElementById('view-pin');
    const btnSwitchPin = document.getElementById('btn-switch-to-pin');
    const btnLockHeader = document.getElementById('btn-lock-app');

    const pinFeedback = document.getElementById('pin-feedback');
    const CORRECT_PIN = '0831'; // August 31 (Anniversary Date!)
    let enteredPin = '';

    let isUnlocked = (sessionStorage.getItem('appUnlocked') === 'true');

    function updateLockUI() {
        if (!lockScreen) return;
        if (isUnlocked) {
            lockScreen.classList.add('unlocked');
        } else {
            lockScreen.classList.remove('unlocked');
            resetLockState();
        }
    }

    function resetLockState() {
        enteredPin = '';
        updatePinDots();
        if (scannerFill) scannerFill.style.width = '0%';
        if (scannerRing) scannerRing.classList.remove('scanning');
        if (lockStatusIcon) lockStatusIcon.textContent = '🔒';
        if (lockStatusWrap) lockStatusWrap.classList.remove('granted');
        if (lockStatusText) lockStatusText.textContent = 'Authenticate to unlock our anniversary card 💕';
        if (scannerPrompt) scannerPrompt.textContent = 'Touch & Hold to Scan Fingerprint';
        if (pinFeedback) pinFeedback.textContent = 'Enter Anniversary PIN (MMDD)';
    }

    function unlockApp(method) {
        initAudio();
        playCelebrateFanfare();
        if (navigator.vibrate) {
            try { navigator.vibrate([100, 60, 150]); } catch (e) {}
        }

        isUnlocked = true;
        sessionStorage.setItem('appUnlocked', 'true');

        if (lockStatusIcon) lockStatusIcon.textContent = '🔓';
        if (lockStatusWrap) lockStatusWrap.classList.add('granted');
        if (lockStatusText) lockStatusText.textContent = 'Access Granted! Welcome My Love 💕';
        if (scannerPrompt) scannerPrompt.textContent = 'Identity Verified ✔';
        if (pinFeedback) pinFeedback.textContent = 'Passcode Verified ✔';

        launchCelebration(60);

        setTimeout(() => {
            if (lockScreen) {
                lockScreen.classList.add('unlocked');
            }
        }, 500);
    }

    // Switch between Fingerprint and PIN
    function switchLockTab(tab) {
        initAudio();
        playKeyClick();
        if (tab === 'bio') {
            if (btnTabBio) btnTabBio.classList.add('active');
            if (btnTabPin) btnTabPin.classList.remove('active');
            if (viewBio) viewBio.classList.add('active');
            if (viewPin) viewPin.classList.remove('active');
        } else {
            if (btnTabPin) btnTabPin.classList.add('active');
            if (btnTabBio) btnTabBio.classList.remove('active');
            if (viewPin) viewPin.classList.add('active');
            if (viewBio) viewBio.classList.remove('active');
        }
    }

    if (btnTabBio) btnTabBio.addEventListener('click', () => switchLockTab('bio'));
    if (btnTabPin) btnTabPin.addEventListener('click', () => switchLockTab('pin'));
    if (btnSwitchPin) btnSwitchPin.addEventListener('click', () => switchLockTab('pin'));

    // Manual Lock Button in Header
    if (btnLockHeader) {
        btnLockHeader.addEventListener('click', () => {
            initAudio();
            playKeyClick();
            isUnlocked = false;
            sessionStorage.removeItem('appUnlocked');
            updateLockUI();
            printLine('🔒 App Locked for privacy.', 'text-dim');
        });
    }

    // --- BIOMETRIC SCANNER (Touch & Hold) ---
    let scanProgress = 0;
    let scanInterval = null;

    function startBiometricScan() {
        if (isUnlocked) return;
        initAudio();
        playBeep(700, 'sine', 0.08);
        if (scannerRing) scannerRing.classList.add('scanning');
        if (scannerPrompt) scannerPrompt.textContent = 'Scanning Fingerprint...';

        scanProgress = 0;
        if (scanInterval) clearInterval(scanInterval);

        scanInterval = setInterval(() => {
            scanProgress += 8;
            if (scannerFill) scannerFill.style.width = Math.min(100, scanProgress) + '%';

            // Haptic ticks and sound chirps while scanning
            if (scanProgress % 24 === 0) {
                playBeep(650 + scanProgress * 3, 'sine', 0.04);
                if (navigator.vibrate) {
                    try { navigator.vibrate(25); } catch (e) {}
                }
            }

            if (scanProgress >= 100) {
                clearInterval(scanInterval);
                scanInterval = null;
                unlockApp('biometric');
            }
        }, 75);
    }

    function cancelBiometricScan() {
        if (isUnlocked) return;
        if (scanInterval) {
            clearInterval(scanInterval);
            scanInterval = null;
        }
        if (scannerRing) scannerRing.classList.remove('scanning');
        if (scannerFill) scannerFill.style.width = '0%';
        if (scannerPrompt) scannerPrompt.textContent = 'Hold longer to authenticate!';
    }

    if (scannerRing) {
        scannerRing.addEventListener('mousedown', startBiometricScan);
        scannerRing.addEventListener('touchstart', (e) => {
            e.preventDefault();
            startBiometricScan();
        }, { passive: false });

        window.addEventListener('mouseup', cancelBiometricScan);
        window.addEventListener('touchend', cancelBiometricScan);
        window.addEventListener('touchcancel', cancelBiometricScan);
    }

    // --- PIN KEYPAD ---
    function updatePinDots() {
        for (let i = 0; i < 4; i++) {
            const dot = document.getElementById('dot-' + i);
            if (dot) {
                if (i < enteredPin.length) dot.classList.add('filled');
                else dot.classList.remove('filled', 'error');
            }
        }
    }

    document.addEventListener('click', (e) => {
        const keyBtn = e.target.closest('.key-btn[data-key]');
        if (!keyBtn || isUnlocked) return;
        const digit = keyBtn.getAttribute('data-key');
        if (enteredPin.length < 4) {
            initAudio();
            playBeep(600 + enteredPin.length * 80, 'sine', 0.06);
            enteredPin += digit;
            updatePinDots();

            if (enteredPin.length === 4) {
                checkPin();
            }
        }
    });

    const btnPinDel = document.getElementById('btn-pin-del');
    if (btnPinDel) {
        btnPinDel.addEventListener('click', () => {
            if (isUnlocked || enteredPin.length === 0) return;
            initAudio();
            playKeyClick();
            enteredPin = enteredPin.slice(0, -1);
            updatePinDots();
        });
    }

    const btnPinHint = document.getElementById('btn-pin-hint');
    if (btnPinHint) {
        btnPinHint.addEventListener('click', () => {
            initAudio();
            playKeyClick();
            if (pinFeedback) pinFeedback.textContent = '💡 Hint: August 31 (0831) 💕';
        });
    }

    function checkPin() {
        if (enteredPin === CORRECT_PIN) {
            unlockApp('pin');
        } else {
            initAudio();
            playBeep(240, 'sawtooth', 0.25);
            if (navigator.vibrate) {
                try { navigator.vibrate([100, 50, 100]); } catch (e) {}
            }

            for (let i = 0; i < 4; i++) {
                const dot = document.getElementById('dot-' + i);
                if (dot) dot.classList.add('error');
            }

            const lockCard = document.querySelector('.lock-card');
            if (lockCard) {
                lockCard.classList.add('shake-anim');
                setTimeout(() => lockCard.classList.remove('shake-anim'), 450);
            }

            if (pinFeedback) pinFeedback.textContent = '❌ Incorrect PIN. Hint: 0831 (Aug 31)';

            setTimeout(() => {
                enteredPin = '';
                updatePinDots();
            }, 600);
        }
    }

    // Initialize lock state
    updateLockUI();

    // Initial Print
    printWelcomeBanner();

})();
