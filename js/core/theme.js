// theme.js
// Gestion du thème clair / sombre

window.AppTheme = window.AppTheme || {};

AppTheme.KEY = 'guild-theme';

AppTheme.get = function () {
  return localStorage.getItem(AppTheme.KEY) || 'dark';
};

AppTheme.apply = function (theme) {
  document.body.classList.toggle('light-theme', theme === 'light');
  localStorage.setItem(AppTheme.KEY, theme);

  const btn = document.getElementById('theme-toggle-btn');
  if (btn) {
    btn.innerHTML =
      theme === 'light'
        ? '<i class="fa-solid fa-moon" aria-hidden="true"></i>'
        : '<i class="fa-solid fa-sun" aria-hidden="true"></i>';
  }
};

AppTheme.toggle = function () {
  const nextTheme = AppTheme.get() === 'dark' ? 'light' : 'dark';
  AppTheme.apply(nextTheme);
  return nextTheme;
};

AppTheme.init = function () {
  AppTheme.apply(AppTheme.get());
};
