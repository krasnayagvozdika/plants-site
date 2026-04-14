const URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQC6o3gVUCO9cXGFdj-HHMMlamlSz5P-zjOJpCWv21H1GadmiUM-IFA2JKsBXBYZ4rsnVND9CdijkUP/pub?output=csv";

const catalog = document.getElementById("catalog");
const filters = document.getElementById("filters");
const searchPanel = document.getElementById("catalog-search-panel");
const searchFab = document.getElementById("catalog-search-fab");
const searchInput = document.getElementById("catalog-search");
const searchClearButton = document.getElementById("catalog-search-clear");
const suggestionsList = document.getElementById("plant-suggestions");
const searchBox = searchInput?.closest(".catalog-search-box") || null;
const modal = document.getElementById("modal");
const modalBody = document.getElementById("modal-body");
const modalContent = modal?.querySelector(".modal-content") || null;
const modalCloseButton = modal?.querySelector(".modal-close") || null;

const menuToggle = document.getElementById("menu-toggle");
const mainNav = document.getElementById("main-nav");

const homeImage1 = document.getElementById("home-image-1");
const homeImage2 = document.getElementById("home-image-2");
const homeImage3 = document.getElementById("home-image-3");

let plants = [];
let currentCategory = "Все";
let currentSearch = "";
let lastFocusedElement = null;
let suggestionItems = [];
let activeSuggestionIndex = -1;

/* mobile menu */
if (menuToggle && mainNav) {
  menuToggle.addEventListener("click", () => {
    const isOpen = mainNav.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });

  document.querySelectorAll(".main-nav .nav-link").forEach((link) => {
    link.addEventListener("click", () => {
      mainNav.classList.remove("open");
      menuToggle.setAttribute("aria-expanded", "false");
    });
  });

  document.addEventListener("click", (e) => {
    const clickedInsideNav = mainNav.contains(e.target);
    const clickedToggle = menuToggle.contains(e.target);

    if (!clickedInsideNav && !clickedToggle) {
      mainNav.classList.remove("open");
      menuToggle.setAttribute("aria-expanded", "false");
    }
  });
}

/* load data where needed */
if (catalog && filters) {
  loadData();
} else if (homeImage1 && homeImage2 && homeImage3) {
  loadHomeImages();
}

async function loadData() {
  try {
    const res = await fetch(URL);
    const text = await res.text();
    const rows = parseCsv(text).slice(1);

    plants = rows
      .filter((cols) => cols.length >= 5)
      .map((cols) => ({
        id: cleanValue(cols[0]),
        name: cleanValue(cols[1]),
        price: cleanValue(cols[2]),
        image: cleanValue(cols[3]),
        category: cleanValue(cols[4]),
        type: cleanValue(cols[5]),
        size: cleanValue(cols[6]),
        description: cleanValue(cols[7]),
        available: cleanValue(cols[8]),
      }))
      .filter((p) => p.name && p.image && p.category);

    updateSuggestions();
    renderFilters();
    renderCatalog();
  } catch (error) {
    if (catalog) {
      catalog.innerHTML = `<div class="empty">Не удалось загрузить данные</div>`;
    }
    console.error(error);
  }
}

async function loadHomeImages() {
  try {
    const res = await fetch(URL);
    const text = await res.text();
    const rows = parseCsv(text).slice(1);

    const homePlants = rows
      .filter((cols) => cols.length >= 5)
      .map((cols) => ({
        id: cleanValue(cols[0]),
        name: cleanValue(cols[1]),
        image: cleanValue(cols[3]),
      }))
      .filter((p) => p.name && p.image);

    const uniqueByImage = getUniquePlantsByImage(homePlants);
    const randomPlants = getRandomUniqueItems(uniqueByImage, 3);

    setHomeCard(homeImage1, randomPlants[0]);
    setHomeCard(homeImage2, randomPlants[1]);
    setHomeCard(homeImage3, randomPlants[2]);
  } catch (error) {
    console.error(error);
  }
}

function getUniquePlantsByImage(items) {
  const map = new Map();

  items.forEach((item) => {
    if (!map.has(item.image)) {
      map.set(item.image, item);
    }
  });

  return Array.from(map.values());
}

