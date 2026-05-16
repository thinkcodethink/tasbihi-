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
    const counterDisplay = document.getElementById("counter");
    const incrementBtn = document.getElementById("increment-btn");
    const resetBtn = document.getElementById("reset-btn");

    incrementBtn.addEventListener("click", () => {
        count++;
        counterDisplay.textContent = count;
        if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred('light');
    });

    resetBtn.addEventListener("click", () => {
        count = 0;
        counterDisplay.textContent = count;
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
                const response = await fetch('/api/create-invoice', { method: 'POST' });
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