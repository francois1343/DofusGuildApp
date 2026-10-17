// init.js
// Initialisation de l'application et logique globale des vues

const DEFAULT_MEMBRES = [
    {
        id: 1,
        pseudo: "Dark-Lame",
        classe: "Iop",
        element: "Terre",
        niveau: 200,
        dispos: "Soir et week-end",
    },
    {
        id: 2,
        pseudo: "Xel-Chrono",
        classe: "Xélor",
        element: "Eau",
        niveau: 195,
        dispos: "Mercredi après-midi",
    },
    {
        id: 3,
        pseudo: "Care-Soin",
        classe: "Eniripsa",
        element: "Feu",
        niveau: 200,
        dispos: "Flexible",
    },
];

const DEFAULT_DEMANDES = [
    {
        id: 1,
        type: "donjon",
        titre: "Passage Comte Harebourg",
        difficulte: "haute",
        date: "2026-05-28",
        heure: "21:00",
        joueursRecherches: 3,
        description: "Besoin d'un coup de main pour le succès Duo.",
        lvlConseille: 200,
        auteur: "Dark-Lame",
        participants: [],
    },
    {
        id: 2,
        type: "quête",
        titre: "Dofus Pourpre - Le Volcan",
        difficulte: "moyenne",
        date: "2026-05-27",
        heure: "18:00",
        joueursRecherches: 2,
        description: "Combat tactique contre le boss de quête.",
        lvlConseille: 150,
        auteur: "Xel-Chrono",
        participants: [],
    },
];

const DEFAULT_EVENEMENTS = [
    {
        id: 1,
        titre: "Soirée Songes Infinis",
        date: "2026-05-29",
        heure: "20:30",
        type: "songes",
        maxParticipants: 4,
        participants: ["Dark-Lame", "Care-Soin"],
        statut: "ouvert",
    },
    {
        id: 2,
        titre: "Donjons Hebdo - Succès",
        date: "2026-05-31",
        heure: "15:00",
        type: "événement spécial",
        maxParticipants: 8,
        participants: ["Dark-Lame", "Xel-Chrono", "Care-Soin"],
        statut: "ouvert",
    },
];

let gMembres = [];
let gDemandes = [];
let gEvenements = [];
let currentUser = "Dark-Lame";

function syncCurrentUser(pseudo) {
    if (pseudo) currentUser = pseudo;
}
window.syncCurrentUser = syncCurrentUser;

function loadFromLocalStorage() {
    gMembres = JSON.parse(localStorage.getItem("gMembres")) || DEFAULT_MEMBRES;
    gDemandes = JSON.parse(localStorage.getItem("gDemandes")) || DEFAULT_DEMANDES;
    gEvenements = JSON.parse(localStorage.getItem("gEvenements")) || DEFAULT_EVENEMENTS;
}

function saveToLocalStorage() {
    localStorage.setItem("gMembres", JSON.stringify(gMembres));
    localStorage.setItem("gDemandes", JSON.stringify(gDemandes));
    localStorage.setItem("gEvenements", JSON.stringify(gEvenements));
}

/**
 * Échappe les caractères HTML spéciaux pour prévenir les attaques XSS
 * @param {string} text - Texte à échapper
 * @returns {string} - Texte échappé
 */
function escapeHTML(text) {
    if (typeof text !== 'string') return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, char => map[char]);
}

function showSection(sectionId) {
    document.querySelectorAll(".view-section").forEach((section) => {
        section.hidden = true;
        section.style.display = "none";
        section.classList.remove("active-view");
    });

    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.hidden = false;
        targetSection.style.display = "";
        targetSection.classList.add("active-view");
    }

    document.querySelectorAll(".nav-links li").forEach((li) => li.classList.remove("active"));
    const activeLink = document.querySelector(`.nav-links a[href="#${sectionId}"]`);
    if (activeLink) {
        activeLink.parentElement.classList.add("active");
    }

    const titles = {
        dashboard: "Tableau de bord",
        demandes: "Entraide & Demandes",
        evenements: "Événements & Calendrier",
        profils: "Membres de la guilde",
    };
    const titleElement = document.querySelector(".topbar h1");
    if (titleElement) {
        titleElement.innerText = titles[sectionId] || "Portail";
    }

    if (sectionId === "dashboard") renderDashboard();
    if (sectionId === "demandes") renderDemandes();
    if (sectionId === "evenements") renderEvenements();
    if (sectionId === "profils") renderProfils();
}

