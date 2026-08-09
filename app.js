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

const OWNED_STORAGE_KEY = "pokemon_tcg_owned_pokemon";
const LEGACY_CARDS_KEY = "pokemon_tcg_owned_cards";

// pokemonId -> true
let ownedPokemon = {};
let filteredPokemon = [];
let currentIndex = 0;
const renderChunkSize = 60;
let activeFilters = {
  search: "",
  gen: "all",
  type: "all",
  status: "all"
};
let currentSort = "id-asc";
let currentModalPokemon = null;

const pokedexGrid = document.getElementById("pokedex-grid");
const searchInput = document.getElementById("search-input");
const statusFilter = document.getElementById("status-filter");
const sortOrder = document.getElementById("sort-order");
const genFilterButtonsContainer = document.getElementById("gen-filter-buttons");
const typeFilterButtonsContainer = document.getElementById("type-filter-buttons");
const scrollToTopBtn = document.getElementById("scroll-to-top");

const pokemonModal = document.getElementById("pokemon-modal");
const modalCloseBtn = document.getElementById("modal-close-btn");
const modalPokemonId = document.getElementById("modal-pokemon-id");
const modalPokemonName = document.getElementById("modal-pokemon-name");
const modalPokemonImg = document.getElementById("modal-pokemon-img");
const modalPokemonTypes = document.getElementById("modal-pokemon-types");
const modalGenVal = document.getElementById("modal-gen-val");
const modalOwnedVal = document.getElementById("modal-owned-val");
const modalToggleOwnedBtn = document.getElementById("modal-toggle-owned-btn");

function loadOwnedPokemon() {
  const saved = localStorage.getItem(OWNED_STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed;
      }
    } catch (e) {
      console.error("Erro ao ler localStorage:", e);
    }
  }

  // Migra coleção antiga (cartas TCG) -> Pokémon marcados
  const legacy = localStorage.getItem(LEGACY_CARDS_KEY);
  if (legacy) {
    try {
      const cards = JSON.parse(legacy);
      const migrated = {};
      Object.values(cards || {}).forEach((card) => {
        if (card && card.pokemonId != null) {
          migrated[String(card.pokemonId)] = true;
        }
      });
      localStorage.setItem(OWNED_STORAGE_KEY, JSON.stringify(migrated));
      return migrated;
    } catch (e) {
      console.error("Erro ao migrar localStorage antigo:", e);
    }
  }

  return {};
}

function persistOwnedPokemon() {
  localStorage.setItem(OWNED_STORAGE_KEY, JSON.stringify(ownedPokemon));
}

function isOwned(pokemonId) {
  return !!ownedPokemon[String(pokemonId)];
}

function setOwned(pokemonId, owned) {
  const key = String(pokemonId);
  if (owned) {
    ownedPokemon[key] = true;
  } else {
    delete ownedPokemon[key];
  }
  persistOwnedPokemon();
}

function toggleOwned(pokemonId) {
  setOwned(pokemonId, !isOwned(pokemonId));
}

function matchesSearch(pokemon, query) {
  if (!query) return true;
  if (String(pokemon.id) === query) return true;
  if (pokemon.name.toLowerCase().includes(query)) return true;
  return (pokemon.aliases || []).some((alias) => alias.toLowerCase().includes(query));
}

document.addEventListener("DOMContentLoaded", () => {
  ownedPokemon = loadOwnedPokemon();
  generateTypeButtons();
  updateDashboard();
  applyFiltersAndSort();
  lucide.createIcons();
  setupEventListeners();
});

