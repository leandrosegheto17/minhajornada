-- Up Migration
-- Tabelas de usuário, sessão e resumo e a função de login (design: Data Models; AD-022, FUN-139, FUN-141).
-- Roda com o papel dono do banco. O papel do app só ganha permissões na migração seguinte (AD-023).

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE usuarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE CHECK (email = lower(email)),
  -- crypt(senha, gen_salt('bf', 12)): bcrypt (FUN-141). Senha em texto puro nunca entra.
  senha_hash text NOT NULL CHECK (senha_hash ~ '^\$2[abxy]\$[0-9]{2}\$'),
  dono boolean NOT NULL DEFAULT false,
  criado_em timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE sessoes (
  token_hash bytea PRIMARY KEY, -- SHA-256 do token (FUN-141)
  usuario_id uuid NOT NULL REFERENCES usuarios (id) ON DELETE CASCADE,
  criada_em timestamptz NOT NULL DEFAULT now(),
  usada_em timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE resumos (
  livro smallint PRIMARY KEY CHECK (livro BETWEEN 1 AND 66),
  conteudo jsonb NOT NULL,
  publicado_em timestamptz NOT NULL DEFAULT now()
);

-- Login (reuso.md R8): devolve o id com a senha certa; NULL com senha errada, e-mail inexistente ou vazio.
-- Sem conta, compara com um hash bcrypt fixo de custo 12, para o tempo de resposta ser o mesmo (FUN-139).
-- VOLATILE: nunca pode vir do cache do Hyperdrive.
CREATE FUNCTION usuario_entrar(p_email text, p_senha text)
  RETURNS uuid
  LANGUAGE plpgsql VOLATILE SECURITY DEFINER
  SET search_path = public, pg_temp
  AS $$
  DECLARE
    c_hash_fixo constant text := '$2a$12$6gPo.a.4j7QhOTbjBd6KFeH3xI0YLFZqmOqdkACBSKmXAC.1uHKvG';
    v_id uuid;
    v_hash text;
    v_confere text;
  BEGIN
    SELECT u.id, u.senha_hash INTO v_id, v_hash FROM usuarios u WHERE u.email = lower(btrim(p_email));
    v_confere := COALESCE(v_hash, c_hash_fixo);
    IF crypt(p_senha, v_confere) = v_confere AND v_confere <> c_hash_fixo THEN
      RETURN v_id;
    END IF;
    RETURN NULL;
  END;
  $$;

-- Só quem recebe a concessão (o papel do app, na migração seguinte) executa; PUBLIC não.
REVOKE ALL ON FUNCTION usuario_entrar(text, text) FROM PUBLIC;

-- Down Migration
DROP FUNCTION usuario_entrar(text, text);
DROP TABLE resumos;
DROP TABLE sessoes;
DROP TABLE usuarios;
