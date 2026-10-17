// =============================================
// GESTION DE L'AUTHENTIFICATION
// =============================================

window.Auth = window.Auth || {};

Auth.session = null;
Auth.membre = null;
Auth.ready = false;

Auth._listeners = new Set();

Auth.onReady = function (callback) {
    if (Auth.ready) {
        callback(Auth.session, Auth.membre);
    }
    Auth._listeners.add(callback);
    return () => Auth._listeners.delete(callback);
};

Auth._notify = function () {
    Auth._listeners.forEach((cb) => cb(Auth.session, Auth.membre));
};

Auth._translateError = function (error) {
    const message = error?.message || 'Une erreur est survenue.';

    const translations = {
        'Invalid login credentials': 'E-mail/nom d\'utilisateur ou mot de passe incorrect.',
        'User already registered': 'Un compte existe déjà avec cet e-mail.',
        'Password should be at least 6 characters': 'Le mot de passe doit contenir au moins 6 caractères.',
        'Email not confirmed': 'Confirmez votre e-mail avant de vous connecter (vérifiez vos spams).',
        'Identity is already linked to another user': 'Ce compte Discord est déjà associé à un autre utilisateur.',
        'Manual linking is disabled': 'La liaison manuelle Discord n\'est pas activée dans Supabase.',
        'Email link is invalid or has expired': 'Le lien de confirmation a expiré ou est invalide.',
        'Database error saving new user': 'Erreur base de données à l\'inscription. Exécutez la migration SQL dans Supabase (supabase/migrations/001_auth_setup.sql).',
        'over_email_send_rate_limit': 'Trop de tentatives d\'inscription. Réessayez dans quelques minutes.',
        'email_address_invalid': 'Adresse e-mail refusée par Supabase. Utilisez une vraie adresse (Gmail, Outlook…).',
        'Unable to validate email address': 'Adresse e-mail invalide.',
        'Provider discord is not enabled': 'Discord n\'est pas activé dans Supabase → Authentication → Providers.',
        'OAuth': 'Erreur OAuth Discord. Vérifiez la configuration Discord + les Redirect URLs Supabase.'
    };

    for (const [key, value] of Object.entries(translations)) {
        if (message.includes(key)) return value;
    }

    return message;
};

Auth.checkEnvironment = function () {
    if (window.location.protocol === 'file:') {
        Auth.showAuthMessage(
            'login-message',
            'Ouvrez le site via un serveur HTTP (Live Server, npm serve…). L\'auth ne fonctionne pas en ouvrant index.html directement.',
            'error'
        );
        return false;
    }
    return true;
};

Auth.cleanAuthUrl = function () {
    const cleanUrl = `${window.location.origin}${window.location.pathname}#dashboard`;
    window.history.replaceState({}, document.title, cleanUrl);
};

Auth.loadProfile = async function (user) {
    if (!user) {
        Auth.membre = null;
        return null;
    }

    try {
        Auth.membre = await API.auth.ensureMembreProfile(user);
    } catch (error) {
        console.warn('Profil membre introuvable', error);
        Auth.membre = null;
    }

    return Auth.membre;
};

Auth.setSession = async function (session) {
    Auth.session = session;
    await Auth.loadProfile(session?.user ?? null);
    Auth.ready = true;
    Auth._notify();
    Auth.updateUI();
};

Auth.init = async function () {
    Auth.checkEnvironment();

    const { data: { subscription } } = API.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && window.location.search.includes('code=')) {
            Auth.cleanAuthUrl();
        }
        await Auth.setSession(session);
    });

    Auth._unsubscribe = () => subscription.unsubscribe();

    try {
        if (window.location.search.includes('code=')) {
            await API.auth.exchangeOAuthCode();
        }
    } catch (error) {
        console.error('Retour Discord échoué', error);
        Auth.showAuthMessage('login-message', Auth._translateError(error), 'error');
    }

    const session = await API.auth.getSession();
    await Auth.setSession(session);
};

