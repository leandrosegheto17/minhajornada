/**
 * Dependências do app (design: "Servidor"). Cada tarefa acrescenta o que usa: a URL pública (guarda de Host e de
 * origem), o limite de login, o cliente do banco, o relógio e o log.
 */
export interface Deps {
  /** URL pública do ambiente (ex.: https://minhajornada.ljssoftware.com.br); ausente ou ilegível, a API responde 500. */
  urlPublica?: string | undefined;
}
