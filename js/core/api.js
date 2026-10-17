// =============================================
// COUCHE API — Toutes les requêtes Supabase
// =============================================

const API = {

    // ─────────────────────────────────────────
    // AUTHENTIFICATION
    // ─────────────────────────────────────────

    auth: {

        /**
         * Inscription e-mail / nom d'utilisateur / mot de passe
         * @param {{ email: string, username: string, password: string }} credentials
         */
        getRedirectUrl() {
            return `${window.location.origin}${window.location.pathname}`;
        },

        async signUp({ email, username, password }) {
            const normalizedUsername = username.trim();

            const { data, error } = await db.auth.signUp({
                email: email.trim(),
                password,
                options: {
                    emailRedirectTo: API.auth.getRedirectUrl(),
                    data: {
                        username: normalizedUsername,
                        pseudo: normalizedUsername
                    }
                }
            });

            if (error) throw error;
            return data;
        },

        /**
         * Échange le code OAuth (PKCE) après redirection Discord
         */
        async exchangeOAuthCode() {
            const params = new URLSearchParams(window.location.search);
            const code = params.get('code');
            if (!code) return null;

            const { data, error } = await db.auth.exchangeCodeForSession(code);
            if (error) throw error;
            return data.session;
        },

        /**
         * Crée le profil membre si le trigger SQL n'a pas tourné
         */
        async ensureMembreProfile(user) {
            if (!user) return null;

            let membre = await API.auth.getMembreByUserId(user.id);
            if (membre) return membre;

            const pseudo = user.user_metadata?.username
                || user.user_metadata?.pseudo
                || user.user_metadata?.full_name
                || user.email?.split('@')[0]
                || 'Membre';

            const { data, error } = await db
                .from('membres')
                .insert([{
                    user_id: user.id,
                    pseudo,
                    username: pseudo,
                    email: user.email,
                    avatar_url: user.user_metadata?.avatar_url || null,
                    actif: true,
                    classe: 'Non renseigné',
                    niveau: 1
                }])
                .select()
                .single();

            if (error) {
                console.warn('Création profil membre échouée', error);
                return null;
            }

            return data;
        },

        /**
         * Connexion avec e-mail ou nom d'utilisateur
         * @param {string} identifier
         * @param {string} password
         */
        async signIn(identifier, password) {
            let email = identifier.trim();

            if (!email.includes('@')) {
                const { data: resolvedEmail, error: lookupError } = await db
                    .rpc('get_email_by_pseudo', { p_pseudo: email });

                if (lookupError) {
                    if (lookupError.code === 'PGRST202' || lookupError.message?.includes('Could not find the function')) {
                        throw new Error('Database error saving new user');
                    }
                    throw new Error('Identifiants invalides.');
                }
                if (!resolvedEmail) {
                    throw new Error('Identifiants invalides.');
                }
                email = resolvedEmail;
            }

            const { data, error } = await db.auth.signInWithPassword({ email, password });
            if (error) throw error;
            return data;
        },

        /**
         * Connexion ou création automatique via Discord OAuth2
         */
        async signInWithDiscord() {
            const redirectTo = API.auth.getRedirectUrl();

            const { data, error } = await db.auth.signInWithOAuth({
                provider: 'discord',
                options: {
                    redirectTo,
                    scopes: 'identify email'
                }
            });

            if (error) throw error;
            return data;
        },

        /**
         * Associe Discord à un compte déjà connecté
         */
        async linkDiscord() {
            const redirectTo = API.auth.getRedirectUrl();

            const { data, error } = await db.auth.linkIdentity({
                provider: 'discord',
                options: {
                    redirectTo,
                    scopes: 'identify email'
                }
            });

            if (error) throw error;
            return data;
        },

        /**
         * Déconnexion sécurisée (invalidation locale + serveur)
         */
        async signOut() {
            const { error } = await db.auth.signOut({ scope: 'global' });
            if (error) throw error;
        },

        /**
         * Session courante
         */
        async getSession() {
            const { data, error } = await db.auth.getSession();
            if (error) throw error;
            return data.session;
        },

        /**
         * Profil membre lié à l'utilisateur connecté
         * @param {string} userId
         */
        async getMembreByUserId(userId) {
            const { data, error } = await db
                .from('membres')
                .select('*')
                .eq('user_id', userId)
                .maybeSingle();

            if (error) throw error;
            return data;
        },

        /**
         * Vérifie si Discord est déjà associé
         * @param {import('@supabase/supabase-js').User} user
         */
        hasDiscordLinked(user) {
            return user?.identities?.some((identity) => identity.provider === 'discord') ?? false;
        },

        /**
         * Écoute les changements d'état d'authentification
         * @param {Function} callback
         */
        onAuthStateChange(callback) {
            return db.auth.onAuthStateChange(callback);
        }
    },

    // ─────────────────────────────────────────
    // MEMBRES
    // ─────────────────────────────────────────

    membres: {

        /**
         * Récupère tous les membres actifs
         * @returns {Promise<Array>}
         */
        async getAll() {
            const { data, error } = await db
                .from('membres')
                .select('*')
                .eq('actif', true)
                .order('pseudo', { ascending: true });

            if (error) throw error;
            return data;
        },

        /**
         * Récupère un membre par son pseudo
         * @param {string} pseudo
         * @returns {Promise<Object>}
         */
        async getByPseudo(pseudo) {
            const { data, error } = await db
                .from('membres')
                .select('*')
                .eq('pseudo', pseudo)
                .single();

            if (error) throw error;
            return data;
        },

        /**
         * Crée un nouveau membre
         * @param {Object} membre - { pseudo, email, classe, niveau }
         * @returns {Promise<Object>}
         */
        async create(membre) {
            const { data, error } = await db
                .from('membres')
                .insert([membre])
                .select()
                .single();

            if (error) throw error;
            return data;
        },

        /**
         * Met à jour un membre
         * @param {string} id
         * @param {Object} updates
         * @returns {Promise<Object>}
         */
        async update(id, updates) {
            const { data, error } = await db
                .from('membres')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        }
    },

    // ─────────────────────────────────────────
    // DEMANDES
    // ─────────────────────────────────────────

    demandes: {

        /**
         * Récupère toutes les demandes avec l'auteur
         * @returns {Promise<Array>}
         */
        async getAll() {
            const { data, error } = await db
                .from('demandes')
                .select(`
                    *,
                    auteur:membres!auteur_id (
                        id,
                        pseudo,
                        classe,
                        avatar_url
                    ),
                    helpers:demande_helpers (
                        id,
                        statut,
                        helper:membres!helper_id (
                            id,
                            pseudo
                        )
                    )
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data;
        },

        /**
         * Récupère les demandes actives uniquement
         * @returns {Promise<Array>}
         */
        async getActives() {
            const { data, error } = await db
                .from('demandes')
                .select(`
                    *,
                    auteur:membres!auteur_id (
                        id,
                        pseudo,
                        classe,
                        avatar_url
                    )
                `)
                .in('statut', ['en_attente', 'en_cours'])
                .order('date_souhaitee', { ascending: true });

            if (error) throw error;
            return data;
        },

        /**
         * Crée une nouvelle demande
         * @param {Object} demande
         * @returns {Promise<Object>}
         */
        async create(demande) {
            const { data, error } = await db
                .from('demandes')
                .insert([demande])
                .select()
                .single();

            if (error) throw error;
            return data;
        },

        /**
         * Met à jour le statut d'une demande
         * @param {string} id
         * @param {string} statut
         * @returns {Promise<Object>}
         */
        async updateStatut(id, statut) {
            const { data, error } = await db
                .from('demandes')
                .update({ statut })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },

        /**
         * Supprime une demande
         * @param {string} id
         * @returns {Promise<void>}
         */
        async delete(id) {
            const { error } = await db
                .from('demandes')
                .delete()
                .eq('id', id);

            if (error) throw error;
        }
    },

    // ─────────────────────────────────────────
    // HELPERS (inscriptions aux demandes)
    // ─────────────────────────────────────────

    helpers: {

        /**
         * Propose son aide pour une demande
         * Vérifie qu'aucun helper actif n'existe déjà
         * @param {string} demandeId
         * @param {string} helperId
         * @returns {Promise<Object>}
         */
        async rejoindre(demandeId, helperId) {
            // Vérification : helper actif déjà présent ?
            const { data: existing } = await db
                .from('demande_helpers')
                .select('id')
                .eq('demande_id', demandeId)
                .eq('statut', 'actif')
                .single();

            if (existing) {
                throw new Error('Cette demande a déjà un helper actif.');
            }

            const { data, error } = await db
                .from('demande_helpers')
                .insert([{
                    demande_id: demandeId,
                    helper_id: helperId,
                    statut: 'actif'
                }])
                .select()
                .single();

            if (error) throw error;

            // Met à jour le statut de la demande
            await API.demandes.updateStatut(demandeId, 'en_cours');

            return data;
        },

        /**
         * Se désiste d'une demande
         * @param {string} demandeId
         * @param {string} helperId
         * @returns {Promise<void>}
         */
        async quitter(demandeId, helperId) {
            const { error } = await db
                .from('demande_helpers')
                .update({ statut: 'annulé' })
                .eq('demande_id', demandeId)
                .eq('helper_id', helperId);

            if (error) throw error;

            // Repasse la demande en attente
            await API.demandes.updateStatut(demandeId, 'en_attente');
        }
    },

    // ─────────────────────────────────────────
    // ÉVÉNEMENTS
    // ─────────────────────────────────────────

    evenements: {

        /**
         * Récupère les événements à venir avec inscriptions
         * @returns {Promise<Array>}
         */
        async getUpcoming() {
            const today = new Date().toISOString().split('T')[0];

            const { data, error } = await db
                .from('evenements')
                .select(`
                    *,
                    organisateur:membres!organisateur_id (
                        id,
                        pseudo,
                        avatar_url
                    ),
                    inscriptions:evenement_inscriptions (
                        id,
                        statut,
                        membre:membres!membre_id (
                            id,
                            pseudo,
                            avatar_url
                        )
                    )
                `)
                .gte('date_evenement', today)
                .in('statut', ['ouvert', 'complet'])
                .order('date_evenement', { ascending: true });

            if (error) throw error;
            return data;
        },

        /**
         * Crée un événement
         * @param {Object} evenement
         * @returns {Promise<Object>}
         */
        async create(evenement) {
            const { data, error } = await db
                .from('evenements')
                .insert([evenement])
                .select()
                .single();

            if (error) throw error;
            return data;
        },

        /**
         * Inscription à un événement
         * Vérifie les places disponibles
         * @param {string} evenementId
         * @param {string} membreId
         * @returns {Promise<Object>}
         */
        async sInscrire(evenementId, membreId) {
            // Récupère l'événement avec le count des inscrits
            const { data: evt, error: evtError } = await db
                .from('evenements')
                .select(`
                    places_max,
                    statut,
                    inscriptions:evenement_inscriptions(count)
                `)
                .eq('id', evenementId)
                .single();

            if (evtError) throw evtError;
            if (evt.statut !== 'ouvert') {
                throw new Error('Cet événement n\'est plus ouvert aux inscriptions.');
            }

            const nbInscrits = evt.inscriptions[0].count;
            if (nbInscrits >= evt.places_max) {
                throw new Error('Événement complet !');
            }

            const { data, error } = await db
                .from('evenement_inscriptions')
                .insert([{
                    evenement_id: evenementId,
                    membre_id: membreId,
                    statut: 'confirmé'
                }])
                .select()
                .single();

            if (error) throw error;

            // Si complet après inscription → met à jour le statut
            if (nbInscrits + 1 >= evt.places_max) {
                await db
                    .from('evenements')
                    .update({ statut: 'complet' })
                    .eq('id', evenementId);
            }

            return data;
        },

        /**
         * Désinscription d'un événement
         * @param {string} evenementId
         * @param {string} membreId
         * @returns {Promise<void>}
         */
        async seDesinscrire(evenementId, membreId) {
            const { error } = await db
                .from('evenement_inscriptions')
                .update({ statut: 'annulé' })
                .eq('evenement_id', evenementId)
                .eq('membre_id', membreId);

            if (error) throw error;

            // Réouvre l'événement s'il était complet
            await db
                .from('evenements')
                .update({ statut: 'ouvert' })
                .eq('id', evenementId)
                .eq('statut', 'complet');
        }
    },

    // ─────────────────────────────────────────
    // STATISTIQUES (Dashboard)
    // ─────────────────────────────────────────

    stats: {

        /**
         * Récupère les 3 compteurs du dashboard
         * @returns {Promise<{demandes, evenements, membres}>}
         */
        async getDashboard() {
            const today = new Date().toISOString().split('T')[0];

            const [demandesRes, evtsRes, membresRes] = await Promise.all([
                db
                    .from('demandes')
                    .select('id', { count: 'exact', head: true })
                    .in('statut', ['en_attente', 'en_cours']),

                db
                    .from('evenements')
                    .select('id', { count: 'exact', head: true })
                    .gte('date_evenement', today)
                    .in('statut', ['ouvert', 'complet']),

                db
                    .from('membres')
                    .select('id', { count: 'exact', head: true })
                    .eq('actif', true)
            ]);

            return {
                demandes: demandesRes.count ?? 0,
                evenements: evtsRes.count ?? 0,
                membres: membresRes.count ?? 0
            };
        }
    }
};
