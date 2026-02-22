document.addEventListener('DOMContentLoaded', () => {
    // 1. Éléments du DOM
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

    // 2. État de l'application
    let isActive = false;
    let timeoutId = null;
    let intervalId = null;
    let holdInterval = null;
    let fadeTimeout = null; // Gère le fondu de sortie du chiffre
    let wakeLock = null;
    let currentStepIndex = 0;
    let selectedDuration = 180;

    const MODES = {
        equilibre: { 
            steps: ['inhale', 'exhale'], 
            times: [5000, 5000], 
            label: "Cohérence Cardiaque", 
            tip: "Système nerveux réinitialisé. Votre calme intérieur est maintenant stabilisé." 
        },
        calme: { 
            steps: ['inhale', 'exhale'], 
            times: [4000, 6000], 
            label: "Retour au calme", 
            tip: "Tensions évacuées. Gardez cette sensation de légèreté avec vous." 
        },
        sommeil: { 
            steps: ['inhale', 'exhale'], 
            times: [4000, 8000], 
            label: "Sommeil profond", 
            tip: "Votre corps est prêt pour le repos. Laissez-vous glisser vers une nuit paisible." 
        },
        focus: { 
            steps: ['inhale', 'exhale'], 
            times: [6000, 4000], 
            label: "Focus & Énergie", 
            tip: "Esprit vif et oxygéné. Vous êtes prêt pour votre prochaine action clé." 
        },
        carree: { 
            steps: ['inhale', 'holdFull', 'exhale', 'holdEmpty'], 
            times: [4000, 4000, 4000, 4000], 
            label: "Respiration Carrée", 
            tip: "Maîtrise totale et lucidité retrouvées. Votre esprit est parfaitement clair." 
        }
    };

    let currentMode = MODES.equilibre;

    // 3. Utilitaires de navigation
    function switchView(viewName) {
        Object.values(views).forEach(v => v.classList.remove('active'));
        views[viewName].classList.add('active');
    }

    async function requestWakeLock() {
        try { if ('wakeLock' in navigator) wakeLock = await navigator.wakeLock.request('screen'); } 
        catch (err) { console.warn("WakeLock non supporté"); }
    }

    // 4. Moteur d'animation avec gestion des fondus
    function updateCycle() {
        if (!isActive) return;
        const step = currentMode.steps[currentStepIndex];
        const duration = currentMode.times[currentStepIndex];

        // Nettoyage immédiat
        clearTimeout(fadeTimeout);
        clearInterval(holdInterval);
        circle.classList.remove('apnea-active');

        circle.style.transition = `transform ${duration}ms cubic-bezier(0.4, 0, 0.6, 1)`;

        if (step === 'inhale' || step === 'exhale') {
            // PHASE ACTIVE : On cache le chiffre en douceur
            if (holdTimer) {
                holdTimer.classList.remove('visible'); 
                // On attend la fin de la transition CSS (500ms) pour vider le texte
                fadeTimeout = setTimeout(() => {
                    if (holdTimer) holdTimer.innerText = "";
                }, 500);
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
            // PHASE D'APNÉE : On affiche le chiffre en douceur
            statusText.innerText = "Bloquez";
            circle.classList.add('apnea-active');
            let secondsLeft = duration / 1000;
            
            if (holdTimer) {
                holdTimer.innerText = secondsLeft;
                // Petit délai pour déclencher la transition d'opacité CSS
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

    // 5. Gestion de la Session
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
        clearTimeout(fadeTimeout);
        clearInterval(intervalId);
        clearInterval(holdInterval);
        
        if (wakeLock) wakeLock.release().then(() => wakeLock = null);

        // Reset visuel
        circle.style.transition = "transform 1.5s ease-out";
        circle.style.transform = "scale(1)";
        if (holdTimer) {
            holdTimer.classList.remove('visible');
            holdTimer.innerText = "";
        }

        if (completed) {
            statusText.innerText = "Bravo";
            coachingTip.innerText = currentMode.tip;
            switchView('end');
        } else {
            statusText.innerText = "Que recherchez-vous ?";
            switchView('modes');
        }
    }

    // 6. Écouteurs d'événements
    document.querySelectorAll('#view-modes .card').forEach(card => {
        card.addEventListener('click', () => {
            currentMode = MODES[card.dataset.mode];
            statusText.innerText = "Quelle durée ?";
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
