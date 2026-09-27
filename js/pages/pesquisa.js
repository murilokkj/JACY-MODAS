// ============================================================================
// pesquisa.js
//
// Comportamento da tela de resultados de busca (pesquisa.html).
// Figma: "🔍 Tela de Pesquisa" (celular: 289:3390).
//
// A página pode ser aberta de três jeitos:
//   - pela barra de busca do header  -> pesquisa.html?q=termo
//     (filtra os produtos pelo nome e mostra "Buscando por: termo");
//   - pelo menu de categorias        -> pesquisa.html?categoria=camisas
//     (mostra "Buscando por: Camisas");
//   - sem parâmetros                  -> lista todos os produtos.
//
// Também cuida da ordenação ("Ordenar produtos por:") e, no celular, da
// folha de filtros que sobe da parte de baixo da tela.
// ============================================================================

(function () {
  // Produtos de exemplo exibidos nos resultados. "slug" é o identificador
  // usado em produto.html?produto=...; produtos indisponíveis não têm página.
  var PRODUTOS = [
    {
      slug: 'cropped',
      nome: 'Cropped recorte preto',
      preco: 44.99,
      parcelas: '10x de R$4,99',
      imagem: '../assets/images/produto-cropped.png',
      disponivel: true
    },
    {
      slug: null,
      nome: 'Calça moletom wide leg',
      preco: 99.9,
      parcelas: '10x de R$9,90',
      imagem: '../assets/images/produto-calca-indisponivel.png',
      disponivel: false
    },
    {
      slug: 'conjunto',
      nome: 'Conjunto moletom (forrado por dentro)',
      preco: 44.99,
      parcelas: '10x de R$4,99',
      imagem: '../assets/images/categoria-conjuntos.png',
      disponivel: true
    },
    {
      slug: 'blusa',
      nome: 'Blusa tricô modal',
      preco: 44.99,
      parcelas: '10x de R$4,99',
      imagem: '../assets/images/produto-blusa-trico.png',
      tag: 'Últimas unidades!',
      disponivel: true
    }
  ];

  // Texto mostrado no campo "Ordenar produtos por:" para cada opção da lista
  var ORDEM_LABELS = {
    relevancia: 'Relevância',
    vendidos: 'Mais vendidos',
    'menor-preco': 'Menor preço',
    'maior-preco': 'Maior preço',
    az: 'Ordem alfabética (A-Z)',
    za: 'Ordem alfabética (Z-A)'
  };

  // Devolve uma cópia da lista ordenada (a original não é alterada).
  // "Relevância" e "Mais vendidos" mantêm a ordem original, já que não há
  // dados de vendas nos produtos de exemplo.
  function ordenar(lista, ordem) {
    var copia = lista.slice();
    switch (ordem) {
      case 'menor-preco':
        return copia.sort(function (a, b) { return a.preco - b.preco; });
      case 'maior-preco':
        return copia.sort(function (a, b) { return b.preco - a.preco; });
      case 'az':
        return copia.sort(function (a, b) { return a.nome.localeCompare(b.nome); });
      case 'za':
        return copia.sort(function (a, b) { return b.nome.localeCompare(a.nome); });
      default:
        return copia;
    }
  }

  // HTML do card de um produto, igual ao da tela inicial. Produto indisponível
  // vira um <article> sem link, com a faixa cinza "Indisponível" sobre a foto.
  function cardHtml(p) {
    if (!p.disponivel) {
      return (
        '<article class="produto">' +
        '<div class="produto-imagem produto-indisponivel">' +
        '<img src="' + p.imagem + '" alt="' + p.nome + '" />' +
        '<div class="indisponivel-overlay"><span>Indisponível</span></div>' +
        '</div>' +
        '<div class="produto-info">' +
        '<p class="produto-nome">' + p.nome + '</p>' +
        '<p class="produto-preco">' + moneyBR(p.preco) + '</p>' +
        '<p class="produto-parcelas">' + p.parcelas + '</p>' +
        '</div>' +
        '</article>'
      );
    }
    return (
      '<a class="produto" href="produto.html?produto=' + p.slug + '">' +
      '<div class="produto-imagem"><img src="' + p.imagem + '" alt="' + p.nome + '" /></div>' +
      '<div class="produto-info">' +
      (p.tag ? '<p class="produto-tag">' + p.tag + '</p>' : '') +
      '<p class="produto-nome">' + p.nome + '</p>' +
      '<p class="produto-preco">' + moneyBR(p.preco) + '</p>' +
      '<p class="produto-parcelas">' + p.parcelas + '</p>' +
      '</div>' +
      '</a>'
    );
  }

  // Formata um número como preço em reais: 44.99 -> "R$44,99"
  function moneyBR(v) {
    return 'R$' + v.toFixed(2).replace('.', ',');
  }

  // Termo digitado na barra de busca do header (pesquisa.html?q=...)
  var TERMO = (new URLSearchParams(window.location.search).get('q') || '').trim();

  // Compara sem acentos e sem diferenciar maiúsculas ("calca" acha "Calça")
  function normalizar(texto) {
    return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }

  // Desenha a grade de resultados: filtra pelo termo buscado (se houver),
  // ordena e monta os cards. Sem termo, a lista de exemplo é repetida 3x
  // só para preencher a página como no design.
  function renderProdutos(ordem) {
    var container = document.getElementById('pesquisa-produtos');
    var base = TERMO
      ? PRODUTOS.filter(function (p) { return normalizar(p.nome).indexOf(normalizar(TERMO)) !== -1; })
      : PRODUTOS;
    if (base.length === 0) {
      container.innerHTML = '<p class="pesquisa-vazia">Nenhum produto encontrado para "' +
        TERMO.replace(/</g, '&lt;') + '".</p>';
      return;
    }
    var lista = ordenar(base, ordem);
    var repetido = TERMO ? lista : lista.concat(lista, lista);
    container.innerHTML = repetido.map(cardHtml).join('');
  }

  document.addEventListener('DOMContentLoaded', function () {
    // Título "Buscando por: ..." com o termo digitado no header
    if (TERMO) document.getElementById('termo-busca').textContent = TERMO;

    // Vindo do menu de categorias (pesquisa.html?categoria=camisas): o título
    // mostra o nome da categoria, lido do próprio link do menu ("Camisas").
    var categoria = new URLSearchParams(window.location.search).get('categoria');
    if (!TERMO && categoria) {
      var linkCategoria = document.querySelector('#panel-menu a[href="pesquisa.html?categoria=' + categoria + '"]');
      document.getElementById('termo-busca').textContent = linkCategoria
        ? linkCategoria.textContent.trim()
        : categoria.charAt(0).toUpperCase() + categoria.slice(1);
    }
    renderProdutos('relevancia');

    // "Ordenar produtos por:": o campo abre/fecha a lista de opções; escolher
    // uma opção atualiza o texto do campo e redesenha os resultados.
    var input = document.getElementById('ordenar-input');
    var lista = document.getElementById('ordenar-lista');
    var selecionadoLabel = document.getElementById('ordenar-selecionado');

    input.addEventListener('click', function (e) {
      e.stopPropagation();
      lista.hidden = !lista.hidden;
    });

    lista.querySelectorAll('button').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var ordem = btn.getAttribute('data-ordem');
        selecionadoLabel.textContent = ORDEM_LABELS[ordem];
        lista.hidden = true;
        renderProdutos(ordem);
      });
    });

    // Clicar em qualquer outro lugar da página fecha a lista de ordenação
    document.addEventListener('click', function () {
      lista.hidden = true;
    });

    // Celular: a lateral de filtros vira uma folha que sobe do rodapé da
    // tela; o fundo escuro ou o Esc fecham (Figma 305:3116).
    var sidebar = document.getElementById('filtro-sidebar');
    var fundo = document.getElementById('filtro-fundo');
    var abrirFiltros = document.getElementById('btn-abrir-filtros');
    var alternarFiltros = function (abrir) {
      sidebar.classList.toggle('aberta', abrir);
      fundo.hidden = !abrir;
    };
    abrirFiltros.addEventListener('click', function (e) {
      e.stopPropagation();
      alternarFiltros(true);
    });
    fundo.addEventListener('click', function () { alternarFiltros(false); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') alternarFiltros(false);
    });
  });
})();
