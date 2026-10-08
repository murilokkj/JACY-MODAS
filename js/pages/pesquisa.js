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
  // "tamanhos" e "cores" são usados pelos filtros da lateral (valores iguais
  // aos "value" dos checkboxes em pesquisa.html).
  var PRODUTOS = [
    {
      slug: 'cropped',
      nome: 'Cropped recorte preto',
      preco: 44.99,
      parcelas: '10x de R$4,99',
      imagem: '../assets/images/produto-cropped.png',
      tamanhos: ['PP', 'P', 'M', 'G'],
      cores: ['Preto'],
      disponivel: true
    },
    {
      slug: null,
      nome: 'Calça moletom wide leg',
      preco: 99.9,
      parcelas: '10x de R$9,90',
      imagem: '../assets/images/produto-calca-indisponivel.png',
      tamanhos: ['P', 'M', 'G', 'GG'],
      cores: ['Preto'],
      disponivel: false
    },
    {
      slug: 'conjunto',
      nome: 'Conjunto moletom (forrado por dentro)',
      preco: 44.99,
      parcelas: '10x de R$4,99',
      imagem: '../assets/images/categoria-conjuntos.png',
      tamanhos: ['P', 'M', 'G'],
      cores: ['Azul'],
      disponivel: true
    },
    {
      slug: 'blusa',
      nome: 'Blusa tricô modal',
      preco: 34.99,
      parcelas: '10x de R$3,50',
      imagem: '../assets/images/produto-blusa-trico.png',
      tag: 'Últimas unidades!',
      tamanhos: ['P', 'M', 'G', 'GG'],
      cores: ['Rosa', 'Branco'],
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

  // Ordem escolhida em "Ordenar produtos por:" e filtros salvos pelo botão
  // "Salvar filtros". Os checkboxes e campos de preço só passam a valer
  // depois do clique no botão — mexer neles sozinho não muda os resultados.
  var ordemAtual = 'relevancia';
  var filtros = { tamanhos: [], cores: [], precoMin: null, precoMax: null };

  // true se algum filtro foi salvo
  function temFiltros() {
    return filtros.tamanhos.length > 0 || filtros.cores.length > 0 ||
      filtros.precoMin !== null || filtros.precoMax !== null;
  }

  // Converte o texto do campo de preço em número ("49,90" ou "R$ 49.90" ->
  // 49.9). Campo vazio ou inválido = sem limite (null).
  function lerPreco(texto) {
    var limpo = texto.replace(/[^\d,.]/g, '').replace(',', '.');
    var valor = parseFloat(limpo);
    return isNaN(valor) ? null : valor;
  }

  // Lê os checkboxes marcados e os campos de preço da lateral
  function lerFiltrosDaTela() {
    var marcados = function (nome) {
      return Array.prototype.map.call(
        document.querySelectorAll('#filtro-sidebar input[name="' + nome + '"]:checked'),
        function (input) { return input.value; }
      );
    };
    return {
      tamanhos: marcados('tamanho'),
      cores: marcados('cor'),
      precoMin: lerPreco(document.getElementById('filtro-preco-min').value),
      precoMax: lerPreco(document.getElementById('filtro-preco-max').value)
    };
  }

  // Um produto passa se tiver ao menos um dos tamanhos marcados, ao menos uma
  // das cores marcadas e o preço dentro da faixa (grupos vazios não filtram).
  function passaNosFiltros(p) {
    var temAlgum = function (doProduto, marcados) {
      return marcados.length === 0 || marcados.some(function (v) { return doProduto.indexOf(v) !== -1; });
    };
    return temAlgum(p.tamanhos, filtros.tamanhos) &&
      temAlgum(p.cores, filtros.cores) &&
      (filtros.precoMin === null || p.preco >= filtros.precoMin) &&
      (filtros.precoMax === null || p.preco <= filtros.precoMax);
  }

  // Desenha a grade de resultados: filtra pelo termo buscado (se houver) e
  // pelos filtros salvos, ordena e monta os cards. Sem termo nem filtros, a
  // lista de exemplo é repetida 3x só para preencher a página como no design.
  function renderProdutos() {
    var container = document.getElementById('pesquisa-produtos');
    var base = PRODUTOS.filter(function (p) {
      var passaNoTermo = !TERMO || normalizar(p.nome).indexOf(normalizar(TERMO)) !== -1;
      return passaNoTermo && passaNosFiltros(p);
    });
    if (base.length === 0) {
      container.innerHTML = '<p class="pesquisa-vazia">' + (TERMO
        ? 'Nenhum produto encontrado para "' + TERMO.replace(/</g, '&lt;') + '"' + (temFiltros() ? ' com os filtros selecionados.' : '.')
        : 'Nenhum produto encontrado com os filtros selecionados.') + '</p>';
      return;
    }
    // A repetição acontece ANTES de ordenar: assim a ordenação vale para a
    // grade inteira (ex.: em "Menor preço" todos os itens de R$44,99 vêm
    // primeiro e os mais caros só no fim), em vez de repetir uma sequência
    // já ordenada três vezes.
    var repetido = TERMO || temFiltros() ? base : base.concat(base, base);
    var lista = ordenar(repetido, ordemAtual);
    container.innerHTML = lista.map(cardHtml).join('');
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
    renderProdutos();

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
        ordemAtual = ordem;
        renderProdutos();
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
    // "Salvar filtros": aplica o que está marcado na lateral e, no celular,
    // fecha a folha de filtros para mostrar os resultados.
    document.getElementById('btn-salvar-filtros').addEventListener('click', function () {
      filtros = lerFiltrosDaTela();
      renderProdutos();
      alternarFiltros(false);
    });

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
