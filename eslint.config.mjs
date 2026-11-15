import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

// FUN-04: o texto bíblico entra na página como texto, nunca como HTML interpretado.
const MSG_HTML = 'O texto entra como texto, nunca como HTML interpretado (FUN-04).';
const SINTAXE_PROIBIDA = [
  { selector: "JSXAttribute[name.name='dangerouslySetInnerHTML']", message: MSG_HTML },
  { selector: 'AssignmentExpression[left.property.name=/^(innerHTML|outerHTML)$/]', message: MSG_HTML },
  { selector: 'CallExpression[callee.property.name=/^(insertAdjacentHTML|writeln)$/]', message: MSG_HTML },
  { selector: "CallExpression[callee.object.name='document'][callee.property.name='write']", message: MSG_HTML },
  {
    selector:
      'CallExpression[callee.name=/^(setTimeout|setInterval)$/][arguments.0.type=/^(Literal|TemplateLiteral)$/]',
    message: 'setTimeout/setInterval com texto avalia código.',
  },
];

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/coverage/**',
      '**/.wrangler/**',
      '.claude/**',
      '.specs/**',
      '.biblia/**',
      '.worktree/**',
      'test-results/**',
      'playwright-report/**',
      'public/livros/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
  { languageOptions: { globals: { ...globals.node } } },
  { files: ['src/**/*.{ts,tsx}'], languageOptions: { globals: { ...globals.browser } } },
  {
    files: ['src/**/*.{ts,tsx}', 'scripts/**/*.{ts,mjs}'],
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
  // FUN-04: sem HTML interpretado nem avaliação de código no app e nos scripts.
  {
    files: ['src/**/*.{ts,tsx}', 'scripts/**/*.{ts,mjs}'],
    ignores: ['src/**/*.test.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': ['error', ...SINTAXE_PROIBIDA],
      'no-eval': 'error',
      'no-new-func': 'error',
      'no-implied-eval': 'error',
      'no-script-url': 'error',
    },
  },
  // FUN-41: só `src/dados/` faz `fetch` (e só para o próprio site: os livros em /livros/).
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/dados/**', 'src/**/*.test.{ts,tsx}'],
    rules: {
      'no-restricted-globals': [
        'error',
        { name: 'fetch', message: 'fetch só em src/dados/ (FUN-41).' },
        { name: 'XMLHttpRequest', message: 'Requisições só em src/dados/ (FUN-41).' },
      ],
    },
  },
);