Auth.signUp = async function (email, username, password) {
    const data = await API.auth.signUp({ email, username, password });
    return data;
};

Auth.signIn = async function (identifier, password) {
    const data = await API.auth.signIn(identifier, password);
    return data;
};

Auth.signInWithDiscord = async function () {
    await API.auth.signInWithDiscord();
};

Auth.linkDiscord = async function () {
    await API.auth.linkDiscord();
};

Auth.signOut = async function () {
    await API.auth.signOut();
    Auth.session = null;
    Auth.membre = null;
    Auth.updateUI();
    window.location.hash = 'dashboard';
};

Auth.isAuthenticated = function () {
    return Boolean(Auth.session?.user);
};

Auth.getDisplayName = function () {
    if (Auth.membre?.pseudo) return Auth.membre.pseudo;
    if (Auth.session?.user?.user_metadata?.username) return Auth.session.user.user_metadata.username;
    return Auth.session?.user?.email?.split('@')[0] || 'Membre';
};

Auth.getAvatarUrl = function () {
    return Auth.membre?.avatar_url
        || Auth.session?.user?.user_metadata?.avatar_url
        || 'assets/logo.png';
};

Auth.hasDiscordLinked = function () {
    return API.auth.hasDiscordLinked(Auth.session?.user);
};

Auth.updateUI = function () {
    const authScreen = document.getElementById('auth-screen');
    const appShell = document.getElementById('app-shell');
    const welcomeEl = document.getElementById('user-welcome');
    const avatarEl = document.getElementById('user-avatar');
    const logoutBtn = document.getElementById('logout-btn');
    const accountBtn = document.getElementById('account-btn');
    const linkDiscordBtn = document.getElementById('link-discord-btn');
    const discordStatus = document.getElementById('discord-status');

    const authenticated = Auth.isAuthenticated();

    if (authScreen) authScreen.hidden = authenticated;
    if (appShell) appShell.hidden = !authenticated;

    if (welcomeEl) {
        welcomeEl.textContent = authenticated
            ? `Bienvenue, ${Auth.getDisplayName()} !`
            : 'Bienvenue, chers membres !';
    }

    if (avatarEl && authenticated) {
        avatarEl.src = Auth.getAvatarUrl();
        avatarEl.alt = `Avatar de ${Auth.getDisplayName()}`;
    }

    if (logoutBtn) logoutBtn.hidden = !authenticated;
    if (accountBtn) accountBtn.hidden = !authenticated;

    if (linkDiscordBtn) {
        linkDiscordBtn.hidden = !authenticated || Auth.hasDiscordLinked();
    }

    if (discordStatus) {
        if (!authenticated) {
            discordStatus.textContent = '';
        } else if (Auth.hasDiscordLinked()) {
            discordStatus.innerHTML = '<i class="fa-brands fa-discord" aria-hidden="true"></i> Discord associé';
            discordStatus.classList.add('linked');
        } else {
            discordStatus.textContent = 'Discord non associé';
            discordStatus.classList.remove('linked');
        }
    }

    if (authenticated && typeof window.syncCurrentUser === 'function') {
        window.syncCurrentUser(Auth.getDisplayName());
    }
};

Auth.showAuthMessage = function (elementId, message, type = 'error') {
    const el = document.getElementById(elementId);
    if (!el) return;

    el.textContent = message;
    el.className = `auth-message auth-message--${type}`;
    el.hidden = !message;
};