function getRandomUniqueItems(items, count) {
  const shuffled = [...items];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const randomIndex = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[i]];
  }

  return shuffled.slice(0, count);
}

function setHomeCard(imageElement, plant) {
  if (!imageElement || !plant) return;

  imageElement.src = `images/${plant.image}`;
  imageElement.alt = plant.name;
  imageElement.loading = "eager";

  imageElement.onerror = () => {
    imageElement.src = "images/logo.png";
    imageElement.alt = "Красная гвоздика";
  };
}

function parseCsv(text = "") {
  const rows = [];
  let currentRow = [];
  let currentCell = "";
  let insideQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentCell += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
      continue;
    }

    if (char === "," && !insideQuotes) {
      currentRow.push(currentCell);
      currentCell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !insideQuotes) {
      if (char === "\r" && nextChar === "\n") {
        i++;
      }

      currentRow.push(currentCell);

      if (currentRow.some((value) => value.trim() !== "")) {
        rows.push(currentRow);
      }

      currentRow = [];
      currentCell = "";
      continue;
    }

    currentCell += char;
  }

  if (currentCell || currentRow.length > 0) {
    currentRow.push(currentCell);
    if (currentRow.some((value) => value.trim() !== "")) {
      rows.push(currentRow);
    }
  }

  return rows;
}

function cleanValue(value = "") {
  return value.replace(/\r/g, "").trim();
}

function renderFilters() {
  if (!filters) return;

  const categories = ["Все", ...new Set(plants.map((p) => p.category))];
  filters.innerHTML = "";

  categories.forEach((cat) => {
    const btn = document.createElement("button");
    btn.textContent = cat;

    if (cat === currentCategory) {
      btn.classList.add("active");
    }

    btn.addEventListener("click", () => {
      currentCategory = cat;
      renderFilters();
      renderCatalog();
    });

    filters.appendChild(btn);
  });
}

function setupSearch() {
  if (!searchInput) return;

  updateSuggestions();
  updateSearchClearButton();

  searchInput.addEventListener("input", (event) => {
    applySearchValue(event.target.value);
  });

  searchInput.addEventListener("search", (event) => {
    applySearchValue(event.target.value);
  });

  searchInput.addEventListener("change", (event) => {
    applySearchValue(event.target.value);
  });

  searchInput.addEventListener("focus", () => {
    updateSuggestions();
  });

  searchInput.addEventListener("keydown", (event) => {
    if (!suggestionItems.length) {
      if (event.key === "Escape") hideSuggestions();
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      activeSuggestionIndex = (activeSuggestionIndex + 1) % suggestionItems.length;
      renderSuggestionList(suggestionItems);
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      activeSuggestionIndex =
        activeSuggestionIndex <= 0 ? suggestionItems.length - 1 : activeSuggestionIndex - 1;
      renderSuggestionList(suggestionItems);
    }

    if (event.key === "Enter" && activeSuggestionIndex >= 0) {
      event.preventDefault();
      applySuggestion(suggestionItems[activeSuggestionIndex]);
    }

    if (event.key === "Escape") {
      hideSuggestions();
    }
  });

  searchClearButton?.addEventListener("click", () => {
    searchInput.value = "";
    currentSearch = "";
    hideSuggestions();
    updateSearchClearButton();
    renderCatalog();
    searchInput.focus();
  });

  searchFab?.addEventListener("click", () => {
    if (searchPanel?.classList.contains("open")) {
      closeSearchPanel();
      return;
    }

    openSearchPanel();
  });
}

function applySearchValue(value) {
  currentSearch = value.trim().toLowerCase();

  if (currentSearch) {
    currentCategory = "Все";
    renderFilters();
  }

  updateSuggestions();
  updateSearchClearButton();
  renderCatalog();
}

function updateSuggestions() {
  if (!suggestionsList || !searchInput) return;

  const baseNames = [...new Set(plants.map((plant) => plant.name).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, "ru")
  );

  const rawValue = searchInput.value.trim().toLowerCase();
  const matchedNames = rawValue
    ? baseNames.filter((name) => name.toLowerCase().includes(rawValue))
    : baseNames;

  suggestionItems = matchedNames.slice(0, 8);
  activeSuggestionIndex = suggestionItems.length ? 0 : -1;

  renderSuggestionList(suggestionItems);
}

