document.addEventListener('DOMContentLoaded', () => {
    // 1. Éléments du DOM
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
    
    // 2. Configuration de l'anneau SVG (apnées)
    const radius = holdRing.r.baseVal.value;
    const circumference = 2 * Math.PI * radius;
    holdRing.style.strokeDasharray = `${circumference} ${circumference}`;
    holdRing.style.strokeDashoffset = circumference;

    // 3. État de l'application
    let isActive = false;
    let timeoutId = null;
    let intervalId = null;
    let wakeLock = null;
    let currentStepIndex = 0;
    let selectedDuration = 180;

    const MODES = {
        equilibre: { 
            steps: ['inhale', 'exhale'], 
            times: [5000, 5000], 
            label: "Cohérence Cardiaque", 
            tip: "Votre système nerveux est réinitialisé. Vous pouvez reprendre le cours de votre journée avec clarté." 
        },
        calme: { 
            steps: ['inhale', 'exhale'], 
            times: [4000, 6000], 
            label: "Retour au calme", 
            tip: "Le calme est revenu. Prenez un instant pour mémoriser cette sensation de relâchement." 
        },
        sommeil: { 
            steps: ['inhale', 'exhale'], 
            times: [4000, 8000], 
            label: "Sommeil profond", 
            tip: "Votre corps est prêt pour le repos. Laissez cette douceur vous accompagner vers une nuit paisible." 
        },
        focus: { 
            steps: ['inhale', 'exhale'], 
            times: [6000, 4000], 
            label: "Focus & Énergie", 
            tip: "Votre esprit est vif et oxygéné. Utilisez cette belle énergie pour votre prochaine action." 
        },
        carree: { 
            steps: ['inhale', 'holdFull', 'exhale', 'holdEmpty'], 
            times: [4000, 4000, 4000, 4000], 
            label: "Respiration Carrée", 
            tip: "Vous avez repris le contrôle. Profitez de cette lucidité mentale totale pour la suite." 
        }
    };

    let currentMode = MODES.equilibre;

    // 4. Utilitaires de navigation
    function switchView(viewName) {
        Object.values(views).forEach(view => view.classList.remove('active'));
        views[viewName].classList.add('active');
    }

    async function requestWakeLock() {
        try { if ('wakeLock' in navigator) wakeLock = await navigator.wakeLock.request('screen'); } 
        catch (err) { console.warn("WakeLock non supporté"); }
    }

    // 5. Moteur d'animation (Le cœur du centrage)
    function updateCycle() {
        if (!isActive) return;
        const step = currentMode.steps[currentStepIndex];
        const duration = currentMode.times[currentStepIndex];

        // On applique les transitions. Notez le centrage forcé par translate(-50%, -50%)
        circle.style.transition = `transform ${duration}ms cubic-bezier(0.4, 0, 0.6, 1)`;

        if (step === 'inhale' || step === 'exhale') {
            // Phases de mouvement : on vide l'anneau
            holdRing.style.transition = 'stroke-dashoffset 0.5s ease-out, opacity 0.5s';
            holdRing.style.strokeDashoffset = circumference; 
            holdRing.style.opacity = "0.1"; 

            if (step === 'inhale') {
                circle.style.transform = "translate(-50%, -50%) scale(4.2)";
                statusText.innerText = "Inspiration...";
            } else {
                circle.style.transform = "translate(-50%, -50%) scale(1)";
                statusText.innerText = "Expiration...";
            }
        } 
        else if (step === 'holdFull' || step === 'holdEmpty') {
            // Phases d'apnée : on remplit l'anneau
            statusText.innerText = "Bloquez";
            holdRing.style.opacity = "1"; 
            holdRing.style.transition = `stroke-dashoffset ${duration}ms linear`;
            holdRing.style.strokeDashoffset = 0; 
        }

        currentStepIndex = (currentStepIndex + 1) % currentMode.steps.length;
        timeoutId = setTimeout(updateCycle, duration);
    }

    // 6. Gestion de la Session
    function startSession() {
        isActive = true;
        currentStepIndex = 0;
        let timeRemaining = selectedDuration;
        
        statusText.innerText = currentMode.label;
        switchView('session');
        requestWakeLock();
        
        setTimeout(() => {
            if(!isActive) return;
            updateCycle();
            
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
        clearTimeout(timeoutId);
        clearInterval(intervalId);
        if (wakeLock) wakeLock.release().then(() => wakeLock = null);

        // Reset visuel avec maintien du centrage
        circle.style.transition = "transform 1.5s ease-out";
        circle.style.transform = "translate(-50%, -50%) scale(1)";
        holdRing.style.transition = "opacity 1s";
        holdRing.style.opacity = "0";

        if (completed) {
            statusText.innerText = "Séance terminée";
            coachingTip.innerText = currentMode.tip;
            switchView('end');
        } else {
            statusText.innerText = "Que recherchez-vous ?";
            switchView('modes');
        }
    }

    // 7. Écouteurs d'événements
    document.querySelectorAll('#view-modes .card').forEach(card => {
        card.addEventListener('click', () => {
            currentMode = MODES[card.dataset.mode];
            statusText.innerText = "Combien de temps ?";
            switchView('duration');
        });
    });

    document.querySelectorAll('#view-duration .card').forEach(card => {
        card.addEventListener('click', () => {
            selectedDuration = parseInt(card.dataset.duration);
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
});
