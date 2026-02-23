document.addEventListener('DOMContentLoaded', () => {
    const views = {
        modes: document.getElementById('view-modes'),
        duration: document.getElementById('view-duration'),
        session: document.getElementById('view-session'),
        end: document.getElementById('view-end')
    };
    
    const circle = document.getElementById('guide-circle');
    const holdTimer = document.getElementById('hold-timer');
    const statusText = document.getElementById('status');
    const progressFill = document.getElementById('progress-fill');
    const timeLeftDisplay = document.getElementById('time-left');
    const coachingTip = document.getElementById('coaching-tip');
    const streakDisplay = document.getElementById('stat-streak');
    const minutesDisplay = document.getElementById('stat-minutes');

    let isActive = false;
    let timeoutId = null;
    let intervalId = null;
    let holdInterval = null;
    let instructionTimeout = null;
    let wakeLock = null;
    let currentStepIndex = 0;
    let selectedDuration = 180;
    let audioCtx = null;

    const MODES = {
        equilibre: { steps: ['inhale', 'exhale'], times: [5000, 5000], tip: "Votre rythme cardiaque s'est synchronisé avec votre respiration.", exitText: "Je me sens en équilibre" },
        calme: { steps: ['inhale', 'exhale'], times: [4000, 6000], tip: "L'expiration longue a activé votre système nerveux parasympathique.", exitText: "Je me sens apaisé(e)" },
        sommeil: { steps: ['inhale', 'exhale'], times: [4000, 8000], tip: "Votre corps est maintenant en mode récupération profonde.", exitText: "Je suis prêt(e) pour la nuit" },
        focus: { steps: ['inhale', 'exhale'], times: [6000, 4000], tip: "L'apport d'oxygène a réveillé votre vigilance cognitive.", exitText: "Je me sens lucide et prêt(e)" },
        carree: { steps: ['inhale', 'holdFull', 'exhale', 'holdEmpty'], times: [4000, 4000, 4000, 4000], tip: "La rétention a stabilisé votre flux mental.", exitText: "Je garde cette maîtrise" }
    };

    let currentMode = MODES.equilibre;

    async function requestWakeLock() {
        try {
            if ('wakeLock' in navigator) { wakeLock = await navigator.wakeLock.request('screen'); }
        } catch (err) { console.warn(`Wake Lock: ${err.message}`); }
    }

    function loadStats() {
        const stats = JSON.parse(localStorage.getItem('platypus_stats')) || { totalSeconds: 0, streak: 0, lastDate: null };
        if (stats.lastDate) {
            const last = new Date(stats.lastDate);
            const today = new Date();
            const diffDays = Math.floor((today - last) / (1000 * 60 * 60 * 24));
            if (diffDays > 1) stats.streak = 0; 
        }
        if (minutesDisplay) minutesDisplay.innerText = Math.floor(stats.totalSeconds / 60);
        if (streakDisplay) streakDisplay.innerText = stats.streak;
        return stats;
    }

    function saveStats(duration) {
        let stats = loadStats();
        const today = new Date().toDateString();
        stats.totalSeconds += duration;
        if (stats.lastDate !== today) { stats.streak += 1; stats.lastDate = today; }
        localStorage.setItem('platypus_stats', JSON.stringify(stats));
        loadStats();
    }

    function initAudio() {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') audioCtx.resume();
    }

    function playEndSound() {
        if (!audioCtx) return;
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        osc.type = 'sine'; 
        osc.frequency.setValueAtTime(432, audioCtx.currentTime); 
        gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.8, audioCtx.currentTime + 0.1); 
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 4); 
        osc.start(audioCtx.currentTime);
        osc.stop(audioCtx.currentTime + 4);
    }

    function triggerVibration(type) {
        if (!('vibrate' in navigator)) return; 
        if (type === 'inhale' || type === 'exhale') navigator.vibrate(30);
        else if (type === 'hold') navigator.vibrate([20, 50, 20]);
        else if (type === 'end') navigator.vibrate([200, 100, 200]);
    }

    function switchView(viewName) {
        Object.values(views).forEach(v => { if(v) v.classList.remove('active'); });
        if(views[viewName]) views[viewName].classList.add('active');
    }

    function updateCycle() {
        if (!isActive) return;
        const step = currentMode.steps[currentStepIndex];
        const duration = currentMode.times[currentStepIndex];
        clearInterval(holdInterval);
        circle.classList.remove('apnea-active');
        circle.style.transition = `transform ${duration}ms cubic-bezier(0.4, 0, 0.6, 1)`;

        if (step === 'inhale' || step === 'exhale') {
            triggerVibration(step);
            holdTimer.classList.remove('visible');
            if (step === 'inhale') { circle.style.transform = "scale(4.2)"; statusText.innerText = "Inspiration..."; }
            else { circle.style.transform = "scale(1)"; statusText.innerText = "Expiration..."; }
        } else { 
            triggerVibration('hold');
            statusText.innerText = "Bloquez";
            circle.classList.add('apnea-active');
            let sec = duration / 1000; holdTimer.innerText = sec; holdTimer.classList.add('visible');
            holdInterval = setInterval(() => { sec--; if (sec > 0) holdTimer.innerText = sec; }, 1000);
        }
        currentStepIndex = (currentStepIndex + 1) % currentMode.steps.length;
        timeoutId = setTimeout(updateCycle, duration);
    }

    async function startSession() {
        initAudio(); 
        await requestWakeLock(); 
        isActive = true; 
        currentStepIndex = 0;
        let timeRemaining = selectedDuration;
        document.body.classList.add('session-mode');
        statusText.classList.remove('text-hidden');
        instructionTimeout = setTimeout(() => { if(isActive) statusText.classList.add('text-hidden'); }, 30000);
        switchView('session');
        setTimeout(() => {
            if(!isActive) return; 
            updateCycle();
            intervalId = setInterval(() => {
                timeRemaining--;
                const m = Math.floor(timeRemaining / 60).toString().padStart(2, '0');
                const s = (timeRemaining % 60).toString().padStart(2, '0');
                if(timeLeftDisplay) timeLeftDisplay.innerText = `${m}:${s}`;
                if(progressFill) progressFill.style.width = `${((selectedDuration - timeRemaining) / selectedDuration) * 100}%`;
                if (timeRemaining <= 0) endSession(true);
            }, 1000);
        }, 1000);
    }

    function endSession(completed) {
        isActive = false;
        clearTimeout(timeoutId); 
        clearTimeout(instructionTimeout);
        clearInterval(intervalId); 
        clearInterval(holdInterval);
        if (statusText) statusText.innerText = ""; 
        if (wakeLock) { wakeLock.release().then(() => wakeLock = null).catch(()=>{}); }
        document.body.classList.remove('session-mode');
        if (statusText) statusText.classList.remove('text-hidden');
        if (circle) circle.style.transform = "scale(1)";
        if (holdTimer) holdTimer.classList.remove('visible');

        if (completed) {
            saveStats(selectedDuration); 
            triggerVibration('end'); 
            playEndSound();
            if (coachingTip) coachingTip.innerText = currentMode.tip; 
            const exitBtnElement = document.getElementById('btn-exit');
            if (exitBtnElement) exitBtnElement.innerText = currentMode.exitText;
            switchView('end');
        } else {
            if (statusText) statusText.innerText = "Que recherchez-vous ?";
            switchView('modes');
        }
    }

    loadStats();
    document.querySelectorAll('#view-modes .card').forEach(c => {
        c.addEventListener('click', () => {
            currentMode = MODES[c.dataset.mode];
            statusText.innerText = "Quelle durée ?";
            switchView('duration');
        });
    });
    document.querySelectorAll('#view-duration .card').forEach(c => {
        c.addEventListener('click', () => {
            selectedDuration = parseInt(c.dataset.duration);
            startSession();
        });
    });
    document.getElementById('btn-back-modes').addEventListener('click', () => {
        statusText.innerText = "Que recherchez-vous ?";
        switchView('modes');
    });
    document.getElementById('btn-stop').addEventListener('click', () => endSession(false));
    document.getElementById('btn-restart').addEventListener('click', () => { 
        statusText.innerText = "Que recherchez-vous ?";
        switchView('modes'); 
    });
    const finalExitBtn = document.getElementById('btn-exit');
    if (finalExitBtn) {
        finalExitBtn.addEventListener('click', () => {
            statusText.innerText = "Que recherchez-vous ?";
            switchView('modes');
            if (window.history.length <= 1) { window.close(); }
        });
    }
});
