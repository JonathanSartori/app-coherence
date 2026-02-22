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

    let isActive = false;
    let timeoutId = null;
    let intervalId = null;
    let holdInterval = null;
    let fadeTimeout = null;
    let wakeLock = null;
    let currentStepIndex = 0;
    let selectedDuration = 180;
    let audioCtx = null; // Contexte audio pour le son de fin

    const MODES = {
        equilibre: { steps: ['inhale', 'exhale'], times: [5000, 5000], label: "Cohérence Cardiaque", tip: "Système nerveux réinitialisé. Calme retrouvé." },
        calme: { steps: ['inhale', 'exhale'], times: [4000, 6000], label: "Retour au calme", tip: "Tensions évacuées. Gardez ce relâchement." },
        sommeil: { steps: ['inhale', 'exhale'], times: [4000, 8000], label: "Sommeil profond", tip: "Prêt pour le repos. Bonne nuit." },
        focus: { steps: ['inhale', 'exhale'], times: [6000, 4000], label: "Focus & Énergie", tip: "Esprit vif. Passez à l'action !" },
        carree: { steps: ['inhale', 'holdFull', 'exhale', 'holdEmpty'], times: [4000, 4000, 4000, 4000], label: "Respiration Carrée", tip: "Maîtrise totale. Lucidité maximale." }
    };

    let currentMode = MODES.equilibre;

    // --- NOUVEAU : SYSTÈME HAPTIQUE ET AUDIO ---

    // Initialise le moteur audio (obligatoire au clic de l'utilisateur)
    function initAudio() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
    }

    // Synthétise un son de bol tibétain zen (432Hz)
    function playEndSound() {
        if (!audioCtx) return;
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        osc.type = 'sine'; // Onde pure
        osc.frequency.setValueAtTime(432, audioCtx.currentTime); 
        
        // Enveloppe sonore : attaque douce, résonance longue
        gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.8, audioCtx.currentTime + 0.1); 
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 4); 

        osc.start(audioCtx.currentTime);
        osc.stop(audioCtx.currentTime + 4);
    }

    // Gère les vibrations si le téléphone le permet (Android)
    function triggerVibration(type) {
        if (!('vibrate' in navigator)) return; 
        
        if (type === 'inhale' || type === 'exhale') {
            navigator.vibrate(30); // Micro-impulsion unique
        } else if (type === 'hold') {
            navigator.vibrate([20, 50, 20]); // Double micro-impulsion pour l'apnée
        } else if (type === 'end') {
            navigator.vibrate([200, 100, 200]); // Vibration longue de fin
        }
    }

    // --- FIN DU SYSTÈME HAPTIQUE ET AUDIO ---

    function switchView(viewName) {
        Object.values(views).forEach(v => v.classList.remove('active'));
        views[viewName].classList.add('active');
    }

    async function requestWakeLock() {
        try { if ('wakeLock' in navigator) wakeLock = await navigator.wakeLock.request('screen'); } 
        catch (err) {}
    }

    function updateCycle() {
        if (!isActive) return;
        const step = currentMode.steps[currentStepIndex];
        const duration = currentMode.times[currentStepIndex];

        clearTimeout(fadeTimeout);
        clearInterval(holdInterval);
        circle.classList.remove('apnea-active');

        circle.style.transition = `transform ${duration}ms cubic-bezier(0.4, 0, 0.6, 1)`;

        if (step === 'inhale' || step === 'exhale') {
            triggerVibration(step); // <-- VIBRATION DE RESPIRATION
            
            if (holdTimer) {
                holdTimer.classList.remove('visible');
                fadeTimeout = setTimeout(() => { if (holdTimer) holdTimer.innerText = ""; }, 500);
            }

            if (step === 'inhale') {
                circle.style.transform = "scale(4.2)";
                statusText.innerText = "Inspiration...";
            } else {
                circle.style.transform = "scale(1)";
                statusText.innerText = "Expiration...";
            }
        } 
        else { 
            triggerVibration('hold'); // <-- VIBRATION D'APNÉE

            statusText.innerText = "Bloquez";
            circle.classList.add('apnea-active');
            let secondsLeft = duration / 1000;
            
            if (holdTimer) {
                holdTimer.innerText = secondsLeft;
                setTimeout(() => holdTimer.classList.add('visible'), 20);
            }
            
            holdInterval = setInterval(() => {
                secondsLeft--;
                if (secondsLeft > 0) {
                    if (holdTimer) holdTimer.innerText = secondsLeft;
                } else {
                    clearInterval(holdInterval);
                }
            }, 1000);
        }

        currentStepIndex = (currentStepIndex + 1) % currentMode.steps.length;
        timeoutId = setTimeout(updateCycle, duration);
    }

    function startSession() {
        initAudio(); // Débloque le son au moment du clic
        isActive = true; currentStepIndex = 0;
        let timeRemaining = selectedDuration;
        switchView('session');
        requestWakeLock();
        setTimeout(() => {
            if(!isActive) return; updateCycle();
            intervalId = setInterval(() => {
                timeRemaining--;
                const m = Math.floor(timeRemaining / 60).toString().padStart(2, '0');
                const s = (timeRemaining % 60).toString().padStart(2, '0');
                timeLeftDisplay.innerText = `${m}:${s}`;
                progressFill.style.width = `${((selectedDuration - timeRemaining) / selectedDuration) * 100}%`;
                
                if (timeRemaining <= 0) endSession(true);
            }, 1000);
        }, 1000);
    }

    function endSession(completed) {
        isActive = false;
        clearTimeout(timeoutId); clearTimeout(fadeTimeout);
        clearInterval(intervalId); clearInterval(holdInterval);
        if (wakeLock) wakeLock.release().then(() => wakeLock = null);
        
        circle.style.transform = "scale(1)";
        if (holdTimer) { holdTimer.classList.remove('visible'); holdTimer.innerText = ""; }

        if (completed) {
            playEndSound(); // <-- SON DE FIN
            triggerVibration('end'); // <-- VIBRATION DE FIN
            statusText.innerText = "Bravo";
            coachingTip.innerText = currentMode.tip;
            switchView('end');
        } else {
            statusText.innerText = "Que recherchez-vous ?";
            switchView('modes');
        }
    }

    // Navigation
    document.querySelectorAll('#view-modes .card').forEach(c => c.addEventListener('click', () => { currentMode = MODES[c.dataset.mode]; switchView('duration'); statusText.innerText = "Quelle durée ?"; }));
    document.querySelectorAll('#view-duration .card').forEach(c => c.addEventListener('click', () => { selectedDuration = parseInt(c.dataset.duration); startSession(); }));
    document.getElementById('btn-back-modes').addEventListener('click', () => switchView('modes'));
    document.getElementById('btn-stop').addEventListener('click', () => endSession(false));
    document.getElementById('btn-restart').addEventListener('click', () => { switchView('modes'); statusText.innerText = "Que recherchez-vous ?"; });
});
