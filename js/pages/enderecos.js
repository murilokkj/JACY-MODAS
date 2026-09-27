// ============================================================================
// enderecos.js
//
// Comportamento da tela "Meus endereços" (enderecos.html).
// Figma: node 396:3872 "📍 Gerenciamento de Endereços" (celular: 402:3920).
//
// A página tem três modos, todos desenhados aqui a partir da mesma lista:
//   - "ver"        -> cartões com lápis/lixeira (396:3314)
//   - "editar"     -> um cartão vira formulário, os outros ficam esmaecidos
//                     (396:3473). Também usado ao clicar em "+ Adicionar
//                     endereço", com um cartão novo em branco.
//   - "selecionar" -> cada cartão ganha uma caixinha de seleção e aparece a
//                     barra "Remover selecionados / Definir como principal"
//                     (396:3642).
//
// O primeiro endereço da lista é sempre o principal; os rótulos
// Principal/Secundário/Terciário vêm da posição na lista.
//
// Como não há backend, a lista fica no localStorage (chave "jm_enderecos"),
// lida e gravada por js/shared/enderecos-dados.js.
// ============================================================================

(function () {
  var TAGS = ['Principal', 'Secundário', 'Terciário'];

  var enderecos = carregar();
  var modo = 'ver';
  var editandoId = null;   // id do cartão em edição (modo "editar")
  var idNovo = null;       // id do cartão criado por "+ Adicionar endereço" e ainda não salvo
  var selecionados = [];   // ids marcados (modo "selecionar")

  // Leitura/gravação da lista ficam em js/shared/enderecos-dados.js, que
  // também é usado pelo cartão "Endereço" de "Minha conta".
  function carregar() {
    return window.JacyEnderecos.carregar();
  }

  // Grava a lista atual (chamado depois de cada alteração)
  function salvar() {
    window.JacyEnderecos.salvar(enderecos);
  }

  // Os valores vêm do que o usuário digitou, então são escapados antes de
  // irem para o innerHTML.
  function esc(texto) {
    return String(texto == null ? '' : texto)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // Rótulo e cor da etiqueta conforme a posição na lista: 0 = Principal,
  // 1 = Secundário, 2 em diante = Terciário.
  function tagDoIndice(i) {
    return { texto: TAGS[Math.min(i, TAGS.length - 1)], classe: 'tag-' + Math.min(i, 2) };
  }

  // ---------------------------------------------------------------- cartões

  function htmlTopo(endereco, i) {
    var tag = tagDoIndice(i);
    var principal = i === 0;
    var checkbox = '';
    if (modo === 'selecionar') {
      var marcado = selecionados.indexOf(endereco.id) !== -1;
      checkbox =
        '<span class="endereco-checkbox' + (marcado ? ' marcado' : '') + '" aria-hidden="true">' +
        (marcado ? '<img src="../assets/icons/check.svg" alt="" />' : '') +
        '</span>';
    }
    return (
      '<div class="endereco-card-topo">' +
      '<div class="topo-esquerda">' + checkbox +
      '<span class="endereco-tag ' + tag.classe + '">' + tag.texto + '</span>' +
      '</div>' +
      '<span class="endereco-status">' +
      '<img src="../assets/icons/' + (principal ? 'status-ativo' : 'status-salvo') + '.svg" alt="" />' +
      (principal ? 'Ativo' : 'Salvo') +
      '</span>' +
      '</div>'
    );
  }

  // No computador o bairro aparece junto da rua ("Rua X, 1 - Bairro"); no
  // celular ele ganha uma linha própria (Figma 402:3476) — o CSS alterna.
  function htmlCampos(e) {
    // Uma linha "Rótulo: valor" do cartão
    function linha(rotulo, valor, classeExtra) {
      return (
        '<div class="endereco-campo' + (classeExtra ? ' ' + classeExtra : '') + '">' +
        '<span class="rotulo">' + rotulo + '</span>' +
        '<span class="valor">' + valor + '</span>' +
        '</div>'
      );
    }
    var bairroJunto = e.bairro ? '<span class="so-desktop"> - ' + esc(e.bairro) + '</span>' : '';
    return (
      '<div class="endereco-campos">' +
      linha('Endereço:', esc(e.rua) + bairroJunto) +
      linha('Cidade/UF:', esc(e.cidade) + '/' + esc(e.uf)) +
      linha('CEP:', esc(e.cep)) +
      linha('Bairro:', esc(e.bairro), 'so-mobile-linha') +
      linha('Complem.:', esc(e.complemento)) +
      '</div>'
    );
  }

  // Cartão em modo de leitura. No modo "ver" o rodapé tem lápis/lixeira;
  // no modo "selecionar" o cartão inteiro vira uma caixinha clicável e o
  // rodapé mostra "Selecionado".
  function htmlCardVer(e, i) {
    var rodape;
    if (modo === 'selecionar') {
      var marcado = selecionados.indexOf(e.id) !== -1;
      rodape =
        '<div class="endereco-card-rodape">' +
        '<span class="selecionado-texto">' + (marcado ? 'Selecionado' : '') + '</span>' +
        '</div>';
    } else {
      rodape =
        '<div class="endereco-card-rodape">' +
        '<span class="nota">' + (i === 0 ? 'Endereço Principal' : '') + '</span>' +
        '<div class="botoes">' +
        '<button type="button" class="btn-circulo" data-editar="' + e.id + '" aria-label="Editar endereço">' +
        '<img src="../assets/icons/btn-editar-circulo.svg" alt="" />' +
        '</button>' +
        '<button type="button" class="btn-circulo btn-circulo-excluir" data-excluir="' + e.id + '" aria-label="Excluir endereço">' +
        '<img src="../assets/icons/trash.svg" alt="" />' +
        '</button>' +
        '</div>' +
        '</div>';
    }

    var classes = ['endereco-card'];
    var atributos = '';
    if (modo === 'selecionar') {
      var sel = selecionados.indexOf(e.id) !== -1;
      classes.push('selecionavel');
      if (sel) classes.push('selecionado');
      atributos = ' role="checkbox" tabindex="0" aria-checked="' + sel + '" data-selecionar="' + e.id + '"';
    }
    if (modo === 'editar') classes.push('esmaecido');

    return (
      '<article class="' + classes.join(' ') + '"' + atributos + '>' +
      htmlTopo(e, i) +
      htmlCampos(e) +
      rodape +
      '</article>'
    );
  }

  // Cartão em modo de edição: um formulário com os campos do endereço e os
  // botões Cancelar/Salvar (Figma 396:3508 / 402:3630).
  function htmlCardEditar(e, i) {
    var tag = tagDoIndice(i);
    // Rótulo + input de um campo; "classe" define a largura no layout
    function grupo(rotulo, campo, classe, extra) {
      return (
        '<label class="endereco-input-grupo ' + classe + '">' +
        '<span>' + rotulo + '</span>' +
        '<input type="text" data-campo="' + campo + '" value="' + esc(e[campo]) + '"' + (extra || '') + ' />' +
        '</label>'
      );
    }
    return (
      '<form class="endereco-card editando" id="form-endereco" novalidate>' +
      '<div class="endereco-card-topo">' +
      '<span class="endereco-tag ' + tag.classe + '">' + tag.texto + '</span>' +
      '<span class="editando-texto">' + (e.id === idNovo ? 'Novo Endereço' : 'Editando Endereço') + '</span>' +
      '</div>' +
      '<div class="endereco-form-campos">' +
      grupo('Endereço:', 'rua', 'largura-total', ' placeholder="Rua e número"') +
      '<div class="endereco-form-linha">' +
      grupo('Bairro:', 'bairro', 'flexivel') +
      grupo('CEP:', 'cep', 'largura-cep', ' inputmode="numeric" maxlength="9"') +
      '</div>' +
      '<div class="endereco-form-linha">' +
      grupo('Cidade:', 'cidade', 'flexivel') +
      grupo('UF:', 'uf', 'largura-uf', ' maxlength="2"') +
      grupo('Complemento:', 'complemento', 'largura-complemento') +
      '</div>' +
      '</div>' +
      '<div class="endereco-form-botoes">' +
      '<button type="button" class="btn-form-cancelar" data-cancelar>Cancelar</button>' +
      '<button type="submit" class="btn-form-salvar">Salvar</button>' +
      '</div>' +
      '</form>'
    );
  }

  // ------------------------------------------------------------ renderização

  function renderLista() {
    var lista = document.getElementById('enderecos-lista');
    if (!lista) return;

    lista.classList.toggle('modo-editar', modo === 'editar');
    lista.classList.toggle('modo-selecionar', modo === 'selecionar');

    if (enderecos.length === 0) {
      lista.innerHTML = '<p class="enderecos-vazio">Você ainda não tem endereços cadastrados.</p>';
    } else {
      lista.innerHTML = enderecos
        .map(function (e, i) {
          return modo === 'editar' && e.id === editandoId ? htmlCardEditar(e, i) : htmlCardVer(e, i);
        })
        .join('');
    }

    renderAcoes();
    ligarEventosLista(lista);
  }

  // Atualiza os botões de cima ("Selecionar endereços" / "Cancelar Seleção")
  // e a barra de seleção múltipla com a contagem de selecionados.
  function renderAcoes() {
    var btnSelecionar = document.getElementById('btn-selecionar');
    if (btnSelecionar) {
      btnSelecionar.textContent = modo === 'selecionar' ? 'Cancelar Seleção' : 'Selecionar endereços';
      btnSelecionar.disabled = enderecos.length === 0 && modo !== 'selecionar';
    }

    var barra = document.getElementById('barra-selecao');
    if (!barra) return;
    barra.hidden = modo !== 'selecionar';
    document.getElementById('selecao-contagem').textContent = String(selecionados.length);
    document.getElementById('btn-remover-selecionados').disabled = selecionados.length === 0;
    document.getElementById('btn-definir-principal').disabled = selecionados.length === 0;
  }

  // Liga os eventos dos cartões recém-desenhados: editar, excluir,
  // marcar/desmarcar na seleção e o formulário de edição.
  function ligarEventosLista(lista) {
    lista.querySelectorAll('[data-editar]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        abrirEdicao(Number(btn.getAttribute('data-editar')));
      });
    });

    lista.querySelectorAll('[data-excluir]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = Number(btn.getAttribute('data-excluir'));
        if (window.confirm('Deseja excluir este endereço?')) {
          enderecos = enderecos.filter(function (e) { return e.id !== id; });
          salvar();
          renderLista();
        }
      });
    });

    lista.querySelectorAll('[data-selecionar]').forEach(function (card) {
      // Marca/desmarca o cartão e devolve o foco a ele após redesenhar
      var alternar = function () {
        var id = Number(card.getAttribute('data-selecionar'));
        var pos = selecionados.indexOf(id);
        if (pos === -1) selecionados.push(id);
        else selecionados.splice(pos, 1);
        renderLista();
        var mesmo = document.querySelector('[data-selecionar="' + id + '"]');
        if (mesmo) mesmo.focus();
      };
      card.addEventListener('click', alternar);
      card.addEventListener('keydown', function (ev) {
        if (ev.key === ' ' || ev.key === 'Enter') {
          ev.preventDefault();
          alternar();
        }
      });
    });

    var form = document.getElementById('form-endereco');
    if (form) {
      form.addEventListener('submit', function (ev) {
        ev.preventDefault();
        salvarEdicao(form);
      });
      form.querySelector('[data-cancelar]').addEventListener('click', cancelarEdicao);
      var uf = form.querySelector('[data-campo="uf"]');
      uf.addEventListener('input', function () { uf.value = uf.value.toUpperCase(); });
    }
  }

  // ------------------------------------------------------------------ ações

  function abrirEdicao(id) {
    if (id !== idNovo) descartarNovo();
    modo = 'editar';
    editandoId = id;
    selecionados = [];
    renderLista();
    var form = document.getElementById('form-endereco');
    if (form) {
      form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      form.querySelector('input').focus({ preventScroll: true });
    }
  }

  // Um cartão novo que nunca foi salvo some ao cancelar/sair da edição
  function descartarNovo() {
    if (idNovo === null) return;
    var id = idNovo;
    enderecos = enderecos.filter(function (e) { return e.id !== id; });
    idNovo = null;
  }

  // "Cancelar" no formulário: volta ao modo "ver" sem salvar nada
  function cancelarEdicao() {
    descartarNovo();
    modo = 'ver';
    editandoId = null;
    renderLista();
  }

  // "Salvar" no formulário: valida os campos obrigatórios, grava e volta ao
  // modo "ver". Um endereço novo passa a valer de fato só a partir daqui.
  function salvarEdicao(form) {
    var dados = {};
    form.querySelectorAll('[data-campo]').forEach(function (input) {
      dados[input.getAttribute('data-campo')] = input.value.trim();
    });

    if (!dados.rua || !dados.cidade || !dados.uf || !dados.cep) {
      window.JacyStore.notificar('Preencha endereço, cidade, UF e CEP.', 'erro');
      return;
    }

    var endereco = enderecos.find(function (e) { return e.id === editandoId; });
    if (endereco) Object.assign(endereco, dados);
    var eraNovo = editandoId === idNovo;
    idNovo = null;
    salvar();

    modo = 'ver';
    editandoId = null;
    renderLista();
    window.JacyStore.notificar(eraNovo ? 'Endereço adicionado com sucesso!' : 'Endereço atualizado com sucesso!', 'sucesso');
  }

  // "+ Adicionar endereço": cria um cartão em branco no fim da lista, já em
  // modo de edição, com um id maior que todos os existentes.
  function adicionarEndereco() {
    descartarNovo();
    var novoId = enderecos.reduce(function (max, e) { return Math.max(max, e.id); }, 0) + 1;
    enderecos.push({ id: novoId, rua: '', bairro: '', cidade: '', uf: '', cep: '', complemento: '' });
    idNovo = novoId;
    abrirEdicao(novoId);
  }

  // "Selecionar endereços" / "Cancelar Seleção": entra e sai do modo de
  // seleção múltipla (sempre começando sem nada marcado).
  function alternarSelecao() {
    if (modo === 'selecionar') {
      modo = 'ver';
    } else {
      descartarNovo();
      modo = 'selecionar';
      editandoId = null;
    }
    selecionados = [];
    renderLista();
  }

  // "Remover selecionados": pede confirmação e apaga os marcados
  function removerSelecionados() {
    if (selecionados.length === 0) return;
    var msg = selecionados.length === 1
      ? 'Deseja excluir o endereço selecionado?'
      : 'Deseja excluir os ' + selecionados.length + ' endereços selecionados?';
    if (!window.confirm(msg)) return;
    enderecos = enderecos.filter(function (e) { return selecionados.indexOf(e.id) === -1; });
    salvar();
    modo = 'ver';
    selecionados = [];
    renderLista();
  }

  // Só um endereço pode ser o principal: ele vai para o topo da lista
  function definirPrincipal() {
    if (selecionados.length !== 1) {
      window.JacyStore.notificar('Selecione apenas um endereço para defini-lo como principal.', 'info');
      return;
    }
    var id = selecionados[0];
    var endereco = enderecos.find(function (e) { return e.id === id; });
    enderecos = [endereco].concat(enderecos.filter(function (e) { return e.id !== id; }));
    salvar();
    modo = 'ver';
    selecionados = [];
    renderLista();
  }

  document.addEventListener('DOMContentLoaded', function () {
    renderLista();

    document.getElementById('btn-selecionar').addEventListener('click', alternarSelecao);
    document.getElementById('btn-adicionar').addEventListener('click', adicionarEndereco);
    document.getElementById('btn-remover-selecionados').addEventListener('click', removerSelecionados);
    document.getElementById('btn-definir-principal').addEventListener('click', definirPrincipal);
  });
})();
