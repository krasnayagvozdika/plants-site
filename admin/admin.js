document.addEventListener("DOMContentLoaded", () => {
  const dropzone = document.querySelector("[data-dropzone]");
  const selectImageButton = document.querySelector("[data-select-image]");
  const fileInput = document.querySelector('input[type="file"][name="image"]');
  const previewImage = document.querySelector("[data-image-preview]");
  const previewText = document.querySelector("[data-image-preview-text]");
  const searchInput = document.querySelector("[data-admin-search]");
  const items = Array.from(document.querySelectorAll("[data-admin-item]"));

  if (dropzone && fileInput) {
    const updatePreview = (file) => {
      if (!file || !previewImage || !previewText) return;

      previewText.textContent = file.name;

      if (!file.type.startsWith("image/")) return;

      const reader = new FileReader();
      reader.onload = () => {
        previewImage.src = String(reader.result);
        previewImage.hidden = false;
      };
      reader.readAsDataURL(file);
    };

    if (selectImageButton) {
      selectImageButton.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        fileInput.click();
      });
    }

    fileInput.addEventListener("change", () => {
      if (fileInput.files && fileInput.files[0]) {
        updatePreview(fileInput.files[0]);
      }
    });

    ["dragenter", "dragover"].forEach((eventName) => {
      dropzone.addEventListener(eventName, (event) => {
        event.preventDefault();
        dropzone.classList.add("is-dragover");
      });
    });

    ["dragleave", "dragend", "drop"].forEach((eventName) => {
      dropzone.addEventListener(eventName, (event) => {
        event.preventDefault();
        dropzone.classList.remove("is-dragover");
      });
    });

    dropzone.addEventListener("drop", (event) => {
      const files = event.dataTransfer?.files;
      if (!files || files.length === 0) return;

      const transfer = new DataTransfer();
      Array.from(files)
        .slice(0, 1)
        .forEach((file) => transfer.items.add(file));

      fileInput.files = transfer.files;
      updatePreview(transfer.files[0]);
    });
  }

  if (searchInput && items.length > 0) {
    searchInput.addEventListener("input", () => {
      const query = searchInput.value.trim().toLowerCase();

      items.forEach((item) => {
        const haystack = `${item.dataset.name || ""} ${item.dataset.category || ""}`.toLowerCase();
        const shouldHide = query !== "" && !haystack.includes(query);
        item.hidden = shouldHide;
        item.classList.toggle("is-hidden", shouldHide);
      });
    });
  }
});
