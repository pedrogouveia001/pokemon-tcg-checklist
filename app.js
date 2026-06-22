// Dicionário de tradução de tipos
const typeTranslations = {
  normal: "Normal",
  fire: "Fogo",
  water: "Água",
  grass: "Planta",
  electric: "Elétrico",
  ice: "Gelo",
  fighting: "Lutador",
  poison: "Venenoso",
  ground: "Terra",
  flying: "Voador",
  psychic: "Psíquico",
  bug: "Inseto",
  rock: "Pedra",
  ghost: "Fantasma",
  dragon: "Dragão",
  dark: "Sombrio",
  steel: "Aço",
  fairy: "Fada"
};

// Configuração de Gerações (nomes em PT-BR e quantidade de pokemon)
const genNames = {
  1: "1ª Geração (Kanto)",
  2: "2ª Geração (Johto)",
  3: "3ª Geração (Hoenn)",
  4: "4ª Geração (Sinnoh)",
  5: "5ª Geração (Unova)",
  6: "6ª Geração (Kalos)",
  7: "7ª Geração (Alola)",
  8: "8ª Geração (Galar)",
  9: "9ª Geração (Paldea)"
};

// Estado da Aplicação
let ownedCards = {}; // id_carta_tcg -> { id, pokemonId, image }
let filteredPokemon = [];
let currentIndex = 0;
const renderChunkSize = 60;
let activeFilters = {
  search: "",
  gen: "all",
  type: "all",
  status: "all" // all, owned, missing
};
let currentSort = "id-asc";

// Seletores DOM
const pokedexGrid = document.getElementById("pokedex-grid");
const searchInput = document.getElementById("search-input");
const statusFilter = document.getElementById("status-filter");
const sortOrder = document.getElementById("sort-order");
const genFilterButtonsContainer = document.getElementById("gen-filter-buttons");
const typeFilterButtonsContainer = document.getElementById("type-filter-buttons");
const scrollToTopBtn = document.getElementById("scroll-to-top");

// Seletores do Modal
const pokemonModal = document.getElementById("pokemon-modal");
const modalCloseBtn = document.getElementById("modal-close-btn");
const modalPokemonId = document.getElementById("modal-pokemon-id");
const modalPokemonName = document.getElementById("modal-pokemon-name");
const modalPokemonImg = document.getElementById("modal-pokemon-img");
const modalPokemonTypes = document.getElementById("modal-pokemon-types");
const modalGenVal = document.getElementById("modal-gen-val");
const modalCardsOwnedVal = document.getElementById("modal-cards-owned-val");
const modalTcgCounter = document.getElementById("modal-tcg-counter");
const tcgCardsGrid = document.getElementById("tcg-cards-grid");

// Inicialização
document.addEventListener("DOMContentLoaded", () => {
  // Carregar dados salvos do localStorage
  const saved = localStorage.getItem("pokemon_tcg_owned_cards");
  if (saved) {
    try {
      ownedCards = JSON.parse(saved);
    } catch (e) {
      console.error("Erro ao ler localStorage:", e);
      ownedCards = {};
    }
  }

  // Gerar botões de tipos
  generateTypeButtons();
  
  // Renderizar filtros e estatísticas iniciais
  updateDashboard();
  applyFiltersAndSort();
  
  // Inicializar ícones Lucide
  lucide.createIcons();

  // Configurar Event Listeners
  setupEventListeners();
});

