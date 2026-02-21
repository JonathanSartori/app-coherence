const circle = document.getElementById('guide-circle');
const statusText = document.getElementById('status');
const btn = document.getElementById('main-btn');

let isActive = false;
let timeoutId = null;

function updateCycle(phase) {
    if (!isActive) return;

    if (phase === 'inhale') {
        circle.style.transform = "scale(4.5)";
        statusText.innerText = "Inspiration";
        timeoutId = setTimeout(() => updateCycle('exhale'), 5000);
    } else {
        circle.style.transform = "scale(1)";
        statusText.innerText = "Expiration";
        timeoutId = setTimeout(() => updateCycle('inhale'), 5000);
    }
}

function stopSession() {
    isActive = false;
    clearTimeout(timeoutId);
    circle.style.transform = "scale(1)";
    statusText.innerText = "Cohérence Cardiaque";
    btn.innerText = "Démarrer la séance";
    btn.classList.remove('active');
}

function startSession() {
    isActive = true;
    btn.innerText = "Arrêter";
    btn.classList.add('active');
    updateCycle('inhale');
}

btn.addEventListener('click', () => {
    if (isActive) {
        stopSession();
    } else {
        startSession();
    }
});
