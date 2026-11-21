-- Up Migration
-- Conferência do papel do app (AD-023, achado A-07). A migração anterior concede o mínimo, mas não tira poder que o papel
-- já tenha: no Neon, o papel criado pelo Console, pela CLI ou pela API entra em `neon_superuser` (CREATEROLE, BYPASSRLS
-- e os papéis que leem e gravam todos os dados). Esta migração faz o deploy parar, antes de publicar o Worker, se o
-- `mj_app` tiver mais do que a AD-023 permite. O `/preparar` cria o papel por SQL (`CREATE ROLE mj_app LOGIN NOINHERIT`).

CREATE FUNCTION conferir_papel_app(papel name) RETURNS void
LANGUAGE plpgsql
SET search_path = pg_catalog, pg_temp
AS $$
DECLARE
  atributos pg_roles%ROWTYPE;
  grupo text;
BEGIN
  SELECT * INTO atributos FROM pg_roles WHERE rolname = papel;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'papel % não existe: o /preparar o cria por SQL antes da migração', papel;
  END IF;

  IF atributos.rolsuper THEN RAISE EXCEPTION 'papel % tem rolsuper', papel; END IF;
  IF atributos.rolbypassrls THEN RAISE EXCEPTION 'papel % tem rolbypassrls', papel; END IF;
  IF atributos.rolcreaterole THEN RAISE EXCEPTION 'papel % tem rolcreaterole', papel; END IF;
  IF atributos.rolcreatedb THEN RAISE EXCEPTION 'papel % tem rolcreatedb', papel; END IF;

  FOREACH grupo IN ARRAY ARRAY['neon_superuser', 'pg_read_all_data', 'pg_write_all_data'] LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = grupo) AND pg_has_role(papel, grupo, 'MEMBER') THEN
      RAISE EXCEPTION 'papel % é membro de %', papel, grupo;
    END IF;
  END LOOP;

  IF has_column_privilege(papel, 'public.usuarios', 'senha_hash', 'SELECT') THEN
    RAISE EXCEPTION 'papel % pode ler usuarios.senha_hash', papel;
  END IF;
  IF has_table_privilege(papel, 'public.resumos', 'INSERT')
     OR has_table_privilege(papel, 'public.resumos', 'DELETE')
     OR has_any_column_privilege(papel, 'public.resumos', 'UPDATE') THEN
    RAISE EXCEPTION 'papel % pode escrever em resumos (o texto é publicado só pelo papel dono)', papel;
  END IF;
END
$$;

REVOKE ALL ON FUNCTION conferir_papel_app(name) FROM PUBLIC;

SELECT conferir_papel_app('mj_app');

-- Down Migration
DROP FUNCTION conferir_papel_app(name);
