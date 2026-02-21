const circle = document.getElementById('guide-circle');
const instruction = document.getElementById('instruction');
const btn = document.getElementById('start-btn');

let isActive = false;

function breathCycle() {
    if (!isActive) return;

    // Inspiration
    instruction.innerText = "Inspirez...";
    circle.className = "inhale";
    
    setTimeout(() => {
        if (!isActive) return;
        // Expiration
        instruction.innerText = "Expirez...";
        circle.className = "exhale";
        
        setTimeout(breathCycle, 5000); // Relance le cycle après 5s
    }, 5000);
}

btn.addEventListener('click', () => {
    isActive = !isActive;
    btn.innerText = isActive ? "Arrêter" : "Démarrer (5 min)";
    if (isActive) breathCycle();
});