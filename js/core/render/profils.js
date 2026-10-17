// profils.js
// Rendu de la page profils

window.AppRenderer = window.AppRenderer || {};

AppRenderer.renderProfils = function (container) {
  const root = container || document.getElementById('profils');
  if (!root) return;

  root.innerHTML = `
    <div class="card" style="margin-bottom: 20px; padding: 20px;">
      <h3>Ajouter un membre dans la guilde</h3>
      <form id="form-membre" data-action="add-membre" style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 15px;">
        <input type="text" id="mbr-pseudo" placeholder="Pseudo en jeu" required>
        <select id="mbr-classe" required>
          <option value="" disabled selected>Choisir une classe...</option>
          <option value="Crâ">Crâ</option>
          <option value="Ecaflip">Ecaflip</option>
          <option value="Éliotrope">Éliotrope</option>
          <option value="Eniripsa">Eniripsa</option>
          <option value="Enutrof">Enutrof</option>
          <option value="Féca">Féca</option>
          <option value="Forgelance">Forgelance</option>
          <option value="Huppermage">Huppermage</option>
          <option value="Iop">Iop</option>
          <option value="Osamodas">Osamodas</option>
          <option value="Ouginak">Ouginak</option>
          <option value="Pandawa">Pandawa</option>
          <option value="Roublard">Roublard</option>
          <option value="Sacrieur">Sacrieur</option>
          <option value="Sadida">Sadida</option>
          <option value="Sram">Sram</option>
          <option value="Steamer">Steamer</option>
          <option value="Xélor">Xélor</option>
          <option value="Zobal">Zobal</option>
        </select>
        <select id="mbr-element" required>
          <option value="" disabled selected>Élément principal...</option>
          <option value="Feu">Feu</option>
          <option value="Eau">Eau</option>
          <option value="Air">Air</option>
          <option value="Terre">Terre</option>
          <option value="Multi">Multi-éléments</option>
        </select>
        <input type="number" id="mbr-niveau" placeholder="Niveau (1-200)" min="1" max="200" required>
        <input type="text" id="mbr-dispos" placeholder="Disponibilités" required>
        <button type="submit" class="btn-primary" style="grid-column: span 2;">Inscrire le membre</button>
      </form>
    </div>
    <div class="card">
      <div class="card-header"><h2>Annuaire des membres</h2></div>
      <div id="member-list" class="member-grid"></div>
    </div>
  `;
};
