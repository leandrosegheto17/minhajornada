-- Up Migration
-- Conferência do papel do app, completa (AD-023, achado A-17). A anterior olhava só a herança de três grupos e os
-- privilégios diretos em `resumos`. Esta recusa também: qualquer membresia de outro papel (com NOINHERIT o privilégio
-- vem por `SET ROLE`, que `has_table_privilege` não conta), TRUNCATE nas três tabelas e escrita em `usuarios`
-- (INSERT, DELETE e UPDATE de qualquer coluna). A migração aplicada não é editada: a função é substituída aqui.

CREATE OR REPLACE FUNCTION conferir_papel_app(papel name) RETURNS void
LANGUAGE plpgsql
SET search_path = pg_catalog, pg_temp
AS $$
DECLARE
  atributos pg_roles%ROWTYPE;
  grupo text;
  tabela text;
BEGIN
  SELECT * INTO atributos FROM pg_roles WHERE rolname = papel;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'papel % não existe: o /preparar o cria por SQL antes da migração', papel;
  END IF;

  IF atributos.rolsuper THEN RAISE EXCEPTION 'papel % tem rolsuper', papel; END IF;
  IF atributos.rolbypassrls THEN RAISE EXCEPTION 'papel % tem rolbypassrls', papel; END IF;
  IF atributos.rolcreaterole THEN RAISE EXCEPTION 'papel % tem rolcreaterole', papel; END IF;
  IF atributos.rolcreatedb THEN RAISE EXCEPTION 'papel % tem rolcreatedb', papel; END IF;

  -- `MEMBER` vale com NOINHERIT; `USAGE` não enxergaria a membresia sem herança.
  FOREACH grupo IN ARRAY ARRAY['neon_superuser', 'pg_read_all_data', 'pg_write_all_data'] LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = grupo) AND pg_has_role(papel, grupo, 'MEMBER') THEN
      RAISE EXCEPTION 'papel % é membro de %', papel, grupo;
    END IF;
  END LOOP;

  SELECT string_agg(r.rolname, ', ' ORDER BY r.rolname) INTO grupo
    FROM pg_auth_members m JOIN pg_roles r ON r.oid = m.roleid
   WHERE m.member = atributos.oid;
  IF grupo IS NOT NULL THEN
    RAISE EXCEPTION 'papel % é membro de %: o papel do app não pertence a nenhum grupo', papel, grupo;
  END IF;

  FOREACH tabela IN ARRAY ARRAY['resumos', 'usuarios', 'sessoes'] LOOP
    IF has_table_privilege(papel, 'public.' || tabela, 'TRUNCATE') THEN
      RAISE EXCEPTION 'papel % pode TRUNCATE em %', papel, tabela;
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
  IF has_table_privilege(papel, 'public.usuarios', 'INSERT')
     OR has_table_privilege(papel, 'public.usuarios', 'DELETE')
     OR has_any_column_privilege(papel, 'public.usuarios', 'UPDATE') THEN
    RAISE EXCEPTION 'papel % pode escrever em usuarios (o app só lê id e dono)', papel;
  END IF;
END
$$;

SELECT conferir_papel_app('mj_app');

-- Down Migration
-- Sem desfazer útil: a função completa só confere; a migração anterior (que a cria) a remove ao ser desfeita.
SELECT 1;
