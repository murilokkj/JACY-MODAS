// ============================================================================
// enderecos-dados.js
//
// Lista de endereços da conta, compartilhada entre a tela "Meus endereços"
// (js/pages/enderecos.js) e o cartão "Endereço" de "Minha conta"
// (js/pages/minha-conta.js), que mostra sempre o endereço principal.
//
// Como não há backend, a lista fica no localStorage (chave "jm_enderecos"),
// começando com os 3 endereços de exemplo do design. O primeiro endereço da
// lista é sempre o principal.
// ============================================================================

(function () {
  var STORAGE_KEY = 'jm_enderecos';

  var EXEMPLO = [
    { id: 1, rua: 'Rua das Palmeiras, 742', bairro: 'Jardim Aurora', cidade: 'São Paulo', uf: 'SP', cep: '01234-567', complemento: 'Apto 302' },
    { id: 2, rua: 'Rua Martino Arosio, 38', bairro: 'Vila Aurora', cidade: 'São Paulo', uf: 'SP', cep: '05186-150', complemento: 'Casa' },
    { id: 3, rua: 'Avenida Paulista, 1000', bairro: 'Bela Vista', cidade: 'São Paulo', uf: 'SP', cep: '01310-100', complemento: 'Bloco B, Conj. 42' }
  ];

  // Lista salva ou, na primeira visita, uma cópia dos exemplos
  function carregar() {
    try {
      var salvos = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (Array.isArray(salvos)) return salvos;
    } catch (e) { /* cai no exemplo abaixo */ }
    return EXEMPLO.map(function (e) { return Object.assign({}, e); });
  }

  // Substitui a lista salva pela lista recebida
  function salvar(lista) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
    } catch (e) { /* sem localStorage: a lista só vive nesta aba */ }
  }

  // Endereço principal (o primeiro da lista) ou null se não houver nenhum
  function principal() {
    return carregar()[0] || null;
  }

  window.JacyEnderecos = {
    carregar: carregar,
    salvar: salvar,
    principal: principal
  };
})();
