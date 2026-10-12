// ============================================================================
// admin-produtos.js
//
// "Gerenciamento de produtos" (Figma node 429:7090): lista os produtos
// cadastrados, com busca, seleção, edição e exclusão. As colunas são
// alinhadas pelas classes das <col> da tabela (ver css/style.css, seção
// "Área administrativa"), então cabeçalho e linhas nunca ficam desalinhados.
// ============================================================================

(function () {
  var Dados = window.JacyAdminDados;
  var Admin = window.JacyAdmin;

  var busca = '';
  var selecionados = [];

  function filtrar() {
    var termo = busca.trim().toLowerCase();
    return Dados.listarProdutos().filter(function (p) {
      if (!termo) return true;
      return [p.nome, p.sku, p.categoria].join(' ').toLowerCase().indexOf(termo) !== -1;
    });
  }

  function precoHtml(p) {
    if (p.promocional) {
      return '<strong class="admin-preco-promo">' + Dados.moeda(p.promocional) + '</strong>' +
        '<s class="admin-preco-antigo">' + Dados.moeda(p.preco) + '</s>';
    }
    return Dados.moeda(p.preco);
  }

  function linha(p) {
    var nome = Admin.esc(p.nome);
    return (
      '<tr data-id="' + p.id + '">' +
      '<td class="c-sel"><input type="checkbox" class="admin-check" data-selecionar aria-label="Selecionar ' + nome + '"' +
      (selecionados.indexOf(p.id) !== -1 ? ' checked' : '') + ' /></td>' +
      '<td><div class="admin-prod">' +
      '<img class="admin-foto" src="' + Admin.esc(p.imagens[0] || '') + '" alt="" />' +
      '<div class="admin-prod-info"><p class="admin-prod-nome">' + nome + '</p>' +
      '<p class="admin-prod-codigo">Código: ' + Admin.esc(p.sku) + '</p></div></div></td>' +
      '<td class="admin-maiuscula">' + Admin.esc(p.categoria) + '</td>' +
      '<td class="col-centro">' + precoHtml(p) + '</td>' +
      '<td class="col-centro">' + p.estoque + '</td>' +
      '<td class="col-centro">' + Admin.badgeProduto(p.status) + '</td>' +
      '<td class="col-centro"><a class="admin-icone-btn" href="cadastro-produto.html?editar=' + encodeURIComponent(p.id) +
      '" aria-label="Editar ' + nome + '"><img src="../../assets/icons/admin/editar.svg" alt="" /></a></td>' +
      '<td class="col-centro"><button type="button" class="admin-icone-btn" data-excluir aria-label="Excluir ' + nome + '">' +
      '<img src="../../assets/icons/admin/excluir.svg" alt="" /></button></td>' +
      '</tr>'
    );
  }

  function render() {
    var lista = filtrar();
    var corpo = document.getElementById('produtos-corpo');

    corpo.innerHTML = lista.length
      ? lista.map(linha).join('')
      : '<tr><td colspan="8" class="admin-vazio">' +
        (busca.trim() ? 'Nenhum produto encontrado para “' + Admin.esc(busca.trim()) + '”.' : 'Nenhum produto cadastrado ainda.') +
        '</td></tr>';

    // Só mantém selecionados os produtos que ainda existem
    var existentes = Dados.listarProdutos().map(function (p) { return p.id; });
    selecionados = selecionados.filter(function (id) { return existentes.indexOf(id) !== -1; });

    var todos = document.getElementById('produtos-selecionar-todos');
    var idsVisiveis = lista.map(function (p) { return p.id; });
    var qtdVisiveisSel = idsVisiveis.filter(function (id) { return selecionados.indexOf(id) !== -1; }).length;
    todos.checked = idsVisiveis.length > 0 && qtdVisiveisSel === idsVisiveis.length;
    todos.indeterminate = qtdVisiveisSel > 0 && qtdVisiveisSel < idsVisiveis.length;
    todos.disabled = idsVisiveis.length === 0;

    var barra = document.getElementById('produtos-selecao');
    barra.hidden = selecionados.length === 0;
    document.getElementById('produtos-selecao-texto').textContent =
      selecionados.length + (selecionados.length === 1 ? ' produto selecionado' : ' produtos selecionados');
  }

  function excluir(ids, mensagem) {
    if (!window.confirm(mensagem)) return;
    Dados.excluirProdutos(ids);
    selecionados = selecionados.filter(function (id) { return ids.indexOf(id) === -1; });
    render();
    Admin.notificar(ids.length === 1 ? 'Produto excluído.' : ids.length + ' produtos excluídos.', 'sucesso');
  }

  document.addEventListener('DOMContentLoaded', function () {
    var campo = document.getElementById('produtos-busca');

    document.getElementById('produtos-busca-form').addEventListener('submit', function (e) {
      e.preventDefault();
      busca = campo.value;
      render();
    });
    campo.addEventListener('input', function () {
      busca = campo.value;
      render();
    });

    var corpo = document.getElementById('produtos-corpo');
    corpo.addEventListener('change', function (e) {
      if (!e.target.matches('[data-selecionar]')) return;
      var id = e.target.closest('tr').getAttribute('data-id');
      var i = selecionados.indexOf(id);
      if (e.target.checked && i === -1) selecionados.push(id);
      if (!e.target.checked && i !== -1) selecionados.splice(i, 1);
      render();
    });
    corpo.addEventListener('click', function (e) {
      var botao = e.target.closest('[data-excluir]');
      if (!botao) return;
      var id = botao.closest('tr').getAttribute('data-id');
      var produto = Dados.obterProduto(id);
      excluir([id], 'Deseja excluir o produto "' + produto.nome + '"?');
    });

    document.getElementById('produtos-selecionar-todos').addEventListener('change', function (e) {
      var ids = filtrar().map(function (p) { return p.id; });
      selecionados = e.target.checked
        ? selecionados.concat(ids.filter(function (id) { return selecionados.indexOf(id) === -1; }))
        : selecionados.filter(function (id) { return ids.indexOf(id) === -1; });
      render();
    });

    document.getElementById('produtos-excluir-selecionados').addEventListener('click', function () {
      excluir(selecionados.slice(), 'Deseja excluir os ' + selecionados.length + ' produtos selecionados?');
    });

    render();
  });
})();
