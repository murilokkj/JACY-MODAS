// ============================================================================
// banner-dados.js
//
// Dados do banner da página inicial, compartilhados entre a tela
// administrativa "Banner do site" (pages/admin/banner.html) e a tela inicial
// da loja (pages/index.html), que exibe o banner salvo.
//
// Pensado para trocar facilmente o armazenamento por uma API + banco:
//   - As telas só usam window.JacyBanner.obterBanner() e salvarBanner(), que
//     sempre devolvem Promises — o mesmo formato de uma chamada fetch().
//   - Existem dois "adaptadores" com a mesma interface:
//       adaptadorLocal -> usado hoje: grava no localStorage do navegador;
//       adaptadorApi   -> já escrito para o backend (GET/PUT em API_URL).
//   - Para ligar a API basta mudar USAR_API para true (e ajustar API_URL);
//     nenhuma tela precisa ser alterada.
//
// Formato do banner (o mesmo que a API deve devolver):
//   {
//     imagem: "url ou data:image/...",   // endereço da imagem do banner
//     textoAlternativo: "texto",         // descrição para leitores de tela
//     link: "https://..." | "",          // destino ao clicar (opcional)
//     atualizadoEm: "2026-11-11T10:00:00.000Z" | null
//   }
//
// Figma: node 466:3630 "Banner da página inicial".
// ============================================================================

