const URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQC6o3gVUCO9cXGFdj-HHMMlamlSz5P-zjOJpCWv21H1GadmiUM-IFA2JKsBXBYZ4rsnVND9CdijkUP/pub?output=csv";

const catalog = document.getElementById("catalog");
const filters = document.getElementById("filters");

let plants = [];
let currentCategory = "Все";

// загрузка CSV
async function loadData() {
  const res = await fetch(URL);
  const text = await res.text();

  const rows = text.split("\n").slice(1);

  plants = rows.map(row => {
    const cols = row.split(",");

    return {
      id: cols[0],
      name: cols[1],
      price: cols[2],
      image: cols[3],
      category: cols[4],
      type: cols[5],
      size: cols[6],
      description: cols[7],
      available: cols[8]
    };
  });

  renderFilters();
  renderCatalog();
}

// фильтры
function renderFilters() {
  const categories = ["Все", ...new Set(plants.map(p => p.category))];

  filters.innerHTML = "";

  categories.forEach(cat => {
    const btn = document.createElement("button");
    btn.textContent = cat;

    if (cat === currentCategory) {
      btn.classList.add("active");
    }

    btn.onclick = () => {
      currentCategory = cat;
      renderFilters();
      renderCatalog();
    };

    filters.appendChild(btn);
  });
}

// карточки
function renderCatalog() {
  let filtered = plants;

  if (currentCategory !== "Все") {
    filtered = plants.filter(p => p.category === currentCategory);
  }

  if (filtered.length === 0) {
    catalog.innerHTML = `<div class="empty">Ничего не найдено</div>`;
    return;
  }

  catalog.innerHTML = filtered.map(p => {
    return `
      <div class="card">
        <img src="images/${p.image}" alt="${p.name}">
        <div class="card-content">
          <h3>${p.name}</h3>

          <div class="meta">
            ${p.category} · ${p.type === "pot" ? "в горшке" : "в грунте"}
          </div>

          ${p.size ? `<div class="size">${p.size}</div>` : ""}
          ${p.price ? `<div class="price">${p.price} ₽</div>` : ""}
          ${p.description ? `<div class="description">${p.description}</div>` : ""}

          <div class="button">Подробнее</div>
        </div>
      </div>
    `;
  }).join("");
}

// старт
loadData();