// ============================================================================
// header.js
//
// Script compartilhado por TODAS as páginas (carregado sempre primeiro).
// Cuida de tudo que fica no header e é igual em qualquer tela:
//   - botões do header: menu de categorias, busca, usuário e carrinho;
//   - painéis que abrem por cima da página (dropdowns no computador,
//     gavetas laterais no celular): categorias, login/usuário e carrinho;
//   - carrinho de compras e CEP de entrega, guardados no localStorage;
//   - "login" simulado do usuário (sem backend, também no localStorage);
//   - carrosséis simples de "Produtos recomendados" e "Meus favoritos".
//
// No fim ele expõe window.JacyStore, usado pelos scripts de cada página
// (produto, registro...) para mexer no carrinho, no CEP e no usuário.
// ============================================================================

(function () {
  // Chaves do localStorage onde o site guarda seus dados
  var CART_KEY = 'jm_cart';
  var CEP_KEY = 'jm_cep';
  var USER_KEY = 'jm_user';

  // ---------------------------------------------------------------- dados

  // Lê um JSON do localStorage; se não existir ou estiver corrompido,
  // devolve o valor padrão em vez de quebrar a página.
  function readJSON(key, fallback) {
    try {
      var v = JSON.parse(localStorage.getItem(key));
      return v || fallback;
    } catch (e) {
      return fallback;
    }
  }

  // Carrinho: lista de itens { id, nome, tamanho, cor, qtd, preco, imagem }.
  // Toda gravação atualiza também o numerinho sobre o ícone do carrinho.
  function getCart() { return readJSON(CART_KEY, []); }
  function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartBadge();
  }
  // CEP digitado para calcular o frete (compartilhado entre carrinho e produto)
  function getCep() { return localStorage.getItem(CEP_KEY) || ''; }
  function setCep(v) { localStorage.setItem(CEP_KEY, v); }
  function clearCep() { localStorage.removeItem(CEP_KEY); }
  // Usuário "logado": { nome }. null = deslogado.
  function getUser() { return readJSON(USER_KEY, null); }
  function setUser(u) {
    if (u) localStorage.setItem(USER_KEY, JSON.stringify(u));
    else localStorage.removeItem(USER_KEY);
  }

  // Adiciona um item ao carrinho. Se o mesmo produto, no mesmo tamanho e cor,
  // já estiver lá, só soma a quantidade em vez de criar outra linha.
  function addToCart(item) {
    var cart = getCart();
    var existing = cart.find(function (i) {
      return i.id === item.id && i.tamanho === item.tamanho && i.cor === item.cor;
    });
    if (existing) existing.qtd += item.qtd;
    else cart.push(item);
    saveCart(cart);
  }

  // Remove a linha do carrinho na posição "index"
  function removeFromCart(index) {
    var cart = getCart();
    cart.splice(index, 1);
    saveCart(cart);
  }

  // Soma "delta" (+1 ou -1) à quantidade de uma linha; nunca fica abaixo de 1
  function updateQty(index, delta) {
    var cart = getCart();
    if (!cart[index]) return;
    cart[index].qtd = Math.max(1, cart[index].qtd + delta);
    saveCart(cart);
  }

  // Total de peças no carrinho (soma das quantidades de todas as linhas)
  function cartCount() {
    return getCart().reduce(function (acc, i) { return acc + i.qtd; }, 0);
  }

  // Formata um número como preço em reais: 44.99 -> "R$44,99"
  function money(v) {
    return 'R$' + v.toFixed(2).replace('.', ',');
  }

  // Atualiza o numerinho sobre o ícone do carrinho; some quando está vazio
  function updateCartBadge() {
    var badge = document.getElementById('cart-badge');
    if (!badge) return;
    var count = cartCount();
    badge.textContent = String(count);
    badge.hidden = count === 0;
  }

  // -------------------------------------------------------------- painéis

  // Ids dos painéis do header: #panel-menu, #panel-user e #panel-cart
  var panels = ['menu', 'user', 'cart'];

  // Cabeçalho dos painéis: título + botão "X" de fechar. O "X" só aparece
  // no celular, onde os painéis viram gavetas laterais (Figma 358:4380).
  function tituloPainel(texto) {
    return (
      '<div class="dp-cabecalho">' +
      '<div class="dp-title">' + texto + '</div>' +
      '<button type="button" class="dp-fechar" data-action="fechar-painel" aria-label="Fechar">' +
      '<img src="../assets/icons/btn-fechar-circulo.svg" alt="" /><span>X</span>' +
      '</button>' +
      '</div>'
    );
  }

  // Fecha todos os painéis e o fundo escuro atrás deles
  function closeAllPanels() {
    panels.forEach(function (name) {
      var el = document.getElementById('panel-' + name);
      if (el) el.hidden = true;
    });
    var backdrop = document.getElementById('dropdown-backdrop');
    if (backdrop) backdrop.hidden = true;
  }

  // Abre um painel (fechando os outros antes). Usuário e carrinho são
  // redesenhados na hora, para refletir o estado atual do localStorage.
  function openPanel(name) {
    closeAllPanels();
    var el = document.getElementById('panel-' + name);
    var backdrop = document.getElementById('dropdown-backdrop');
    if (!el) return;
    if (name === 'user') renderUserPanel();
    if (name === 'cart') renderCartPanel();
    el.hidden = false;
    if (backdrop) backdrop.hidden = false;
  }

  // Clique no ícone do header: abre o painel ou, se já estiver aberto, fecha
  function togglePanel(name) {
    var el = document.getElementById('panel-' + name);
    if (!el) return;
    if (el.hidden) openPanel(name);
    else closeAllPanels();
  }

  // Painel do usuário. Tem dois estados:
  //   - logado    -> saudação + links da conta + "Sair da conta";
  //   - deslogado -> formulário de login + "Criar conta".
  function renderUserPanel() {
    var el = document.getElementById('panel-user');
    if (!el) return;
    var user = getUser();
    if (user) {
      el.innerHTML =
        tituloPainel('USUÁRIO') +
        '<div class="user-header">' +
        '<div class="user-avatar">' +
        '<img class="so-desktop-bloco" src="../assets/icons/circle-user.svg" alt="" />' +
        '<img class="so-mobile-bloco" src="../assets/icons/user-avatar-rosa.svg" alt="" />' +
        '</div>' +
        '<p class="user-greeting">Olá, <strong>' + user.nome + '</strong>!</p>' +
        '</div>' +
        '<nav class="user-nav">' +
        // "Gerenciar minha conta" navega para a tela de perfil (Figma node 171:187)
        '<a href="minha-conta.html">Gerenciar minha conta</a>' +
        // "Segurança e privacidade" navega para a tela de troca de senha/e-mail (Figma node 176:954)
        '<a href="seguranca-privacidade.html">Segurança e privacidade</a>' +
        // "Meus favoritos" navega para a tela de favoritos (Figma node 176:953)
        '<a href="favoritos.html">Meus favoritos</a>' +
        // "Meus endereços" navega para a tela de gerenciamento de endereços (Figma node 396:3872)
        '<a href="enderecos.html">Meus endereços</a>' +
        // "Meus pedidos" navega de verdade para a tela de histórico de pedidos (Figma node 176:952)
        '<a href="pedidos.html">Meus pedidos</a>' +
        '<a href="#" data-action="logout">Sair da conta</a>' +
        '</nav>';
      // "Sair da conta": apaga o usuário e redesenha o painel já deslogado
      el.querySelector('[data-action="logout"]').addEventListener('click', function (e) {
        e.preventDefault();
        setUser(null);
        renderUserPanel();
      });
      el.querySelectorAll('[data-action="noop"]').forEach(function (a) {
        a.addEventListener('click', function (e) { e.preventDefault(); });
      });
    } else {
      el.innerHTML =
        tituloPainel('LOGIN') +
        '<input class="dp-input" type="email" id="login-email" placeholder="Digite seu email" />' +
        '<div class="dp-field">' +
        '<input class="dp-input" type="password" id="login-senha" placeholder="Digite sua senha" />' +
        // "Esqueci minha senha" navega para o fluxo de recuperação (Figma node 176:954)
        '<a href="recuperar-senha.html" class="dp-link">Esqueci minha senha</a>' +
        '</div>' +
        '<div class="dp-btns">' +
        '<button type="button" class="dp-btn dp-btn-primary" data-action="entrar">ENTRAR</button>' +
        // "CRIAR CONTA" navega para o fluxo de registro (Figma node 171:184)
        // No celular aparecem um divisor e "Não possui uma conta?" antes do botão (Figma 359:3735)
        '<div class="dp-registro-aviso"><hr /><p>Não possui uma conta?</p></div>' +
        '<a href="registro.html" class="dp-btn dp-btn-ghost">CRIAR CONTA</a>' +
        '</div>';
      // "ENTRAR": login simulado — qualquer e-mail é aceito, e o nome exibido
      // é a parte antes do "@" (ex.: maria@email.com -> "maria").
      el.querySelectorAll('[data-action="entrar"]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var email = el.querySelector('#login-email').value.trim();
          var nome = email ? email.split('@')[0] : 'Usuário';
          setUser({ nome: nome });
          renderUserPanel();
        });
      });
      el.querySelectorAll('[data-action="noop"]').forEach(function (a) {
        a.addEventListener('click', function (e) { e.preventDefault(); });
      });
    }
  }

  // As páginas ficam em pages/, então as imagens são "../assets/...". Itens
  // salvos no carrinho antes dessa mudança guardaram "assets/..." sem o "../".
  function caminhoImagem(src) {
    return src && src.indexOf('assets/') === 0 ? '../' + src : src;
  }

  // HTML de uma linha do carrinho (foto, nome, variação, quantidade, preço).
  // O "index" vai nos data-atributos para os botões saberem qual linha alterar.
  function cartProductRow(item, index) {
    return (
      '<div class="cart-item">' +
      '<div class="cart-item-photo"><img src="' + caminhoImagem(item.imagem) + '" alt="" /></div>' +
      '<div class="cart-item-info">' +
      '<p class="cart-item-nome">' + item.nome + '</p>' +
      '<p class="cart-item-var">' + item.tamanho + ', ' + item.cor + '</p>' +
      '<div class="cart-item-qtd">' +
      '<button type="button" data-qtd-minus="' + index + '">-</button>' +
      '<span>' + item.qtd + '</span>' +
      '<button type="button" data-qtd-plus="' + index + '">+</button>' +
      '</div>' +
      '</div>' +
      '<div class="cart-item-right">' +
      // No celular o "Remover" vira o ícone de lixeira (Figma 221:2677)
      '<a href="#" class="cart-item-remover" data-remove="' + index + '" aria-label="Remover">' +
      '<span class="so-desktop-inline">Remover</span>' +
      '<img class="so-mobile-bloco" src="../assets/icons/lixeira-carrinho.svg" alt="" />' +
      '</a>' +
      '<p class="cart-item-preco">' + money(item.preco * item.qtd) + '</p>' +
      '</div>' +
      '</div>'
    );
  }

  // Painel do carrinho. Redesenhado a cada ação (quantidade, remover, frete,
  // CEP), sempre a partir do que está salvo no localStorage.
  function renderCartPanel() {
    var el = document.getElementById('panel-cart');
    if (!el) return;
    var cart = getCart();

    if (cart.length === 0) {
      el.innerHTML =
        tituloPainel('CARRINHO DE COMPRAS') +
        '<p class="cart-empty-msg">Não há produtos no carrinho.</p>' +
        '<button type="button" class="dp-btn dp-btn-primary" data-action="fechar">CONTINUAR COMPRANDO</button>';
      el.querySelector('[data-action="fechar"]').addEventListener('click', closeAllPanels);
      return;
    }

    // Frete: SEDEX e PAC custam R$10,00 (só aparecem depois de informar o CEP);
    // retirar na loja é grátis. A opção escolhida fica num data-atributo do painel.
    var subtotal = cart.reduce(function (acc, i) { return acc + i.preco * i.qtd; }, 0);
    var cep = getCep();
    var frete = 0;
    var selectedFrete = el.getAttribute('data-frete') || 'retirar';
    if (cep && selectedFrete === 'sedex') frete = 10;
    if (cep && selectedFrete === 'pac') frete = 10;

    var itemsHtml = cart.map(cartProductRow).join('');

    // Bloco de entrega: com CEP informado mostra as opções dos Correios;
    // sem CEP, mostra o campo para digitar o CEP e o botão "Calcular".
    var entregaHtml;
    if (cep) {
      entregaHtml =
        '<div class="cart-entregas">' +
        '<p class="entrega-label">Envio:</p>' +
        '<input class="cep-display" type="text" id="cart-cep-display" value="' + cep + '" />' +
        '<label class="frete-opcao ' + (selectedFrete === 'sedex' ? 'selecionado' : '') + '">' +
        '<input type="radio" name="frete" value="sedex" ' + (selectedFrete === 'sedex' ? 'checked' : '') + ' />' +
        '<span class="frete-info"><strong>Correios - SEDEX</strong><small>Chega em 1 a 2 dias úteis</small></span>' +
        '<span class="frete-preco">R$10,00</span>' +
        '</label>' +
        '<label class="frete-opcao ' + (selectedFrete === 'pac' ? 'selecionado' : '') + '">' +
        '<input type="radio" name="frete" value="pac" ' + (selectedFrete === 'pac' ? 'checked' : '') + ' />' +
        '<span class="frete-info"><strong>Correios - PAC</strong><small>Chega em 2 a 5 dias úteis</small></span>' +
        '<span class="frete-preco">R$10,00</span>' +
        '</label>' +
        '<p class="entrega-label">Retirar na loja:</p>' +
        '<label class="frete-opcao ' + (selectedFrete === 'retirar' ? 'selecionado' : '') + '">' +
        '<input type="radio" name="frete" value="retirar" ' + (selectedFrete === 'retirar' ? 'checked' : '') + ' />' +
        '<span class="frete-info"><strong>Retirar em:</strong><small>Rua Martino Arosio, 38 — Vila Aurora, São Paulo - SP, 05186-150</small></span>' +
        '<span class="frete-preco">Grátis</span>' +
        '</label>' +
        '</div>';
    } else {
      entregaHtml =
        '<div class="cart-entregas">' +
        '<p class="entrega-label">Envio:</p>' +
        '<input class="dp-input" type="text" id="cart-cep-input" placeholder="Digite seu CEP" />' +
        '<div class="cep-actions">' +
        '<button type="button" class="dp-btn-mini" data-action="calcular">Calcular</button>' +
        '<span class="dp-link-inline">Não sei meu CEP</span>' +
        '</div>' +
        '<p class="entrega-label">Retirar na loja:</p>' +
        '<label class="frete-opcao selecionado">' +
        '<input type="radio" name="frete" value="retirar" checked />' +
        '<span class="frete-info"><strong>Retirar em:</strong><small>Rua Martino Arosio, 38 — Vila Aurora, São Paulo - SP, 05186-150</small></span>' +
        '<span class="frete-preco">Grátis</span>' +
        '</label>' +
        '</div>';
    }

    el.innerHTML =
      tituloPainel('CARRINHO DE COMPRAS') +
      '<div class="cart-items">' + itemsHtml + '</div>' +
      '<div class="cart-subtotal"><span>Subtotal (sem frete):</span><span>' + money(subtotal) + '</span></div>' +
      entregaHtml +
      '<div class="cart-total"><span>Total:</span><span>' + money(subtotal + frete) + '</span></div>' +
      '<button type="button" class="dp-btn dp-btn-primary" data-action="finalizar">FINALIZAR COMPRA</button>';

    // Liga os botões recém-desenhados: quantidade, remover, calcular CEP,
    // editar CEP, escolher frete e finalizar compra.
    el.querySelectorAll('[data-qtd-minus]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        updateQty(Number(btn.getAttribute('data-qtd-minus')), -1);
        renderCartPanel();
      });
    });
    el.querySelectorAll('[data-qtd-plus]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        updateQty(Number(btn.getAttribute('data-qtd-plus')), 1);
        renderCartPanel();
      });
    });
    el.querySelectorAll('[data-remove]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        removeFromCart(Number(a.getAttribute('data-remove')));
        renderCartPanel();
      });
    });
    var calcularBtn = el.querySelector('[data-action="calcular"]');
    if (calcularBtn) {
      calcularBtn.addEventListener('click', function () {
        var input = el.querySelector('#cart-cep-input');
        if (input && input.value.trim()) {
          setCep(input.value.trim());
          el.setAttribute('data-frete', 'retirar');
          renderCartPanel();
        }
      });
    }
    var cepDisplay = el.querySelector('#cart-cep-display');
    if (cepDisplay) {
      var updateCepDisplay = function () {
        setCep(cepDisplay.value.trim());
        renderCartPanel();
      };
      cepDisplay.addEventListener('change', updateCepDisplay);
      cepDisplay.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          cepDisplay.blur();
        }
      });
    }
    el.querySelectorAll('input[name="frete"]').forEach(function (radio) {
      radio.addEventListener('change', function () {
        el.setAttribute('data-frete', radio.value);
        renderCartPanel();
      });
    });
    // "FINALIZAR COMPRA": como não há pagamento de verdade, apenas esvazia o
    // carrinho, limpa o CEP e mostra uma confirmação.
    var finalizarBtn = el.querySelector('[data-action="finalizar"]');
    if (finalizarBtn) {
      finalizarBtn.addEventListener('click', function () {
        saveCart([]);
        clearCep();
        closeAllPanels();
        notificar('Pedido realizado com sucesso! Obrigada por comprar na Jacy Modas.', 'sucesso');
      });
    }
  }

  // Carrossel genérico com loop nas pontas: ao avançar a partir do último
  // item volta para o primeiro, e ao voltar a partir do primeiro vai para
  // o último (mesmo comportamento do carrossel de avaliações em js/pages/index.js).
  function wireCarousel(listSelector, prevSelector, nextSelector) {
    var lista = document.querySelector(listSelector);
    var prevBtn = document.querySelector(prevSelector);
    var nextBtn = document.querySelector(nextSelector);
    if (!lista || !prevBtn || !nextBtn) return;

    var indiceAtual = 0;
    var irPara = function (indice) {
      var itens = Array.from(lista.children);
      if (itens.length === 0) return;
      if (indice >= itens.length) indice = 0;
      if (indice < 0) indice = itens.length - 1;
      indiceAtual = indice;
      itens[indiceAtual].scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
    };

    prevBtn.addEventListener('click', function () { irPara(indiceAtual - 1); });
    nextBtn.addEventListener('click', function () { irPara(indiceAtual + 1); });
  }

  // ---------------------------------------------------------- notificações

  // Ícone de cada tipo de notificação (o tipo "info" não tem ícone)
  var ICONES_NOTIFICACAO = {
    sucesso: '../assets/icons/circle-check.svg',
    erro: '../assets/icons/x-circle-vermelho.svg'
  };

  // Tempo que cada notificação fica na tela antes de sumir sozinha
  var DURACAO_NOTIFICACAO = 4500;

  // Cria (uma única vez) a área fixa no canto inferior direito onde as
  // notificações ficam empilhadas. Nas páginas com o botão flutuante do
  // WhatsApp, a área sobe um pouco para não ficar por cima dele.
  function areaNotificacoes() {
    var area = document.getElementById('notificacoes');
    if (area) return area;
    area = document.createElement('div');
    area.id = 'notificacoes';
    area.className = 'notificacoes';
    if (document.querySelector('.whatsapp-float')) area.classList.add('acima-whatsapp');
    document.body.appendChild(area);
    return area;
  }

  // Mostra uma notificação no canto inferior direito, no lugar do alert()
  // do navegador. Tipos:
  //   - "sucesso" -> verde (ex.: "Senha alterada com sucesso!");
  //   - "erro"    -> vermelho (ex.: "Digite sua senha atual.");
  //   - "info"    -> cinza (avisos neutros).
  // Some sozinha depois de alguns segundos ou ao clicar no "×".
  // Confirmações (ex.: "Deseja excluir este endereço?") continuam usando o
  // confirm() do navegador, porque exigem uma resposta do usuário.
  function notificar(mensagem, tipo) {
    if (tipo !== 'sucesso' && tipo !== 'erro') tipo = 'info';
    var el = document.createElement('div');
    el.className = 'notificacao notificacao--' + tipo;
    // Erros são anunciados na hora por leitores de tela; os demais, com calma
    el.setAttribute('role', tipo === 'erro' ? 'alert' : 'status');
    el.innerHTML =
      (ICONES_NOTIFICACAO[tipo] ? '<img class="notificacao-icone" src="' + ICONES_NOTIFICACAO[tipo] + '" alt="" />' : '') +
      '<p class="notificacao-texto"></p>' +
      '<button type="button" class="notificacao-fechar" aria-label="Fechar notificação">&times;</button>';
    el.querySelector('.notificacao-texto').textContent = mensagem;
    areaNotificacoes().appendChild(el);

    var fechar = function () {
      if (el.classList.contains('saindo')) return;
      el.classList.add('saindo');
      // Espera a animação de saída terminar antes de tirar da página
      setTimeout(function () { el.remove(); }, 250);
    };
    el.querySelector('.notificacao-fechar').addEventListener('click', fechar);
    setTimeout(fechar, DURACAO_NOTIFICACAO);
  }

  // ----------------------------------------------------------------- busca

  // Barra de busca do header (Figma 18:6507 / mobile 204:891): clicar na
  // lupa troca a lupa por um campo "O que está procurando?" (o logo continua
  // visível). Enviar leva para pesquisa.html?q=termo; Esc ou clicar fora
  // (com o campo vazio) fecha a barra. O formulário é criado aqui no JS para
  // não precisar repeti-lo no HTML de cada página.
  function wireBusca() {
    var btnSearch = document.getElementById('btn-search');
    var header = document.querySelector('.site-header');
    if (!btnSearch || !header) return;

    var form = document.createElement('form');
    form.className = 'barra-busca';
    form.action = 'pesquisa.html';
    form.setAttribute('role', 'search');
    form.innerHTML =
      '<input type="search" name="q" placeholder="O que está procurando?" aria-label="Buscar produtos" autocomplete="off" />' +
      '<button type="submit" aria-label="Buscar"><img src="../assets/icons/search-rosa.svg" alt="" /></button>';
    btnSearch.insertAdjacentElement('afterend', form);

    var input = form.querySelector('input');

    // Em telas bem estreitas a barra fica curta: usa um texto menor
    var ajustarPlaceholder = function () {
      input.placeholder = window.matchMedia('(max-width: 480px)').matches ? 'Buscar...' : 'O que está procurando?';
    };
    ajustarPlaceholder();
    window.addEventListener('resize', ajustarPlaceholder);
    // Na página de pesquisa, o campo já vem preenchido com o termo buscado
    var termoAtual = new URLSearchParams(window.location.search).get('q');
    if (termoAtual) input.value = termoAtual;

    var abrir = function () {
      header.classList.add('busca-aberta');
      input.focus();
    };
    var fechar = function () { header.classList.remove('busca-aberta'); };

    btnSearch.addEventListener('click', function (e) {
      e.preventDefault();
      abrir();
    });
    // Não envia a busca com o campo vazio
    form.addEventListener('submit', function (e) {
      if (!input.value.trim()) {
        e.preventDefault();
        input.focus();
      }
    });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') fechar();
    });
    document.addEventListener('click', function (e) {
      if (!header.classList.contains('busca-aberta')) return;
      if (form.contains(e.target) || btnSearch.contains(e.target)) return;
      if (!input.value.trim()) fechar();
    });
  }

  // ----------------------------------------------------------- inicialização

  document.addEventListener('DOMContentLoaded', function () {
    updateCartBadge();

    // Ícones do header -> abrem/fecham os respectivos painéis
    var btnMenu = document.getElementById('btn-menu');
    var btnUser = document.getElementById('btn-user');
    var btnCart = document.getElementById('btn-cart');
    var backdrop = document.getElementById('dropdown-backdrop');

    if (btnMenu) btnMenu.addEventListener('click', function (e) { e.preventDefault(); togglePanel('menu'); });
    wireBusca();
    if (btnUser) btnUser.addEventListener('click', function (e) { e.preventDefault(); togglePanel('user'); });
    if (btnCart) btnCart.addEventListener('click', function (e) { e.preventDefault(); togglePanel('cart'); });
    if (backdrop) backdrop.addEventListener('click', closeAllPanels);

    // O painel de categorias vem pronto no HTML de cada página: troca o título
    // simples pelo cabeçalho com o botão de fechar.
    var menuTitulo = document.querySelector('#panel-menu > .dp-title');
    if (menuTitulo) menuTitulo.outerHTML = tituloPainel(menuTitulo.textContent);

    // Botão "X" das gavetas (celular) e tecla Esc fecham os painéis
    document.addEventListener('click', function (e) {
      if (e.target.closest('[data-action="fechar-painel"]')) closeAllPanels();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeAllPanels();
    });

    // Carrossel de "Produtos recomendados" (produto.html)
    wireCarousel('#recomendados-lista', '#recomendados-prev', '#recomendados-next');
    // Carrossel de "Meus Favoritos" (favoritos.html); a lista é preenchida
    // depois por js/pages/favoritos.js, mas os itens só são lidos no clique da
    // seta, então já dá pra ligar os botões aqui sem problema de ordem.
    wireCarousel('#favoritos-lista', '#favoritos-prev', '#favoritos-next');

    // Links "Voltar ao login" (nas telas de recuperar senha) levam para
    // esta página com ?login=1 na URL; quando presente, abre o painel de
    // login automaticamente, como se o usuário tivesse clicado no ícone de usuário.
    if (new URLSearchParams(window.location.search).get('login') === '1') {
      openPanel('user');
    }
  });

  // Funções disponíveis para os scripts das páginas (produto, registro...)
  window.JacyStore = {
    getCart: getCart,
    addToCart: addToCart,
    getCep: getCep,
    setCep: setCep,
    money: money,
    openPanel: openPanel,
    closeAllPanels: closeAllPanels,
    // Notificação no canto inferior direito (usada no lugar de alert())
    notificar: notificar,
    // Usados por js/pages/registro.js para logar o usuário assim que a conta é criada.
    getUser: getUser,
    setUser: setUser
  };
})();
