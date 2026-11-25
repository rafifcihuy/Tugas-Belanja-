const favoriteGrid = document.getElementById("favoriteGrid");
const favoriteEmptyState = document.getElementById("favoriteEmptyState");
const favCount = document.getElementById("favCount");
const addAllButton = document.getElementById("addAllButton");

const renderFavorites = () => {
  const favorites = getFavorites()
    .map(findProduct)
    .filter(Boolean);

  favoriteGrid.innerHTML = favorites
    .map((item) => `
      <div class="col-6 col-md-4 col-lg-3 fav-item" data-id="${item.id}">
        <div class="card product-card h-100 shadow-sm">
          ${favoriteButton(item.id)}
          <a href="produk.html?id=${item.id}">
            <img src="${item.image}" class="card-img-top" alt="${escapeHTML(item.name)}" loading="lazy">
          </a>
          <div class="card-body d-flex flex-column">
            <span class="badge category-badge align-self-start mb-2">${escapeHTML(item.category)}</span>
            <h6 class="card-title"><a class="product-link" href="produk.html?id=${item.id}">${escapeHTML(item.name)}</a></h6>
            <div class="rating-stars mb-2">${renderStars(item.rating)} <small class="text-muted">${item.rating}</small></div>
            <p class="product-price mt-auto mb-3">${formatRupiah(item.price)}</p>
            <button class="btn btn-primary w-100 add-to-cart" type="button" data-id="${item.id}" aria-label="Tambah ${escapeHTML(item.name)} ke keranjang">
              <i class="bi bi-cart-plus me-1"></i>Tambah
            </button>
          </div>
        </div>
      </div>`)
    .join("");

  favoriteEmptyState.classList.toggle("d-none", favorites.length !== 0);
  addAllButton.hidden = favorites.length === 0;
  favCount.textContent = favorites.length ? `${favorites.length} produk disimpan` : "Belum ada yang disimpan";
};

const showUndoToast = (product) => {
  showToast(
    `${escapeHTML(product.name)} dihapus dari favorit<button type="button" class="btn btn-link btn-sm toast-undo p-0 ms-2" data-id="${product.id}">Urungkan</button>`
  );
};

favoriteGrid.addEventListener("click", (event) => {
  const heart = event.target.closest(".favorite-toggle");

  if (heart) {
    event.preventDefault();
    event.stopPropagation();
    const item = heart.closest(".fav-item");
    if (item.classList.contains("removing")) return;
    const product = findProduct(heart.dataset.id);
    item.classList.add("removing");
    setTimeout(() => {
      try {
        toggleFavorite(product.id);
      } catch (error) {
        showToast("Favorit tidak dapat disimpan. Silakan coba lagi.", "danger");
        renderFavorites();
        return;
      }
      renderFavorites();
      showUndoToast(product);
    }, 280);
    return;
  }

  const button = event.target.closest(".add-to-cart");
  if (!button) return;
  addToCartWithEffect(button.dataset.id, 1, button);
});

document.addEventListener("click", (event) => {
  const undo = event.target.closest(".toast-undo");
  if (!undo) return;
  const id = Number(undo.dataset.id);
  undo.disabled = true;
  if (!isFavorite(id)) toggleFavorite(id);
  renderFavorites();
  const toastElement = undo.closest(".toast");
  if (toastElement) bootstrap.Toast.getOrCreateInstance(toastElement).hide();
});

addAllButton.addEventListener("click", () => {
  const results = getFavorites().map((id) => addToCart(id, 1));
  const success = results.filter((result) => result.ok).length;
  const failed = results.length - success;
  if (success) {
    showToast(failed ? `${success} produk masuk keranjang, ${failed} gagal karena stok` : `${success} produk masuk ke keranjang`);
  } else {
    showToast("Stok produk favorit tidak mencukupi", "danger");
  }
});

renderFavorites();
