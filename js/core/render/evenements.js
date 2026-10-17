// evenements.js
// Rendu de la page événements

window.AppRenderer = window.AppRenderer || {};

AppRenderer.renderEvenements = function (container) {
  const root = container || document.getElementById('evenements');
  if (!root) return;

  root.innerHTML = `
    <div class="card" style="margin-bottom: 20px; padding: 20px;">
      <h3>Planifier une soirée de guilde</h3>
      <form id="form-event" data-action="add-evenement" style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 15px;">
        <input type="text" id="evt-titre" placeholder="Nom de l'événement" required>
        <input type="number" id="evt-max" placeholder="Nombre max de participants" required>
        <input type="date" id="evt-date" required>
        <input type="time" id="evt-heure" required>
        <button type="submit" class="btn-primary" style="grid-column: span 2;">Créer l'événement</button>
      </form>
    </div>
    <div class="card">
      <div class="card-header"><h2>Calendrier des activités</h2></div>
      <ul class="list-preview" id="full-events-list"></ul>
    </div>
  `;
};
