// ============================================================================
// favoritos.js
//
// Monta a tela "Meus Favoritos" (favoritos.html) a partir do que o usuário
// marcou como favorito nas páginas de produto (botão "Adicionar aos
// favoritos" em js/pages/product.js, persistido por js/shared/catalog.js).
//
// Figma: node 176:953 "❤️ Meus Favoritos" — estados "favoritos-lista"
// (176:531) e "favoritos-vazio" (176:667).
// ============================================================================

(function () {
  // Formata um número como preço em reais: 44.99 -> "R$44,99"
  function money(v) {
    return 'R$' + v.toFixed(2).replace('.', ',');
  }

  // Gera o mesmo card de produto usado na home/pesquisa/recomendados,
  // para manter a aparência consistente em todo o site.
  function cardProdutoHtml(slug, produto) {
    return (
      '<a class="produto" href="produto.html?produto=' + slug + '">' +
      '<div class="produto-imagem"><img src="' + produto.imagens[0] + '" alt="' + produto.nome + '" /></div>' +
      '<div class="produto-info">' +
      (produto.tag ? '<p class="produto-tag">' + produto.tag + '</p>' : '') +
      '<p class="produto-nome">' + produto.nome + '</p>' +
      '<p class="produto-preco">' + money(produto.preco) + '</p>' +
      '<p class="produto-parcelas">10x de ' + money(produto.preco / 10) + '</p>' +
      '</div>' +
      '</a>'
    );
  }

  // Mostra a lista de favoritos ou, se não houver nenhum, o cartão
  // "Você ainda não tem favoritos" com o botão "Explorar produtos".
  function render() {
    var comItens = document.getElementById('favoritos-com-itens');
    var vazio = document.getElementById('favoritos-vazio');
    var lista = document.getElementById('favoritos-lista');
    if (!comItens || !vazio || !lista) return; // só faz sentido em favoritos.html

    var slugs = window.JacyCatalog.getFavoritos();
    var produtos = window.JacyCatalog.PRODUCTS;

    if (slugs.length === 0) {
      comItens.hidden = true;
      vazio.hidden = false;
      return;
    }

    vazio.hidden = true;
    comItens.hidden = false;
    lista.innerHTML = slugs
      .filter(function (slug) { return produtos[slug]; }) // ignora slugs que não existem mais no catálogo
      .map(function (slug) { return cardProdutoHtml(slug, produtos[slug]); })
      .join('');
  }

  document.addEventListener('DOMContentLoaded', render);
})();
