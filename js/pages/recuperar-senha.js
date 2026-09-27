// ============================================================================
// recuperar-senha.js
//
// Liga as duas telas do fluxo de recuperação de senha:
//   1) recuperar-senha.html              -> formulário pedindo o e-mail
//   2) recuperar-senha-confirmacao.html  -> "e-mail enviado", com contagem
//                                            regressiva para poder reenviar
//
// Figma: nodes 176:889 e 176:907, dentro da seção 176:954 "🔒 Segurança e Privacidade".
//
// Como não existe backend, nenhum e-mail é realmente enviado: o e-mail
// digitado é apenas mascarado (ex.: j***@email.com) e guardado no
// sessionStorage para a tela de confirmação conseguir exibi-lo.
// ============================================================================

(function () {
  var CHAVE_EMAIL = 'jm_recuperacao_email';

  // ----------------------------------------------------------------------
  // Tela 1: formulário de recuperar-senha.html
  // ----------------------------------------------------------------------
  function wireFormRecuperar() {
    var form = document.getElementById('form-recuperar');
    if (!form) return; // esta função só faz sentido em recuperar-senha.html

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = document.getElementById('email-recuperacao').value.trim();
      if (!email || email.indexOf('@') === -1) {
        window.JacyStore.notificar('Digite um e-mail válido.', 'erro');
        return;
      }

      // Guarda o e-mail já mascarado para a próxima tela usar
      sessionStorage.setItem(CHAVE_EMAIL, window.mascararEmail(email));
      window.location.href = 'recuperar-senha-confirmacao.html';
    });
  }

  // ----------------------------------------------------------------------
  // Tela 2: confirmação em recuperar-senha-confirmacao.html
  // ----------------------------------------------------------------------
  function wireConfirmacao() {
    var elEmail = document.getElementById('email-mascarado');
    var btnReenviar = document.getElementById('btn-reenviar');
    var textoTimer = document.getElementById('texto-timer');
    if (!elEmail || !btnReenviar || !textoTimer) return; // só faz sentido nesta tela

    // Mostra o e-mail mascarado guardado na tela anterior (ou um valor
    // de exemplo, caso a página seja aberta direto, sem passar pelo formulário)
    elEmail.textContent = sessionStorage.getItem(CHAVE_EMAIL) || 'j***@email.com';

    // Contagem regressiva de 59 segundos antes de liberar o botão "Reenviar e-mail"
    var segundosRestantes = 59;
    var intervalo = null;

    // 7 -> "00:07"
    function formatarTempo(segundos) {
      return '00:' + String(segundos).padStart(2, '0');
    }

    // Desabilita "Reenviar e-mail" e conta de 59 até 0; ao zerar, libera o botão
    function iniciarContagem() {
      segundosRestantes = 59;
      btnReenviar.disabled = true;
      textoTimer.hidden = false;
      textoTimer.textContent = 'Reenviar em ' + formatarTempo(segundosRestantes);

      intervalo = setInterval(function () {
        segundosRestantes -= 1;
        if (segundosRestantes <= 0) {
          clearInterval(intervalo);
          btnReenviar.disabled = false;
          textoTimer.hidden = true; // esconde o texto quando já pode reenviar
        } else {
          textoTimer.textContent = 'Reenviar em ' + formatarTempo(segundosRestantes);
        }
      }, 1000);
    }

    btnReenviar.addEventListener('click', function () {
      if (btnReenviar.disabled) return;
      window.JacyStore.notificar('E-mail reenviado!', 'sucesso');
      iniciarContagem(); // reinicia a contagem de 59s após reenviar
    });

    iniciarContagem();
  }

  document.addEventListener('DOMContentLoaded', function () {
    wireFormRecuperar();
    wireConfirmacao();
  });
})();