Auth.initForms = function () {
    const loginForm = document.getElementById('form-login');
    const registerForm = document.getElementById('form-register');
    const discordLoginBtn = document.getElementById('discord-login-btn');
    const linkDiscordBtn = document.getElementById('link-discord-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const accountPanel = document.getElementById('account-panel');
    const accountBtn = document.getElementById('account-btn');
    const accountCloseBtn = document.getElementById('account-close-btn');
    const authTabs = document.querySelectorAll('[data-auth-tab]');

    authTabs.forEach((tab) => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.authTab;
            document.querySelectorAll('[data-auth-panel]').forEach((panel) => {
                panel.hidden = panel.dataset.authPanel !== target;
            });
            authTabs.forEach((t) => t.classList.toggle('active', t.dataset.authTab === target));
            Auth.showAuthMessage('login-message', '');
            Auth.showAuthMessage('register-message', '');
        });
    });

    loginForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const identifier = document.getElementById('login-identifier').value.trim();
        const password = document.getElementById('login-password').value;
        const submitBtn = loginForm.querySelector('[type="submit"]');

        submitBtn.disabled = true;
        Auth.showAuthMessage('login-message', '');

        try {
            await Auth.signIn(identifier, password);
            Auth.showAuthMessage('login-message', 'Connexion réussie !', 'success');
        } catch (error) {
            console.error('Connexion échouée', error);
            Auth.showAuthMessage('login-message', Auth._translateError(error));
        } finally {
            submitBtn.disabled = false;
        }
    });

    registerForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('register-email').value.trim();
        const username = document.getElementById('register-username').value.trim();
        const password = document.getElementById('register-password').value;
        const passwordConfirm = document.getElementById('register-password-confirm').value;
        const submitBtn = registerForm.querySelector('[type="submit"]');

        if (password !== passwordConfirm) {
            Auth.showAuthMessage('register-message', 'Les mots de passe ne correspondent pas.');
            return;
        }

        if (username.length < 3) {
            Auth.showAuthMessage('register-message', 'Le nom d\'utilisateur doit contenir au moins 3 caractères.');
            return;
        }

        submitBtn.disabled = true;
        Auth.showAuthMessage('register-message', '');

        try {
            const result = await Auth.signUp(email, username, password);
            const { session, user } = result;

            if (session) {
                Auth.showAuthMessage('register-message', 'Compte créé avec succès !', 'success');
            } else if (user?.identities?.length === 0) {
                Auth.showAuthMessage(
                    'register-message',
                    'Un compte existe déjà avec cet e-mail. Connectez-vous ou réinitialisez votre mot de passe.',
                    'error'
                );
            } else {
                Auth.showAuthMessage(
                    'register-message',
                    'Compte créé ! Un e-mail de confirmation a été envoyé — cliquez le lien avant de vous connecter (vérifiez les spams).',
                    'success'
                );
                registerForm.reset();
            }
        } catch (error) {
            console.error('Inscription échouée', error);
            Auth.showAuthMessage('register-message', Auth._translateError(error));
        } finally {
            submitBtn.disabled = false;
        }
    });

    discordLoginBtn?.addEventListener('click', async () => {
        if (!Auth.checkEnvironment()) return;

        try {
            await Auth.signInWithDiscord();
        } catch (error) {
            console.error('Discord OAuth échoué', error);
            Auth.showAuthMessage('login-message', Auth._translateError(error), 'error');
        }
    });

    linkDiscordBtn?.addEventListener('click', async () => {
        try {
            await Auth.linkDiscord();
        } catch (error) {
            alert(Auth._translateError(error));
        }
    });

    logoutBtn?.addEventListener('click', async () => {
        try {
            await Auth.signOut();
        } catch (error) {
            alert(Auth._translateError(error));
        }
    });

    accountBtn?.addEventListener('click', () => {
        if (accountPanel) accountPanel.hidden = !accountPanel.hidden;
    });

    accountCloseBtn?.addEventListener('click', () => {
        if (accountPanel) accountPanel.hidden = true;
    });

    document.addEventListener('click', (e) => {
        if (!accountPanel || accountPanel.hidden) return;
        if (e.target.closest('#account-panel') || e.target.closest('#account-btn')) return;
        accountPanel.hidden = true;
    });
};
