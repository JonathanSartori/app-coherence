document.addEventListener('DOMContentLoaded', () => {
    const views = {
        modes: document.getElementById('view-modes'),
        duration: document.getElementById('view-duration'),
        session: document.getElementById('view-session'),
        end: document.getElementById('view-end')
    };
    const circle = document.getElementById('guide-circle');
    const holdRing = document.getElementById('hold-ring');
    const statusText = document.getElementById('status');
    const progressFill = document.getElementById('progress-fill');
    const timeLeftDisplay = document.getElementById('time-left');
    const coachingTip = document.getElementById('coaching-tip');

    // Setup Anneau SVG
    const radius = holdRing.r.baseVal.value;
    const circumference = 2 * Math.PI * radius;
    holdRing.style.strokeDasharray = `${circumference} ${circumference}`;
    holdRing.style.strokeDashoffset = circumference;

    let isActive = false, timeoutId = null, intervalId = null, wakeLock = null;
    let currentStepIndex = 0, selectedDuration = 180;

    const MODES = {
        equilibre: { steps: ['inhale', 'exhale'], times: [5000, 5000], label: "Cohérence Cardiaque", tip: "Votre système nerveux est réinitialisé. Vous pouvez reprendre le cours de votre journée avec clarté." },
        calme: { steps: ['inhale', 'exhale'], times: [4000, 6000], label: "Retour au calme", tip: "Le calme est revenu. Prenez un instant pour mémoriser cette sensation de relâchement." },
        sommeil: { steps: ['inhale', 'exhale'], times: [4000, 8000], label: "Sommeil profond", tip: "Votre corps est prêt pour le repos. Laissez cette douceur vous accompagner." },
        focus: { steps: ['inhale', 'exhale'], times: [6000, 4000], label: "Focus & Énergie", tip: "Votre esprit est vif et oxygéné. Utilisez cette belle énergie pour votre prochaine action." },
        carree: { steps: ['inhale', 'holdFull', 'exhale', 'holdEmpty'], times: [4000, 4000, 4000, 4000], label: "Respiration Carrée", tip: "Vous avez repris le contrôle. Profitez de cette lucidité mentale totale." }
    };

    let currentMode = MODES.equilibre;

    function switchView(viewName) {
        Object.values(views).forEach(v => v.classList.remove('active'));
        views[viewName].classList.add('active');
    }

    async function requestWakeLock() {
        try { if ('wakeLock' in navigator) wakeLock = await navigator.wakeLock.request('screen'); } catch (e) {}
    }

    function updateCycle() {
        if (!isActive) return;
        const step = currentMode.steps[currentStepIndex];
        const duration = currentMode.times[currentStepIndex];

        circle.style.transition = `transform ${duration}ms cubic-bezier(0.4, 0, 0.6, 1)`;

        if (step === 'inhale' || step === 'exhale') {
            holdRing.style.transition = 'stroke-dashoffset 0.5s ease-out, opacity 0.5s';
            holdRing.style.strokeDashoffset = circumference; 
            holdRing.style.opacity = "0.1"; 
            if (step === 'inhale') { circle.style.transform = "scale(4.2)"; statusText.innerText = "Inspiration..."; }
            else { circle.style.transform = "scale(1)"; statusText.innerText = "Expiration..."; }
        } 
        else { // holdFull ou holdEmpty
            statusText.innerText = "Bloquez";
            holdRing.style.opacity = "1"; 
            holdRing.style.transition = `stroke-dashoffset ${duration}ms linear`;
            holdRing.style.strokeDashoffset = 0; 
        }

        currentStepIndex = (currentStepIndex + 1) % currentMode.steps.length;
        timeoutId = setTimeout(updateCycle, duration);
    }

    function startSession() {
        isActive = true; currentStepIndex = 0;
        let timeRemaining = selectedDuration;
        switchView('session'); requestWakeLock();
        setTimeout(() => {
            if(!isActive) return; updateCycle();
            intervalId = setInterval(() => {
                timeRemaining--;
                timeLeftDisplay.innerText = `${Math.floor(timeRemaining / 60).toString().padStart(2, '0')}:${(timeRemaining % 60).toString().padStart(2, '0')}`;
                progressFill.style.width = `${((selectedDuration - timeRemaining) / selectedDuration) * 100}%`;
                if (timeRemaining <= 0) endSession(true);
            }, 1000);
        }, 1000);
    }

    function endSession(completed) {
        isActive = false; clearTimeout(timeoutId); clearInterval(intervalId);
        if (wakeLock) wakeLock.release().then(() => wakeLock = null);
        circle.style.transform = "scale(1)"; holdRing.style.opacity = "0";
        if (completed) { coachingTip.innerText = currentMode.tip; switchView('end'); statusText.innerText = "Bravo"; }
        else { switchView('modes'); statusText.innerText = "Que recherchez-vous ?"; }
    }

    document.querySelectorAll('#view-modes .card').forEach(c => c.addEventListener('click', () => { currentMode = MODES[c.dataset.mode]; switchView('duration'); statusText.innerText = "Combien de temps ?"; }));
    document.querySelectorAll('#view-duration .card').forEach(c => c.addEventListener('click', () => { selectedDuration = parseInt(c.dataset.duration); startSession(); }));
    document.getElementById('btn-back-modes').addEventListener('click', () => switchView('modes'));
    document.getElementById('btn-stop').addEventListener('click', () => endSession(false));
    document.getElementById('btn-restart').addEventListener('click', () => { switchView('modes'); statusText.innerText = "Que recherchez-vous ?"; });
});