// Configurar todos os Event Listeners da página
function setupEventListeners() {
  // Busca por texto
  searchInput.addEventListener("input", (e) => {
    activeFilters.search = e.target.value.toLowerCase().trim();
    applyFiltersAndSort();
  });

  // Filtro de Status
  statusFilter.addEventListener("change", (e) => {
    activeFilters.status = e.target.value;
    applyFiltersAndSort();
  });

  // Ordenação
  sortOrder.addEventListener("change", (e) => {
    currentSort = e.target.value;
    applyFiltersAndSort();
  });

  // Filtro de Geração
  genFilterButtonsContainer.addEventListener("click", (e) => {
    const btn = e.target.closest(".gen-btn");
    if (!btn) return;
    
    document.querySelectorAll(".gen-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    
    activeFilters.gen = btn.dataset.gen;
    applyFiltersAndSort();
  });

  // Filtro de Tipo
  typeFilterButtonsContainer.addEventListener("click", (e) => {
    const btn = e.target.closest(".type-btn");
    if (!btn) return;
    
    document.querySelectorAll(".type-btn").forEach(b => {
      b.classList.remove("active");
      // Remover classes de cores antigas
      Object.keys(typeTranslations).forEach(typeKey => {
        b.classList.remove(`type-${typeKey}`);
      });
    });
    
    btn.classList.add("active");
    if (btn.dataset.type !== "all") {
      btn.classList.add(`type-${btn.dataset.type}`);
    }
    
    activeFilters.type = btn.dataset.type;
    applyFiltersAndSort();
  });

  // Fechar Modal
  modalCloseBtn.addEventListener("click", closeModal);
  pokemonModal.addEventListener("click", (e) => {
    if (e.target === pokemonModal) closeModal();
  });

  // Scroll Infinito
  window.addEventListener("scroll", () => {
    // Botão Voltar ao Topo
    if (window.scrollY > 400) {
      scrollToTopBtn.classList.add("visible");
    } else {
      scrollToTopBtn.classList.remove("visible");
    }

    // Carregar mais Pokémon quando rolar perto do fim da página
    if ((window.innerHeight + window.scrollY) >= document.documentElement.scrollHeight - 300) {
      renderMorePokemon();
    }
  });

  // Ação de Voltar ao Topo
  scrollToTopBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  // Fechar modal com a tecla ESC
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && pokemonModal.classList.contains("active")) {
      closeModal();
    }
  });
}

// Gerar dinamicamente os botões de tipo com suas respectivas cores
function generateTypeButtons() {
  Object.keys(typeTranslations).forEach(typeKey => {
    const typeLabel = typeTranslations[typeKey];
    const btn = document.createElement("button");
    btn.className = "type-btn";
    btn.dataset.type = typeKey;
    btn.textContent = typeLabel;
    
    // Pegar variável de cor do CSS para estilizar no hover/ativo
    const colorVar = `var(--type-${typeKey}-color)`;
    btn.style.setProperty("--btn-color-accent", colorVar);
    
    typeFilterButtonsContainer.appendChild(btn);
  });
}

// Retornar um mapeamento de pokemonId -> array de IDs de cartas que o usuário tem
function getOwnedCardsByPokemonMap() {
  const map = {};
  Object.values(ownedCards).forEach(card => {
    const pId = card.pokemonId;
    if (!map[pId]) {
      map[pId] = [];
    }
    map[pId].push(card.id);
  });
  return map;
}

// Atualizar estatísticas e elementos visuais do Dashboard
function updateDashboard() {
  const ownedMap = getOwnedCardsByPokemonMap();
  const totalPokemon = pokemonData.length; // 1025
  const uniquePokemonCount = Object.keys(ownedMap).length;
  const totalCardsCount = Object.keys(ownedCards).length;

  // 1. Estatísticas Rápidas
  document.getElementById("stat-total-cards").textContent = totalCardsCount;
  document.getElementById("stat-unique-pokemon").textContent = `${uniquePokemonCount} / ${totalPokemon}`;
  
  // 2. Círculos de Progresso
  const pokedexProgressPercent = totalPokemon > 0 ? Math.round((uniquePokemonCount / totalPokemon) * 100) : 0;
  
  // Atualizar Círculo da Pokedex
  document.getElementById("pokedex-progress-text").textContent = `${pokedexProgressPercent}%`;
  const pokedexCircle = document.getElementById("pokedex-progress-circle");
  const pokedexOffset = 251.2 - (251.2 * pokedexProgressPercent) / 100;
  pokedexCircle.style.strokeDashoffset = pokedexOffset;

  // Atualizar Círculo de Cartas
  document.getElementById("cards-progress-text").textContent = totalCardsCount;
  const cardsCircle = document.getElementById("cards-progress-circle");
  // O circulo de cartas pode animar de acordo com algum patamar (ex: 1000 cartas)
  const cardsProgressPercent = Math.min(100, Math.round((totalCardsCount / 500) * 100)); // limite estético de 500 cartas para 100% no círculo
  const cardsOffset = 251.2 - (251.2 * cardsProgressPercent) / 100;
  cardsCircle.style.strokeDashoffset = cardsOffset;

  // 3. Progresso por Geração
  const genStatsList = document.getElementById("generations-stats-list");
  genStatsList.innerHTML = "";

  // Agrupar Pokémon por Geração
  const genPokemonCounts = {};
  const genOwnedCounts = {};
  
  for (let i = 1; i <= 9; i++) {
    genPokemonCounts[i] = 0;
    genOwnedCounts[i] = 0;
  }

  pokemonData.forEach(p => {
    genPokemonCounts[p.generation]++;
    if (ownedMap[p.id]) {
      genOwnedCounts[p.generation]++;
    }
  });

  for (let gen = 1; gen <= 9; gen++) {
    const total = genPokemonCounts[gen];
    const owned = genOwnedCounts[gen];
    const percent = total > 0 ? Math.round((owned / total) * 100) : 0;

    const row = document.createElement("div");
    row.className = "gen-stat-row";
    row.innerHTML = `
      <div class="gen-label-wrapper">
        <span class="gen-label">Geração ${gen}</span>
        <span class="gen-percent">${owned}/${total} (${percent}%)</span>
      </div>
      <div class="gen-bar-bg">
        <div class="gen-bar-fill" style="width: ${percent}%"></div>
      </div>
    `;
    genStatsList.appendChild(row);
  }

  // 4. Progresso por Tipo
  const typeStatsList = document.getElementById("types-stats-list");
  typeStatsList.innerHTML = "";

  const typePokemonCounts = {};
  const typeOwnedCounts = {};

  Object.keys(typeTranslations).forEach(t => {
    typePokemonCounts[t] = 0;
    typeOwnedCounts[t] = 0;
  });

  pokemonData.forEach(p => {
    p.types.forEach(t => {
      const typeKey = t.toLowerCase();
      if (typePokemonCounts[typeKey] !== undefined) {
        typePokemonCounts[typeKey]++;
        if (ownedMap[p.id]) {
          typeOwnedCounts[typeKey]++;
        }
      }
    });
  });

  Object.keys(typeTranslations).forEach(typeKey => {
    const total = typePokemonCounts[typeKey];
    const owned = typeOwnedCounts[typeKey];
    const percent = total > 0 ? Math.round((owned / total) * 100) : 0;
    const typeLabel = typeTranslations[typeKey];

    const typeCard = document.createElement("div");
    typeCard.className = "type-stat-card";
    typeCard.innerHTML = `
      <span class="type-stat-badge type-${typeKey}">${typeLabel}</span>
      <span class="type-stat-progress">${owned}/${total}</span>
      <div class="type-stat-bar-bg">
        <div class="type-stat-bar-fill type-${typeKey}" style="width: ${percent}%; color: var(--type-${typeKey}-color);"></div>
      </div>
    `;
    typeStatsList.appendChild(typeCard);
  });
}

