import { loadCatalogPlants } from "./catalog-data.js";
import { escapeHtml, resolveImagePath } from "./utils.js";

export async function initCatalogPage() {
  const catalog = document.getElementById("catalog");
  const filters = document.getElementById("filters");
  const searchPanel = document.getElementById("catalog-search-panel");
  const searchFab = document.getElementById("catalog-search-fab");
  const searchInput = document.getElementById("catalog-search");
  const searchClearButton = document.getElementById("catalog-search-clear");
  const suggestionsList = document.getElementById("plant-suggestions");
  const searchBox = searchInput ? searchInput.closest(".catalog-search-box") : null;
  const modal = document.getElementById("modal");
  const modalBody = document.getElementById("modal-body");
  const modalContent = modal ? modal.querySelector(".modal-content") : null;
  const modalCloseButton = modal ? modal.querySelector(".modal-close") : null;

  if (!catalog || !filters) return;

  let plants = [];
  let currentCategory = "Все";
  let currentSearch = "";
  let lastFocusedElement = null;
  let suggestionItems = [];
  let activeSuggestionIndex = -1;

  function getTypeLabel(type) {
    if (type === "pot") return "в горшке";
    if (type === "ground") return "в грунте";
    if (type === "cut") return "под срезку";
    if (!type) return "тип не указан";
    return type;
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

  function closeSearchPanel() {
    if (!searchPanel || !searchFab) return;

    searchPanel.classList.remove("open");
    searchPanel.setAttribute("aria-hidden", "true");
    searchFab.classList.remove("active");
    searchFab.setAttribute("aria-expanded", "false");
    searchFab.setAttribute("aria-label", "Открыть поиск по каталогу");
    hideSuggestions();
  }

  function openSearchPanel() {
    if (!searchPanel || !searchFab) return;

    searchPanel.classList.add("open");
    searchPanel.setAttribute("aria-hidden", "false");
    searchFab.classList.add("active");
    searchFab.setAttribute("aria-expanded", "true");
    searchFab.setAttribute("aria-label", "Закрыть поиск по каталогу");

    requestAnimationFrame(() => {
      if (searchInput) {
        searchInput.focus();
      }
    });
  }

  function resetSearch() {
    currentSearch = "";

    if (searchInput) {
      searchInput.value = "";
    }

    hideSuggestions();
    updateSearchClearButton();
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

  function trapFocus(event) {
    if (!modal) return;

    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length === 0) {
      if (modalContent) {
        modalContent.focus();
      }
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

  function openCard(plant) {
    if (!modal || !modalBody) return;

    const typeLabel = getTypeLabel(plant.type);
    lastFocusedElement = document.activeElement;
    closeSearchPanel();

    if (searchInput) {
      searchInput.blur();
    }

    modalBody.innerHTML = `
      <article class="plant-modal-card">
        <div class="modal-image-shell">
          <img class="modal-image" src="${escapeHtml(resolveImagePath(plant.image))}" alt="${escapeHtml(plant.name)}">
        </div>

        <div class="modal-details">
          <div class="modal-tags">
            <span class="modal-tag">${escapeHtml(plant.category)}</span>
            <span class="modal-tag modal-tag-soft">${escapeHtml(typeLabel)}</span>
            <span class="modal-tag ${plant.available === false ? "modal-tag-muted" : "modal-tag-stock"}">
              ${plant.available === false ? "Нет в наличии" : "В наличии"}
            </span>
          </div>

          <h2 class="modal-title" id="modal-title">${escapeHtml(plant.name)}</h2>
          <div class="modal-price">${plant.price ? `Цена от ${escapeHtml(plant.price)} Br` : "Цена по запросу"}</div>

          <div class="modal-info-grid">
            <div class="modal-info-item">
              <span class="modal-info-label">Категория</span>
              <span class="modal-info-value">${escapeHtml(plant.category)}</span>
            </div>
            <div class="modal-info-item">
              <span class="modal-info-label">Формат</span>
              <span class="modal-info-value">${escapeHtml(typeLabel)}</span>
            </div>
            ${
              plant.size
                ? `<div class="modal-info-item">
                    <span class="modal-info-label">Размер</span>
                    <span class="modal-info-value">${escapeHtml(plant.size)}</span>
                  </div>`
                : ""
            }
          </div>

          ${
            plant.description
              ? `<div class="modal-description-block">
                  <h3>Описание</h3>
                  <div class="modal-description">${escapeHtml(plant.description)}</div>
                </div>`
              : ""
          }
        </div>
      </article>
    `;

    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";

    if (modalCloseButton) {
      modalCloseButton.focus();
    }
  }

  function renderCatalog() {
    let filtered = plants;

    if (!currentSearch && currentCategory !== "Все") {
      filtered = plants.filter((plant) => plant.category === currentCategory);
    }

    if (currentSearch) {
      filtered = filtered.filter((plant) => plant.name.toLowerCase().includes(currentSearch));
    }

    if (filtered.length === 0) {
      const queryText = searchInput ? searchInput.value.trim() : "";

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
      .map((plant) => {
        const typeLabel = getTypeLabel(plant.type);

        return `
          <article
            class="card"
            data-id="${escapeHtml(plant.id)}"
            role="button"
            tabindex="0"
            aria-label="Открыть карточку растения ${escapeHtml(plant.name)}"
          >
            <img src="${escapeHtml(resolveImagePath(plant.image))}" alt="${escapeHtml(plant.name)}" loading="lazy">
            <div class="card-content">
              <h3>${escapeHtml(plant.name)}</h3>
              <div class="meta">${escapeHtml(plant.category)} · ${escapeHtml(typeLabel)}</div>
              ${plant.available === false ? '<div class="stock-status stock-status-off">Нет в наличии</div>' : ""}
              ${plant.price ? `<div class="price">Цена от ${escapeHtml(plant.price)} Br</div>` : ""}
            </div>
          </article>
        `;
      })
      .join("");

    document.querySelectorAll(".card").forEach((card) => {
      card.addEventListener("click", () => {
        const plant = plants.find((item) => item.id === card.dataset.id);
        if (plant) openCard(plant);
      });

      card.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;

        event.preventDefault();
        const plant = plants.find((item) => item.id === card.dataset.id);
        if (plant) openCard(plant);
      });
    });
  }

  function renderFilters() {
    const categories = ["Все", ...new Set(plants.map((plant) => plant.category))];
    filters.innerHTML = "";

    categories.forEach((category) => {
      const button = document.createElement("button");
      button.textContent = category;

      if (category === currentCategory) {
        button.classList.add("active");
      }

      button.addEventListener("click", () => {
        resetSearch();
        closeSearchPanel();
        currentCategory = category;
        renderFilters();
        renderCatalog();
      });

      filters.appendChild(button);
    });
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

    if (searchClearButton) {
      searchClearButton.addEventListener("click", () => {
        searchInput.value = "";
        currentSearch = "";
        hideSuggestions();
        updateSearchClearButton();
        renderCatalog();
        searchInput.focus();
      });
    }

    if (searchFab) {
      searchFab.addEventListener("click", () => {
        if (searchPanel && searchPanel.classList.contains("open")) {
          closeSearchPanel();
          return;
        }

        openSearchPanel();
      });
    }
  }

  if (modal) {
    modal.addEventListener("click", (event) => {
      if (event.target === modal) {
        closeModal();
      }
    });
  }

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

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeSearchPanel();
      closeModal();
    }

    if (event.key === "Tab" && modal && modal.classList.contains("open")) {
      trapFocus(event);
    }
  });

  setupSearch();

  try {
    plants = await loadCatalogPlants();
    updateSuggestions();
    renderFilters();
    renderCatalog();
  } catch (error) {
    catalog.innerHTML = `
      <div class="empty empty-search">
        <h3>Каталог временно недоступен</h3>
        <p>Не удалось загрузить ассортимент из онлайн-таблицы.</p>
        <p>
          Уточнить наличие можно по телефону
          <a href="tel:+375232561934">8 (0232) 56-19-34</a>.
        </p>
      </div>
    `;
    console.error(error);
  }
}
