const circle = document.getElementById('guide-circle');
const statusText = document.getElementById('status');
const btn = document.getElementById('main-btn');
const modeBtns = document.querySelectorAll('.mode-btn');
const durationSelect = document.getElementById('duration-select');
const setupZone = document.getElementById('setup-zone');
const progressZone = document.getElementById('progress-zone');
const progressFill = document.getElementById('progress-fill');
const timeLeftDisplay = document.getElementById('time-left');
const coachingTip = document.getElementById('coaching-tip');

let isActive = false;
let timeoutId = null;
let intervalId = null;
let wakeLock = null;
let totalTime = 0;
let timeRemaining = 0;
let currentStepIndex = 0;

const MODES = {
    equilibre: { 
        steps: ['inhale', 'exhale'], times: [5000, 5000], label: "Équilibre",
        tip: "Votre système nerveux est réinitialisé. Vous êtes prêt(e) à aborder la suite avec clarté et ancrage."
    },
    calme: { 
        steps: ['inhale', 'exhale'], times: [4000, 6000], label: "Retour au calme",
        tip: "Le calme est revenu. Gardez cette sensation de relâchement dans vos épaules pour les prochaines heures."
    },
    sommeil: { 
        steps: ['inhale', 'exhale'], times: [4000, 8000], label: "Sommeil",
        tip: "Votre corps est prêt pour le repos. Laissez cette douceur vous accompagner vers un sommeil profond."
    },
    focus: { 
        steps: ['inhale', 'exhale'], times: [6000, 4000], label: "Focus",
        tip: "Votre esprit est vif et oxygéné. Utilisez cette belle énergie pour votre prochaine action clé."
    },
    carree: { 
        steps: ['inhale', 'holdFull', 'exhale', 'holdEmpty'], times: [4000, 4000, 4000, 4000], label: "Carrée",
        tip: "Vous avez repris le contrôle. Votre métabolisme est stabilisé, votre mental est d'une lucidité totale."
    }
};

let currentMode = MODES.equilibre;

// Formatage du temps (ex: 180 -> "03:00")
function formatTime(seconds) {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}

async function requestWakeLock() {
    try {
        if ('wakeLock' in navigator) wakeLock = await navigator.wakeLock.request('screen');
    } catch (err) { console.error(err); }
}

function updateCycle() {
    if (!isActive) return;

    const step = currentMode.steps[currentStepIndex];
    const duration = currentMode.times[currentStepIndex];

    circle.style.transition = `transform ${duration}ms cubic-bezier(0.4, 0, 0.6, 1)`;

    if (step === 'inhale') {
        circle.style.transform = "scale(4.5)";
        statusText.innerText = "Inspiration";
    } else if (step === 'holdFull') {
        statusText.innerText = "Bloquez (plein)";
    } else if (step === 'exhale') {
        circle.style.transform = "scale(1)";
        statusText.innerText = "Expiration";
    } else if (step === 'holdEmpty') {
        statusText.innerText = "Bloquez (vide)";
    }

    currentStepIndex = (currentStepIndex + 1) % currentMode.steps.length;
    timeoutId = setTimeout(updateCycle, duration);
}

function endSession(completed = false) {
    isActive = false;
    clearTimeout(timeoutId);
    clearInterval(intervalId);
    
    if (wakeLock !== null) {
        wakeLock.release();
        wakeLock = null;
    }

    // Réinitialisation visuelle
    circle.style.transition = "transform 2s ease-out";
    circle.style.transform = "scale(1)";
    progressZone.classList.add('hidden');
    
    if (completed) {
        statusText.innerText = "Séance terminée";
        coachingTip.innerText = currentMode.tip;
        coachingTip.classList.remove('hidden');
        btn.innerText = "Nouvelle séance";
    } else {
        setupZone.classList.remove('hidden');
        statusText.innerText = "Sélectionnez votre mode";
        btn.innerText = "Démarrer la séance";
    }
    
    btn.classList.remove('active');
}

function startSession() {
    isActive = true;
    currentStepIndex = 0;
    totalTime = parseInt(durationSelect.value);
    timeRemaining = totalTime;

    // Mise à jour de l'interface
    setupZone.classList.add('hidden');
    coachingTip.classList.add('hidden');
    progressZone.classList.remove('hidden');
    timeLeftDisplay.innerText = formatTime(timeRemaining);
    progressFill.style.width = "0%";
    
    btn.innerText = "Interrompre";
    btn.classList.add('active');
    
    requestWakeLock();
    updateCycle();

    // Gestion du minuteur global
    intervalId = setInterval(() => {
        timeRemaining--;
        timeLeftDisplay.innerText = formatTime(timeRemaining);
        
        const progressPercent = ((totalTime - timeRemaining) / totalTime) * 100;
        progressFill.style.width = `${progressPercent}%`;

        if (timeRemaining <= 0) {
            endSession(true); // Terminé avec succès
        }
    }, 1000);
}

// Gestion des boutons
modeBtns.forEach(button => {
    button.addEventListener('click', () => {
        modeBtns.forEach(b => b.classList.remove('active'));
        button.classList.add('active');
        currentMode = MODES[button.dataset.mode];
    });
});

btn.addEventListener('click', () => {
    if (isActive) {
        endSession(false); // Interrompu par l'utilisateur
    } else {
        // Si on relance après une fin de séance, on réaffiche les réglages
        if (coachingTip.classList.contains('hidden') === false) {
            coachingTip.classList.add('hidden');
            setupZone.classList.remove('hidden');
            statusText.innerText = "Sélectionnez votre mode";
            btn.innerText = "Démarrer la séance";
        } else {
            startSession();
        }
    }
});
