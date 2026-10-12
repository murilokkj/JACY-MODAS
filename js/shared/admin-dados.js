// ============================================================================
// admin-dados.js
//
// Dados e regras de negócio da área administrativa (pages/admin/).
// Como não existe backend, produtos e pedidos ficam no localStorage e são
// criados com dados de exemplo na primeira visita (mesmo padrão do carrinho
// e dos favoritos). Todas as telas do admin leem e gravam por aqui, então
// um produto cadastrado em "Cadastro de produtos" aparece na listagem, no
// controle de estoque e no painel.
//
// Precisa carregar ANTES de js/shared/admin.js e dos js/pages/admin-*.js.
// Figma: nodes 429:7090 (produtos), 429:7224 (cadastro), 429:7346 (estoque)
// e 429:7497 (pedidos). O "Painel administrativo" não tem protótipo.
// ============================================================================

(function () {
  var PRODUTOS_KEY = 'jm_admin_produtos';
  var PEDIDOS_KEY = 'jm_admin_pedidos';

  // Até esta quantidade (inclusive) o produto aparece como "Estoque baixo"
  var LIMITE_ESTOQUE_BAIXO = 10;

  var IMG = '../../assets/images/';
  var IMG_ADMIN = IMG + 'admin/';

  // Cores disponíveis no cadastro (as 3 primeiras são as bolinhas do Figma)
  var CORES = [
    { nome: 'Bordô', hex: '#942D43' },
    { nome: 'Azul petróleo', hex: '#324759' },
    { nome: 'Cinza', hex: '#A6A9AE' },
    { nome: 'Preto', hex: '#100D0F' },
    { nome: 'Branco', hex: '#FFFFFF' },
    { nome: 'Rosa', hex: '#FF099C' },
    { nome: 'Verde militar', hex: '#4B5320' },
    { nome: 'Bege', hex: '#D9C3A5' }
  ];

  var CATEGORIAS = [
    'Camisas', 'Blusinhas', 'Blusas', 'Vestidos', 'Croppeds', 'Calças',
    'Bermudas', 'Conjuntos', 'Corsets', 'Biquínis', 'Bodys', 'Saias'
  ];

  // Etapas de um pedido, na ordem em que acontecem
  var STATUS_PEDIDO = {
    pendente: 'Pendente',
    preparacao: 'Em preparação',
    enviado: 'Enviado',
    retirada: 'Pronto para retirada',
    entregue: 'Entregue',
    cancelado: 'Cancelado'
  };

  function cor(nome) {
    return CORES.filter(function (c) { return c.nome === nome; })[0];
  }

  function horasAtras(h) {
    return new Date(Date.now() - h * 3600 * 1000).toISOString();
  }

  // ------------------------------------------------------------ seeds

  function produtosIniciais() {
    return [
      {
        id: 'p1', nome: 'Baby look branca', sku: 'BLU-5632', categoria: 'Blusas', colecao: 'Verão',
        tamanhos: 'PP, P, M, G', descricao: 'Baby look em malha canelada com modelagem ajustada.',
        cores: [cor('Bordô'), cor('Azul petróleo'), cor('Cinza'), cor('Branco'), cor('Preto')],
        custo: 29.9, preco: 59.99, promocional: null, estoque: 32, status: 'ativo',
        imagens: [IMG_ADMIN + 'produto-baby-look-branca.png'], atualizadoEm: horasAtras(26)
      },
      {
        id: 'p2', nome: 'Vestido de manga longa preto', sku: 'VEST-3478', categoria: 'Vestidos', colecao: 'Inverno',
        tamanhos: 'P, M, G', descricao: 'Vestido curto de manga longa em tecido com elastano.',
        cores: [cor('Preto'), cor('Bordô'), cor('Cinza'), cor('Azul petróleo'), cor('Bege')],
        custo: 34.5, preco: 59.99, promocional: null, estoque: 8, status: 'ativo',
        imagens: [IMG_ADMIN + 'produto-vestido-manga-longa-preto.png'], atualizadoEm: horasAtras(50)
      },
      {
        id: 'p3', nome: 'Cropped de manga longa verde militar', sku: 'CROP-3478', categoria: 'Croppeds', colecao: 'Inverno',
        tamanhos: 'PP, P, M', descricao: 'Cropped de manga longa em malha canelada, gola alta.',
        cores: [cor('Verde militar'), cor('Preto'), cor('Cinza'), cor('Bordô'), cor('Rosa')],
        custo: 28, preco: 59.99, promocional: null, estoque: 14, status: 'ativo',
        imagens: [IMG_ADMIN + 'produto-cropped-verde-militar.png'], atualizadoEm: horasAtras(75)
      },
      {
        id: 'p4', nome: 'Cropped de manga longa cinza', sku: 'CROP-3481', categoria: 'Croppeds', colecao: 'Inverno',
        tamanhos: 'PP, P, M', descricao: 'Cropped de manga longa em malha canelada, gola alta.',
        cores: [cor('Cinza'), cor('Preto'), cor('Bordô'), cor('Rosa'), cor('Bege')],
        custo: 28, preco: 59.99, promocional: null, estoque: 0, status: 'inativo',
        imagens: [IMG_ADMIN + 'produto-cropped-cinza.png'], atualizadoEm: horasAtras(120)
      },
      {
        id: 'p5', nome: 'Conjunto moletom (forrado por dentro)', sku: 'CONJ-1020', categoria: 'Conjuntos', colecao: 'Inverno',
        tamanhos: 'P, M, G, GG', descricao: 'Conjunto de moletom com forro felpudo, blusa e calça.',
        cores: [cor('Cinza'), cor('Preto'), cor('Rosa')],
        custo: 22, preco: 44.99, promocional: null, estoque: 21, status: 'ativo',
        imagens: [IMG + 'categoria-conjuntos.png'], atualizadoEm: horasAtras(30)
      },
      {
        id: 'p6', nome: 'Blusa tricô modal', sku: 'BLU-7741', categoria: 'Blusas', colecao: 'Inverno',
        tamanhos: 'P, M, G', descricao: 'Blusa de tricô modal macia, ideal para meia-estação.',
        cores: [cor('Bege'), cor('Rosa'), cor('Preto'), cor('Branco')],
        custo: 18, preco: 34.99, promocional: null, estoque: 5, status: 'ativo',
        imagens: [IMG + 'produto-blusa-trico.png'], atualizadoEm: horasAtras(8)
      },
      {
        id: 'p7', nome: 'Calça moletom wide leg', sku: 'CALC-2210', categoria: 'Calças', colecao: 'Inverno',
        tamanhos: 'P, M, G', descricao: 'Calça wide leg em moletom, cintura alta com elástico.',
        cores: [cor('Preto'), cor('Cinza')],
        custo: 45, preco: 99.9, promocional: null, estoque: 0, status: 'ativo',
        imagens: [IMG + 'produto-calca-indisponivel.png'], atualizadoEm: horasAtras(200)
      },
      {
        id: 'p8', nome: 'Vestido poliamida', sku: 'VEST-9012', categoria: 'Vestidos', colecao: 'Verão',
        tamanhos: 'P, M, G', descricao: 'Vestido midi em poliamida com ótimo caimento.',
        cores: [cor('Preto'), cor('Rosa'), cor('Azul petróleo')],
        custo: 26, preco: 54.99, promocional: 44.99, estoque: 40, status: 'ativo',
        imagens: [IMG + 'categoria-vestidos.png'], atualizadoEm: horasAtras(15)
      }
    ];
  }

  function pedidosIniciais() {
    // "h" = há quantas horas o pedido foi feito (as datas ficam sempre recentes)
    var base = [
      { numero: '35021', cliente: 'Ana Souza', h: 2, pagamento: 'Pix', entrega: 'envio', status: 'pendente', total: 104.98, itens: 2 },
      { numero: '35020', cliente: 'Beatriz Lima', h: 5, pagamento: 'Cartão de crédito', entrega: 'retirada', status: 'pendente', total: 59.99, itens: 1 },
      { numero: '35018', cliente: 'Camila Ferreira', h: 9, pagamento: 'Pix', entrega: 'envio', status: 'pendente', total: 139.97, itens: 3 },
      { numero: '35015', cliente: 'Daniela Rocha', h: 22, pagamento: 'Cartão de crédito', entrega: 'envio', status: 'preparacao', total: 94.98, itens: 2 },
      { numero: '35012', cliente: 'Eduarda Martins', h: 30, pagamento: 'Pix', entrega: 'retirada', status: 'preparacao', total: 44.99, itens: 1 },
      { numero: '35009', cliente: 'Fernanda Alves', h: 49, pagamento: 'Cartão de débito', entrega: 'envio', status: 'enviado', total: 169.98, itens: 3 },
      { numero: '35006', cliente: 'Gabriela Costa', h: 55, pagamento: 'Pix', entrega: 'envio', status: 'enviado', total: 79.99, itens: 1 },
      { numero: '35003', cliente: 'Helena Barros', h: 72, pagamento: 'Cartão de crédito', entrega: 'retirada', status: 'retirada', total: 59.99, itens: 1 },
      { numero: '34998', cliente: 'Isabela Nunes', h: 77, pagamento: 'Pix', entrega: 'envio', status: 'entregue', total: 124.98, itens: 2 },
      { numero: '34994', cliente: 'Juliana Prado', h: 100, pagamento: 'Cartão de crédito', entrega: 'envio', status: 'entregue', total: 99.9, itens: 1 },
      { numero: '34989', cliente: 'Karen Duarte', h: 124, pagamento: 'Pix', entrega: 'envio', status: 'entregue', total: 184.97, itens: 3 },
      { numero: '34985', cliente: 'Larissa Mendes', h: 148, pagamento: 'Cartão de débito', entrega: 'retirada', status: 'entregue', total: 44.99, itens: 1 },
      { numero: '34980', cliente: 'Mariana Teixeira', h: 170, pagamento: 'Pix', entrega: 'envio', status: 'cancelado', total: 74.99, itens: 1 },
      { numero: '34977', cliente: 'Natália Pires', h: 196, pagamento: 'Cartão de crédito', entrega: 'envio', status: 'entregue', total: 119.98, itens: 2 }
    ];
    return base.map(function (p) {
      return {
        numero: p.numero, cliente: p.cliente, data: horasAtras(p.h), pagamento: p.pagamento,
        entrega: p.entrega, status: p.status, total: p.total, itens: p.itens
      };
    });
  }

  // ------------------------------------------------------------ storage

  function ler(chave, iniciais) {
    try {
      var v = JSON.parse(localStorage.getItem(chave));
      if (Array.isArray(v)) return v;
    } catch (e) { /* cai no padrão abaixo */ }
    var dados = iniciais();
    gravar(chave, dados);
    return dados;
  }

  function gravar(chave, dados) {
    localStorage.setItem(chave, JSON.stringify(dados));
  }

  // ------------------------------------------------------------ produtos

  function listarProdutos() { return ler(PRODUTOS_KEY, produtosIniciais); }

  function obterProduto(id) {
    return listarProdutos().filter(function (p) { return p.id === id; })[0] || null;
  }

  // Cria (sem id) ou atualiza (com id) um produto e devolve o id
  function salvarProduto(produto) {
    var lista = listarProdutos();
    produto.atualizadoEm = new Date().toISOString();
    if (!produto.id) {
      produto.id = 'p' + Date.now();
      lista.unshift(produto);
    } else {
      lista = lista.map(function (p) { return p.id === produto.id ? produto : p; });
    }
    gravar(PRODUTOS_KEY, lista);
    return produto.id;
  }

  function excluirProdutos(ids) {
    gravar(PRODUTOS_KEY, listarProdutos().filter(function (p) { return ids.indexOf(p.id) === -1; }));
  }

  function skuExiste(sku, ignorarId) {
    var alvo = String(sku).trim().toLowerCase();
    return listarProdutos().some(function (p) {
      return p.id !== ignorarId && p.sku.toLowerCase() === alvo;
    });
  }

  // "disponivel", "baixo" ou "indisponivel" (inativo ou sem estoque)
  function situacaoEstoque(produto) {
    if (produto.status === 'inativo' || produto.estoque <= 0) return 'indisponivel';
    if (produto.estoque <= LIMITE_ESTOQUE_BAIXO) return 'baixo';
    return 'disponivel';
  }

  // ------------------------------------------------------------ pedidos

  function listarPedidos() { return ler(PEDIDOS_KEY, pedidosIniciais); }

  // Próxima etapa do pedido (retirada na loja pula o "Enviado")
  function proximoStatus(pedido) {
    if (pedido.status === 'pendente') return 'preparacao';
    if (pedido.status === 'preparacao') return pedido.entrega === 'retirada' ? 'retirada' : 'enviado';
    if (pedido.status === 'enviado' || pedido.status === 'retirada') return 'entregue';
    return null;
  }

  function atualizarStatusPedido(numero, status) {
    gravar(PEDIDOS_KEY, listarPedidos().map(function (p) {
      if (p.numero === numero) p.status = status;
      return p;
    }));
  }

  // ------------------------------------------------------------ formatação

  function moeda(v) {
    return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  function dois(n) { return (n < 10 ? '0' : '') + n; }

  function dataBR(iso) {
    var d = new Date(iso);
    return dois(d.getDate()) + '/' + dois(d.getMonth() + 1) + '/' + d.getFullYear();
  }

  // Mesmo formato do Figma: 24/08/2026 - 10H30
  function dataHoraBR(iso) {
    var d = new Date(iso);
    return dataBR(iso) + ' - ' + dois(d.getHours()) + 'H' + dois(d.getMinutes());
  }

  window.JacyAdminDados = {
    CORES: CORES,
    CATEGORIAS: CATEGORIAS,
    STATUS_PEDIDO: STATUS_PEDIDO,
    LIMITE_ESTOQUE_BAIXO: LIMITE_ESTOQUE_BAIXO,
    listarProdutos: listarProdutos,
    obterProduto: obterProduto,
    salvarProduto: salvarProduto,
    excluirProdutos: excluirProdutos,
    skuExiste: skuExiste,
    situacaoEstoque: situacaoEstoque,
    listarPedidos: listarPedidos,
    proximoStatus: proximoStatus,
    atualizarStatusPedido: atualizarStatusPedido,
    moeda: moeda,
    dataBR: dataBR,
    dataHoraBR: dataHoraBR
  };
})();
