document.addEventListener('DOMContentLoaded', () => {
    // 1. Éléments du DOM
    const views = {
        modes: document.getElementById('view-modes'),
        duration: document.getElementById('view-duration'),
        session: document.getElementById('view-session'),
        end: document.getElementById('view-end')
    };
    
    const circle = document.getElementById('guide-circle');
    const statusText = document.getElementById('status');
    const progressFill = document.getElementById('progress-fill');
    const timeLeftDisplay = document.getElementById('time-left');
    const coachingTip = document.getElementById('coaching-tip');
    
    // 2. Boutons et Cartes
    const modeCards = document.querySelectorAll('#view-modes .card');
    const durationCards = document.querySelectorAll('#view-duration .card');
    const btnBackModes = document.getElementById('btn-back-modes');
    const btnStop = document.getElementById('btn-stop');
    const btnRestart = document.getElementById('btn-restart');

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
            tip: "Votre esprit est vif et oxygéné. Utilisez cette belle énergie pour votre prochaine action clé." 
        },
        carree: { 
            steps: ['inhale', 'holdFull', 'exhale', 'holdEmpty'], 
            times: [4000, 4000, 4000, 4000], 
            label: "Respiration Carrée", 
            tip: "Vous avez repris le contrôle. Profitez de cette lucidité mentale totale pour la suite." 
        }
    };

    let currentMode = MODES.equilibre;

    // 4. Utilitaires
    function switchView(viewName) {
        Object.values(views).forEach(view => view.classList.remove('active'));
        views[viewName].classList.add('active');
    }

    function formatTime(seconds) {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    }

    async function requestWakeLock() {
        try { if ('wakeLock' in navigator) wakeLock = await navigator.wakeLock.request('screen'); } 
        catch (err) { console.warn("WakeLock non supporté"); }
    }

    // 5. Logique de Respiration (Moteur d'animation)
    function updateCycle() {
        if (!isActive) return;
        const step = currentMode.steps[currentStepIndex];
        const duration = currentMode.times[currentStepIndex];

        // Transition combinée pour la taille (transform) et la transparence (opacity)
        circle.style.transition = `transform ${duration}ms cubic-bezier(0.4, 0, 0.6, 1), opacity ${duration}ms linear`;

        if (step === 'inhale') { 
            circle.style.transform = "scale(4.5)"; 
            circle.style.opacity = "1";
            statusText.innerText = "Inspiration..."; 
        } else if (step === 'holdFull') { 
            circle.style.opacity = "0.3"; // S'estompe pour indiquer la durée de l'apnée pleine
            statusText.innerText = "Bloquez"; 
        } else if (step === 'exhale') { 
            circle.style.transform = "scale(1)"; 
            circle.style.opacity = "1";
            statusText.innerText = "Expiration..."; 
        } else if (step === 'holdEmpty') { 
            circle.style.opacity = "0.3"; // S'estompe pour indiquer la durée de l'apnée vide
            statusText.innerText = "Bloquez"; 
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
        timeLeftDisplay.innerText = formatTime(timeRemaining);
        progressFill.style.width = "0%";
        
        switchView('session');
        requestWakeLock();
        
        // Délai de préparation avant le premier cycle
        setTimeout(() => {
            if(!isActive) return;
            updateCycle();
            
            intervalId = setInterval(() => {
                timeRemaining--;
                timeLeftDisplay.innerText = formatTime(timeRemaining);
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

        // Reset visuel du guide
        circle.style.transition = "transform 1.5s ease-out, opacity 1.5s ease-out";
        circle.style.transform = "scale(1)";
        circle.style.opacity = "1";

        if (completed) {
            statusText.innerText = "Séance terminée";
            coachingTip.innerText = currentMode.tip;
            switchView('end');
        } else {
            statusText.innerText = "Que recherchez-vous ?";
            switchView('modes');
        }
    }

    // 7. Événements de Navigation
    modeCards.forEach(card => {
        card.addEventListener('click', () => {
            currentMode = MODES[card.dataset.mode];
            statusText.innerText = "Combien de temps ?";
            switchView('duration');
        });
    });

    durationCards.forEach(card => {
        card.addEventListener('click', () => {
            selectedDuration = parseInt(card.dataset.duration);
            startSession();
        });
    });

    btnBackModes.addEventListener('click', () => {
        statusText.innerText = "Que recherchez-vous ?";
        switchView('modes');
    });

    btnStop.addEventListener('click', () => endSession(false));

    btnRestart.addEventListener('click', () => {
        statusText.innerText = "Que recherchez-vous ?";
        switchView('modes');
    });
});
