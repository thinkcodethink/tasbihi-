document.addEventListener("DOMContentLoaded", async () => {
    // Initialize Telegram Web App
    const tg = window.Telegram.WebApp;
    tg.expand(); // Expand the app to full height

    // Check Premium Status Securely
    if (tg.initData) {
        try {
            const res = await fetch('/api/check-premium', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ initData: tg.initData })
            });
            const data = await res.json();
            if (data.premium) {
                document.body.classList.add("premium");
                const pBtn = document.getElementById("premium-btn");
                if (pBtn) pBtn.style.display = "none";
            }
        } catch (e) {
            console.error("Failed to check premium status", e);
        }
    }

    // Add a close button to exit the app
    const closeButton = document.createElement("button");
    closeButton.textContent = "Close";
    closeButton.style.backgroundColor = "#007BFF";
    closeButton.style.color = "white";
    closeButton.style.marginTop = "10px";
    closeButton.style.padding = "10px 20px";
    closeButton.style.border = "none";
    closeButton.style.borderRadius = "5px";
    closeButton.style.cursor = "pointer";

    closeButton.addEventListener("click", () => {
        tg.close(); // Close the Telegram Mini App
    });

    document.querySelector(".container").appendChild(closeButton);

    // Audio Context for sound synthesis
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    let audioCtx;

    let soundEnabled = localStorage.getItem('tasbih_sound') !== 'false';

    function playClickSound() {
        if (!soundEnabled) return;
        if (!audioCtx) audioCtx = new AudioContext();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(600, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.05);
        gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.05);
    }

    function playChimeSound() {
        if (!soundEnabled) return;
        if (!audioCtx) audioCtx = new AudioContext();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(400, audioCtx.currentTime + 0.5);
        gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.5);
    }

    // Counter logic
    let count = parseInt(localStorage.getItem('tasbih_count')) || 0;
    let targetCount = null;
    let savedType = localStorage.getItem('tasbih_type') || 'custom';

    const counterDisplay = document.getElementById("counter");
    const targetDisplay = document.getElementById("target-display");
    const counterWrapper = document.querySelector(".counter-wrapper");
    const incrementBtn = document.getElementById("increment-btn");
    const resetBtn = document.getElementById("reset-btn");
    const tasbihTypeSelect = document.getElementById("tasbih-type");
    const progressCircle = document.querySelector('.progress-ring__circle');
    const soundToggleBtn = document.getElementById('sound-toggle');
    const soundIconOn = document.getElementById('sound-icon-on');
    const soundIconOff = document.getElementById('sound-icon-off');

    // Progress Ring setup
    const radius = progressCircle.r.baseVal.value;
    const circumference = radius * 2 * Math.PI;
    progressCircle.style.strokeDasharray = `${circumference} ${circumference}`;
    progressCircle.style.strokeDashoffset = circumference;

    const tasbihTargets = {
        'custom': null,
        'subhanallah': 33,
        'alhamdulillah': 33,
        'allahuakbar': 34,
        'astaghfirullah': 100
    };

    tasbihTypeSelect.value = savedType;
    targetCount = tasbihTargets[savedType];
    counterDisplay.textContent = count;

    function saveState() {
        localStorage.setItem('tasbih_count', count);
        localStorage.setItem('tasbih_type', tasbihTypeSelect.value);
    }

    function updateSoundUI() {
        if (soundEnabled) {
            soundIconOn.style.display = 'block';
            soundIconOff.style.display = 'none';
        } else {
            soundIconOn.style.display = 'none';
            soundIconOff.style.display = 'block';
        }
    }
    updateSoundUI();

    soundToggleBtn.addEventListener('click', () => {
        soundEnabled = !soundEnabled;
        localStorage.setItem('tasbih_sound', soundEnabled);
        updateSoundUI();
    });

    function updateProgress() {
        if (targetCount) {
            let pct = count / targetCount;
            if (pct > 1) pct = 1;
            progressCircle.style.strokeDashoffset = circumference - pct * circumference;
        } else {
            progressCircle.style.strokeDashoffset = circumference;
        }
    }

    function updateTargetDisplay() {
        if (targetCount) {
            targetDisplay.textContent = `/ ${targetCount}`;
            targetDisplay.style.display = "block";
        } else {
            targetDisplay.style.display = "none";
        }
        updateProgress();
    }
    
    // Initial call
    updateTargetDisplay();

    tasbihTypeSelect.addEventListener("change", (e) => {
        targetCount = tasbihTargets[e.target.value];
        count = 0; // Reset count when changing type
        counterDisplay.textContent = count;
        counterWrapper.classList.remove("target-reached-pulse");
        saveState();
        updateTargetDisplay();
    });

    incrementBtn.addEventListener("click", () => {
        // Init audio context on first user gesture if needed
        if (soundEnabled && !audioCtx) audioCtx = new AudioContext();

        count++;
        counterDisplay.textContent = count;
        saveState();
        
        // Number pop animation
        counterDisplay.classList.remove("pop-animate");
        void counterDisplay.offsetWidth;
        counterDisplay.classList.add("pop-animate");
        
        counterWrapper.classList.remove("target-reached-pulse"); // Reset pulse if already reached and continuing

        updateProgress();
        playClickSound();

        if (targetCount && count === targetCount) {
            playChimeSound();
            if (tg.HapticFeedback) {
                tg.HapticFeedback.impactOccurred('heavy');
                tg.HapticFeedback.notificationOccurred('success');
            }
            // Trigger visual pulse
            void counterWrapper.offsetWidth; // Trigger reflow to restart animation
            counterWrapper.classList.add("target-reached-pulse");
        } else {
            if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred('light');
        }
    });

    resetBtn.addEventListener("click", () => {
        count = 0;
        counterDisplay.textContent = count;
        saveState();
        updateProgress();
        counterWrapper.classList.remove("target-reached-pulse");
        if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred('medium');
    });

    // Premium button logic
    const premiumBtn = document.getElementById("premium-btn");
    if (premiumBtn) {
        premiumBtn.style.backgroundColor = "#ffc107";
        premiumBtn.style.color = "#333";
        premiumBtn.style.marginTop = "20px";
        
        premiumBtn.addEventListener("click", async () => {
            try {
                const response = await fetch('/api/create-invoice', { 
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ initData: tg.initData })
                });
                const data = await response.json();
                
                if (data.invoiceLink) {
                    tg.openInvoice(data.invoiceLink, (status) => {
                        if (status === 'paid') {
                            document.body.classList.add("premium");
                            premiumBtn.style.display = "none";
                            tg.showAlert("Thank you! Premium theme unlocked.");
                        } else {
                            console.log("Payment status:", status);
                        }
                    });
                } else {
                    tg.showAlert("Failed to create invoice: " + (data.error || "Unknown error"));
                }
            } catch (error) {
                tg.showAlert("Error: " + error.message);
            }
        });
    }
});