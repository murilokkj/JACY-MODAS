// ============================================================================
// admin-cadastro.js
//
// "Cadastro de produtos" (Figma node 429:7224): formulário com envio de
// imagens, dados do produto e a prévia ao lado, que se atualiza enquanto o
// administrador digita. Com ?editar=<id> a mesma tela edita um produto
// existente (é para onde o lápis da listagem leva).
//
// O Figma não tem os campos Categoria, Estoque e Status, mas a listagem e o
// controle de estoque precisam deles, então entram numa linha extra.
// ============================================================================

(function () {
  var Dados = window.JacyAdminDados;
  var Admin = window.JacyAdmin;

  var MAX_IMAGENS = 7; // 1 principal + 6 adicionais (os 6 quadrados "+")
  var COR_PADRAO = '#A6A9AE';

  var imagens = []; // posição 0 = principal; vazias ficam como null
  var editando = null; // produto sendo editado (ou null ao cadastrar)
  var slotAlvo = 0; // qual posição o seletor de arquivo vai preencher

  function el(id) { return document.getElementById(id); }

  // "1.299,90" ou "59,99" -> número (ou NaN se estiver inválido/vazio)
  function lerPreco(texto) {
    var t = String(texto).trim().replace(/\s/g, '').replace(/\./g, '').replace(',', '.');
    return t === '' ? NaN : Number(t);
  }

  function formatarPreco(n) {
    return n == null ? '' : n.toFixed(2).replace('.', ',');
  }

  // Lê a imagem escolhida e a reduz (máx. 900px) antes de guardar, para não
  // estourar o limite do localStorage com fotos grandes.
  function lerImagem(arquivo, depois) {
    var leitor = new FileReader();
    leitor.onload = function () {
      var img = new Image();
      img.onload = function () {
        var escala = Math.min(1, 900 / Math.max(img.width, img.height));
        var canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * escala);
        canvas.height = Math.round(img.height * escala);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        depois(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = function () { depois(null); };
      img.src = leitor.result;
    };
    leitor.onerror = function () { depois(null); };
    leitor.readAsDataURL(arquivo);
  }

  // ------------------------------------------------------------ imagens

  function renderImagens() {
    var principal = el('imagem-principal');
    if (imagens[0]) {
      principal.classList.add('com-imagem');
      principal.innerHTML =
        '<img class="admin-upload-foto" src="' + imagens[0] + '" alt="Imagem principal do produto" />' +
        '<span class="admin-slot-remover" data-remover="0" role="button" tabindex="0" aria-label="Remover imagem principal">&times;</span>';
    } else {
      principal.classList.remove('com-imagem');
      principal.innerHTML =
        '<img class="admin-upload-icone" src="../../assets/icons/admin/enviar-imagem.svg" alt="" />' +
        '<span class="admin-upload-textos"><strong>Clique para enviar a imagem</strong><span>PNG ou JPG</span></span>';
    }

    var html = '';
    for (var i = 1; i < MAX_IMAGENS; i++) {
      if (imagens[i]) {
        html +=
          '<div class="admin-slot com-imagem"><img src="' + imagens[i] + '" alt="Imagem adicional ' + i + '" />' +
          '<button type="button" class="admin-slot-remover" data-remover="' + i + '" aria-label="Remover imagem adicional ' + i + '">&times;</button></div>';
      } else {
        html +=
          '<button type="button" class="admin-slot" data-slot="' + i + '" aria-label="Adicionar imagem adicional ' + i + '">' +
          '<img src="../../assets/icons/admin/adicionar.svg" alt="" /></button>';
      }
    }
    el('imagens-extras').innerHTML = html;
    renderPrevia();
  }

  function escolherArquivo(posicao) {
    slotAlvo = posicao;
    el('arquivo-imagem').click();
  }

  // ------------------------------------------------------------ cor

  function atualizarCor() {
    var cor = Dados.CORES.filter(function (c) { return c.nome === el('produto-cor').value; })[0];
    var marca = el('cor-marca');
    if (cor) {
      marca.innerHTML = '<span class="admin-cor-bolinha admin-cor-bolinha--campo" style="background:' + cor.hex + '"></span>';
    } else {
      marca.innerHTML = '<img src="../../assets/icons/admin/cor-selecionada.svg" alt="" />';
    }
    el('produto-cor').classList.toggle('vazio', !cor);
  }

  // ------------------------------------------------------------ prévia

  function renderPrevia() {
    var foto = el('previa-foto');
    var primeira = imagens.filter(Boolean)[0];
    foto.innerHTML = primeira
      ? '<img src="' + primeira + '" alt="Prévia do produto" />'
      : '<span class="admin-previa-vazia">Envie uma imagem para ver a prévia</span>';

    el('previa-nome').textContent = el('produto-nome').value.trim() || '—';

    var venda = lerPreco(el('produto-preco').value);
    var promo = lerPreco(el('produto-promocional').value);
    var preco = !isNaN(promo) && promo > 0 ? promo : venda;
    el('previa-preco').textContent = isNaN(preco) ? '—' : formatarPreco(preco);

    el('previa-descricao').textContent = el('produto-descricao').value.trim() || '—';

    var ativo = el('produto-status').value === 'ativo';
    var badge = el('previa-status');
    badge.textContent = ativo ? 'ativo' : 'inativo';
    badge.className = 'admin-badge ' + (ativo ? 'admin-badge--ok' : 'admin-badge--erro');
  }

  // ------------------------------------------------------------ salvar

  function marcar(campo, invalido) {
    campo.classList.toggle('erro', invalido);
    return invalido;
  }

  function salvar(e) {
    e.preventDefault();

    var obrigatorios = ['produto-nome', 'produto-sku', 'produto-colecao', 'produto-tamanho', 'produto-descricao', 'produto-categoria', 'produto-estoque'];
    var faltando = false;
    obrigatorios.forEach(function (id) {
      if (marcar(el(id), !el(id).value.trim())) faltando = true;
    });

    var venda = lerPreco(el('produto-preco').value);
    if (marcar(el('produto-preco'), isNaN(venda) || venda <= 0)) faltando = true;

    var estoque = Number(el('produto-estoque').value);
    if (el('produto-estoque').value.trim() && marcar(el('produto-estoque'), !(estoque >= 0) || estoque % 1 !== 0)) {
      Admin.notificar('O estoque deve ser um número inteiro, zero ou maior.', 'erro');
      return;
    }

    if (faltando) {
      Admin.notificar('Preencha os campos obrigatórios (*).', 'erro');
      return;
    }

    var custo = lerPreco(el('produto-custo').value);
    if (el('produto-custo').value.trim() && marcar(el('produto-custo'), isNaN(custo) || custo < 0)) {
      Admin.notificar('Confira o preço de custo.', 'erro');
      return;
    }

    var promo = lerPreco(el('produto-promocional').value);
    var temPromo = el('produto-promocional').value.trim() !== '';
    if (temPromo && marcar(el('produto-promocional'), isNaN(promo) || promo <= 0 || promo >= venda)) {
      Admin.notificar('O preço promocional deve ser menor que o preço de venda.', 'erro');
      return;
    }

    var sku = el('produto-sku').value.trim().toUpperCase();
    if (marcar(el('produto-sku'), Dados.skuExiste(sku, editando && editando.id))) {
      Admin.notificar('Já existe um produto com este SKU.', 'erro');
      return;
    }

    var fotos = imagens.filter(Boolean);
    if (!fotos.length) {
      Admin.notificar('Envie ao menos uma imagem do produto.', 'erro');
      return;
    }

    var cor = Dados.CORES.filter(function (c) { return c.nome === el('produto-cor').value; })[0];
    var cores = editando ? editando.cores.slice() : [];
    if (cor) {
      // Ao editar, a cor escolhida substitui só a primeira; as demais ficam
      if (cores.length) cores[0] = cor; else cores = [cor];
    }

    var produto = {
      id: editando ? editando.id : null,
      nome: el('produto-nome').value.trim(),
      sku: sku,
      categoria: el('produto-categoria').value,
      colecao: el('produto-colecao').value.trim(),
      tamanhos: el('produto-tamanho').value.trim(),
      descricao: el('produto-descricao').value.trim(),
      cores: cores,
      custo: isNaN(custo) ? null : custo,
      preco: venda,
      promocional: temPromo ? promo : null,
      estoque: estoque,
      status: el('produto-status').value,
      imagens: fotos
    };

    try {
      Dados.salvarProduto(produto);
    } catch (erro) {
      Admin.notificar('Não foi possível salvar: as imagens ocupam espaço demais. Use fotos menores.', 'erro');
      return;
    }

    Admin.notificar(editando ? 'Produto atualizado com sucesso!' : 'Produto cadastrado com sucesso!', 'sucesso');
    setTimeout(function () { window.location.href = 'gerenciamento-produtos.html'; }, 900);
  }

  // ------------------------------------------------------------ edição

  function preencher(produto) {
    el('produto-nome').value = produto.nome;
    el('produto-sku').value = produto.sku;
    el('produto-colecao').value = produto.colecao;
    el('produto-tamanho').value = produto.tamanhos;
    el('produto-descricao').value = produto.descricao;
    el('produto-categoria').value = produto.categoria;
    el('produto-estoque').value = produto.estoque;
    el('produto-status').value = produto.status;
    el('produto-custo').value = formatarPreco(produto.custo);
    el('produto-preco').value = formatarPreco(produto.preco);
    el('produto-promocional').value = formatarPreco(produto.promocional);
    if (produto.cores[0]) el('produto-cor').value = produto.cores[0].nome;
    imagens = produto.imagens.slice(0, MAX_IMAGENS);
  }

  document.addEventListener('DOMContentLoaded', function () {
    // Opções de categoria e de cor vêm dos dados compartilhados
    el('produto-categoria').innerHTML = '<option value="" disabled selected>Selecione</option>' +
      Dados.CATEGORIAS.map(function (c) { return '<option>' + c + '</option>'; }).join('');
    el('produto-cor').innerHTML = '<option value="" selected>Selecione a cor</option>' +
      Dados.CORES.map(function (c) { return '<option>' + c.nome + '</option>'; }).join('');

    var id = new URLSearchParams(window.location.search).get('editar');
    if (id) {
      editando = Dados.obterProduto(id);
      if (editando) {
        preencher(editando);
        el('cadastro-titulo').textContent = 'Editar produto';
        document.title = 'Editar produto — Jacy Modas (admin)';
      } else {
        Admin.notificar('Produto não encontrado. Cadastre um novo.', 'erro');
      }
    }

    atualizarCor();
    renderImagens();

    el('imagem-principal').addEventListener('click', function (e) {
      var remover = e.target.closest('[data-remover]');
      if (remover) {
        imagens[0] = null;
        renderImagens();
        return;
      }
      escolherArquivo(0);
    });
    el('imagem-principal').addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (e.target.closest('[data-remover]')) { imagens[0] = null; renderImagens(); }
        else escolherArquivo(0);
      }
    });

    el('imagens-extras').addEventListener('click', function (e) {
      var remover = e.target.closest('[data-remover]');
      if (remover) {
        imagens[Number(remover.getAttribute('data-remover'))] = null;
        renderImagens();
        return;
      }
      var slot = e.target.closest('[data-slot]');
      if (slot) escolherArquivo(Number(slot.getAttribute('data-slot')));
    });

    el('arquivo-imagem').addEventListener('change', function (e) {
      var arquivo = e.target.files[0];
      e.target.value = '';
      if (!arquivo) return;
      if (!/^image\/(png|jpeg)$/.test(arquivo.type)) {
        Admin.notificar('Envie uma imagem PNG ou JPG.', 'erro');
        return;
      }
      lerImagem(arquivo, function (dataUrl) {
        if (!dataUrl) {
          Admin.notificar('Não foi possível ler essa imagem.', 'erro');
          return;
        }
        imagens[slotAlvo] = dataUrl;
        renderImagens();
      });
    });

    el('produto-cor').addEventListener('change', atualizarCor);

    ['produto-nome', 'produto-preco', 'produto-promocional', 'produto-descricao', 'produto-status'].forEach(function (campo) {
      el(campo).addEventListener('input', renderPrevia);
      el(campo).addEventListener('change', renderPrevia);
    });

    // Tira o destaque vermelho assim que o campo volta a ser editado
    el('form-produto').addEventListener('input', function (e) {
      e.target.classList.remove('erro');
    });

    el('form-produto').addEventListener('submit', salvar);
  });
})();
