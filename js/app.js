import { initCatalogPage } from "./catalog-page.js";
import { initHomePage } from "./home-page.js";
import { initMobileMenu, initScrollTopButton } from "./site-ui.js";

initMobileMenu();
initScrollTopButton();

await Promise.all([initCatalogPage(), initHomePage()]);
