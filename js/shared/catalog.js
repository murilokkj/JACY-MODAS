// ============================================================================
// catalog.js
//
// Catálogo de produtos compartilhado entre as páginas (antes vivia só dentro
// de js/pages/product.js) e o sistema de favoritos ("Meus Favoritos", Figma node
// 176:953). Precisa carregar ANTES de js/pages/product.js e js/pages/favoritos.js.
// ============================================================================

(function () {
  // Produtos de exemplo, indexados pelo slug usado na URL
  // (produto.html?produto=<slug>). "precoOriginal" marca uma promoção e
  // "imagens" com mais de uma foto ativa a galeria com miniaturas/setas.
  var PRODUCTS = {
    cropped: {
      nome: 'Cropped recorte preto',
      categoria: 'Croppeds',
      preco: 44.99,
      imagens: ['../assets/images/produto-cropped.png']
    },
    conjunto: {
      nome: 'Conjunto moletom (forrado por dentro)',
      categoria: 'Conjuntos',
      preco: 44.99,
      imagens: ['../assets/images/categoria-conjuntos.png']
    },
    blusa: {
      nome: 'Blusa tricô modal',
      categoria: 'Blusas',
      preco: 34.99,
      tag: 'Últimas unidades!',
      imagens: [
        '../assets/images/produto-blusa-trico.png',
        '../assets/images/produto-blusa-trico.png',
        '../assets/images/produto-blusa-trico.png',
        '../assets/images/produto-blusa-trico.png'
      ]
    },
    'vestido-promocao': {
      nome: 'Vestido poliamida',
      categoria: 'Vestidos',
      preco: 44.99,
      precoOriginal: 54.99,
      imagens: ['../assets/images/categoria-vestidos.png']
    }
  };

  // --------------------------------------------------------------------
  // Favoritos: lista de slugs de produto guardada no localStorage, igual
  // ao padrão já usado para o carrinho (js/shared/header.js).
  // --------------------------------------------------------------------
  var FAVORITOS_KEY = 'jm_favoritos';

  // Lista de slugs favoritados (vazia se ainda não houver nada salvo)
  function getFavoritos() {
    try {
      var v = JSON.parse(localStorage.getItem(FAVORITOS_KEY));
      return Array.isArray(v) ? v : [];
    } catch (e) {
      return [];
    }
  }

  // true se o produto já está nos favoritos
  function isFavorito(slug) {
    return getFavoritos().indexOf(slug) !== -1;
  }

  // Adiciona/remove o produto dos favoritos e devolve o novo estado (true = favoritado)
  function toggleFavorito(slug) {
    var favoritos = getFavoritos();
    var indice = favoritos.indexOf(slug);
    if (indice === -1) {
      favoritos.push(slug);
    } else {
      favoritos.splice(indice, 1);
    }
    localStorage.setItem(FAVORITOS_KEY, JSON.stringify(favoritos));
    return indice === -1; // true se acabou de ser adicionado
  }

  // Tira o produto dos favoritos (sem efeito se ele não estiver lá)
  function removerFavorito(slug) {
    var favoritos = getFavoritos().filter(function (s) { return s !== slug; });
    localStorage.setItem(FAVORITOS_KEY, JSON.stringify(favoritos));
  }

  // Disponível para js/pages/product.js e js/pages/favoritos.js
  window.JacyCatalog = {
    PRODUCTS: PRODUCTS,
    getFavoritos: getFavoritos,
    isFavorito: isFavorito,
    toggleFavorito: toggleFavorito,
    removerFavorito: removerFavorito
  };
})();
