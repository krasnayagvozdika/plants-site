import { CATALOG_JSON_URL } from "./config.js";

export async function fetchCatalogData() {
  const response = await fetch(CATALOG_JSON_URL, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`Catalog JSON request failed with status ${response.status}`);
  }

  return await response.json();
}

export async function loadCatalogPlants() {
  const data = await fetchCatalogData();
  const items = Array.isArray(data) ? data : data.items;

  if (!Array.isArray(items)) {
    throw new Error("Catalog JSON has invalid shape.");
  }

  return items.filter((plant) => plant && plant.name && plant.category);
}

export function getUniquePlantsByImage(items) {
  const map = new Map();

  items.forEach((item) => {
    if (!map.has(item.image)) {
      map.set(item.image, item);
    }
  });

  return Array.from(map.values());
}

export function getRandomUniqueItems(items, count) {
  const shuffled = [...items];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const randomIndex = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[i]];
  }

  return shuffled.slice(0, count);
}