function setupEventListeners() {
  searchInput.addEventListener("input", (e) => {
    activeFilters.search = e.target.value.toLowerCase().trim();
    applyFiltersAndSort();
  });

  statusFilter.addEventListener("change", (e) => {
    activeFilters.status = e.target.value;
    applyFiltersAndSort();
  });

  sortOrder.addEventListener("change", (e) => {
    currentSort = e.target.value;
    applyFiltersAndSort();
  });

  genFilterButtonsContainer.addEventListener("click", (e) => {
    const btn = e.target.closest(".gen-btn");
    if (!btn) return;
    document.querySelectorAll(".gen-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    activeFilters.gen = btn.dataset.gen;
    applyFiltersAndSort();
  });

  typeFilterButtonsContainer.addEventListener("click", (e) => {
    const btn = e.target.closest(".type-btn");
    if (!btn) return;
    document.querySelectorAll(".type-btn").forEach((b) => {
      b.classList.remove("active");
      Object.keys(typeTranslations).forEach((typeKey) => b.classList.remove(`type-${typeKey}`));
    });
    btn.classList.add("active");
    if (btn.dataset.type !== "all") {
      btn.classList.add(`type-${btn.dataset.type}`);
    }
    activeFilters.type = btn.dataset.type;
    applyFiltersAndSort();
  });

  modalCloseBtn.addEventListener("click", closeModal);
  pokemonModal.addEventListener("click", (e) => {
    if (e.target === pokemonModal) closeModal();
  });

  modalToggleOwnedBtn.addEventListener("click", () => {
    if (!currentModalPokemon) return;
    toggleOwned(currentModalPokemon.id);
    updateModalOwnedState(currentModalPokemon.id);
    updatePokemonGridCardVisual(currentModalPokemon.id);
    updateDashboard();
  });

  window.addEventListener("scroll", () => {
    if (window.scrollY > 400) {
      scrollToTopBtn.classList.add("visible");
    } else {
      scrollToTopBtn.classList.remove("visible");
    }
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 300) {
      renderMorePokemon();
    }
  });

  scrollToTopBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && pokemonModal.classList.contains("active")) {
      closeModal();
    }
  });
}

function generateTypeButtons() {
  Object.keys(typeTranslations).forEach((typeKey) => {
    const btn = document.createElement("button");
    btn.className = "type-btn";
    btn.dataset.type = typeKey;
    btn.textContent = typeTranslations[typeKey];
    btn.style.setProperty("--btn-color-accent", `var(--type-${typeKey}-color)`);
    typeFilterButtonsContainer.appendChild(btn);
  });
}