function renderSuggestionList(items) {
  if (!suggestionsList || !searchInput) return;

  if (items.length === 0 || !searchInput.value.trim()) {
    hideSuggestions();
    return;
  }

  suggestionsList.innerHTML = items
    .map((name, index) => {
      const isActive = index === activeSuggestionIndex;

      return `
        <button
          class="search-suggestion${isActive ? " active" : ""}"
          type="button"
          role="option"
          aria-selected="${isActive ? "true" : "false"}"
          data-value="${escapeHtml(name)}"
        >
          ${escapeHtml(name)}
        </button>
      `;
    })
    .join("");

  suggestionsList.classList.add("open");
  searchInput.setAttribute("aria-expanded", "true");

  suggestionsList.querySelectorAll(".search-suggestion").forEach((button) => {
    button.addEventListener("mousedown", (event) => {
      event.preventDefault();
      applySuggestion(button.dataset.value || "");
    });
  });
}

function applySuggestion(value) {
  if (!searchInput) return;

  searchInput.value = value;
  currentSearch = value.trim().toLowerCase();
  currentCategory = "Все";
  renderFilters();
  updateSuggestions();
  renderCatalog();
  closeSearchPanel();
  searchInput.blur();
}

function hideSuggestions() {
  if (!suggestionsList || !searchInput) return;

  suggestionsList.classList.remove("open");
  suggestionsList.innerHTML = "";
  searchInput.setAttribute("aria-expanded", "false");
  activeSuggestionIndex = -1;
}

function updateSearchClearButton() {
  if (!searchClearButton || !searchInput) return;

  const hasValue = searchInput.value.trim().length > 0;
  searchClearButton.classList.toggle("visible", hasValue);
  searchClearButton.disabled = !hasValue;
}

function openSearchPanel() {
  if (!searchPanel || !searchFab) return;

  searchPanel.classList.add("open");
  searchPanel.setAttribute("aria-hidden", "false");
  searchFab.classList.add("active");
  searchFab.setAttribute("aria-expanded", "true");
  searchFab.setAttribute("aria-label", "Закрыть поиск по каталогу");

  requestAnimationFrame(() => {
    searchInput?.focus();
  });
}

function closeSearchPanel() {
  if (!searchPanel || !searchFab) return;

  searchPanel.classList.remove("open");
  searchPanel.setAttribute("aria-hidden", "true");
  searchFab.classList.remove("active");
  searchFab.setAttribute("aria-expanded", "false");
  searchFab.setAttribute("aria-label", "Открыть поиск по каталогу");
  hideSuggestions();
}

function renderCatalog() {
  if (!catalog) return;

  let filtered = plants;

  if (!currentSearch && currentCategory !== "Все") {
    filtered = plants.filter((p) => p.category === currentCategory);
  }

  if (currentSearch) {
    filtered = filtered.filter((p) => p.name.toLowerCase().includes(currentSearch));
  }

  if (filtered.length === 0) {
    const queryText = searchInput?.value.trim();

    catalog.innerHTML = `
      <div class="empty empty-search">
        <h3>Ничего не найдено</h3>
        <p>
          ${
            queryText
              ? `По запросу «${escapeHtml(queryText)}» в каталоге сейчас нет совпадений.`
              : "По выбранным параметрам в каталоге сейчас нет совпадений."
          }
        </p>
        <p>
          Можно уточнить наличие и ассортимент в магазине по телефону
          <a href="tel:+375232561934">8 (0232) 56-19-34</a>.
        </p>
      </div>
    `;
    return;
  }

  catalog.innerHTML = filtered
    .map((p) => {
      const typeLabel = getTypeLabel(p.type);

      return `
        <article
          class="card"
          data-id="${escapeHtml(p.id)}"
          role="button"
          tabindex="0"
          aria-label="Открыть карточку растения ${escapeHtml(p.name)}"
        >
          <img src="images/${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}" loading="lazy">
          <div class="card-content">
            <h3>${escapeHtml(p.name)}</h3>
            <div class="meta">${escapeHtml(p.category)} · ${escapeHtml(typeLabel)}</div>
            ${p.price ? `<div class="price">${escapeHtml(p.price)} Br</div>` : ""}
          </div>
        </article>
      `;
    })
    .join("");

  document.querySelectorAll(".card").forEach((card) => {
    card.addEventListener("click", () => {
      const plant = plants.find((p) => p.id === card.dataset.id);
      if (plant) openCard(plant);
    });

    card.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;

      event.preventDefault();
      const plant = plants.find((p) => p.id === card.dataset.id);
      if (plant) openCard(plant);
    });
  });
}

