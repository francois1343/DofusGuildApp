// dashboard.js
// Rendu de la page tableau de bord

window.AppRenderer = window.AppRenderer || {};

AppRenderer.renderDashboard = function (container) {
  const root = container || document.getElementById('dashboard');
  if (!root) return;

  root.innerHTML = `
    <div class="stats-grid">
      <div class="stat-card">
        <i class="fa-solid fa-wand-magic-sparkles" aria-hidden="true"></i>
        <div class="stat-info">
          <h3>Demandes Actives</h3>
          <p id="stat-demandes">0</p>
        </div>
      </div>
      <div class="stat-card">
        <i class="fa-solid fa-dragon" aria-hidden="true"></i>
        <div class="stat-info">
          <h3>Événements à venir</h3>
          <p id="stat-events">0</p>
        </div>
      </div>
      <div class="stat-card">
        <i class="fa-solid fa-users" aria-hidden="true"></i>
        <div class="stat-info">
          <h3>Membres inscrits</h3>
          <p id="stat-membres">0</p>
        </div>
      </div>
    </div>
    <div class="dashboard-content">
      <div class="card">
        <div class="card-header">
          <h2>Dernières demandes d'aide</h2>
          <button class="btn-primary" data-section="demandes">+ Nouvelle</button>
        </div>
        <ul class="list-preview" id="recent-requests"></ul>
      </div>
      <div class="card">
        <div class="card-header">
          <h2>Prochains Événements</h2>
          <button class="btn-primary" data-section="evenements">Voir tout</button>
        </div>
        <ul class="list-preview" id="upcoming-events"></ul>
      </div>
    </div>
  `;
};
