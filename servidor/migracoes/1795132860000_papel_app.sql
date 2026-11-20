-- Up Migration
-- Permissões mínimas do papel do app (AD-023). O papel `mj_app` é criado pelo /preparar (no teste, pelo apoio de banco);
-- esta migração só concede, e falha se o papel não existir.

REVOKE ALL ON usuarios, sessoes, resumos FROM mj_app;

-- usuarios: só id e dono. Sem hash, sem e-mail, sem escrita.
GRANT SELECT (id, dono) ON usuarios TO mj_app;

-- resumos: só leitura. O texto é publicado pelo papel dono (script de publicação).
GRANT SELECT ON resumos TO mj_app;

-- sessoes: cria, lê, renova (só usada_em) e apaga (logout e vencimento).
GRANT SELECT, INSERT, DELETE ON sessoes TO mj_app;
GRANT UPDATE (usada_em) ON sessoes TO mj_app;

-- Login: o app não lê o hash; pede à função.
GRANT EXECUTE ON FUNCTION usuario_entrar(text, text) TO mj_app;

-- Down Migration
REVOKE EXECUTE ON FUNCTION usuario_entrar(text, text) FROM mj_app;
REVOKE ALL ON usuarios, sessoes, resumos FROM mj_app;
