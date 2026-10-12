// ============================================================================
// admin-painel.js
//
// "Painel administrativo": visão geral da loja, sem protótipo no Figma. Reúne
// o que o administrador precisa ver ao entrar: faturamento e ticket médio dos
// últimos 7 dias, pedidos esperando ação, produtos com estoque em alerta, as
// vendas por dia, os pedidos mais recentes e atalhos para as outras telas.
// Tudo é calculado a partir dos mesmos dados das demais telas.
// ============================================================================

(function () {
  var Dados = window.JacyAdminDados;
  var Admin = window.JacyAdmin;

  var DIAS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

  var CLASSE_STATUS = {
    pendente: 'admin-badge--aviso',
    preparacao: 'admin-badge--rosa',
    enviado: 'admin-badge--azul',
    retirada: 'admin-badge--lilas',
    entregue: 'admin-badge--ok',
    cancelado: 'admin-badge--erro'
  };

  function el(id) { return document.getElementById(id); }

  function mesmoDia(a, b) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }

  // Vendas (pedidos não cancelados) de cada um dos últimos 7 dias, do mais antigo ao de hoje
  function vendasPorDia(pedidos) {
    var dias = [];
    for (var i = 6; i >= 0; i--) {
      var dia = new Date();
      dia.setHours(0, 0, 0, 0);
      dia.setDate(dia.getDate() - i);
      var total = pedidos
        .filter(function (p) { return p.status !== 'cancelado' && mesmoDia(new Date(p.data), dia); })
        .reduce(function (soma, p) { return soma + p.total; }, 0);
      dias.push({ dia: dia, total: total });
    }
    return dias;
  }

  function renderGrafico(dias) {
    var maior = Math.max.apply(null, dias.map(function (d) { return d.total; })) || 1;
    el('painel-grafico').innerHTML = dias.map(function (d) {
      var altura = d.total ? Math.max(4, Math.round((d.total / maior) * 100)) : 0;
      var rotulo = DIAS[d.dia.getDay()] + ' ' + Dados.dataBR(d.dia.toISOString()).slice(0, 5);
      return (
        '<div class="admin-barra-col" role="img" aria-label="' + rotulo + ': ' + Dados.moeda(d.total) + '">' +
        '<span class="admin-barra-valor">' + (d.total ? Math.round(d.total) : '') + '</span>' +
        '<div class="admin-barra-area"><div class="admin-barra" style="height:' + altura + '%"></div></div>' +
        '<span class="admin-barra-dia">' + rotulo + '</span>' +
        '</div>'
      );
    }).join('');
  }

  function renderPedidosRecentes(pedidos) {
    var recentes = pedidos.slice().sort(function (a, b) { return new Date(b.data) - new Date(a.data); }).slice(0, 5);
    el('painel-pedidos-corpo').innerHTML = recentes.map(function (p) {
      return (
        '<tr>' +
        '<td class="admin-pedido-numero">#' + p.numero + '</td>' +
        '<td>' + Admin.esc(p.cliente) + '</td>' +
        '<td><span class="admin-badge ' + CLASSE_STATUS[p.status] + '">' + Dados.STATUS_PEDIDO[p.status].toUpperCase() + '</span></td>' +
        '<td class="col-direita">' + Dados.moeda(p.total) + '</td>' +
        '</tr>'
      );
    }).join('');
  }

  function renderAlertasEstoque(produtos) {
    var alertas = produtos
      .filter(function (p) { return Dados.situacaoEstoque(p) !== 'disponivel'; })
      .sort(function (a, b) { return a.estoque - b.estoque; });

    el('painel-alertas').innerHTML = alertas.length
      ? alertas.slice(0, 5).map(function (p) {
        return (
          '<li class="admin-alerta">' +
          '<img class="admin-foto admin-foto--pequena" src="' + Admin.esc(p.imagens[0] || '') + '" alt="" />' +
          '<div class="admin-prod-info"><p class="admin-prod-nome">' + Admin.esc(p.nome) + '</p>' +
          '<p class="admin-prod-codigo">' + p.estoque + ' UN. em estoque</p></div>' +
          Admin.badgeEstoque(Dados.situacaoEstoque(p)) +
          '</li>'
        );
      }).join('')
      : '<li class="admin-vazio">Nenhum produto com estoque em alerta.</li>';
  }

  document.addEventListener('DOMContentLoaded', function () {
    var pedidos = Dados.listarPedidos();
    var produtos = Dados.listarProdutos();

    var dias = vendasPorDia(pedidos);
    var faturamento = dias.reduce(function (soma, d) { return soma + d.total; }, 0);

    var inicio = dias[0].dia;
    var vendas = pedidos.filter(function (p) { return p.status !== 'cancelado' && new Date(p.data) >= inicio; });
    var ticket = vendas.length ? faturamento / vendas.length : 0;

    el('kpi-faturamento').textContent = Dados.moeda(faturamento);
    el('kpi-pendentes').textContent = pedidos.filter(function (p) { return p.status === 'pendente'; }).length;
    el('kpi-ticket').textContent = Dados.moeda(ticket);
    el('kpi-estoque').textContent = produtos.filter(function (p) { return Dados.situacaoEstoque(p) !== 'disponivel'; }).length;
    el('painel-total-semana').textContent = Dados.moeda(faturamento) + ' em ' + vendas.length + (vendas.length === 1 ? ' pedido' : ' pedidos');

    renderGrafico(dias);
    renderPedidosRecentes(pedidos);
    renderAlertasEstoque(produtos);
  });
})();