// Aplicar filtros de pesquisa, geração, tipo e status, além de ordenar e renderizar
function applyFiltersAndSort() {
  const ownedMap = getOwnedCardsByPokemonMap();

  // Filtrar
  filteredPokemon = pokemonData.filter(p => {
    // 1. Filtro de Busca (Nome ou ID)
    const matchesSearch = p.name.toLowerCase().includes(activeFilters.search) || 
                          p.id.toString() === activeFilters.search;
    
    // 2. Filtro de Geração
    const matchesGen = activeFilters.gen === "all" || p.generation.toString() === activeFilters.gen;
    
    // 3. Filtro de Tipo
    const matchesType = activeFilters.type === "all" || p.types.some(t => t.toLowerCase() === activeFilters.type);
    
    // 4. Filtro de Status
    let matchesStatus = true;
    if (activeFilters.status === "owned") {
      matchesStatus = !!ownedMap[p.id];
    } else if (activeFilters.status === "missing") {
      matchesStatus = !ownedMap[p.id];
    }

    return matchesSearch && matchesGen && matchesType && matchesStatus;
  });

  // Ordenar
  if (currentSort === "id-asc") {
    filteredPokemon.sort((a, b) => a.id - b.id);
  } else if (currentSort === "id-desc") {
    filteredPokemon.sort((a, b) => b.id - a.id);
  } else if (currentSort === "name-asc") {
    filteredPokemon.sort((a, b) => a.name.localeCompare(b.name));
  } else if (currentSort === "name-desc") {
    filteredPokemon.sort((a, b) => b.name.localeCompare(a.name));
  }

  // Resetar visualização e paginação
  pokedexGrid.innerHTML = "";
  currentIndex = 0;
  
  if (filteredPokemon.length === 0) {
    pokedexGrid.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🔍</div>
        <h3>Nenhum Pokémon encontrado</h3>
        <p>Tente ajustar os termos de busca ou os filtros de tipo e geração.</p>
      </div>
    `;
  } else {
    renderMorePokemon();
  }
}

// Renderizar a próxima fatia (chunk) de Pokémon na tela (Scroll Infinito / Lazy rendering)
function renderMorePokemon() {
  if (currentIndex >= filteredPokemon.length) return;

  const fragment = document.createDocumentFragment();
  const nextSlice = filteredPokemon.slice(currentIndex, currentIndex + renderChunkSize);
  const ownedMap = getOwnedCardsByPokemonMap();

  nextSlice.forEach(p => {
    const card = document.createElement("div");
    
    // Determinar classes CSS baseadas no status de coleção
    const pCardsOwned = ownedMap[p.id] ? ownedMap[p.id].length : 0;
    let collectionClass = "";
    let statusText = "0 cartas";
    
    if (pCardsOwned > 0) {
      collectionClass = "owned-some";
      statusText = `${pCardsOwned} ${pCardsOwned === 1 ? 'carta' : 'cartas'}`;
    }

    card.className = `pokemon-card ${collectionClass}`;
    card.dataset.id = p.id;

    // Badges de tipos em português
    const typeBadgesHtml = p.types.map(t => {
      const typeKey = t.toLowerCase();
      const label = typeTranslations[typeKey] || t;
      return `<span class="type-badge type-${typeKey}">${label}</span>`;
    }).join("");

    // Formatar ID (ex: 1 -> #001)
    const formattedId = String(p.id).padStart(3, '0');

    // Imagem oficial de alta qualidade
    const imgUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${p.id}.png`;

    card.innerHTML = `
      <span class="card-id">#${formattedId}</span>
      <span class="card-collect-status">${statusText}</span>
      <div class="card-img-wrapper">
        <img class="card-img" src="${imgUrl}" alt="${p.name}" loading="lazy">
      </div>
      <h3 class="card-name">${p.name}</h3>
      <div class="card-types">
        ${typeBadgesHtml}
      </div>
    `;

    // Click handler para abrir o modal de detalhes do Pokémon
    card.addEventListener("click", () => openModal(p));

    fragment.appendChild(card);
  });

  pokedexGrid.appendChild(fragment);
  currentIndex += renderChunkSize;
}

