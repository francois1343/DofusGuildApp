// demandes.js
// Rendu de la page demandes

window.AppRenderer = window.AppRenderer || {};

AppRenderer.renderDemandes = function (container) {
  const root = container || document.getElementById('demandes');
  if (!root) return;

  root.innerHTML = `
    <div class="card" style="margin-bottom: 20px; padding: 20px;">
      <h3>Créer une demande d'aide</h3>
      <form id="form-demande" data-action="add-demande" style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 15px;">
        <input type="text" id="req-titre" placeholder="Titre de l'activité" required>
        <select id="req-type">
          <option value="donjon">Donjon</option>
          <option value="quête">Quête</option>
          <option value="songes">Songes</option>
          <option value="succès">Succès</option>
          <option value="farm">Farm</option>
          <option value="mission">Mission de guilde</option>
          <option value="événement">Événement spécial</option>
        </select>
        <select id="req-diff">
          <option value="basse">Difficulté : Basse</option>
          <option value="moyenne">Difficulté : Moyenne</option>
          <option value="haute">Difficulté : Haute</option>
        </select>
        <input type="number" id="req-lvl" placeholder="Niveau conseillé" required>
        <input type="date" id="req-date" required>
        <input type="time" id="req-heure" required>
        <input type="number" id="req-places" placeholder="Nombre de joueurs recherchés" required>
        <textarea id="req-desc" placeholder="Description de votre besoin..." required></textarea>
        <button type="submit" class="btn-primary" style="grid-column: span 2;">Publier la demande</button>
      </form>
    </div>
    <div class="card">
      <div class="card-header"><h2>Toutes les demandes actives</h2></div>
      <ul class="list-preview" id="full-requests-list"></ul>
    </div>
  `;
};
