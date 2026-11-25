const favoriteGrid = document.getElementById("favoriteGrid");
const favoriteEmptyState = document.getElementById("favoriteEmptyState");

const renderFavorites = () => {
  const favorites = getFavorites()
    .map(findProduct)
    .filter(Boolean);

  favoriteGrid.innerHTML = favorites
    .map((item) => `
      <div class="col-6 col-md-4 col-lg-3">
        <div class="card product-card h-100 shadow-sm">
          ${favoriteButton(item.id)}
          <a href="produk.html?id=${item.id}">
            <img src="${item.image}" class="card-img-top" alt="${escapeHTML(item.name)}" loading="lazy">
          </a>
          <div class="card-body d-flex flex-column">
            <span class="badge category-badge align-self-start mb-2">${escapeHTML(item.category)}</span>
            <h6 class="card-title"><a class="product-link" href="produk.html?id=${item.id}">${escapeHTML(item.name)}</a></h6>
            <p class="product-price mt-auto mb-3">${formatRupiah(item.price)}</p>
            <button class="btn btn-primary w-100 add-to-cart" type="button" data-id="${item.id}" aria-label="Tambah ${escapeHTML(item.name)} ke keranjang">
              <i class="bi bi-cart-plus me-1"></i>Tambah
            </button>
          </div>
        </div>
      </div>`)
    .join("");

  favoriteEmptyState.classList.toggle("d-none", favorites.length !== 0);
};

bindFavoriteButtons(favoriteGrid, renderFavorites);
favoriteGrid.addEventListener("click", (event) => {
  const button = event.target.closest(".add-to-cart");
  if (!button) return;
  addToCartWithEffect(button.dataset.id, 1, button);
});

renderFavorites();