// Abrir Modal de Detalhes
function openModal(pokemon) {
  const formattedId = String(pokemon.id).padStart(3, '0');
  modalPokemonId.textContent = `#${formattedId}`;
  modalPokemonName.textContent = pokemon.name;
  
  const imgUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon.id}.png`;
  modalPokemonImg.src = imgUrl;
  modalPokemonImg.alt = pokemon.name;
  
  modalGenVal.textContent = genNames[pokemon.generation] || `${pokemon.generation}ª Geração`;
  
  // Tipos
  modalPokemonTypes.innerHTML = pokemon.types.map(t => {
    const typeKey = t.toLowerCase();
    const label = typeTranslations[typeKey] || t;
    return `<span class="type-badge type-${typeKey}">${label}</span>`;
  }).join("");

  // Atualizar contagem no modal
  updateModalCardsOwnedCount(pokemon.id);

  // Abrir Modal visualmente
  pokemonModal.classList.add("active");
  document.body.style.overflow = "hidden"; // Desativar scroll da página de trás

  // Buscar cartas de TCG via API
  fetchTcgCards(pokemon.id);
}

// Fechar Modal
function closeModal() {
  pokemonModal.classList.remove("active");
  document.body.style.overflow = ""; // Reativar scroll
  tcgCardsGrid.innerHTML = ""; // Limpar grid de cartas para evitar leaks
}

// Atualizar o contador de cartas possuídas do Pokémon exibido no Modal
function updateModalCardsOwnedCount(pokemonId) {
  const ownedMap = getOwnedCardsByPokemonMap();
  const ownedCount = ownedMap[pokemonId] ? ownedMap[pokemonId].length : 0;
  modalCardsOwnedVal.textContent = ownedCount;
}

// Buscar ilustrações de todas as cartas de TCG para o Pokémon
async function fetchTcgCards(pokemonId) {
  tcgCardsGrid.innerHTML = `
    <div class="tcg-loading">
      <div class="loader"></div>
      <p>Buscando cartas do Pokémon TCG...</p>
    </div>
  `;
  modalTcgCounter.textContent = "Carregando...";

  try {
    // Fazer requisição à API oficial do Pokémon TCG
    const response = await fetch(`https://api.pokemontcg.io/v2/cards?q=nationalPokedexNumbers:${pokemonId}`);
    if (!response.ok) {
      throw new Error(`Erro na API: ${response.status}`);
    }
    const data = await response.json();
    const cards = data.data || [];

    // Ordenar cartas (pelo ano/coleção se possível, ou simplesmente por ID do set)
    cards.sort((a, b) => {
      const setA = a.set?.releaseDate || "";
      const setB = b.set?.releaseDate || "";
      return setA.localeCompare(setB);
    });

    renderTcgCards(cards, pokemonId);
  } catch (error) {
    console.error("Erro ao buscar cartas do Pokémon TCG:", error);
    tcgCardsGrid.innerHTML = `
      <div class="tcg-empty">
        <span style="font-size: 2.5rem;">⚠️</span>
        <h4 style="margin-top: 10px; color: var(--text-primary);">Não foi possível carregar as cartas</h4>
        <p style="font-size: 0.85rem; margin-top: 5px;">Houve um erro na comunicação com a API do Pokémon TCG. Verifique sua conexão.</p>
      </div>
    `;
    modalTcgCounter.textContent = "Erro ao carregar";
  }
}

