const URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQC6o3gVUCO9cXGFdj-HHMMlamlSz5P-zjOJpCWv21H1GadmiUM-IFA2JKsBXBYZ4rsnVND9CdijkUP/pub?output=csv";

const catalog = document.getElementById("catalog");
const filters = document.getElementById("filters");
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
let lastFocusedElement = null;

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

function renderCatalog() {
  if (!catalog) return;

  let filtered = plants;

  if (currentCategory !== "Все") {
    filtered = plants.filter((p) => p.category === currentCategory);
  }

  if (filtered.length === 0) {
    catalog.innerHTML = `<div class="empty">Ничего не найдено</div>`;
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
  if (!type) return "тип не указан";
  return type;
}

function openCard(p) {
  if (!modal || !modalBody) return;

  const typeLabel = getTypeLabel(p.type);
  lastFocusedElement = document.activeElement;

  modalBody.innerHTML = `
    <img class="modal-image" src="images/${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}">
    <h2 class="modal-title" id="modal-title">${escapeHtml(p.name)}</h2>
    <div class="modal-meta">${escapeHtml(p.category)} · ${escapeHtml(typeLabel)}</div>
    ${p.price ? `<div class="modal-price">${escapeHtml(p.price)} Br</div>` : `<div class="modal-price">Цена по запросу</div>`}
    ${p.size ? `<div class="modal-size">Размер: ${escapeHtml(p.size)}</div>` : ""}
    ${p.description ? `<div class="modal-description">${escapeHtml(p.description)}</div>` : ""}
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

if (modalCloseButton) {
  modalCloseButton.addEventListener("click", closeModal);
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
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
