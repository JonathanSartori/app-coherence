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

    let isActive = false, timeoutId = null, intervalId = null, holdInterval = null;
    let currentStepIndex = 0, selectedDuration = 180;

    const MODES = {
        equilibre: { steps: ['inhale', 'exhale'], times: [5000, 5000], label: "Cohérence Cardiaque", tip: "Système nerveux réinitialisé. Calme retrouvé." },
        calme: { steps: ['inhale', 'exhale'], times: [4000, 6000], label: "Retour au calme", tip: "Tensions évacuées. Gardez ce relâchement." },
        sommeil: { steps: ['inhale', 'exhale'], times: [4000, 8000], label: "Sommeil profond", tip: "Prêt pour le repos. Bonne nuit." },
        focus: { steps: ['inhale', 'exhale'], times: [6000, 4000], label: "Focus & Énergie", tip: "Esprit vif. Passez à l'action !" },
        carree: { steps: ['inhale', 'holdFull', 'exhale', 'holdEmpty'], times: [4000, 4000, 4000, 4000], label: "Respiration Carrée", tip: "Maîtrise totale. Lucidité maximale." }
    };

    let currentMode = MODES.equilibre;

    function switchView(viewName) {
        Object.values(views).forEach(v => v.classList.remove('active'));
        views[viewName].classList.add('active');
    }

    function updateCycle() {
        if (!isActive) return;
        const step = currentMode.steps[currentStepIndex];
        const duration = currentMode.times[currentStepIndex];

        holdTimer.innerText = "";
        circle.classList.remove('apnea-active');
        clearInterval(holdInterval);

        circle.style.transition = `transform ${duration}ms cubic-bezier(0.4, 0, 0.6, 1)`;

        if (step === 'inhale' || step === 'exhale') {
            if (step === 'inhale') {
                circle.style.transform = "scale(4.2)";
                statusText.innerText = "Inspiration...";
            } else {
                circle.style.transform = "scale(1)";
                statusText.innerText = "Expiration...";
            }
        } 
        else { // Apnées
            statusText.innerText = "Bloquez";
            circle.classList.add('apnea-active');
            let secondsLeft = duration / 1000;
            holdTimer.innerText = secondsLeft;
            holdInterval = setInterval(() => {
                secondsLeft--;
                if (secondsLeft > 0) holdTimer.innerText = secondsLeft;
                else clearInterval(holdInterval);
            }, 1000);
        }

        currentStepIndex = (currentStepIndex + 1) % currentMode.steps.length;
        timeoutId = setTimeout(updateCycle, duration);
    }

    function startSession() {
        isActive = true; currentStepIndex = 0;
        let timeRemaining = selectedDuration;
        switchView('session');
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
        isActive = false; clearTimeout(timeoutId); clearInterval(intervalId); clearInterval(holdInterval);
        circle.style.transform = "scale(1)"; holdTimer.innerText = "";
        if (completed) { coachingTip.innerText = currentMode.tip; switchView('end'); }
        else { switchView('modes'); statusText.innerText = "Que recherchez-vous ?"; }
    }

    document.querySelectorAll('#view-modes .card').forEach(c => c.addEventListener('click', () => { currentMode = MODES[c.dataset.mode]; switchView('duration'); statusText.innerText = "Durée ?"; }));
    document.querySelectorAll('#view-duration .card').forEach(c => c.addEventListener('click', () => { selectedDuration = parseInt(c.dataset.duration); startSession(); }));
    document.getElementById('btn-back-modes').addEventListener('click', () => switchView('modes'));
    document.getElementById('btn-stop').addEventListener('click', () => endSession(false));
    document.getElementById('btn-restart').addEventListener('click', () => { switchView('modes'); statusText.innerText = "Que recherchez-vous ?"; });
});
