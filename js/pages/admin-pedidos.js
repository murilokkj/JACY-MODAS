// ============================================================================
// admin-pedidos.js
//
// "Gestão de pedidos" (Figma node 429:7497): indicadores por etapa e tabela
// de pedidos. Clicar num indicador filtra a tabela por aquela etapa (clicar
// de novo remove o filtro); o botão da coluna AÇÕES avança o pedido para a
// próxima etapa. Sem pedidos no filtro, mostra a área vazia do Figma.
// ============================================================================

(function () {
  var Dados = window.JacyAdminDados;
  var Admin = window.JacyAdmin;

  var filtro = null;

  // Texto do botão que leva o pedido para a próxima etapa
  var ROTULO_ACAO = {
    preparacao: 'Iniciar preparo',
    enviado: 'Marcar enviado',
    retirada: 'Liberar retirada',
    entregue: 'Concluir entrega'
  };

  var CLASSE_STATUS = {
    pendente: 'admin-badge--aviso',
    preparacao: 'admin-badge--rosa',
    enviado: 'admin-badge--azul',
    retirada: 'admin-badge--lilas',
    entregue: 'admin-badge--ok',
    cancelado: 'admin-badge--erro'
  };

  function linha(p) {
    var proximo = Dados.proximoStatus(p);
    var acao = proximo
      ? '<button type="button" class="admin-btn admin-btn--contorno admin-btn--pequeno" data-avancar="' + p.numero + '">' +
        ROTULO_ACAO[proximo] + '</button>'
      : '<span class="admin-sem-acao">—</span>';
    return (
      '<tr>' +
      '<td class="admin-pedido-numero">#' + p.numero + '</td>' +
      '<td>' + Admin.esc(p.cliente) + '</td>' +
      '<td>' + Dados.dataBR(p.data) + '</td>' +
      '<td>' + p.pagamento + '</td>' +
      '<td><span class="admin-badge ' + CLASSE_STATUS[p.status] + '">' + Dados.STATUS_PEDIDO[p.status].toUpperCase() + '</span></td>' +
      '<td class="col-direita">' + Dados.moeda(p.total) + '</td>' +
      '<td class="col-centro">' + acao + '</td>' +
      '</tr>'
    );
  }

  function render() {
    var pedidos = Dados.listarPedidos();

    ['pendente', 'preparacao', 'enviado', 'retirada', 'entregue'].forEach(function (status) {
      document.getElementById('ind-' + status).textContent = pedidos
        .filter(function (p) { return p.status === status; }).length;
    });
    document.querySelectorAll('[data-filtro]').forEach(function (cartao) {
      cartao.setAttribute('aria-pressed', String(cartao.getAttribute('data-filtro') === filtro));
    });

    var lista = pedidos.filter(function (p) { return !filtro || p.status === filtro; });
    document.getElementById('pedidos-corpo').innerHTML = lista.length
      ? lista.map(linha).join('')
      : '<tr><td colspan="7" class="admin-vazio">Nenhum pedido encontrado.</td></tr>';
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('[data-filtro]').forEach(function (cartao) {
      cartao.addEventListener('click', function () {
        var alvo = cartao.getAttribute('data-filtro');
        filtro = filtro === alvo ? null : alvo;
        render();
      });
    });

    document.getElementById('pedidos-corpo').addEventListener('click', function (e) {
      var botao = e.target.closest('[data-avancar]');
      if (!botao) return;
      var numero = botao.getAttribute('data-avancar');
      var pedido = Dados.listarPedidos().filter(function (p) { return p.numero === numero; })[0];
      var proximo = pedido && Dados.proximoStatus(pedido);
      if (!proximo) return;
      Dados.atualizarStatusPedido(numero, proximo);
      render();
      Admin.notificar('Pedido #' + numero + ' atualizado para "' + Dados.STATUS_PEDIDO[proximo] + '".', 'sucesso');
    });

    render();
  });
})();