function renderDashboard() {
    const statDemandes = document.getElementById("stat-demandes");
    const statEvents = document.getElementById("stat-events");
    const statMembres = document.getElementById("stat-membres");

    if (statDemandes) statDemandes.innerText = gDemandes.length;
    if (statEvents) statEvents.innerText = gEvenements.filter((e) => e.statut === "ouvert").length;
    if (statMembres) statMembres.innerText = gMembres.length;

    const recentReqContainer = document.getElementById("recent-requests");
    if (recentReqContainer) {
        recentReqContainer.innerHTML =
            gDemandes.slice(0, 3)
                .map(
                    (req) => `
        <li class="list-item">
            <div class="item-icon diff-${escapeHTML(req.difficulte)}">${escapeHTML(req.difficulte)}</div>
            <div class="item-details">
                <strong>${escapeHTML(req.titre)}</strong>
                <span>Par <em>${escapeHTML(req.auteur)}</em> - Lvl conseillé : ${req.lvlConseille}</span>
            </div>
            <div class="item-action">
                <button class="btn-secondary" data-section="demandes">Voir</button>
            </div>
        </li>
    `,
                )
                .join("") || '<li class="list-item">Aucune demande active.</li>';
    }

    const upcomingEvContainer = document.getElementById("upcoming-events");
    if (upcomingEvContainer) {
        upcomingEvContainer.innerHTML =
            gEvenements.slice(0, 3)
                .map((event) => {
                    const dateObj = new Date(event.date);
                    const day = dateObj.getDate() || "??";
                    const month = dateObj.toLocaleString("fr-FR", { month: "short" }) || "Mai";
                    return `
            <li class="list-item">
                <div class="item-date">
                    <span class="day">${day}</span>
                    <span class="month">${month}</span>
                </div>
                <div class="item-details">
                    <strong>${escapeHTML(event.titre)}</strong>
                    <span>${event.heure} - Places : ${event.participants.length}/${event.maxParticipants}</span>
                </div>
            </li>
        `;
                })
                .join("") || '<li class="list-item">Aucun événement prévu.</li>';
    }
}

function renderDemandes() {
    const container = document.getElementById("demandes");
    if (!container) return;

    container.innerHTML = `
        <div class="card" style="margin-bottom: 20px; padding: 20px;">
            <h3>Créer une demande d'aide</h3>
            <form id="form-demande" data-action="add-demande" style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 15px;">
                <input type="text" id="req-titre" placeholder="Titre de l'activité (ex: Donjon Koutoulou)" required>
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
                <select id="req-auteur" required style="grid-column: span 2;">
                    <option value="" disabled selected>Auteur de la demande...</option>
                    ${gMembres
                        .map(
                            (membre) => `
                        <option value="${escapeHTML(membre.pseudo)}">${escapeHTML(membre.pseudo)} (${escapeHTML(membre.classe)})</option>
                    `,
                        )
                        .join("")}
                </select>
                <input type="number" id="req-places" placeholder="Nombre de joueurs recherchés" required style="grid-column: span 2;">
                <textarea id="req-desc" placeholder="Description de votre besoin..." required style="grid-column: span 2;"></textarea>
                <button type="submit" class="btn-primary" style="grid-column: span 2;">Publier la demande</button>
            </form>
        </div>
        <div class="card">
            <div class="card-header"><h2>Toutes les demandes actives</h2></div>
            <ul class="list-preview" id="full-requests-list"></ul>
        </div>
    `;

    const listContainer = document.getElementById("full-requests-list");
    if (listContainer) {
        listContainer.innerHTML =
            gDemandes
                .map(
                    (req) => `
        <li class="list-item">
            <div class="item-icon diff-${escapeHTML(req.difficulte)}">${escapeHTML(req.difficulte)}</div>
            <div class="item-details">
                <strong>${escapeHTML(req.titre)} [Lvl ${req.lvlConseille}]</strong>
                <p style="font-size:0.9rem; color:var(--text-light); margin:5px 0;">${escapeHTML(req.description)}</p>
                <span>Prévu le ${req.date} à ${req.heure} - Proposé par <strong>${escapeHTML(req.auteur)}</strong></span>
            </div>
            <div>
                <button class="btn-secondary" data-action="delete-demande" data-id="${req.id}" aria-label="Supprimer la demande ${escapeHTML(req.titre)}">
                    <i class="fa-solid fa-trash" aria-hidden="true"></i>
                </button>
            </div>
        </li>
    `,
                )
                .join("") || '<li class="list-item">Aucune demande disponible.</li>';
    }
}

