// router.js
// Gestion des routes par hashchange et navigation entre sections

window.AppRouter = window.AppRouter || {};

AppRouter.routes = {
  dashboard: 'dashboard',
  demandes: 'demandes',
  evenements: 'evenements',
  profils: 'profils',
};

AppRouter.navigate = function (hash) {
  const rawHash = hash || window.location.hash.replace('#', '');
  const page = rawHash || 'dashboard';
  const sectionId = AppRouter.routes[page] || 'dashboard';

  if (typeof window.showSection === 'function') {
    window.showSection(sectionId);
  } else {
    console.warn('showSection() non défini, impossible de naviguer vers', sectionId);
  }
};

AppRouter.onHashChange = function () {
  AppRouter.navigate(window.location.hash);
};

AppRouter.init = function () {
  window.addEventListener('hashchange', AppRouter.onHashChange);
  window.addEventListener('DOMContentLoaded', function () {
    AppRouter.navigate(window.location.hash);
  });
};

AppRouter.init();
