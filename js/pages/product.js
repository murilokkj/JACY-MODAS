// ============================================================================
// product.js
//
// Comportamento da página de produto (produto.html?produto=<slug>).
// Figma: "🛍️ Produtos" (celular: 289:3391 — uma foto, várias fotos,
// promoção e indisponível).
//
// Lê o slug da URL, busca o produto em js/shared/catalog.js e monta a
// página: galeria de fotos, título/preços, tamanhos, cores, quantidade,
// favoritar, adicionar ao carrinho e cálculo de frete.
// ============================================================================

(function () {
  // Bolinhas de cor oferecidas em todos os produtos de exemplo, e o nome de
  // cada cor na mesma ordem (usado no carrinho: "P, Preto").
  var CORES = [
    '../assets/icons/cor-opcao-1.svg',
    '../assets/icons/cor-opcao-2.svg',
    '../assets/icons/cor-opcao-3.svg',
    '../assets/icons/cor-opcao-4.svg'
  ];
  var CORES_NOMES = ['Preto', 'Branco', 'Azul', 'Rosa'];
  var TAMANHOS = ['PP', 'P', 'M', 'G', 'GG'];

  // O catálogo de produtos agora vive em js/shared/catalog.js (compartilhado com a
  // página "Meus Favoritos"), que precisa carregar antes deste arquivo.
  var PRODUCTS = window.JacyCatalog.PRODUCTS;

  // Formata um número como preço em reais: 44.99 -> "R$44,99"
  function money(v) {
    return 'R$' + v.toFixed(2).replace('.', ',');
  }

  // Lê um parâmetro da URL (ex.: getParam('produto') em ?produto=blusa)
  function getParam(name) {
    return new URLSearchParams(window.location.search).get(name);
  }

  // Produto exibido. Slug ausente ou desconhecido cai no "cropped".
  var slug = getParam('produto') || 'cropped';
  var produto = PRODUCTS[slug] || PRODUCTS.cropped;

  // Escolhas atuais do usuário na página. Cada render* lê daqui; os cliques
  // alteram o estado e chamam o render correspondente de novo.
  var state = {
    tamanho: TAMANHOS[1],
    corIndex: 0,
    qtd: 1,
    fotoAtiva: 0,
    favorito: window.JacyCatalog.isFavorito(slug),
    frete: 'retirar'
  };

  // Galeria: foto principal e, quando o produto tem mais de uma foto,
  // miniaturas (computador) ou setas (celular) para trocar a foto.
  function renderGaleria() {
    var el = document.getElementById('produto-galeria');
    var temMiniaturas = produto.imagens.length > 1;
    var html = '';
    if (temMiniaturas) {
      html += '<div class="produto-galeria-miniaturas">';
      produto.imagens.forEach(function (src, i) {
        html += '<img src="' + src + '" data-foto="' + i + '" class="' + (i === state.fotoAtiva ? 'ativa' : '') + '" alt="" />';
      });
      html += '</div>';
    }
    // No celular as miniaturas somem e a troca de foto é feita pelas setas
    // ao lado da foto principal (Figma 289:1565 "Galeria de Imagens").
    var seta = function (lado, passo) {
      return temMiniaturas
        ? '<button type="button" class="galeria-seta so-mobile-bloco" data-passo="' + passo + '" aria-label="' +
            (passo < 0 ? 'Foto anterior' : 'Próxima foto') + '"><img src="../assets/icons/angle-' + lado + '.svg" alt="" /></button>'
        : '';
    };
    html += seta('left', -1);
    html += '<div class="produto-foto-principal"><img src="' + produto.imagens[state.fotoAtiva] + '" alt="' + produto.nome + '" id="produto-foto-principal-img" /></div>';
    html += seta('right', 1);
    el.innerHTML = html;

    el.querySelectorAll('[data-passo]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var total = produto.imagens.length;
        state.fotoAtiva = (state.fotoAtiva + Number(btn.getAttribute('data-passo')) + total) % total;
        renderGaleria();
      });
    });

    if (temMiniaturas) {
      el.querySelectorAll('[data-foto]').forEach(function (img) {
        img.addEventListener('click', function () {
          state.fotoAtiva = Number(img.getAttribute('data-foto'));
          renderGaleria();
        });
      });
    }
  }

  // Título da aba, categoria, nome, preço (com o preço antigo riscado em
  // promoções), parcelas em 10x e a tag "Últimas unidades!", se houver.
  function renderInfo() {
    document.getElementById('page-title').textContent = produto.nome + ' — Jacy Modas';
    document.getElementById('produto-categoria').textContent = produto.categoria;
    document.getElementById('produto-titulo').textContent = produto.nome;

    var precosEl = document.getElementById('produto-precos');
    if (produto.precoOriginal) {
      precosEl.innerHTML =
        '<span class="produto-preco-atual">' + money(produto.preco) + '</span>' +
        '<span class="produto-preco-original">' + money(produto.precoOriginal) + '</span>';
    } else {
      precosEl.innerHTML = '<span class="produto-preco-atual">' + money(produto.preco) + '</span>';
    }
    document.getElementById('produto-parcelas').textContent = '10x de ' + money(produto.preco / 10);

    var tagEl = document.getElementById('produto-tag');
    if (produto.tag) {
      tagEl.textContent = produto.tag;
      tagEl.hidden = false;
    } else {
      tagEl.hidden = true;
    }
  }

  // Botões de tamanho e bolinhas de cor; o selecionado fica destacado
  function renderOpcoes() {
    var tamanhosEl = document.getElementById('produto-tamanhos');
    tamanhosEl.innerHTML = TAMANHOS.map(function (t) {
      return '<button type="button" data-tamanho="' + t + '" class="' + (t === state.tamanho ? 'selecionado' : '') + '">' + t + '</button>';
    }).join('');
    tamanhosEl.querySelectorAll('button').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.tamanho = btn.getAttribute('data-tamanho');
        renderOpcoes();
      });
    });

    var coresEl = document.getElementById('produto-cores');
    coresEl.innerHTML = CORES.map(function (src, i) {
      return '<button type="button" data-cor="' + i + '" class="' + (i === state.corIndex ? 'selecionado' : '') + '"><img src="' + src + '" alt="' + CORES_NOMES[i] + '" /></button>';
    }).join('');
    coresEl.querySelectorAll('button').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.corIndex = Number(btn.getAttribute('data-cor'));
        renderOpcoes();
      });
    });
  }

  // Número exibido entre os botões "-" e "+"
  function renderQtde() {
    document.getElementById('qtde-valor').textContent = String(state.qtd);
  }

  // Opção "Retirar na loja" (grátis), que aparece com ou sem CEP informado
  function retirarOptionHtml() {
    return (
      '<p class="entrega-label" style="margin-top:16px">Retirar na loja:</p>' +
      '<label class="frete-opcao ' + (state.frete === 'retirar' ? 'selecionado' : '') + '">' +
      '<input type="radio" name="produto-frete" value="retirar" ' + (state.frete === 'retirar' ? 'checked' : '') + ' />' +
      '<span class="frete-info"><strong>Retirar em:</strong><small>Rua Martino Arosio, 38 — Vila Aurora, São Paulo - SP, 05186-150</small></span>' +
      '<span class="frete-preco">Grátis</span>' +
      '</label>'
    );
  }

  // Seção "Envio:". Sem CEP salvo mostra o campo + "Calcular"; com CEP
  // mostra o CEP (editável) e as opções SEDEX/PAC. O CEP é o mesmo do
  // carrinho (window.JacyStore), então vale para as duas telas.
  function renderEnvio() {
    var el = document.getElementById('produto-envio-conteudo');
    var cep = window.JacyStore.getCep();

    if (cep) {
      el.innerHTML =
        '<input class="cep-display" type="text" id="produto-cep-display" value="' + cep + '" />' +
        '<label class="frete-opcao ' + (state.frete === 'sedex' ? 'selecionado' : '') + '" style="margin-top:16px">' +
        '<input type="radio" name="produto-frete" value="sedex" ' + (state.frete === 'sedex' ? 'checked' : '') + ' />' +
        '<span class="frete-info"><strong>Correios - SEDEX</strong><small>Chega em 1 a 2 dias úteis</small></span>' +
        '<span class="frete-preco">R$10,00</span>' +
        '</label>' +
        '<label class="frete-opcao ' + (state.frete === 'pac' ? 'selecionado' : '') + '" style="margin-top:16px">' +
        '<input type="radio" name="produto-frete" value="pac" ' + (state.frete === 'pac' ? 'checked' : '') + ' />' +
        '<span class="frete-info"><strong>Correios - PAC</strong><small>Chega em 2 a 5 dias úteis</small></span>' +
        '<span class="frete-preco">R$10,00</span>' +
        '</label>' +
        retirarOptionHtml();
      var cepDisplay = document.getElementById('produto-cep-display');
      cepDisplay.addEventListener('change', function () {
        window.JacyStore.setCep(cepDisplay.value.trim());
        renderEnvio();
      });
      cepDisplay.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          cepDisplay.blur();
        }
      });
    } else {
      el.innerHTML =
        '<input class="dp-input" type="text" id="produto-cep-input" placeholder="Digite seu CEP" />' +
        '<div class="cep-actions" style="margin-top:16px">' +
        '<button type="button" class="dp-btn-mini" id="produto-calcular-cep">Calcular</button>' +
        '<span class="dp-link-inline">Não sei meu CEP</span>' +
        '</div>' +
        retirarOptionHtml();
      document.getElementById('produto-calcular-cep').addEventListener('click', function () {
        var input = document.getElementById('produto-cep-input');
        if (input && input.value.trim()) {
          window.JacyStore.setCep(input.value.trim());
          renderEnvio();
        }
      });
    }

    el.querySelectorAll('input[name="produto-frete"]').forEach(function (radio) {
      radio.addEventListener('change', function () {
        state.frete = radio.value;
        renderEnvio();
      });
    });
  }

  // Liga os botões de quantidade, favoritar e "Adicionar ao carrinho"
  function wireAcoes() {
    document.getElementById('qtde-menos').addEventListener('click', function () {
      state.qtd = Math.max(1, state.qtd - 1);
      renderQtde();
    });
    document.getElementById('qtde-mais').addEventListener('click', function () {
      state.qtd += 1;
      renderQtde();
    });

    // Botão de favoritar: o estado é persistido em localStorage (via
    // js/shared/catalog.js) para poder aparecer depois na página "Meus Favoritos".
    var favBtn = document.getElementById('produto-favoritar');
    var atualizarBotaoFavorito = function () {
      favBtn.classList.toggle('favoritado', state.favorito);
      favBtn.querySelector('span').textContent = state.favorito ? 'Adicionado aos favoritos' : 'Adicionar aos favoritos';
    };
    atualizarBotaoFavorito(); // reflete o estado salvo assim que a página carrega
    favBtn.addEventListener('click', function () {
      state.favorito = window.JacyCatalog.toggleFavorito(slug);
      atualizarBotaoFavorito();
    });

    // "Adicionar ao carrinho": salva o item com o tamanho, a cor e a
    // quantidade escolhidos e já abre o painel do carrinho.
    document.getElementById('btn-comprar').addEventListener('click', function () {
      window.JacyStore.addToCart({
        id: slug,
        nome: produto.nome,
        preco: produto.preco,
        imagem: produto.imagens[0],
        tamanho: state.tamanho,
        cor: CORES_NOMES[state.corIndex],
        qtd: state.qtd
      });
      window.JacyStore.openPanel('cart');
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    renderGaleria();
    renderInfo();
    renderOpcoes();
    renderQtde();
    renderEnvio();
    wireAcoes();
  });
})();