function renderEvenements() {
    const container = document.getElementById("evenements");
    if (!container) return;

    container.innerHTML = `
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

    const listContainer = document.getElementById("full-events-list");
    if (listContainer) {
        listContainer.innerHTML =
            gEvenements
                .map((evt) => {
                    return `
            <li class="list-item">
                <div class="item-date"><span class="day">${evt.date.split("-")[2] || "?"}</span></div>
                <div class="item-details">
                    <strong>${escapeHTML(evt.titre)} (${evt.heure})</strong>
                    <span>Membres inscrits (${evt.participants.length}/${evt.maxParticipants}) : <strong style="color: var(--primary-text);">${evt.participants.map(escapeHTML).join(", ") || "Aucun"}</strong></span>
                </div>
                <div class="item-action" style="display: flex; gap: 10px;">
                    <button class="btn-primary" data-action="toggle-inscription" data-id="${evt.id}">
                        <i class="fa-solid fa-user-pen" aria-hidden="true"></i> Inscrire / Désinscrire
                    </button>
                    <button class="btn-secondary" data-action="delete-evenement" data-id="${evt.id}" style="color: var(--diff-haute); border-color: var(--diff-haute);" aria-label="Supprimer l'événement ${escapeHTML(evt.titre)}">
                        <i class="fa-solid fa-trash" aria-hidden="true"></i>
                    </button>
                </div>
            </li>
        `;
                })
                .join("") || '<li class="list-item">Aucun événement planifié.</li>';
    }
}

function renderProfils() {
    const container = document.getElementById("profils");
    if (!container) return;

    container.innerHTML = `
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
                <input type="text" id="mbr-dispos" placeholder="Disponibilités (ex: Soir et week-end, mercredi aprèm...)" required>
                <button type="submit" class="btn-primary" style="grid-column: span 2;">Inscrire le membre</button>
            </form>
        </div>
        <div class="card">
            <div class="card-header"><h2>Annuaire des membres</h2></div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px;" id="member-grid"></div>
        </div>
    `;

    const memberGrid = document.getElementById("member-grid");
    if (memberGrid) {
        memberGrid.innerHTML =
            gMembres
                .map((mb) => {
                    const classNameCleaned = mb.classe
                        .normalize("NFD")
                        .replace(/[\u0300-\u036f]/g, "")
                        .toLowerCase();

                    const elementMapping = {
                        Feu: "fire",
                        Eau: "water",
                        Air: "air",
                        Terre: "earth",
                        Multi: "multi",
                    };
                    const elementFile = elementMapping[mb.element] || "multi";

                    return `
                <div class="card" style="padding: 20px; text-align: center; display: flex; flex-direction: column; justify-content: space-between;">
                    <div>
                        <img src="assets/classes/${classNameCleaned}.png" 
                             alt="${escapeHTML(mb.classe)}" 
                             style="width: 75px; height: 75px; border-radius: 50%; object-fit: cover; border: 2px solid var(--primary-color); margin-bottom: 10px; background-color: var(--bg-dark);"
                             onerror="this.src='https://via.placeholder.com/75?text=?';">
                        <h3 style="color:var(--primary-text);">${escapeHTML(mb.pseudo)}</h3>
                        <p style="font-weight:600; margin:5px 0;">${escapeHTML(mb.classe)} - Lvl ${mb.niveau}</p>
                        <div style="display: flex; align-items: center; justify-content: center; gap: 6px; font-size: 0.9rem; color: var(--text-muted); margin: 8px 0;">
                            <span>Élément :</span>
                            <img src="assets/elements/${elementFile}.png" 
                                 alt="${escapeHTML(mb.element)}" 
                                 style="width: 18px; height: 18px; object-fit: contain;"
                                 onerror="this.hidden=true;">
                            <span style="color: var(--text-light); font-weight: 500;">${escapeHTML(mb.element)}</span>
                        </div>
                        <p style="font-size:0.85rem; margin-top:10px; font-style:italic; min-height: 40px;">Dispos : ${escapeHTML(mb.dispos)}</p>
                    </div>
                    <div style="margin-top: 15px; border-top: 1px solid var(--border-color); padding-top: 15px;">
                        <button class="btn-secondary" data-action="delete-membre" data-id="${mb.id}" style="color: var(--diff-haute); border-color: var(--diff-haute); width: 100%;">
                            <i class="fa-solid fa-user-slash" aria-hidden="true"></i> Retirer de la guilde
                        </button>
                    </div>
                </div>
                `;
                })
                .join("");
    }
}

function addDemande(e) {
    e.preventDefault();
    const newDemande = {
        id: Date.now(),
        titre: document.getElementById("req-titre").value,
        type: document.getElementById("req-type").value,
        difficulte: document.getElementById("req-diff").value,
        lvlConseille: parseInt(document.getElementById("req-lvl").value, 10),
        date: document.getElementById("req-date").value,
        heure: document.getElementById("req-heure").value,
        joueursRecherches: parseInt(document.getElementById("req-places").value, 10),
        description: document.getElementById("req-desc").value,
        auteur: document.getElementById("req-auteur").value,
        participants: [],
    };

    gDemandes.unshift(newDemande);
    saveToLocalStorage();
    renderDemandes();
}

function deleteDemande(id) {
    gDemandes = gDemandes.filter((req) => req.id !== id);
    saveToLocalStorage();
    renderDemandes();
}

function addEvenement(e) {
    e.preventDefault();
    const newEvent = {
        id: Date.now(),
        titre: document.getElementById("evt-titre").value,
        date: document.getElementById("evt-date").value,
        heure: document.getElementById("evt-heure").value,
        maxParticipants: parseInt(document.getElementById("evt-max").value, 10),
        participants: [],
        statut: "ouvert",
    };

    gEvenements.push(newEvent);
    saveToLocalStorage();
    renderEvenements();
}

function toggleInscription(id) {
    const evt = gEvenements.find((e) => e.id === id);
    if (!evt) return;

    const pseudo = prompt("Entrez le pseudo du membre à inscrire ou désinscrire :");
    if (!pseudo) return;

    const pseudoNettoye = pseudo.trim();
    const membreTrouve = gMembres.find(
        (m) => m.pseudo.toLowerCase() === pseudoNettoye.toLowerCase(),
    );

    if (!membreTrouve) {
        alert(`Le joueur "${pseudoNettoye}" n'existe pas dans la liste des membres de la guilde. Ajoutez-le d'abord dans l'onglet Membres !`);
        return;
    }

    const exactPseudo = membreTrouve.pseudo;
    const index = evt.participants.indexOf(exactPseudo);

    if (index === -1) {
        if (evt.participants.length >= evt.maxParticipants) {
            alert("Cet événement est complet ! Impossible d'ajouter un joueur.");
            return;
        }
        evt.participants.push(exactPseudo);
    } else {
        evt.participants.splice(index, 1);
    }

    saveToLocalStorage();
    renderEvenements();
}

