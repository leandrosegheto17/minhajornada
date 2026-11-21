/* Ícones do mockup (.specs/mockup/telas/*.html e guia.html), sempre decorativos: o rótulo fica no botão (FUN-44). */

const traco = {
  fill: 'none',
  stroke: 'currentColor',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

export function IconeAparencia() {
  return (
    <svg className="icone" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 18 8.5 5h1L15 18M5 14h8" {...traco} strokeWidth="2" />
      <path d="M16.5 18v-5.2a2.4 2.4 0 0 1 4.6-.9M16.5 15.5h4.5V18" {...traco} strokeWidth="1.8" />
    </svg>
  );
}

export function IconeSobre() {
  return (
    <svg className="icone" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M12 11v6M12 7.5v.5" {...traco} strokeWidth="2.2" />
    </svg>
  );
}

export function IconeAbaixo() {
  return (
    <svg className="icone" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 10l5 5 5-5" {...traco} strokeWidth="2" />
    </svg>
  );
}

export function IconeMais() {
  return (
    <svg className="icone" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 12h12M12 6v12" {...traco} strokeWidth="2.2" />
    </svg>
  );
}

export function IconeMenos() {
  return (
    <svg className="icone" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 12h12" {...traco} strokeWidth="2.2" />
    </svg>
  );
}

export function IconeLivro() {
  return (
    <svg className="icone" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5zM4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconeSemRede() {
  return (
    <svg className="icone" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M7 18h10a4 4 0 0 0 .6-7.95A6 6 0 0 0 6.2 9.6 4.2 4.2 0 0 0 7 18z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M4 4l16 16" {...traco} strokeWidth="2" />
    </svg>
  );
}

export function IconeLivroAberto() {
  return (
    <svg className="icone" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 6.5C10 5 7 4.5 3.5 5v13c3.5-.5 6.5 0 8.5 1.5 2-1.5 5-2 8.5-1.5V5C17 4.5 14 5 12 6.5Zm0 0V19.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconeRolagem() {
  return (
    <svg className="icone" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 4h10M7 20h10M5 8h14M5 12h14M5 16h14" {...traco} strokeWidth="1.9" />
    </svg>
  );
}

export function IconeConta() {
  return (
    <svg className="icone" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="8.5" r="3.8" fill="none" stroke="currentColor" strokeWidth="1.9" />
      <path d="M4.5 20c.8-3.8 3.8-5.8 7.5-5.8s6.7 2 7.5 5.8" {...traco} strokeWidth="1.9" />
    </svg>
  );
}

export function IconeResumo() {
  return (
    <svg className="icone" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4.5" y="3.5" width="15" height="17" rx="2" fill="none" stroke="currentColor" strokeWidth="1.9" />
      <path d="M8 8h8M8 12h8M8 16h5" {...traco} strokeWidth="1.9" />
    </svg>
  );
}
