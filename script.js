const circle = document.getElementById('guide-circle');
const instruction = document.getElementById('instruction');
const statusText = document.getElementById('status');
const btn = document.getElementById('main-btn');

let isActive = false;
let timeoutId = null;

function updateCycle(phase) {
    if (!isActive) return;

    if (phase === 'inhale') {
        instruction.innerText = "Inspirez";
        circle.style.transform = "scale(4)";
        statusText.innerText = "L'air entre doucement...";
        
        timeoutId = setTimeout(() => updateCycle('exhale'), 5000);
    } else {
        instruction.innerText = "Expirez";
        circle.style.transform = "scale(1)";
        statusText.innerText = "Relâchez les tensions...";
        
        timeoutId = setTimeout(() => updateCycle('inhale'), 5000);
    }
}

function stopSession() {
    isActive = false;
    clearTimeout(timeoutId); // Arrête le cycle en cours immédiatement
    circle.style.transform = "scale(1)";
    instruction.innerText = "Démarrer";
    statusText.innerText = "Session interrompue";
    btn.innerText = "Recommencer";
    btn.style.background = "var(--accent-color)";
}

function startSession() {
    isActive = true;
    btn.innerText = "Arrêter la séance";
    btn.style.background = "#ef4444"; // Rouge pour l'arrêt
    updateCycle('inhale');
}

btn.addEventListener('click', () => {
    if (isActive) {
        stopSession();
    } else {
        startSession();
    }
});

// Enregistrement du Service Worker (pour le PWA)
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js');
}