// Renderizar as cartas do TCG no grid do modal
function renderTcgCards(cards, pokemonId) {
  tcgCardsGrid.innerHTML = "";

  if (cards.length === 0) {
    tcgCardsGrid.innerHTML = `
      <div class="tcg-empty">
        <span style="font-size: 2.5rem;">🃏</span>
        <h4 style="margin-top: 10px; color: var(--text-primary);">Nenhuma carta oficial encontrada</h4>
        <p style="font-size: 0.85rem; margin-top: 5px;">Não encontramos registros de cartas TCG para este Pokémon.</p>
      </div>
    `;
    modalTcgCounter.textContent = "0 de 0 cartas";
    return;
  }

  let ownedCount = 0;

  cards.forEach(card => {
    const isOwned = !!ownedCards[card.id];
    if (isOwned) ownedCount++;

    const cardItem = document.createElement("div");
    cardItem.className = `tcg-card-item ${isOwned ? 'owned' : ''}`;
    cardItem.dataset.cardId = card.id;

    // Detalhes da carta no tooltip/title
    const cardTitle = `${card.name} (${card.set?.name || 'Coleção'} - #${card.number})`;
    cardItem.title = cardTitle;

    cardItem.innerHTML = `
      <img class="tcg-card-img" src="${card.images.small}" alt="${cardTitle}" loading="lazy">
    `;

    // Clique na carta para marcar/desmarcar
    cardItem.addEventListener("click", () => {
      toggleCardOwned(card, pokemonId, cardItem);
    });

    tcgCardsGrid.appendChild(cardItem);
  });

  updateTcgCounterLabel(ownedCount, cards.length);
}

// Atualizar o contador textual no modal (ex: "3 de 15 cartas")
function updateTcgCounterLabel(owned, total) {
  modalTcgCounter.textContent = `${owned} de ${total} ${total === 1 ? 'carta' : 'cartas'}`;
}

// Alterar o estado de posse de uma carta (salvar no localStorage)
function toggleCardOwned(card, pokemonId, cardElement) {
  const cardId = card.id;
  const isCurrentlyOwned = cardElement.classList.contains("owned");

  if (isCurrentlyOwned) {
    // Remover
    delete ownedCards[cardId];
    cardElement.classList.remove("owned");
  } else {
    // Adicionar
    ownedCards[cardId] = {
      id: cardId,
      pokemonId: pokemonId,
      image: card.images.small,
      name: card.name
    };
    cardElement.classList.add("owned");
  }

  // Persistir no localStorage
  localStorage.setItem("pokemon_tcg_owned_cards", JSON.stringify(ownedCards));

  // Recalcular contador local do modal
  const activeTcgCards = tcgCardsGrid.querySelectorAll(".tcg-card-item");
  let ownedCount = 0;
  activeTcgCards.forEach(item => {
    if (item.classList.contains("owned")) ownedCount++;
  });
  updateTcgCounterLabel(ownedCount, activeTcgCards.length);
  updateModalCardsOwnedCount(pokemonId);

  // Atualizar visual do card de Pokémon na tela principal sem recarregar a grade inteira
  updatePokemonGridCardVisual(pokemonId);

  // Atualizar painel de estatísticas no topo da página
  updateDashboard();
}

// Atualizar apenas o card do Pokémon específico na tela principal para otimização visual
function updatePokemonGridCardVisual(pokemonId) {
  const card = pokedexGrid.querySelector(`.pokemon-card[data-id="${pokemonId}"]`);
  if (!card) return;

  const ownedMap = getOwnedCardsByPokemonMap();
  const pCardsOwned = ownedMap[pokemonId] ? ownedMap[pokemonId].length : 0;
  
  const statusElement = card.querySelector(".card-collect-status");
  
  // Resetar classes do card
  card.classList.remove("owned-some", "owned-all");
  
  if (pCardsOwned > 0) {
    card.classList.add("owned-some");
    statusElement.textContent = `${pCardsOwned} ${pCardsOwned === 1 ? 'carta' : 'cartas'}`;
    statusElement.style.display = "";
  } else {
    statusElement.textContent = "0 cartas";
  }
}