(function () {
  // ------------------------------------------------------------- configuração

  // false = localStorage (protótipo); true = backend real em API_URL
  var USAR_API = false;

  // Endpoint esperado no backend:
  //   GET  API_URL  -> devolve o banner atual (JSON no formato acima)
  //   PUT  API_URL  -> recebe multipart/form-data com os campos "imagem"
  //                    (arquivo, opcional), "textoAlternativo" e "link" e
  //                    devolve o banner atualizado
  var API_URL = '/api/banner';

  var STORAGE_KEY = 'jm_banner';

  // Regras de envio (as mesmas mostradas na tela e que a API deve validar)
  var TIPOS_ACEITOS = ['image/png', 'image/jpeg', 'image/webp'];
  var TAMANHO_MAXIMO = 5 * 1024 * 1024; // 5 MB
  var LARGURA_SUGERIDA = 1920;
  var ALTURA_SUGERIDA = 640;

  // Caminhos relativos à raiz do projeto; prefixo() ajusta conforme a pasta
  // da página (pages/ ou pages/admin/)
  var BANNER_PADRAO = {
    imagem: 'assets/images/banner-sorteio.png',
    textoAlternativo: 'Sorteio: acerte o placar e concorra a uma camiseta do Brasil',
    link: '',
    atualizadoEm: null
  };

  // Quantos "../" separam a página atual da raiz do projeto
  function prefixo() {
    return window.location.pathname.indexOf('/pages/admin/') !== -1 ? '../../' : '../';
  }

  // Imagens salvas como caminho do projeto ("assets/...") ganham o prefixo da
  // pasta atual; URLs completas e data: URLs ficam como estão
  function resolverImagem(banner) {
    var copia = Object.assign({}, banner);
    if (copia.imagem && copia.imagem.indexOf('assets/') === 0) {
      copia.imagem = prefixo() + copia.imagem;
    }
    return copia;
  }

  // ------------------------------------------------------------- validação

  // Devolve a mensagem de erro do arquivo ou null se ele puder ser usado
  function validarArquivo(arquivo) {
    if (!arquivo) return 'Selecione uma imagem para o banner.';
    if (TIPOS_ACEITOS.indexOf(arquivo.type) === -1) return 'Formato não aceito. Envie uma imagem PNG, JPG ou WebP.';
    if (arquivo.size > TAMANHO_MAXIMO) return 'A imagem passa de 5 MB. Escolha um arquivo menor.';
    return null;
  }

  // Link vazio é permitido; preenchido, precisa ser http(s) ou um caminho do site
  function validarLink(link) {
    if (!link) return null;
    try {
      var url = new URL(link, window.location.href);
      if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Error();
      return null;
    } catch (e) {
      return 'Link de destino inválido. Use um endereço como https://seusite.com.br/colecao.';
    }
  }

  // ------------------------------------------------------- adaptador local

  // Reduz a imagem para no máximo 1920 × 640 px e a converte em data: URL
  // (JPEG), para caber no localStorage. Com a API, o arquivo original é
  // enviado e o servidor fica responsável por otimizar.
  function arquivoParaDataUrl(arquivo) {
    return new Promise(function (resolve, reject) {
      var leitor = new FileReader();
      leitor.onerror = function () { reject(new Error('Não foi possível ler a imagem.')); };
      leitor.onload = function () {
        var img = new Image();
        img.onerror = function () { reject(new Error('Não foi possível abrir a imagem.')); };
        img.onload = function () {
          var escala = Math.min(1, LARGURA_SUGERIDA / img.width, ALTURA_SUGERIDA / img.height);
          var canvas = document.createElement('canvas');
          canvas.width = Math.round(img.width * escala);
          canvas.height = Math.round(img.height * escala);
          canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        };
        img.src = leitor.result;
      };
      leitor.readAsDataURL(arquivo);
    });
  }

  var adaptadorLocal = {
    obter: function () {
      try {
        var salvo = JSON.parse(localStorage.getItem(STORAGE_KEY));
        if (salvo && salvo.imagem) return Promise.resolve(salvo);
      } catch (e) { /* cai no banner padrão */ }
      return Promise.resolve(Object.assign({}, BANNER_PADRAO));
    },

    salvar: function (dados) {
      var imagemPronta = dados.arquivo
        ? arquivoParaDataUrl(dados.arquivo)
        : adaptadorLocal.obter().then(function (atual) { return atual.imagem; });

      return imagemPronta.then(function (imagem) {
        var banner = {
          imagem: imagem,
          textoAlternativo: dados.textoAlternativo,
          link: dados.link,
          atualizadoEm: new Date().toISOString()
        };
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(banner));
        } catch (e) {
          throw new Error('Não há espaço no navegador para salvar esta imagem. Tente uma imagem menor.');
        }
        return banner;
      });
    }
  };

  // --------------------------------------------------------- adaptador API

  var adaptadorApi = {
    obter: function () {
      return fetch(API_URL, { headers: { Accept: 'application/json' } }).then(function (resposta) {
        if (!resposta.ok) throw new Error('Não foi possível carregar o banner.');
        return resposta.json();
      });
    },

    salvar: function (dados) {
      var corpo = new FormData();
      if (dados.arquivo) corpo.append('imagem', dados.arquivo);
      corpo.append('textoAlternativo', dados.textoAlternativo);
      corpo.append('link', dados.link);
      return fetch(API_URL, { method: 'PUT', body: corpo }).then(function (resposta) {
        if (!resposta.ok) throw new Error('Não foi possível salvar o banner. Tente novamente.');
        return resposta.json();
      });
    }
  };

  var adaptador = USAR_API ? adaptadorApi : adaptadorLocal;

  // ------------------------------------------------------- interface pública

  // Banner atual, pronto para usar no <img> da página que chamou
  function obterBanner() {
    return adaptador.obter()
      .catch(function () { return Object.assign({}, BANNER_PADRAO); })
      .then(resolverImagem);
  }

  // Salva o banner. dados = { arquivo: File | null, textoAlternativo, link }.
  // Sem arquivo novo, mantém a imagem atual e só atualiza os textos.
  function salvarBanner(dados) {
    var erro = (dados.arquivo ? validarArquivo(dados.arquivo) : null) || validarLink(dados.link);
    if (erro) return Promise.reject(new Error(erro));
    return adaptador.salvar(dados).then(resolverImagem);
  }

  window.JacyBanner = {
    TIPOS_ACEITOS: TIPOS_ACEITOS,
    TAMANHO_MAXIMO: TAMANHO_MAXIMO,
    validarArquivo: validarArquivo,
    validarLink: validarLink,
    obterBanner: obterBanner,
    salvarBanner: salvarBanner
  };
})();
