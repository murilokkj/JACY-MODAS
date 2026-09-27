// ============================================================================
// registro.js
//
// Fluxo de criação de conta (registro.html). Figma: node 171:184 "📝 Tela de
// Registro" e node 171:185 "📍 Tela de Endereço".
//
// A página tem 5 "passos" (elementos com [data-passo]) escondidos/mostrados
// por este arquivo; só os passos 1-3 aparecem no indicador de progresso:
//   1) Dados pessoais
//   2) Informações de contato (email/telefone/CPF, com validação real)
//   3) Crie sua senha (requisitos ao vivo + confirmação)
//   4) Adicionar endereço (sem indicador — é a seção "Tela de Endereço" do
//      Figma, encadeada logo após o passo 3)
//   5) Sucesso
//
// Como não há backend, os dados ficam só em memória (objeto "dados") até o
// fim do fluxo, quando viram o usuário logado via window.JacyStore.setUser.
// ============================================================================

(function () {
  var SUBTITULOS = {
    1: 'Preencha os campos abaixo para iniciar o cadastro.',
    2: 'Precisamos de algumas informações para validar sua segurança.',
    3: 'Escolha uma senha forte para proteger seu perfil.'
  };

  var dados = {
    pessoais: {},
    contato: {},
    senha: '',
    endereco: {}
  };

  // Só depois da primeira tentativa de criar a conta os requisitos de senha
  // não cumpridos passam a aparecer em vermelho.
  var tentouEnviarSenha = false;

  // Mostra o passo "n" do cadastro e esconde os demais:
  //   1 a 3 -> dados pessoais, contato e senha (com o cabeçalho de passos);
  //   4     -> endereço (cabeçalho próprio);  5 -> tela de sucesso.
  function irParaPasso(n) {
    document.querySelectorAll('[data-passo]').forEach(function (el) {
      el.hidden = true;
    });
    document.getElementById('registro-header-passos').hidden = true;
    document.getElementById('registro-header-endereco').hidden = true;

    if (n >= 1 && n <= 3) {
      document.getElementById('registro-header-passos').hidden = false;
      document.getElementById('registro-subtitulo-texto').textContent = SUBTITULOS[n];
    } else if (n === 4) {
      document.getElementById('registro-header-endereco').hidden = false;
    }

    document.querySelector('[data-passo="' + n + '"]').hidden = false;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Destaca o campo em vermelho e mostra a mensagem de erro abaixo dele
  function marcarErro(input, mensagemEl, mensagem) {
    input.classList.add('erro');
    if (mensagemEl) {
      mensagemEl.textContent = mensagem;
      mensagemEl.hidden = false;
    }
  }

  // Remove o destaque de erro e esconde a mensagem
  function limparErro(input, mensagemEl) {
    input.classList.remove('erro');
    if (mensagemEl) mensagemEl.hidden = true;
  }

  // Validação real de CPF: 11 dígitos, não todos iguais, e os dois dígitos
  // verificadores batendo com o cálculo oficial (módulo 11).
  function validarCPF(cpfDigitado) {
    var cpf = cpfDigitado.replace(/\D/g, '');
    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;

    var soma = 0;
    var i;
    for (i = 1; i <= 9; i++) soma += parseInt(cpf.charAt(i - 1), 10) * (11 - i);
    var resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.charAt(9), 10)) return false;

    soma = 0;
    for (i = 1; i <= 10; i++) soma += parseInt(cpf.charAt(i - 1), 10) * (12 - i);
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    return resto === parseInt(cpf.charAt(10), 10);
  }

  // ===================== Passo 1: Dados pessoais =====================
  function wirePasso1() {
    var form = document.getElementById('passo-1');
    var nome = document.getElementById('reg-nome');
    var sobrenome = document.getElementById('reg-sobrenome');
    var nascimento = document.getElementById('reg-nascimento');
    var genero = document.getElementById('reg-genero');

    genero.addEventListener('change', function () {
      genero.classList.toggle('preenchido', !!genero.value);
      genero.classList.remove('erro');
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var valido = true;

      [nome, sobrenome].forEach(function (input) {
        if (input.value.trim()) {
          input.classList.remove('erro');
        } else {
          input.classList.add('erro');
          valido = false;
        }
      });

      var dataValida = /^\d{2}\/\d{2}\/\d{4}$/.test(nascimento.value.trim());
      nascimento.classList.toggle('erro', !dataValida);
      if (!dataValida) valido = false;

      if (genero.value) {
        genero.classList.remove('erro');
      } else {
        genero.classList.add('erro');
        valido = false;
      }

      if (!valido) return;

      dados.pessoais = {
        nome: nome.value.trim(),
        sobrenome: sobrenome.value.trim(),
        nascimento: nascimento.value.trim(),
        genero: genero.value
      };
      irParaPasso(2);
    });
  }

  // ===================== Passo 2: Informações de contato =====================
  function wirePasso2() {
    var form = document.getElementById('passo-2');
    var email = document.getElementById('reg-email');
    var emailErro = document.getElementById('reg-email-erro');
    var telefone = document.getElementById('reg-telefone');
    var cpf = document.getElementById('reg-cpf');
    var cpfErro = document.getElementById('reg-cpf-erro');

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var valido = true;

      var emailValor = email.value.trim();
      var emailFormatoOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValor);
      if (!emailFormatoOk) {
        marcarErro(email, emailErro, 'Email inválido');
        valido = false;
      } else if (emailValor.toLowerCase() === 'contato@usuario.com') {
        // E-mail de exemplo do próprio Figma (node 348:3337) usado aqui como
        // gatilho de demonstração do estado de erro "já cadastrado".
        marcarErro(email, emailErro, 'Este email já está cadastrado');
        valido = false;
      } else {
        limparErro(email, emailErro);
      }

      if (telefone.value.trim()) {
        telefone.classList.remove('erro');
      } else {
        telefone.classList.add('erro');
        valido = false;
      }

      if (validarCPF(cpf.value)) {
        limparErro(cpf, cpfErro);
      } else {
        marcarErro(cpf, cpfErro, 'CPF inválido');
        valido = false;
      }

      if (!valido) return;

      dados.contato = {
        email: emailValor,
        telefone: telefone.value.trim(),
        cpf: cpf.value.trim()
      };
      irParaPasso(3);
    });
  }

  // ===================== Passo 3: Crie sua senha =====================
  function wirePasso3() {
    var form = document.getElementById('passo-3');
    var senha = document.getElementById('reg-senha');
    var confirmar = document.getElementById('reg-confirmar-senha');

    var requisitos = {
      tamanho: { el: document.getElementById('req-tamanho'), teste: function (v) { return v.length >= 8; } },
      maiuscula: { el: document.getElementById('req-maiuscula'), teste: function (v) { return /[A-Z]/.test(v); } },
      numero: { el: document.getElementById('req-numero'), teste: function (v) { return /[0-9]/.test(v); } },
      especial: { el: document.getElementById('req-especial'), teste: function (v) { return /[^A-Za-z0-9]/.test(v); } }
    };
    var reqCoincide = document.getElementById('req-coincide');

    // Marca cada requisito da senha como cumprido (verde) ou não, e o de
    // "senhas coincidem"; devolve true se todos estiverem ok.
    function atualizarRequisitos() {
      var valor = senha.value;
      var todosOk = true;

      Object.keys(requisitos).forEach(function (chave) {
        var req = requisitos[chave];
        var ok = req.teste(valor);
        req.el.classList.toggle('cumprido', ok);
        req.el.classList.toggle('invalido', tentouEnviarSenha && !ok);
        if (!ok) todosOk = false;
      });

      var coincide = confirmar.value.length > 0 && confirmar.value === valor;
      reqCoincide.classList.toggle('cumprido', coincide);
      reqCoincide.classList.toggle('invalido', tentouEnviarSenha && !coincide);
      if (!coincide) todosOk = false;

      return todosOk;
    }

    senha.addEventListener('input', atualizarRequisitos);
    confirmar.addEventListener('input', atualizarRequisitos);

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      tentouEnviarSenha = true;
      var valido = atualizarRequisitos();
      if (!valido) return;

      dados.senha = senha.value;
      irParaPasso(4);
    });
  }

  // ===================== Passo 4: Adicionar endereço =====================
  function wirePasso4() {
    var form = document.getElementById('passo-4');
    var cep = document.getElementById('reg-cep');
    var cepErro = document.getElementById('reg-cep-erro');
    var endereco = document.getElementById('reg-endereco');
    var numero = document.getElementById('reg-numero');
    var bairro = document.getElementById('reg-bairro');
    var cidade = document.getElementById('reg-cidade');
    var uf = document.getElementById('reg-uf');
    var complemento = document.getElementById('reg-complemento');
    var salvarPadrao = document.getElementById('reg-endereco-padrao');

    document.getElementById('reg-calcular-cep').addEventListener('click', function () {
      var digitos = cep.value.replace(/\D/g, '');
      if (digitos.length !== 8) {
        marcarErro(cep, cepErro, 'CEP inválido');
        return;
      }
      limparErro(cep, cepErro);
      // Sem backend: preenche com um endereço de exemplo, consistente com o
      // mock usado em js/pages/minha-conta.js.
      endereco.value = 'Rua das Palmeiras';
      bairro.value = 'Jardim Aurora';
      cidade.value = 'São Paulo';
      uf.value = 'SP';
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var valido = true;

      var digitos = cep.value.replace(/\D/g, '');
      if (digitos.length === 8) {
        limparErro(cep, cepErro);
      } else {
        marcarErro(cep, cepErro, 'CEP inválido');
        valido = false;
      }

      [endereco, numero, bairro, cidade, uf].forEach(function (input) {
        if (input.value.trim()) {
          input.classList.remove('erro');
        } else {
          input.classList.add('erro');
          valido = false;
        }
      });

      if (!valido) return;

      dados.endereco = {
        cep: cep.value.trim(),
        endereco: endereco.value.trim(),
        numero: numero.value.trim(),
        bairro: bairro.value.trim(),
        cidade: cidade.value.trim(),
        uf: uf.value.trim(),
        complemento: complemento.value.trim(),
        padrao: salvarPadrao.checked
      };

      finalizarCadastro();
    });
  }

  // Junta os dados coletados nos 4 passos, "cria a conta" (loga o usuário
  // via localStorage, como o resto do site já faz) e mostra a tela de sucesso.
  function finalizarCadastro() {
    window.JacyStore.setUser({
      nome: dados.pessoais.nome,
      sobrenome: dados.pessoais.sobrenome,
      email: dados.contato.email,
      telefone: dados.contato.telefone,
      cpf: dados.contato.cpf,
      nascimento: dados.pessoais.nascimento,
      genero: dados.pessoais.genero,
      endereco: dados.endereco
    });
    irParaPasso(5);
  }

  // Links abaixo dos botões: "Voltar para o passo anterior" e "Já tem uma
  // conta? Faça login" (que abre o painel de login do header).
  function wireLinksSecundarios() {
    document.querySelectorAll('[data-action="voltar"]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        irParaPasso(Number(btn.getAttribute('data-para')));
      });
    });
    document.querySelectorAll('[data-action="abrir-login"]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        window.JacyStore.openPanel('user');
      });
    });
    document.getElementById('reg-ir-para-loja').addEventListener('click', function () {
      window.location.href = 'index.html';
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    wirePasso1();
    wirePasso2();
    wirePasso3();
    wirePasso4();
    wireLinksSecundarios();
  });
})();
