// Enregistrement du Service Worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js');
}

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    loadFromLocalStorage();
    initEventDelegation();
    initRouter();
});
