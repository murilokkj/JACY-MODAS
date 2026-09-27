// ============================================================================
// minha-conta.js
//
// Comportamento da tela "Gerenciar minha conta" (minha-conta.html).
// Figma: node 171:187 "👤 Gerenciamento do Usuário".
//
// A seção "Dados pessoais" tem dois modos:
//   - "ver"    -> rótulo + valor em texto simples (estado inicial)
//   - "editar" -> os mesmos campos viram <input>, com botões Salvar/Cancelar
// Clicar no lápis muda de "ver" para "editar"; Salvar valida e volta para
// "ver" com os novos valores; Cancelar volta para "ver" descartando a edição.
// A seção "Endereço" é só leitura: o lápis dela é um link para a tela
// "Meus endereços" (enderecos.html), onde os endereços são gerenciados.
//
// Como não há backend, os dados abaixo são só um mock guardado em memória
// (perdem-se ao recarregar a página).
// ============================================================================

(function () {
  // Dados atuais de cada seção — chave do campo -> valor exibido
  var dados = {
    pessoais: {
      nome: 'João da Silva',
      cpf: '123.456.789-00',
      nascimento: '15/03/1990',
      telefone: '(11) 98765-4321'
    },
    // Preenchido com o endereço principal de "Meus endereços" (ver dadosEndereco)
    endereco: null
  };

  // O cartão "Endereço" mostra sempre o principal (o primeiro da lista em
  // "Meus endereços", js/shared/enderecos-dados.js), no formato do design:
  // "Rua, número - Bairro" / "Cidade/UF" / "CEP".
  function dadosEndereco() {
    var e = window.JacyEnderecos.principal();
    if (!e) return null;
    return {
      endereco: e.rua + (e.bairro ? ' - ' + e.bairro : ''),
      cidade: e.cidade + '/' + e.uf,
      cep: e.cep
    };
  }

  // Os endereços vêm do que o usuário digitou em "Meus endereços"
  function esc(texto) {
    return String(texto == null ? '' : texto)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  // Define a ordem e o rótulo de cada campo por seção
  var CAMPOS = {
    pessoais: [
      { chave: 'nome', rotulo: 'Nome:' },
      { chave: 'cpf', rotulo: 'CPF:' },
      { chave: 'nascimento', rotulo: 'Data de nascimento:', rotuloCurto: 'Nascimento:' },
      { chave: 'telefone', rotulo: 'Telefone:' }
    ],
    endereco: [
      { chave: 'endereco', rotulo: 'Endereço:' },
      { chave: 'cidade', rotulo: 'Cidade/UF:' },
      { chave: 'cep', rotulo: 'CEP:' }
    ]
  };

  // Marca qual seção está em edição: a seção ganha a classe "editando" e o
  // cartão inteiro ganha "em-edicao" — o CSS usa isso para esconder os
  // lápis e esmaecer a outra seção (Figma 169:59 / 289:2222).
  function marcarEdicao(secao, editando) {
    var el = document.getElementById('secao-' + secao);
    if (el) el.classList.toggle('editando', editando);
    var card = document.querySelector('.conta-perfil-card');
    if (card) card.classList.toggle('em-edicao', !!document.querySelector('.conta-secao.editando'));
  }

  // No celular alguns rótulos são abreviados (Figma 289:2126 "Nascimento:")
  function htmlRotulo(campo) {
    if (!campo.rotuloCurto) return '<p class="rotulo">' + campo.rotulo + '</p>';
    return (
      '<p class="rotulo">' +
      '<span class="so-desktop">' + campo.rotulo + '</span>' +
      '<span class="so-mobile">' + campo.rotuloCurto + '</span>' +
      '</p>'
    );
  }

  // Modo "ver": rótulo + valor como texto
  function renderView(secao) {
    var container = document.getElementById('campos-' + secao);
    if (!container) return;
    marcarEdicao(secao, false);
    if (!dados[secao]) {
      container.innerHTML = '<p class="valor">Nenhum endereço cadastrado.</p>';
      return;
    }
    container.innerHTML = CAMPOS[secao]
      .map(function (campo) {
        return (
          '<div class="conta-campo-linha">' +
          htmlRotulo(campo) +
          '<p class="valor">' + esc(dados[secao][campo.chave]) + '</p>' +
          '</div>'
        );
      })
      .join('');
  }

  // Modo "editar": rótulo + <input>, com os botões Salvar/Cancelar no final
  function renderEdit(secao) {
    var container = document.getElementById('campos-' + secao);
    if (!container) return;
    marcarEdicao(secao, true);

    var camposHtml = CAMPOS[secao]
      .map(function (campo) {
        return (
          '<div class="conta-campo-linha">' +
          htmlRotulo(campo) +
          '<input type="text" data-campo="' + campo.chave + '" value="' + dados[secao][campo.chave] + '" />' +
          '</div>'
        );
      })
      .join('');

    container.innerHTML =
      camposHtml +
      '<div class="acoes-duas-colunas">' +
      '<button type="button" class="btn-primario-pink" data-salvar>Salvar</button>' +
      '<button type="button" class="btn-secundario-outline" data-cancelar>Cancelar</button>' +
      '</div>';

    container.querySelector('[data-salvar]').addEventListener('click', function () {
      // Recolhe o valor de cada input e grava de volta em "dados" antes de
      // voltar para o modo de visualização.
      CAMPOS[secao].forEach(function (campo) {
        var input = container.querySelector('[data-campo="' + campo.chave + '"]');
        if (input && input.value.trim()) {
          dados[secao][campo.chave] = input.value.trim();
        }
      });
      renderView(secao);
      window.JacyStore.notificar('Dados atualizados com sucesso!', 'sucesso');
    });

    container.querySelector('[data-cancelar]').addEventListener('click', function () {
      renderView(secao); // descarta o que foi digitado, mantém os dados antigos
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    renderView('pessoais');
    dados.endereco = dadosEndereco();
    renderView('endereco');

    // Só "Dados pessoais" edita aqui; o lápis do endereço é um link para enderecos.html
    document.querySelectorAll('button.btn-editar[data-alvo]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        renderEdit(btn.getAttribute('data-alvo'));
      });
    });
  });
})();
