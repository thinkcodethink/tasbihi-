document.addEventListener("DOMContentLoaded", () => {
    // Initialize Telegram Web App
    const tg = window.Telegram.WebApp;
    tg.expand(); // Expand the app to full height

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
});