function updateDashboard() {
  const totalPokemon = pokemonData.length;
  const ownedCount = Object.keys(ownedPokemon).length;
  const missingCount = totalPokemon - ownedCount;

  document.getElementById("stat-owned-pokemon").textContent = ownedCount;
  document.getElementById("stat-unique-pokemon").textContent = `${ownedCount} / ${totalPokemon}`;
  document.getElementById("stat-missing-pokemon").textContent = missingCount;

  const pokedexProgressPercent = totalPokemon > 0 ? Math.round((ownedCount / totalPokemon) * 100) : 0;
  document.getElementById("pokedex-progress-text").textContent = `${pokedexProgressPercent}%`;
  document.getElementById("pokedex-progress-circle").style.strokeDashoffset =
    251.2 - (251.2 * pokedexProgressPercent) / 100;

  document.getElementById("owned-progress-text").textContent = ownedCount;
  document.getElementById("owned-progress-circle").style.strokeDashoffset =
    251.2 - (251.2 * pokedexProgressPercent) / 100;

  const genStatsList = document.getElementById("generations-stats-list");
  genStatsList.innerHTML = "";

  const genPokemonCounts = {};
  const genOwnedCounts = {};
  for (let i = 1; i <= 9; i++) {
    genPokemonCounts[i] = 0;
    genOwnedCounts[i] = 0;
  }

  pokemonData.forEach((p) => {
    genPokemonCounts[p.generation]++;
    if (isOwned(p.id)) genOwnedCounts[p.generation]++;
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

  const typeStatsList = document.getElementById("types-stats-list");
  typeStatsList.innerHTML = "";

  const typePokemonCounts = {};
  const typeOwnedCounts = {};
  Object.keys(typeTranslations).forEach((t) => {
    typePokemonCounts[t] = 0;
    typeOwnedCounts[t] = 0;
  });

  pokemonData.forEach((p) => {
    p.types.forEach((t) => {
      const typeKey = t.toLowerCase();
      if (typePokemonCounts[typeKey] === undefined) return;
      typePokemonCounts[typeKey]++;
      if (isOwned(p.id)) typeOwnedCounts[typeKey]++;
    });
  });

  Object.keys(typeTranslations).forEach((typeKey) => {
    const total = typePokemonCounts[typeKey];
    const owned = typeOwnedCounts[typeKey];
    const percent = total > 0 ? Math.round((owned / total) * 100) : 0;
    const typeCard = document.createElement("div");
    typeCard.className = "type-stat-card";
    typeCard.innerHTML = `
      <span class="type-stat-badge type-${typeKey}">${typeTranslations[typeKey]}</span>
      <span class="type-stat-progress">${owned}/${total}</span>
      <div class="type-stat-bar-bg">
        <div class="type-stat-bar-fill type-${typeKey}" style="width: ${percent}%; color: var(--type-${typeKey}-color);"></div>
      </div>
    `;
    typeStatsList.appendChild(typeCard);
  });
}

function applyFiltersAndSort() {
  filteredPokemon = pokemonData.filter((p) => {
    const matchesQuery = matchesSearch(p, activeFilters.search);
    const matchesGen = activeFilters.gen === "all" || p.generation.toString() === activeFilters.gen;
    const matchesType =
      activeFilters.type === "all" || p.types.some((t) => t.toLowerCase() === activeFilters.type);

    let matchesStatus = true;
    if (activeFilters.status === "owned") matchesStatus = isOwned(p.id);
    if (activeFilters.status === "missing") matchesStatus = !isOwned(p.id);

    return matchesQuery && matchesGen && matchesType && matchesStatus;
  });

  if (currentSort === "id-asc") filteredPokemon.sort((a, b) => a.id - b.id);
  else if (currentSort === "id-desc") filteredPokemon.sort((a, b) => b.id - a.id);
  else if (currentSort === "name-asc") filteredPokemon.sort((a, b) => a.name.localeCompare(b.name));
  else if (currentSort === "name-desc") filteredPokemon.sort((a, b) => b.name.localeCompare(a.name));

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

function renderMorePokemon() {
  if (currentIndex >= filteredPokemon.length) return;

  const fragment = document.createDocumentFragment();
  const nextSlice = filteredPokemon.slice(currentIndex, currentIndex + renderChunkSize);

  nextSlice.forEach((p) => {
    const owned = isOwned(p.id);
    const card = document.createElement("div");
    card.className = `pokemon-card ${owned ? "owned-some" : ""}`;
    card.dataset.id = p.id;

    const typeBadgesHtml = p.types
      .map((t) => {
        const typeKey = t.toLowerCase();
        return `<span class="type-badge type-${typeKey}">${typeTranslations[typeKey] || t}</span>`;
      })
      .join("");

    const formattedId = String(p.id).padStart(3, "0");
    const imgUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${p.id}.png`;
    const aliasHint = (p.aliases || [])[0];

    card.innerHTML = `
      <span class="card-id">#${formattedId}</span>
      <span class="card-collect-status">${owned ? "Obtido" : "Faltando"}</span>
      <div class="card-img-wrapper">
        <img class="card-img" src="${imgUrl}" alt="${p.name}" loading="lazy">
      </div>
      <h3 class="card-name">${p.name}</h3>
      ${aliasHint ? `<p class="card-alias">${aliasHint}</p>` : ""}
      <div class="card-types">${typeBadgesHtml}</div>
    `;

    card.addEventListener("click", () => openModal(p));
    fragment.appendChild(card);
  });

  pokedexGrid.appendChild(fragment);
  currentIndex += renderChunkSize;
}

function openModal(pokemon) {
  currentModalPokemon = pokemon;
  const formattedId = String(pokemon.id).padStart(3, "0");
  modalPokemonId.textContent = `#${formattedId}`;
  modalPokemonName.textContent = pokemon.name;
  modalPokemonImg.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon.id}.png`;
  modalPokemonImg.alt = pokemon.name;
  modalGenVal.textContent = genNames[pokemon.generation] || `${pokemon.generation}ª Geração`;
  modalPokemonTypes.innerHTML = pokemon.types
    .map((t) => {
      const typeKey = t.toLowerCase();
      return `<span class="type-badge type-${typeKey}">${typeTranslations[typeKey] || t}</span>`;
    })
    .join("");

  updateModalOwnedState(pokemon.id);
  pokemonModal.classList.add("active");
  document.body.style.overflow = "hidden";
}

function updateModalOwnedState(pokemonId) {
  const owned = isOwned(pokemonId);
  modalOwnedVal.textContent = owned ? "Sim" : "Não";
  modalToggleOwnedBtn.textContent = owned ? "Remover da coleção" : "Marcar como obtido";
  modalToggleOwnedBtn.classList.toggle("is-owned", owned);
}

function closeModal() {
  pokemonModal.classList.remove("active");
  document.body.style.overflow = "";
  currentModalPokemon = null;
}

function updatePokemonGridCardVisual(pokemonId) {
  const card = pokedexGrid.querySelector(`.pokemon-card[data-id="${pokemonId}"]`);
  if (!card) return;

  const owned = isOwned(pokemonId);
  card.classList.toggle("owned-some", owned);
  const statusElement = card.querySelector(".card-collect-status");
  if (statusElement) statusElement.textContent = owned ? "Obtido" : "Faltando";
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./sw.js", { updateViaCache: "none" })
      .then((reg) => reg.update())
      .catch((err) => console.warn("Service Worker não registrado:", err));
  });
}
