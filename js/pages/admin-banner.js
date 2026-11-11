// ============================================================================
// admin-banner.js
//
// Comportamento da tela "Banner do site" (pages/admin/banner.html).
// Figma: node 466:3630 "Banner da página inicial".
//
// Fluxo:
//   1. Ao abrir, carrega o banner atual (window.JacyBanner.obterBanner) e
//      preenche o texto alternativo e o link.
//   2. O administrador escolhe uma imagem (clique, teclado ou arrastar e
//      soltar); o arquivo é validado e aparece na prévia — nada é publicado.
//   3. "SALVAR" envia imagem + textos por window.JacyBanner.salvarBanner
//      (hoje localStorage, depois a API) e o banner passa a valer na tela
//      inicial. "CANCELAR" descarta o que não foi salvo.
// ============================================================================

(function () {
  var notificar = function (msg, tipo) { window.JacyAdmin.notificar(msg, tipo); };

  var bannerSalvo = null;   // banner atualmente publicado
  var arquivoNovo = null;   // imagem escolhida e ainda não salva
  var urlPrevia = null;     // object URL da prévia (liberada ao trocar)

  var el = {};

  // ------------------------------------------------------------- prévia

  // Mostra a imagem escolhida na prévia ou volta ao estado "aguardando"
  function mostrarPrevia(arquivo) {
    if (urlPrevia) URL.revokeObjectURL(urlPrevia);
    urlPrevia = arquivo ? URL.createObjectURL(arquivo) : null;

    el.previaImagem.hidden = !arquivo;
    el.previaVazia.hidden = !!arquivo;
    if (arquivo) {
      el.previaImagem.src = urlPrevia;
      el.previaImagem.alt = el.alt.value.trim() || 'Prévia do novo banner';
    } else {
      el.previaImagem.removeAttribute('src');
    }

    // A área de envio passa a mostrar o arquivo escolhido
    el.envio.classList.toggle('com-arquivo', !!arquivo);
    el.envioPrincipal.textContent = arquivo ? arquivo.name : 'Clique para selecionar uma imagem';
    el.envioSecundario.textContent = arquivo ? 'Clique para trocar a imagem' : 'ou arraste o arquivo até aqui';
  }

  // Valida e usa o arquivo escolhido; inválido = avisa e mantém o anterior
  function escolherArquivo(arquivo) {
    var erro = window.JacyBanner.validarArquivo(arquivo);
    if (erro) {
      notificar(erro, 'erro');
      return;
    }
    arquivoNovo = arquivo;
    mostrarPrevia(arquivo);
  }

  // ---------------------------------------------------------- formulário

  // Preenche os campos com o banner publicado
  function preencherCampos() {
    el.alt.value = bannerSalvo ? bannerSalvo.textoAlternativo || '' : '';
    el.link.value = bannerSalvo ? bannerSalvo.link || '' : '';
    el.alt.classList.remove('erro');
    el.link.classList.remove('erro');
  }

  // true se há imagem nova ou textos diferentes do banner publicado
  function houveAlteracao() {
    var atual = bannerSalvo || {};
    return !!arquivoNovo ||
      el.alt.value.trim() !== (atual.textoAlternativo || '') ||
      el.link.value.trim() !== (atual.link || '');
  }

  function salvar(e) {
    e.preventDefault();
    var alt = el.alt.value.trim();
    var link = el.link.value.trim();

    if (!houveAlteracao()) {
      notificar('Nenhuma alteração para salvar.', 'info');
      return;
    }

    // O texto alternativo é obrigatório: o banner é a primeira imagem da loja
    el.alt.classList.toggle('erro', !alt);
    if (!alt) {
      notificar('Descreva a imagem no campo de texto alternativo.', 'erro');
      el.alt.focus();
      return;
    }

    var erroLink = window.JacyBanner.validarLink(link);
    el.link.classList.toggle('erro', !!erroLink);
    if (erroLink) {
      notificar(erroLink, 'erro');
      el.link.focus();
      return;
    }

    el.salvar.disabled = true;
    el.salvar.textContent = 'SALVANDO...';

    window.JacyBanner.salvarBanner({ arquivo: arquivoNovo, textoAlternativo: alt, link: link })
      .then(function (banner) {
        bannerSalvo = banner;
        arquivoNovo = null;
        mostrarPrevia(null);
        preencherCampos();
        notificar('Banner atualizado! Ele já aparece na página inicial.', 'sucesso');
      })
      .catch(function (erro) {
        notificar(erro.message, 'erro');
      })
      .then(function () {
        el.salvar.disabled = false;
        el.salvar.textContent = 'SALVAR';
      });
  }

  // Descarta a imagem escolhida e volta os campos ao que está publicado
  function cancelar() {
    if (!houveAlteracao()) return;
    arquivoNovo = null;
    el.arquivo.value = '';
    mostrarPrevia(null);
    preencherCampos();
    notificar('Alterações descartadas.', 'info');
  }

  // ------------------------------------------------------------- eventos

  function ligarEnvio() {
    var abrirSeletor = function () { el.arquivo.click(); };

    el.envio.addEventListener('click', abrirSeletor);
    el.envio.addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter' || ev.key === ' ') {
        ev.preventDefault();
        abrirSeletor();
      }
    });
    el.arquivo.addEventListener('change', function () {
      if (el.arquivo.files[0]) escolherArquivo(el.arquivo.files[0]);
      el.arquivo.value = ''; // permite escolher o mesmo arquivo de novo
    });

    // Arrastar e soltar: destaca a área enquanto o arquivo está por cima
    ['dragenter', 'dragover'].forEach(function (tipo) {
      el.envio.addEventListener(tipo, function (ev) {
        ev.preventDefault();
        el.envio.classList.add('arrastando');
      });
    });
    ['dragleave', 'drop'].forEach(function (tipo) {
      el.envio.addEventListener(tipo, function (ev) {
        ev.preventDefault();
        el.envio.classList.remove('arrastando');
      });
    });
    el.envio.addEventListener('drop', function (ev) {
      var arquivo = ev.dataTransfer && ev.dataTransfer.files[0];
      if (arquivo) escolherArquivo(arquivo);
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    el = {
      form: document.getElementById('form-banner'),
      envio: document.getElementById('banner-envio'),
      envioPrincipal: document.getElementById('banner-envio-principal'),
      envioSecundario: document.getElementById('banner-envio-secundario'),
      arquivo: document.getElementById('banner-arquivo'),
      previaVazia: document.getElementById('banner-previa-vazia'),
      previaImagem: document.getElementById('banner-previa-imagem'),
      alt: document.getElementById('banner-alt'),
      link: document.getElementById('banner-link'),
      cancelar: document.getElementById('banner-cancelar'),
      salvar: document.getElementById('banner-salvar')
    };

    ligarEnvio();
    el.form.addEventListener('submit', salvar);
    el.cancelar.addEventListener('click', cancelar);
    el.alt.addEventListener('input', function () {
      el.alt.classList.remove('erro');
      if (arquivoNovo) el.previaImagem.alt = el.alt.value.trim() || 'Prévia do novo banner';
    });
    el.link.addEventListener('input', function () { el.link.classList.remove('erro'); });

    window.JacyBanner.obterBanner().then(function (banner) {
      bannerSalvo = banner;
      preencherCampos();
    });
  });
})();
