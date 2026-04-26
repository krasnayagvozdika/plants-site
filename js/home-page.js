import { getRandomUniqueItems, getUniquePlantsByImage, loadCatalogPlants } from "./catalog-data.js";
import { resolveImagePath } from "./utils.js";

function setHomeCard(imageElement, plant) {
  if (!imageElement || !plant) return;

  imageElement.src = resolveImagePath(plant.image);
  imageElement.alt = plant.name;
  imageElement.loading = "eager";

  imageElement.onerror = () => {
    imageElement.src = "images/logo.png";
    imageElement.alt = "Красная гвоздика";
  };
}

function setHomeGalleryFallback(images) {
  images.forEach((imageElement) => {
    if (!imageElement) return;

    imageElement.src = "images/logo.png";
    imageElement.alt = "Красная гвоздика";
    imageElement.loading = "eager";
  });
}

export async function initHomePage() {
  const homeImages = [
    document.getElementById("home-image-1"),
    document.getElementById("home-image-2"),
    document.getElementById("home-image-3"),
  ];

  if (homeImages.some((image) => !image)) return;

  try {
    const plants = await loadCatalogPlants();
    const homePlants = plants
      .map(({ id, image, name }) => ({ id, image, name }))
      .filter((plant) => plant.name && plant.image);

    const uniqueByImage = getUniquePlantsByImage(homePlants);
    const randomPlants = getRandomUniqueItems(uniqueByImage, 3);

    setHomeCard(homeImages[0], randomPlants[0]);
    setHomeCard(homeImages[1], randomPlants[1]);
    setHomeCard(homeImages[2], randomPlants[2]);
  } catch (error) {
    setHomeGalleryFallback(homeImages);
    console.error(error);
  }
}
