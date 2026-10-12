// ============================================================================
// admin.js
//
// Estrutura comum das telas administrativas (pages/admin/): monta o menu
// lateral (com a seção atual destacada) e oferece utilitários usados por
// todas elas. Cada página informa qual é pelo atributo
// <body data-admin-pagina="produtos|cadastro|estoque|pedidos|painel">.
// ============================================================================

(function () {
  var ICONES = '../../assets/icons/admin/';

  // Seções do menu lateral, na ordem do Figma
  var SECOES = [
    { pagina: 'produtos', href: 'gerenciamento-produtos.html', rotulo: 'Gerenciamento de produtos', icone: 'nav-produtos' },
    { pagina: 'cadastro', href: 'cadastro-produto.html', rotulo: 'Cadastro de produtos', icone: 'nav-cadastro' },
    { pagina: 'estoque', href: 'controle-estoque.html', rotulo: 'Controle de estoque', icone: 'nav-estoque' },
    { pagina: 'pedidos', href: 'gestao-pedidos.html', rotulo: 'Gestão de pedidos', icone: 'nav-pedidos' },
    { pagina: 'painel', href: 'painel.html', rotulo: 'Painel administrativo', icone: 'nav-painel' }
  ];

  // Escapa texto digitado pelo administrador antes de colocá-lo em innerHTML
  function esc(texto) {
    return String(texto)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function montarMenu() {
    var nav = document.getElementById('admin-nav');
    if (!nav) return;
    var atual = document.body.getAttribute('data-admin-pagina');

    var itens = SECOES.map(function (s) {
      var ativo = s.pagina === atual;
      return (
        '<a class="admin-nav-item' + (ativo ? ' ativo' : '') + '" href="' + s.href + '"' +
        (ativo ? ' aria-current="page"' : '') + '>' +
        '<img src="' + ICONES + s.icone + (ativo ? '-ativo' : '') + '.svg" alt="" />' +
        '<span>' + s.rotulo + '</span>' +
        '</a>'
      );
    }).join('');

    // "Sair" volta para a loja (não há login de administrador neste protótipo)
    nav.innerHTML =
      '<div class="admin-nav-secoes">' + itens + '</div>' +
      '<a class="admin-nav-item admin-nav-sair" href="../index.html">' +
      '<img src="' + ICONES + 'nav-sair.svg" alt="" /><span>Sair</span></a>';
  }

  // Notificação no canto inferior direito (mesmo visual do restante do site)
  var ICONES_NOTIFICACAO = {
    sucesso: '../../assets/icons/circle-check.svg',
    erro: '../../assets/icons/x-circle-vermelho.svg'
  };

  function notificar(mensagem, tipo) {
    if (tipo !== 'sucesso' && tipo !== 'erro') tipo = 'info';
    var area = document.getElementById('notificacoes');
    if (!area) {
      area = document.createElement('div');
      area.id = 'notificacoes';
      area.className = 'notificacoes';
      document.body.appendChild(area);
    }
    var el = document.createElement('div');
    el.className = 'notificacao notificacao--' + tipo;
    el.setAttribute('role', tipo === 'erro' ? 'alert' : 'status');
    el.innerHTML =
      (ICONES_NOTIFICACAO[tipo] ? '<img class="notificacao-icone" src="' + ICONES_NOTIFICACAO[tipo] + '" alt="" />' : '') +
      '<p class="notificacao-texto"></p>' +
      '<button type="button" class="notificacao-fechar" aria-label="Fechar notificação">&times;</button>';
    el.querySelector('.notificacao-texto').textContent = mensagem;
    area.appendChild(el);

    var fechar = function () {
      if (el.classList.contains('saindo')) return;
      el.classList.add('saindo');
      setTimeout(function () { el.remove(); }, 250);
    };
    el.querySelector('.notificacao-fechar').addEventListener('click', fechar);
    setTimeout(fechar, 4500);
  }

  // "ATIVO" / "INATIVO" na cor certa
  function badgeProduto(status) {
    return status === 'ativo'
      ? '<span class="admin-badge admin-badge--ok">ATIVO</span>'
      : '<span class="admin-badge admin-badge--erro">INATIVO</span>';
  }

  // Situação do estoque de um produto (usada no controle de estoque e no painel)
  var ROTULOS_ESTOQUE = {
    disponivel: ['admin-badge--ok', 'DISPONÍVEL'],
    baixo: ['admin-badge--aviso', 'ESTOQUE BAIXO'],
    indisponivel: ['admin-badge--erro', 'INDISPONÍVEL']
  };

  function badgeEstoque(situacao) {
    var r = ROTULOS_ESTOQUE[situacao];
    return '<span class="admin-badge ' + r[0] + '">' + r[1] + '</span>';
  }

  // Bolinhas de cor (até 3) e "+N" com as demais
  function bolinhasCores(cores) {
    var visiveis = cores.slice(0, 3).map(function (c) {
      return '<span class="admin-cor-bolinha" style="background:' + esc(c.hex) + '" title="' + esc(c.nome) + '"></span>';
    }).join('');
    var extra = cores.length > 3 ? '<span class="admin-cores-extra">+' + (cores.length - 3) + '</span>' : '';
    return '<div class="admin-cores">' + visiveis + extra + '</div>';
  }

  document.addEventListener('DOMContentLoaded', montarMenu);

  window.JacyAdmin = {
    esc: esc,
    notificar: notificar,
    badgeProduto: badgeProduto,
    badgeEstoque: badgeEstoque,
    bolinhasCores: bolinhasCores
  };
})();
