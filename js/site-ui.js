export function initMobileMenu() {
  const menuToggle = document.getElementById("menu-toggle");
  const mainNav = document.getElementById("main-nav");

  if (!menuToggle || !mainNav) return;

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

  document.addEventListener("click", (event) => {
    const clickedInsideNav = mainNav.contains(event.target);
    const clickedToggle = menuToggle.contains(event.target);

    if (!clickedInsideNav && !clickedToggle) {
      mainNav.classList.remove("open");
      menuToggle.setAttribute("aria-expanded", "false");
    }
  });
}

export function initScrollTopButton() {
  const scrollTopButton = document.createElement("button");
  scrollTopButton.type = "button";
  scrollTopButton.className = "scroll-top-button";
  scrollTopButton.setAttribute("aria-label", "Наверх");
  scrollTopButton.innerHTML = '<span aria-hidden="true">↑</span>';

  scrollTopButton.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  document.body.appendChild(scrollTopButton);

  const updateScrollTopButton = () => {
    const shouldShow = window.scrollY > 700;
    scrollTopButton.classList.toggle("visible", shouldShow);
  };

  updateScrollTopButton();
  window.addEventListener("scroll", updateScrollTopButton, { passive: true });
}
