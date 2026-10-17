// storage.js
// Lecture / écriture dans LocalStorage

window.AppStorage = window.AppStorage || {};

AppStorage.read = function (key, defaultValue = null) {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch (error) {
    console.warn('Erreur de lecture LocalStorage', error);
    return defaultValue;
  }
};

AppStorage.write = function (key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn('Erreur d écriture LocalStorage', error);
  }
};

AppStorage.remove = function (key) {
  localStorage.removeItem(key);
};
