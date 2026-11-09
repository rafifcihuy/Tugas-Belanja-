const params = new URLSearchParams(window.location.search);
let keyword = (params.get("q") || "").trim();

const productGrid = document.getElementById("productGrid");
const emptyState = document.getElementById("emptyState");
const resultInfo = document.getElementById("resultInfo");
const resetButton = document.getElementById("resetButton");
const navSearch = document.getElementById("searchInput");

if (navSearch) {
  navSearch.value = keyword;
  if (!keyword) navSearch.focus();
}

const getResults = () => {
  const key = keyword.toLowerCase();
  return products.filter((item) => item.name.toLowerCase().includes(key) || item.category.toLowerCase().includes(key));
};

const render = () => {
  const list = getResults();

  productGrid.innerHTML = list
    .map(
      (item) => `
      <div class="col-6 col-md-4 col-lg-3">
        <div class="card product-card h-100 shadow-sm">
          <a href="produk.html?id=${item.id}">
            <img src="${item.image}" class="card-img-top" alt="${item.name}" loading="lazy">
          </a>
          <div class="card-body d-flex flex-column">
            <span class="badge category-badge align-self-start mb-2">${item.category}</span>
            <h6 class="card-title">
              <a class="product-link" href="produk.html?id=${item.id}">${item.name}</a>
            </h6>
            <div class="rating-stars mb-2">${renderStars(item.rating)} <small class="text-muted">${item.rating}</small></div>
            <p class="product-price mt-auto mb-3">${formatRupiah(item.price)}</p>
            <button class="btn btn-primary w-100 add-to-cart" type="button" data-id="${item.id}">
              <i class="bi bi-cart-plus me-1"></i>Tambah
            </button>
          </div>
        </div>
      </div>`
    )
    .join("");

  emptyState.classList.toggle("d-none", list.length !== 0);

  resultInfo.innerHTML = keyword
    ? `Ditemukan ${list.length} produk untuk "${escapeHTML(keyword)}"`
    : `Semua produk (${list.length})`;
};

window.onSearch = (value) => {
  keyword = value;
  const url = value ? `cari.html?q=${encodeURIComponent(value)}` : "cari.html";
  history.replaceState(null, "", url);
  render();
};

resetButton.addEventListener("click", () => {
  keyword = "";
  if (navSearch) navSearch.value = "";
  history.replaceState(null, "", "cari.html");
  render();
});

productGrid.addEventListener("click", (event) => {
  const button = event.target.closest(".add-to-cart");
  if (!button) return;
  addToCartWithEffect(button.dataset.id, 1, button);
});

render();