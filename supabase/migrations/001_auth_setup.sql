-- =============================================
-- Authentification — schéma et politiques RLS
-- À exécuter dans l'éditeur SQL Supabase
-- =============================================

-- Lien entre auth.users et la table membres existante
ALTER TABLE public.membres
    ADD COLUMN IF NOT EXISTS user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS discord_id TEXT UNIQUE,
    ADD COLUMN IF NOT EXISTS username TEXT;

CREATE INDEX IF NOT EXISTS idx_membres_user_id ON public.membres(user_id);
CREATE INDEX IF NOT EXISTS idx_membres_pseudo_lower ON public.membres(lower(pseudo));

-- Recherche d'e-mail par pseudo (connexion avec nom d'utilisateur)
CREATE OR REPLACE FUNCTION public.get_email_by_pseudo(p_pseudo TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_email TEXT;
BEGIN
    SELECT email INTO v_email
    FROM public.membres
    WHERE lower(pseudo) = lower(trim(p_pseudo))
       OR lower(username) = lower(trim(p_pseudo))
    LIMIT 1;

    RETURN v_email;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_email_by_pseudo(TEXT) TO anon, authenticated;

-- Profil membre automatique à la création d'un compte auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_pseudo TEXT;
    v_avatar TEXT;
BEGIN
    v_pseudo := COALESCE(
        NEW.raw_user_meta_data->>'username',
        NEW.raw_user_meta_data->>'pseudo',
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        split_part(NEW.email, '@', 1)
    );

    v_avatar := COALESCE(
        NEW.raw_user_meta_data->>'avatar_url',
        NEW.raw_user_meta_data->>'picture'
    );

    BEGIN
        INSERT INTO public.membres (user_id, pseudo, username, email, avatar_url, actif, discord_id, classe, niveau)
        VALUES (
            NEW.id,
            v_pseudo,
            COALESCE(NEW.raw_user_meta_data->>'username', v_pseudo),
            NEW.email,
            v_avatar,
            true,
            CASE
                WHEN NEW.raw_app_meta_data->>'provider' = 'discord'
                THEN COALESCE(NEW.raw_user_meta_data->>'provider_id', NEW.raw_user_meta_data->>'sub')
                ELSE NULL
            END,
            'Non renseigné',
            1
        )
        ON CONFLICT (user_id) DO UPDATE SET
            email = EXCLUDED.email,
            avatar_url = COALESCE(EXCLUDED.avatar_url, public.membres.avatar_url),
            discord_id = COALESCE(EXCLUDED.discord_id, public.membres.discord_id),
            username = COALESCE(EXCLUDED.username, public.membres.username);
    EXCEPTION WHEN OTHERS THEN
        -- Ne bloque pas la création du compte auth si le profil membre échoue
        RAISE WARNING 'handle_new_user: %', SQLERRM;
    END;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Mise à jour Discord après liaison de compte
CREATE OR REPLACE FUNCTION public.sync_discord_identity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NEW.raw_app_meta_data->>'provider' = 'discord' THEN
        UPDATE public.membres
        SET
            discord_id = COALESCE(NEW.raw_user_meta_data->>'provider_id', discord_id),
            avatar_url = COALESCE(NEW.raw_user_meta_data->>'avatar_url', avatar_url)
        WHERE user_id = NEW.id;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
    AFTER UPDATE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_discord_identity();

-- RLS sur membres
ALTER TABLE public.membres ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Membres visibles par utilisateurs connectés" ON public.membres;
CREATE POLICY "Membres visibles par utilisateurs connectés"
    ON public.membres FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Membre modifiable par son propriétaire" ON public.membres;
CREATE POLICY "Membre modifiable par son propriétaire"
    ON public.membres FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Membre insérable par son propriétaire" ON public.membres;
CREATE POLICY "Membre insérable par son propriétaire"
    ON public.membres FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);