function deleteEvenement(id) {
    if (confirm("Voulez-vous vraiment supprimer cet événement ?")) {
        gEvenements = gEvenements.filter((evt) => evt.id !== id);
        saveToLocalStorage();
        renderEvenements();
    }
}

function addMembre(e) {
    e.preventDefault();

    const pseudoSaisi = document.getElementById("mbr-pseudo").value.trim();

    const existeDeja = gMembres.some(
        (m) => m.pseudo.toLowerCase() === pseudoSaisi.toLowerCase(),
    );
    if (existeDeja) {
        alert("Ce pseudo est déjà enregistré dans la guilde !");
        return;
    }

    const newMembre = {
        id: Date.now(),
        pseudo: pseudoSaisi,
        classe: document.getElementById("mbr-classe").value,
        element: document.getElementById("mbr-element").value,
        niveau: parseInt(document.getElementById("mbr-niveau").value, 10),
        dispos: document.getElementById("mbr-dispos").value.trim(),
    };

    gMembres.push(newMembre);
    saveToLocalStorage();
    renderProfils();
    const formMembre = document.getElementById("form-membre");
    if (formMembre) formMembre.reset();
}

function deleteMembre(id) {
    if (confirm("Voulez-vous vraiment retirer ce membre de la guilde ?")) {
        gMembres = gMembres.filter((m) => m.id !== id);
        saveToLocalStorage();
        renderProfils();
    }
}

