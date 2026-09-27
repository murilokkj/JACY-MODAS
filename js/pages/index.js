// ============================================================================
// index.js
//
// Comportamento da tela inicial (index.html). Quase tudo da home é HTML
// estático; aqui fica só o carrossel de "Avaliações", com as setas
// "anterior" e "próxima" passando uma avaliação por vez.
// Figma: "Tela Inicial" (celular: 196:583).
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
  const lista = document.getElementById('avaliacoes-lista');
  const prevBtn = document.getElementById('avaliacao-prev');
  const nextBtn = document.getElementById('avaliacao-next');

  // Sem o carrossel na página, não há nada a fazer
  if (!lista || !prevBtn || !nextBtn) return;

  // Índice da avaliação "atual" (a primeira visível na lista). O carrossel
  // avança/recua uma avaliação por clique e dá a volta nas pontas: da
  // última avaliação, "próxima" leva de volta à primeira, e da primeira,
  // "anterior" leva à última.
  let indiceAtual = 0;

  const irPara = (indice) => {
    const itens = Array.from(lista.querySelectorAll('.avaliacao'));
    if (itens.length === 0) return;

    if (indice >= itens.length) indice = 0; // passou do fim -> volta ao início
    if (indice < 0) indice = itens.length - 1; // passou do início -> vai ao fim

    indiceAtual = indice;
    itens[indiceAtual].scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
  };

  prevBtn.addEventListener('click', () => irPara(indiceAtual - 1));
  nextBtn.addEventListener('click', () => irPara(indiceAtual + 1));
});
