// ============================================================================
// admin-estoque.js
//
// "Controle de estoque" (Figma node 429:7346): indicadores, busca e tabela de
// estoque por produto. Os cartões "Estoque baixo" e "Indisponíveis" também
// funcionam como filtro (clicar de novo remove o filtro). A situação de cada
// produto é calculada pela quantidade (ver situacaoEstoque em admin-dados.js).
// ============================================================================

(function () {
  var Dados = window.JacyAdminDados;
  var Admin = window.JacyAdmin;

  var busca = '';
  var filtro = null; // null, "baixo" ou "indisponivel"

  function filtrar(produtos) {
    var termo = busca.trim().toLowerCase();
    return produtos.filter(function (p) {
      if (filtro && Dados.situacaoEstoque(p) !== filtro) return false;
      if (!termo) return true;
      return [p.nome, p.sku].join(' ').toLowerCase().indexOf(termo) !== -1;
    });
  }

  function linha(p) {
    return (
      '<tr>' +
      '<td><div class="admin-prod">' +
      '<img class="admin-foto" src="' + Admin.esc(p.imagens[0] || '') + '" alt="" />' +
      '<div class="admin-prod-info"><p class="admin-prod-nome">' + Admin.esc(p.nome) + '</p>' +
      '<p class="admin-prod-codigo">Código: ' + Admin.esc(p.sku) + '</p></div></div></td>' +
      '<td>' + Admin.bolinhasCores(p.cores) + '</td>' +
      '<td>' + p.estoque + ' UN.</td>' +
      '<td>' + Admin.badgeEstoque(Dados.situacaoEstoque(p)) + '</td>' +
      '<td class="admin-data-celula">' + Dados.dataHoraBR(p.atualizadoEm) + '</td>' +
      '</tr>'
    );
  }

  function render() {
    var produtos = Dados.listarProdutos();

    document.getElementById('ind-cadastrados').textContent = produtos.length;
    document.getElementById('ind-total').textContent = produtos
      .reduce(function (soma, p) { return soma + p.estoque; }, 0)
      .toLocaleString('pt-BR');
    document.getElementById('ind-baixo').textContent = produtos
      .filter(function (p) { return Dados.situacaoEstoque(p) === 'baixo'; }).length;
    document.getElementById('ind-indisponiveis').textContent = produtos
      .filter(function (p) { return Dados.situacaoEstoque(p) === 'indisponivel'; }).length;

    document.querySelectorAll('[data-filtro]').forEach(function (cartao) {
      cartao.setAttribute('aria-pressed', String(cartao.getAttribute('data-filtro') === filtro));
    });

    var lista = filtrar(produtos);
    document.getElementById('estoque-corpo').innerHTML = lista.length
      ? lista.map(linha).join('')
      : '<tr><td colspan="5" class="admin-vazio">Nenhum produto encontrado.</td></tr>';
  }

  document.addEventListener('DOMContentLoaded', function () {
    var campo = document.getElementById('estoque-busca');

    document.getElementById('estoque-busca-form').addEventListener('submit', function (e) {
      e.preventDefault();
      busca = campo.value;
      render();
    });
    campo.addEventListener('input', function () {
      busca = campo.value;
      render();
    });

    document.querySelectorAll('[data-filtro]').forEach(function (cartao) {
      cartao.addEventListener('click', function () {
        var alvo = cartao.getAttribute('data-filtro');
        filtro = filtro === alvo ? null : alvo;
        render();
      });
    });

    render();
  });
})();
