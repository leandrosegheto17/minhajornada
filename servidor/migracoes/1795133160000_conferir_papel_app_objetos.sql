-- Up Migration
-- Conferência do papel do app, objetos próprios (AD-023, achado A-26). Recusa também o papel que é dono de qualquer
-- função, tabela, visão ou sequência, ou tipo: dono muda o objeto (e a função dele roda no search_path do dono). A função
-- é substituída; a migração aplicada não é editada. A chamada usa `::name`: uma sobrecarga `(text)` criada em `public`
-- ganharia de um literal sem tipo.

CREATE OR REPLACE FUNCTION conferir_papel_app(papel name) RETURNS void
LANGUAGE plpgsql
SET search_path = pg_catalog, pg_temp
AS $$
DECLARE
  atributos pg_roles%ROWTYPE;
  grupo text;
  tabela text;
  coluna text;
  esquema record;
  objeto record;
BEGIN
  SELECT * INTO atributos FROM pg_roles WHERE rolname = papel;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'papel % não existe: o /preparar o cria por SQL antes da migração', papel;
  END IF;

  IF atributos.rolsuper THEN RAISE EXCEPTION 'papel % tem rolsuper', papel; END IF;
  IF atributos.rolbypassrls THEN RAISE EXCEPTION 'papel % tem rolbypassrls', papel; END IF;
  IF atributos.rolcreaterole THEN RAISE EXCEPTION 'papel % tem rolcreaterole', papel; END IF;
  IF atributos.rolcreatedb THEN RAISE EXCEPTION 'papel % tem rolcreatedb', papel; END IF;
  IF atributos.rolreplication THEN RAISE EXCEPTION 'papel % tem rolreplication', papel; END IF;

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

  IF EXISTS (SELECT 1 FROM pg_database WHERE datname = current_database() AND datdba = atributos.oid) THEN
    RAISE EXCEPTION 'papel % é dono do banco (e do schema public)', papel;
  END IF;
  IF has_database_privilege(papel, current_database(), 'CREATE') THEN
    RAISE EXCEPTION 'papel % pode CREATE no banco', papel;
  END IF;
  FOR esquema IN
    SELECT nspname, nspowner FROM pg_namespace
     WHERE nspname !~ '^pg_' AND nspname <> 'information_schema'
  LOOP
    IF esquema.nspowner = atributos.oid THEN
      RAISE EXCEPTION 'papel % é dono do schema %', papel, esquema.nspname;
    END IF;
    IF has_schema_privilege(papel, esquema.nspname, 'CREATE') THEN
      RAISE EXCEPTION 'papel % pode CREATE no schema %', papel, esquema.nspname;
    END IF;
  END LOOP;

  FOR objeto IN
    SELECT 'função' AS tipo, p.proname::text AS nome FROM pg_proc p WHERE p.proowner = atributos.oid
    UNION ALL
    SELECT 'tabela, visão ou sequência', c.relname::text FROM pg_class c WHERE c.relowner = atributos.oid
    UNION ALL
    SELECT 'tipo', t.typname::text FROM pg_type t WHERE t.typowner = atributos.oid
  LOOP
    RAISE EXCEPTION 'papel % é dono de % %', papel, objeto.tipo, objeto.nome;
  END LOOP;

  FOREACH tabela IN ARRAY ARRAY['resumos', 'usuarios', 'sessoes'] LOOP
    IF has_table_privilege(papel, 'public.' || tabela, 'TRUNCATE') THEN
      RAISE EXCEPTION 'papel % pode TRUNCATE em %', papel, tabela;
    END IF;
    IF has_table_privilege(papel, 'public.' || tabela, 'TRIGGER') THEN
      RAISE EXCEPTION 'papel % pode TRIGGER em %', papel, tabela;
    END IF;
    IF has_table_privilege(papel, 'public.' || tabela, 'REFERENCES') THEN
      RAISE EXCEPTION 'papel % pode REFERENCES em %', papel, tabela;
    END IF;
  END LOOP;

  FOR coluna IN
    SELECT attname FROM pg_attribute
     WHERE attrelid = 'public.usuarios'::regclass AND attnum > 0 AND NOT attisdropped
       AND attname NOT IN ('id', 'dono')
  LOOP
    IF has_column_privilege(papel, 'public.usuarios', coluna, 'SELECT') THEN
      RAISE EXCEPTION 'papel % pode ler usuarios.% (o app lê só id e dono)', papel, coluna;
    END IF;
  END LOOP;
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

SELECT public.conferir_papel_app('mj_app'::name);

-- Down Migration
-- Sem desfazer útil: a função só confere; a migração que a cria a remove ao ser desfeita.
SELECT 1;
