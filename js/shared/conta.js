// ============================================================================
// conta.js
//
// Comportamento da página "Segurança e privacidade" (seguranca-privacidade.html).
// Figma: node 176:749, dentro da seção 176:954 "🔒 Segurança e Privacidade".
//
// Como não existe um backend real, "salvar" a senha ou o e-mail apenas
// valida os campos no navegador e mostra uma confirmação — nada é enviado
// para um servidor.
// ============================================================================

(function () {
  // Alterna um campo de senha entre "password" (oculto) e "text" (visível)
  // quando o usuário clica no ícone de olho ao lado do campo.
  function wireMostrarSenha() {
    document.querySelectorAll('.btn-mostrar-senha').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var input = document.getElementById(btn.getAttribute('data-alvo'));
        if (!input) return;
        input.type = input.type === 'password' ? 'text' : 'password';
      });
    });
  }

  // Liga/desliga a classe "cumprido" no requisito "No mínimo 8 caracteres"
  // conforme o usuário digita a nova senha (validação em tempo real).
  function wireRequisitoSenha() {
    var novaSenha = document.getElementById('senha-nova');
    var requisito = document.getElementById('requisito-tamanho');
    if (!novaSenha || !requisito) return;

    var verificar = function () {
      requisito.classList.toggle('cumprido', novaSenha.value.length >= 8);
    };
    novaSenha.addEventListener('input', verificar);
    verificar(); // roda uma vez ao carregar, caso o campo já venha preenchido
  }

  // Formulário "Alterar Senha": valida os 3 campos e simula o salvamento.
  function wireFormSenha() {
    var form = document.getElementById('form-senha');
    if (!form) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var atual = document.getElementById('senha-atual').value;
      var nova = document.getElementById('senha-nova').value;
      var confirmar = document.getElementById('senha-confirmar').value;

      if (!atual) {
        window.JacyStore.notificar('Digite sua senha atual.', 'erro');
        return;
      }
      if (nova.length < 8) {
        window.JacyStore.notificar('A nova senha deve ter no mínimo 8 caracteres.', 'erro');
        return;
      }
      if (nova !== confirmar) {
        window.JacyStore.notificar('A confirmação não é igual à nova senha.', 'erro');
        return;
      }

      window.JacyStore.notificar('Senha alterada com sucesso!', 'sucesso');
      form.reset();
      document.getElementById('requisito-tamanho').classList.remove('cumprido');
    });

    // Botão "Cancelar": limpa os 3 campos sem validar nada
    var cancelar = document.getElementById('btn-cancelar-senha');
    if (cancelar) {
      cancelar.addEventListener('click', function () {
        form.reset();
        document.getElementById('requisito-tamanho').classList.remove('cumprido');
      });
    }
  }

  // Formulário "Alterar E-mail": valida o novo e-mail e atualiza a linha
  // "E-mail atual:" exibida acima do campo.
  function wireFormEmail() {
    var form = document.getElementById('form-email');
    if (!form) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var novoEmailInput = document.getElementById('email-novo');
      var novoEmail = novoEmailInput.value.trim();

      if (!novoEmail || novoEmail.indexOf('@') === -1) {
        window.JacyStore.notificar('Digite um e-mail válido.', 'erro');
        return;
      }

      document.getElementById('email-atual-valor').textContent = mascararEmail(novoEmail);
      novoEmailInput.value = '';
      window.JacyStore.notificar('E-mail atualizado com sucesso!', 'sucesso');
    });
  }

  // Transforma "joao.silva@gmail.com" em "j***@gmail.com", igual ao padrão
  // usado no design (j***@email.com) — usada aqui e na tela de recuperação.
  function mascararEmail(email) {
    var partes = email.split('@');
    if (partes.length !== 2 || !partes[0]) return email;
    return partes[0].charAt(0) + '***@' + partes[1];
  }
  window.mascararEmail = mascararEmail; // reaproveitado por js/pages/recuperar-senha.js

  // As duas chavinhas de privacidade não precisam de nenhum código: o
  // visual liga/desliga já funciona sozinho via CSS (:checked), pois cada
  // uma é um <input type="checkbox"> real dentro do rótulo ".toggle-switch".

  document.addEventListener('DOMContentLoaded', function () {
    wireMostrarSenha();
    wireRequisitoSenha();
    wireFormSenha();
    wireFormEmail();
  });
})();
