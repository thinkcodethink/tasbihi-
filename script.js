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

    // Counter logic
    let count = 0;
    let targetCount = null;
    const counterDisplay = document.getElementById("counter");
    const targetDisplay = document.getElementById("target-display");
    const counterWrapper = document.querySelector(".counter-wrapper");
    const incrementBtn = document.getElementById("increment-btn");
    const resetBtn = document.getElementById("reset-btn");
    const tasbihTypeSelect = document.getElementById("tasbih-type");

    const tasbihTargets = {
        'custom': null,
        'subhanallah': 33,
        'alhamdulillah': 33,
        'allahuakbar': 34,
        'astaghfirullah': 100
    };

    function updateTargetDisplay() {
        if (targetCount) {
            targetDisplay.textContent = `/ ${targetCount}`;
            targetDisplay.style.display = "block";
        } else {
            targetDisplay.style.display = "none";
        }
    }

    tasbihTypeSelect.addEventListener("change", (e) => {
        targetCount = tasbihTargets[e.target.value];
        count = 0; // Reset count when changing type
        counterDisplay.textContent = count;
        counterWrapper.classList.remove("target-reached-pulse");
        updateTargetDisplay();
    });

    incrementBtn.addEventListener("click", () => {
        count++;
        counterDisplay.textContent = count;
        
        counterWrapper.classList.remove("target-reached-pulse"); // Reset pulse if already reached and continuing

        if (targetCount && count === targetCount) {
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