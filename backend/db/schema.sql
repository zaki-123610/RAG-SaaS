CREATE TABLE IF NOT EXISTS users (
    id          SERIAL PRIMARY KEY,
    email       TEXT UNIQUE NOT NULL,
    password    TEXT NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bots (
    id          TEXT PRIMARY KEY,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bots_user ON bots(user_id);

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS documents (
    id          SERIAL PRIMARY KEY,
    bot_id      TEXT NOT NULL REFERENCES bots(id) ON DELETE CASCADE,
    filename    TEXT NOT NULL,
    chunks      INTEGER DEFAULT 0,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chunks (
    id          SERIAL PRIMARY KEY,
    bot_id      TEXT NOT NULL REFERENCES bots(id) ON DELETE CASCADE,
    document_id INTEGER REFERENCES documents(id) ON DELETE CASCADE,
    content     TEXT NOT NULL,
    embedding   vector(1024) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_chunks_bot ON chunks(bot_id);
CREATE INDEX IF NOT EXISTS idx_documents_bot ON documents(bot_id);

ALTER TABLE bots ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE;
ALTER TABLE bots ADD COLUMN IF NOT EXISTS allowed_origins TEXT[] DEFAULT '{}';
ALTER TABLE bots ADD COLUMN IF NOT EXISTS daily_limit INTEGER DEFAULT 100;

CREATE TABLE IF NOT EXISTS public_queries (
    id         SERIAL PRIMARY KEY,
    bot_id     TEXT NOT NULL REFERENCES bots(id) ON DELETE CASCADE,
    question   TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_public_queries_bot_date
    ON public_queries(bot_id, created_at);

ALTER TABLE users ADD COLUMN IF NOT EXISTS chunk_limit INTEGER DEFAULT 500;

-- Emails insensibles a la casse : on passe tout en minuscules et on pose un
-- index unique sur lower(email). Ne fait rien s il existe deja des doublons
-- qui ne different que par la casse (a regler a la main), pour ne jamais
-- bloquer le demarrage de l app.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM users GROUP BY lower(email) HAVING COUNT(*) > 1
    ) THEN
        UPDATE users SET email = lower(email) WHERE email <> lower(email);
        CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_lower ON users (lower(email));
    END IF;
END $$;