/* resumo-livro · barra.js
   Barra de título do projeto (.specs/mockup/barra.js) com os acréscimos da feature:
   - data-sessao="dono" no <body>: "Sair" no lugar de "Entrar / Criar conta" (FUN-142);
   - data-resumo="ligado|desligado" no <body>: botão "Resumo" logo depois do de formato, só no modo
     livro e só com sessão de dono (FUN-153), com aria-pressed (FUN-162). Sem o atributo, sem botão.
   O botão "Resumo" chama window.alternarResumo(ligado) se a tela definir.
   Tema pelo endereço (#claro, #escuro, #sepia) e painel "Aa", como no projeto. Só para o mockup. */
(function () {
  var raiz = document.documentElement;
  var corpo = document.body;
  var formato = corpo.getAttribute('data-formato') || 'rolagem';
  var destino = corpo.getAttribute('data-destino-formato') || '';
  var dono = corpo.getAttribute('data-sessao') === 'dono';
  var resumo = corpo.getAttribute('data-resumo');
  var paraLivro = formato === 'rolagem';
  var hash = location.hash;

  var icLivro = '<svg class="icone" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 6.5C10 5 7 4.5 3.5 5v13c3.5-.5 6.5 0 8.5 1.5 2-1.5 5-2 8.5-1.5V5C17 4.5 14 5 12 6.5Zm0 0V19.5" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"/></svg>';
  var icRolagem = '<svg class="icone" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4h10M7 20h10M5 8h14M5 12h14M5 16h14" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></svg>';
  var icResumo = '<svg class="icone" viewBox="0 0 24 24" aria-hidden="true"><rect x="4.5" y="3.5" width="15" height="17" rx="2" fill="none" stroke="currentColor" stroke-width="1.9"/><path d="M8 8h8M8 12h8M8 16h5" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></svg>';
  var icAa = '<svg class="icone" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 18 8.5 5h1L15 18M5 14h8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M16.5 18v-5.2a2.4 2.4 0 0 1 4.6-.9M16.5 15.5h4.5V18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var icSobre = '<svg class="icone" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 11v6M12 7.5v.5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>';
  var icConta = '<svg class="icone" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8.5" r="3.8" fill="none" stroke="currentColor" stroke-width="1.9"/><path d="M4.5 20c.8-3.8 3.8-5.8 7.5-5.8s6.7 2 7.5 5.8" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></svg>';
  var icSair = '<svg class="icone" viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4.5H6.5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2H14M10 12h10m-3.5-3.5L20 12l-3.5 3.5" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  var botaoResumo = (dono && !paraLivro && resumo)
    ? '<button class="botao-alternar" data-acao="resumo" aria-pressed="' + (resumo === 'ligado') + '" aria-label="Resumo do livro">' + icResumo + '<span class="rotulo-alternar">Resumo</span></button>'
    : '';
  var conta = dono
    ? '<a class="botao-conta" href="livro-resumo.html?sessao=nao' + hash + '" aria-label="Sair">' + icSair + '<span class="rotulo-conta">Sair</span></a>'
    : '<a class="botao-conta" href="entrar.html' + hash + '" aria-label="Entrar ou criar conta">' + icConta + '<span class="rotulo-conta">Entrar / Criar conta</span></a>';

  var barra = document.createElement('header');
  barra.className = 'barra-titulo';
  barra.innerHTML =
    '<div class="barra-titulo__conteudo">' +
      '<a class="marca" href="#" aria-label="MinhaJornada, página inicial">MinhaJornada</a>' +
      '<div class="grupo-acoes">' +
        '<a class="botao-formato" href="' + destino + hash + '" aria-label="' + (paraLivro ? 'Ler como livro' : 'Ler em rolagem') + '">' +
          (paraLivro ? icLivro : icRolagem) + '<span class="rotulo-formato">' + (paraLivro ? 'Livro' : 'Rolagem') + '</span></a>' +
        botaoResumo +
        '<div class="ancora-painel">' +
          '<button class="botao-icone" data-acao="aparencia" aria-label="Aparência: letra e tema" aria-expanded="false" aria-controls="painel-aparencia">' + icAa + '</button>' +
          '<section class="painel-aparencia" id="painel-aparencia" aria-label="Aparência" hidden>' +
            '<h2>Aparência</h2>' +
            '<div class="painel-linha"><span class="painel-rotulo" id="rotulo-letra">Tamanho da letra</span>' +
              '<div class="controle-letra" role="group" aria-labelledby="rotulo-letra">' +
                '<button class="botao-icone" data-acao="menos" aria-label="Diminuir letra"><svg class="icone" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 12h12" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg></button>' +
                '<output aria-live="polite">Letra 3 de 5</output>' +
                '<button class="botao-icone" data-acao="mais" aria-label="Aumentar letra"><svg class="icone" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 12h12M12 6v12" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg></button>' +
              '</div></div>' +
            '<div class="painel-linha"><span class="painel-rotulo" id="rotulo-tema">Tema</span>' +
              '<div class="seletor-tema" role="group" aria-labelledby="rotulo-tema">' +
                '<button class="opcao-tema" data-tema="claro">Claro</button>' +
                '<button class="opcao-tema" data-tema="escuro">Escuro</button>' +
                '<button class="opcao-tema" data-tema="sepia">Sépia</button>' +
              '</div></div>' +
          '</section>' +
        '</div>' +
        '<a class="botao-icone" href="#" aria-label="Sobre o MinhaJornada">' + icSobre + '</a>' +
        conta +
      '</div>' +
    '</div>';
  corpo.insertBefore(barra, corpo.firstChild);

  /* botão "Resumo" */
  var br = barra.querySelector('[data-acao=resumo]');
  if (br) br.addEventListener('click', function () {
    var ligado = br.getAttribute('aria-pressed') !== 'true';
    br.setAttribute('aria-pressed', String(ligado));
    if (window.alternarResumo) window.alternarResumo(ligado);
  });

  /* tema pelo endereço */
  var temas = ['claro', 'escuro', 'sepia'];
  var nomeTema = hash.replace('#', '').split('-')[0];
  if (temas.indexOf(nomeTema) >= 0) raiz.setAttribute('data-tema', nomeTema);
  function marcarTema() {
    var atual = raiz.getAttribute('data-tema') || 'claro';
    barra.querySelectorAll('.opcao-tema').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.tema === atual)); });
  }
  barra.querySelectorAll('.opcao-tema').forEach(function (b) {
    b.addEventListener('click', function () { raiz.setAttribute('data-tema', b.dataset.tema); marcarTema(); });
  });
  marcarTema();

  /* letra */
  var menos = barra.querySelector('[data-acao=menos]'), mais = barra.querySelector('[data-acao=mais]'), saida = barra.querySelector('.controle-letra output');
  function letra(d) {
    var n = Math.min(5, Math.max(1, (+raiz.getAttribute('data-letra') || 3) + d));
    raiz.setAttribute('data-letra', n);
    menos.disabled = n === 1; mais.disabled = n === 5;
    saida.textContent = 'Letra ' + n + ' de 5';
  }
  menos.onclick = function () { letra(-1); };
  mais.onclick = function () { letra(1); };
  letra(0);

  /* painel "Aa" */
  var abre = barra.querySelector('[data-acao=aparencia]'), painel = barra.querySelector('#painel-aparencia');
  abre.onclick = function () { var v = painel.hidden; painel.hidden = !v; abre.setAttribute('aria-expanded', String(v)); };
})();