function toggleTheme() {
    const body = document.body;
    const btn = document.getElementById("theme-toggle-btn");
    if (!btn) return;

    body.classList.toggle("light-theme");

    if (body.classList.contains("light-theme")) {
        btn.innerHTML = '<i class="fa-solid fa-moon" aria-hidden="true"></i>';
        localStorage.setItem("guild-theme", "light");
    } else {
        btn.innerHTML = '<i class="fa-solid fa-sun" aria-hidden="true"></i>';
        localStorage.setItem("guild-theme", "dark");
    }
}

function initTheme() {
    const savedTheme = localStorage.getItem("guild-theme");
    const body = document.body;
    const btn = document.getElementById("theme-toggle-btn");

    if (savedTheme === "light") {
        body.classList.add("light-theme");
        if (btn) btn.innerHTML = '<i class="fa-solid fa-moon" aria-hidden="true"></i>';
    } else {
        body.classList.remove("light-theme");
        if (btn) btn.innerHTML = '<i class="fa-solid fa-sun" aria-hidden="true"></i>';
    }
}

function initEventDelegation() {
    document.body.addEventListener('click', (e) => {
        const target = e.target.closest('[data-action], [data-section]');
        if (!target) return;

        const section = target.dataset.section;
        if (section) {
            e.preventDefault();
            window.location.hash = section;
            return;
        }

        const action = target.dataset.action;
        const id = parseInt(target.dataset.id, 10);

        switch (action) {
            case 'toggle-theme':
                toggleTheme();
                break;
            case 'delete-demande':
                deleteDemande(id);
                break;
            case 'delete-evenement':
                deleteEvenement(id);
                break;
            case 'toggle-inscription':
                toggleInscription(id);
                break;
            case 'delete-membre':
                deleteMembre(id);
                break;
        }
    });

    document.body.addEventListener('submit', (e) => {
        const action = e.target.dataset.action;
        if (!action) return;

        switch (action) {
            case 'add-demande':
                addDemande(e);
                break;
            case 'add-evenement':
                addEvenement(e);
                break;
            case 'add-membre':
                addMembre(e);
                break;
        }
    });

    const themeBtn = document.getElementById('theme-toggle-btn');
    if (themeBtn) {
        themeBtn.addEventListener('click', toggleTheme);
    }
}

function initRouter() {
    const validRoutes = ['dashboard', 'demandes', 'evenements', 'profils'];

    const navigateToHash = () => {
        const hash = window.location.hash.replace('#', '') || 'dashboard';
        const route = validRoutes.includes(hash) ? hash : 'dashboard';
        
        // Correction du hash si invalide
        if (route !== hash) {
            window.location.hash = route;
        }
        
        showSection(route);
    };

    // Écoute les changements d'URL
    window.addEventListener('hashchange', navigateToHash);

    // Navigation initiale au démarrage
    navigateToHash();
}

// Fonction utilitaire de navigation directe
function navigateTo(route) {
    window.location.hash = route;
}
