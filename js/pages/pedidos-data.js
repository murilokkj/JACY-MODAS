// ============================================================================
// pedidos-data.js
//
// Dados de exemplo e funções de renderização para as telas de "Meus Pedidos"
// (Figma: node 176:952 - "📦 Meus Pedidos").
//
// Este arquivo é usado por DUAS páginas:
//   - pedidos.html          -> lista/histórico de pedidos (renderListaPedidos)
//   - pedido-detalhe.html   -> detalhe de um pedido específico (renderDetalhePedido)
//
// Como não existe um backend real, os pedidos abaixo são dados fixos (mock).
// Os pedidos #34928 e #34810 reproduzem exatamente o conteúdo do Figma
// (estados "Entregue" e "Em andamento"). Os pedidos #34562 e #33912 não
// tinham uma tela de detalhe própria no design, então foram completados de
// forma coerente com o padrão visual das outras duas telas.
// ============================================================================

(function () {
  // Base de dados dos pedidos, indexada pelo número do pedido.
  var PEDIDOS = {
    '34928': {
      numero: '34928',
      data: '12/05/2026',
      status: 'entregue', // usado para escolher a cor do badge e o layout do detalhe
      statusLabel: 'Entregue',
      total: 134.97,
      // Imagens usadas como miniatura na listagem (uma por item do pedido)
      thumbs: ['../assets/images/produto-cropped.png', '../assets/images/categoria-vestidos.png'],
      // Dados exclusivos do template "detalhe de pedido entregue"
      endereco: 'Rua das Palmeiras, 742 - Jardim Aurora, São Paulo/SP - CEP: 01234-567',
      destinatario: 'João da Silva',
      metodoPagamento: 'Cartão de Crédito (Mastercard **** 4242) em 3x',
      subtotal: 124.97,
      frete: 10.0,
      itens: [
        {
          nome: 'Cropped Recorte Preto',
          variacao: 'Tamanho: P | Cor: Preto | Qtd: 1',
          preco: 44.99,
          imagem: '../assets/images/produto-cropped.png'
        },
        {
          nome: 'Vestido Poliamida Especial',
          variacao: 'Tamanho: M | Cor: Rosa | Qtd: 2',
          preco: 89.98,
          imagem: '../assets/images/categoria-vestidos.png'
        }
      ]
    },
    '34810': {
      numero: '34810',
      data: '08/05/2026',
      status: 'andamento',
      statusLabel: 'Em andamento',
      total: 44.99,
      thumbs: ['../assets/images/produto-cropped.png'],
      // Dados exclusivos do template "detalhe de pedido com rastreio"
      codigoRastreio: 'JC987654321BR',
      subtotal: 34.99,
      frete: 10.0,
      // Cada etapa da entrega: "concluido" (já aconteceu), "atual" (acontecendo
      // agora) ou "pendente" (ainda não aconteceu, aparece esmaecida)
      timeline: [
        { titulo: 'Pedido Confirmado', data: '08/05/2026 - 10:00', estado: 'concluido' },
        { titulo: 'Pagamento Aprovado', data: '08/05/2026 - 10:05', estado: 'concluido' },
        { titulo: 'Em Separação', data: '08/05/2026 - 14:00', estado: 'concluido' },
        { titulo: 'Enviado (Correios Sedex)', data: '09/05/2026 - 09:00', estado: 'concluido' },
        { titulo: 'Em Trânsito para o destinatário (Atual)', data: '10/05/2026 - 15:30', estado: 'atual' },
        { titulo: 'Entregue', data: 'Previsão: 12/05/2026', estado: 'pendente' }
      ]
    },
    '34562': {
      numero: '34562',
      data: '28/04/2026',
      status: 'cancelado',
      statusLabel: 'Cancelado',
      total: 99.9,
      thumbs: ['../assets/images/produto-calca-indisponivel.png'],
      endereco: 'Rua das Palmeiras, 742 - Jardim Aurora, São Paulo/SP - CEP: 01234-567',
      destinatario: 'João da Silva',
      metodoPagamento: 'Pix',
      subtotal: 99.9,
      frete: 0,
      itens: [
        {
          nome: 'Calça Moletom Wide Leg',
          variacao: 'Tamanho: M | Cor: Preto | Qtd: 1',
          preco: 99.9,
          imagem: '../assets/images/produto-calca-indisponivel.png'
        }
      ]
    },
    '33912': {
      numero: '33912',
      data: '15/04/2026',
      status: 'entregue',
      statusLabel: 'Entregue',
      total: 79.99,
      thumbs: ['../assets/images/produto-blusa-trico.png'],
      endereco: 'Rua das Palmeiras, 742 - Jardim Aurora, São Paulo/SP - CEP: 01234-567',
      destinatario: 'João da Silva',
      metodoPagamento: 'Cartão de Crédito (Visa **** 1234) em 1x',
      subtotal: 79.99,
      frete: 0,
      itens: [
        {
          nome: 'Blusa Tricô Modal',
          variacao: 'Tamanho: G | Cor: Vermelho | Qtd: 1',
          preco: 79.99,
          imagem: '../assets/images/produto-blusa-trico.png'
        }
      ]
    }
  };

  // Formata um número para o padrão de moeda usado no site (R$0,00)
  function money(v) {
    return 'R$' + v.toFixed(2).replace('.', ',');
  }

  // Monta o HTML do badge colorido de status (Entregue / Em andamento / Cancelado)
  function statusBadgeHtml(pedido) {
    return '<div class="status-badge status-badge--' + pedido.status + '">' + pedido.statusLabel + '</div>';
  }

  // ----------------------------------------------------------------------
  // Página de LISTA (pedidos.html): desenha um card por pedido
  // ----------------------------------------------------------------------
  function renderListaPedidos() {
    var container = document.getElementById('order-list');
    if (!container) return; // esta função só faz sentido em pedidos.html

    // Ordena os pedidos do mais recente para o mais antigo antes de desenhar
    var pedidos = Object.keys(PEDIDOS)
      .map(function (numero) { return PEDIDOS[numero]; })
      .sort(function (a, b) { return b.numero - a.numero; });

    container.innerHTML = pedidos
      .map(function (pedido) {
        var thumbsHtml = pedido.thumbs.map(function (src) { return '<img src="' + src + '" alt="" />'; }).join('');
        return (
          '<div class="order-card">' +
          '<div class="order-card-info">' +
          '<p class="order-card-numero">Pedido #' + pedido.numero + '</p>' +
          '<p class="order-card-data">Realizado em: ' + pedido.data + '</p>' +
          '</div>' +
          statusBadgeHtml(pedido) +
          '<div class="order-card-thumbs">' + thumbsHtml + '</div>' +
          '<div class="order-card-total">' +
          '<p class="label">Valor Total:</p>' +
          '<p class="valor">' + money(pedido.total) + '</p>' +
          '</div>' +
          // O botão "Ver detalhes" leva para a página de detalhe passando o
          // número do pedido na URL (?pedido=34928)
          '<a class="order-card-btn" href="pedido-detalhe.html?pedido=' + pedido.numero + '">Ver detalhes</a>' +
          '</div>'
        );
      })
      .join('');
  }

  // ----------------------------------------------------------------------
  // Página de DETALHE (pedido-detalhe.html): escolhe o layout certo conforme
  // o status do pedido (entregue/cancelado -> itens comprados; andamento -> rastreio)
  // ----------------------------------------------------------------------
  function renderDetalhePedido() {
    var root = document.getElementById('pedido-detalhe-root');
    if (!root) return; // esta função só faz sentido em pedido-detalhe.html

    // Lê o número do pedido a partir da query string (?pedido=34928)
    var numero = new URLSearchParams(window.location.search).get('pedido');
    var pedido = PEDIDOS[numero] || PEDIDOS['34928']; // usa um pedido padrão se o número não existir

    // Atualiza o título da aba e a trilha de navegação (breadcrumb)
    document.getElementById('page-title').textContent = 'Pedido #' + pedido.numero + ' — Jacy Modas';
    document.getElementById('breadcrumb-pedido').textContent = 'Pedido #' + pedido.numero;

    // Cabeçalho: número do pedido + badge de status (o wrapper existe fixo no
    // HTML só para receber o badge, que muda de cor conforme o status)
    document.getElementById('pedido-numero-titulo').textContent = 'Pedido #' + pedido.numero;
    document.getElementById('pedido-status-badge-wrapper').innerHTML = statusBadgeHtml(pedido);

    // Pedidos "em andamento" mostram a linha do tempo de rastreio;
    // os demais (entregue/cancelado) mostram entrega + pagamento + itens.
    if (pedido.status === 'andamento') {
      root.innerHTML = renderLayoutRastreio(pedido);
    } else {
      root.innerHTML = renderLayoutEntregue(pedido);
    }
  }

  // Layout usado para pedidos entregues ou cancelados: dados de entrega,
  // resumo do pagamento e lista de itens comprados.
  function renderLayoutEntregue(pedido) {
    var itensHtml = pedido.itens
      .map(function (item) {
        return (
          '<div class="item-comprado">' +
          '<img src="' + item.imagem + '" alt="" />' +
          '<div class="item-comprado-info">' +
          '<p class="item-comprado-nome">' + item.nome + '</p>' +
          '<p class="item-comprado-variacao">' + item.variacao + '</p>' +
          '</div>' +
          '<p class="item-comprado-preco">' + money(item.preco) + '</p>' +
          '</div>'
        );
      })
      .join('');

    return (
      '<div class="pedido-detalhe-grid">' +
      // Card da esquerda: informações de entrega
      '<div class="info-card">' +
      '<h2>Informações de Entrega</h2>' +
      '<div class="info-linhas">' +
      '<p class="rotulo">Endereço:</p>' +
      '<p class="valor">' + pedido.endereco + '</p>' +
      '<p class="rotulo">Destinatário:</p>' +
      '<p class="valor">' + pedido.destinatario + '</p>' +
      '</div>' +
      '</div>' +
      // Card da direita: forma de pagamento e resumo de valores
      '<div class="info-card">' +
      '<h2>Pagamento &amp; Resumo</h2>' +
      '<div class="info-linhas">' +
      '<p class="rotulo">Método:</p>' +
      '<p class="valor">' + pedido.metodoPagamento + '</p>' +
      '<div class="resumo-linha"><span class="rotulo">Subtotal:</span><span class="valor">' + money(pedido.subtotal) + '</span></div>' +
      '<div class="resumo-linha"><span class="rotulo">Frete:</span><span class="valor">' + (pedido.frete > 0 ? money(pedido.frete) : 'Grátis') + '</span></div>' +
      '<div class="resumo-linha total"><span class="rotulo">Total:</span><span class="valor">' + money(pedido.total) + '</span></div>' +
      '</div>' +
      '</div>' +
      '</div>' +
      // Card de largura total: itens comprados
      '<div class="itens-comprados">' +
      '<h2>Itens Comprados</h2>' +
      itensHtml +
      '</div>' +
      // Botão para comprar os mesmos itens novamente
      '<div class="pedido-detalhe-acao">' +
      '<button type="button" class="btn-comprar-novamente" id="btn-comprar-novamente">Comprar novamente</button>' +
      '</div>'
    );
  }

  // Layout usado para pedidos "em andamento": linha do tempo de rastreio +
  // resumo financeiro (sem lista de itens, igual ao design original).
  function renderLayoutRastreio(pedido) {
    var timelineHtml = pedido.timeline
      .map(function (etapa) {
        return (
          '<div class="timeline-item timeline-item--' + etapa.estado + '">' +
          '<div class="timeline-dot"></div>' +
          '<div>' +
          '<p class="timeline-titulo">' + etapa.titulo + '</p>' +
          '<p class="timeline-data">' + etapa.data + '</p>' +
          '</div>' +
          '</div>'
        );
      })
      .join('');

    return (
      '<div class="pedido-detalhe-grid">' +
      // Card da esquerda: linha do tempo de rastreio
      '<div class="info-card" style="flex: 1.4 0 0;">' +
      '<div class="pedidos-titulo" style="justify-content: space-between; width: 100%;">' +
      '<h2 style="margin:0;">Acompanhar Entrega</h2>' +
      '<span style="color: var(--rosa); font-weight: 600; font-size: 14px;">Código: ' + pedido.codigoRastreio + '</span>' +
      '</div>' +
      '<div class="timeline">' + timelineHtml + '</div>' +
      '</div>' +
      // Card da direita: resumo do pedido
      '<div class="info-card" style="max-width: 450px;">' +
      '<h2>Resumo do Pedido</h2>' +
      '<div class="info-linhas">' +
      '<div class="resumo-linha"><span class="rotulo">Subtotal:</span><span class="valor">' + money(pedido.subtotal) + '</span></div>' +
      '<div class="resumo-linha"><span class="rotulo">Frete:</span><span class="valor">' + (pedido.frete > 0 ? money(pedido.frete) : 'Grátis') + '</span></div>' +
      '<div class="resumo-linha total"><span class="rotulo">Total:</span><span class="valor">' + money(pedido.total) + '</span></div>' +
      '</div>' +
      '</div>' +
      '</div>'
    );
  }

  // Roda a renderização certa assim que a página termina de carregar.
  // As duas funções verificam sozinhas se o elemento delas existe na
  // página atual, então é seguro chamar as duas em ambos os arquivos.
  document.addEventListener('DOMContentLoaded', function () {
    renderListaPedidos();
    renderDetalhePedido();

    // Botão "Comprar novamente": só existe no layout de pedido entregue/cancelado
    document.addEventListener('click', function (e) {
      if (e.target && e.target.id === 'btn-comprar-novamente') {
        window.JacyStore.notificar('Os itens deste pedido foram adicionados ao carrinho novamente.', 'sucesso');
      }
    });
  });
})();