function getTypeLabel(type) {
  if (type === "pot") return "в горшке";
  if (type === "ground") return "в грунте";
  if (type === "cut") return "под срезку";
  if (!type) return "тип не указан";
  return type;
}

function openCard(p) {
  if (!modal || !modalBody) return;

  const typeLabel = getTypeLabel(p.type);
  lastFocusedElement = document.activeElement;
  closeSearchPanel();
  searchInput?.blur();

  modalBody.innerHTML = `
    <article class="plant-modal-card">
      <div class="modal-image-shell">
        <img class="modal-image" src="images/${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}">
      </div>

      <div class="modal-details">
        <div class="modal-tags">
          <span class="modal-tag">${escapeHtml(p.category)}</span>
          <span class="modal-tag modal-tag-soft">${escapeHtml(typeLabel)}</span>
        </div>

        <h2 class="modal-title" id="modal-title">${escapeHtml(p.name)}</h2>
        <div class="modal-price">${p.price ? `${escapeHtml(p.price)} Br` : "Цена по запросу"}</div>

        <div class="modal-info-grid">
          <div class="modal-info-item">
            <span class="modal-info-label">Категория</span>
            <span class="modal-info-value">${escapeHtml(p.category)}</span>
          </div>
          <div class="modal-info-item">
            <span class="modal-info-label">Формат</span>
            <span class="modal-info-value">${escapeHtml(typeLabel)}</span>
          </div>
          ${
            p.size
              ? `<div class="modal-info-item">
                  <span class="modal-info-label">Размер</span>
                  <span class="modal-info-value">${escapeHtml(p.size)}</span>
                </div>`
              : ""
          }
        </div>

        <div class="modal-description-block">
          <h3>Описание</h3>
          <div class="modal-description">
            ${
              p.description
                ? escapeHtml(p.description)
                : "Описание скоро появится. Пока можно ориентироваться по фотографии и уточнять наличие и детали по телефону."
            }
          </div>
        </div>
      </div>
    </article>
  `;

  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  modalCloseButton?.focus();
}

function closeModal() {
  if (!modal) return;
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";

  if (lastFocusedElement instanceof HTMLElement) {
    lastFocusedElement.focus();
  }
}

function escapeHtml(str = "") {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

if (modal) {
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });
}

setupSearch();

if (document && searchBox) {
  document.addEventListener("click", (event) => {
    if (!searchBox.contains(event.target)) {
      hideSuggestions();
    }
  });
}

if (document && searchPanel && searchFab) {
  document.addEventListener("click", (event) => {
    const clickedInsidePanel = searchPanel.contains(event.target);
    const clickedFab = searchFab.contains(event.target);

    if (!clickedInsidePanel && !clickedFab) {
      closeSearchPanel();
    }
  });
}

if (modalCloseButton) {
  modalCloseButton.addEventListener("click", closeModal);
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeSearchPanel();
    closeModal();
  }

  if (e.key === "Tab" && modal?.classList.contains("open")) {
    trapFocus(e);
  }
});

function trapFocus(event) {
  if (!modal) return;

  const focusableElements = modal.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );

  if (focusableElements.length === 0) {
    modalContent?.focus();
    event.preventDefault();
    return;
  }

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  if (event.shiftKey && document.activeElement === firstElement) {
    lastElement.focus();
    event.preventDefault();
  } else if (!event.shiftKey && document.activeElement === lastElement) {
    firstElement.focus();
    event.preventDefault();
  }
}
