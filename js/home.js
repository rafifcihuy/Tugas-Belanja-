const params = new URLSearchParams(window.location.search);

const state = {
  keyword: (params.get("q") || "").trim(),
  category: "Semua",
  sort: "default"
};

const productGrid = document.getElementById("productGrid");
const emptyState = document.getElementById("emptyState");
const resultInfo = document.getElementById("resultInfo");
const sortSelect = document.getElementById("sortSelect");
const resetButton = document.getElementById("resetButton");
const categoryButtons = document.querySelectorAll("#categoryFilter button");
const navSearch = document.getElementById("searchInput");
const productSearch = document.getElementById("productSearch");

if (navSearch) navSearch.value = state.keyword;
if (productSearch) productSearch.value = state.keyword;

const getVisibleProducts = () => {
  let list = products.filter((item) => {
    const matchCategory = state.category === "Semua" || item.category === state.category;
    const keyword = state.keyword.toLowerCase();
    const searchableText = `${item.name} ${item.category} ${item.desc || ""}`.toLowerCase();
    const matchKeyword = !keyword || searchableText.includes(keyword);
    return matchCategory && matchKeyword;
  });

  if (state.sort === "low") list = [...list].sort((a, b) => a.price - b.price);
  if (state.sort === "high") list = [...list].sort((a, b) => b.price - a.price);
  if (state.sort === "rating") list = [...list].sort((a, b) => b.rating - a.rating);
  if (state.sort === "name") list = [...list].sort((a, b) => a.name.localeCompare(b.name));

  return list;
};

const renderProducts = () => {
  const list = getVisibleProducts();

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
              <i class="bi bi-cart-plus me-1"></i>Tambah ke Keranjang
            </button>
          </div>
        </div>
      </div>`
    )
    .join("");

  emptyState.classList.toggle("d-none", list.length !== 0);

  let info = `Menampilkan ${list.length} produk`;
  if (state.category !== "Semua") info += ` pada kategori ${state.category}`;
  if (state.keyword) info += ` untuk pencarian "${escapeHTML(state.keyword)}"`;
  resultInfo.innerHTML = info;
};

window.onSearch = (keyword) => {
  state.keyword = keyword;
  if (navSearch) navSearch.value = keyword;
  if (productSearch) productSearch.value = keyword;
  renderProducts();
};

if (productSearch) {
  productSearch.addEventListener("input", () => {
    window.onSearch(productSearch.value.trim());
  });
}

sortSelect.addEventListener("change", () => {
  state.sort = sortSelect.value;
  renderProducts();
});

categoryButtons.forEach((button) => {
  button.addEventListener("click", () => {
    categoryButtons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    state.category = button.dataset.category;
    renderProducts();
  });
});

resetButton.addEventListener("click", () => {
  state.keyword = "";
  state.category = "Semua";
  state.sort = "default";
  if (navSearch) navSearch.value = "";
  if (productSearch) productSearch.value = "";
  sortSelect.value = "default";
  categoryButtons.forEach((item) => item.classList.toggle("active", item.dataset.category === "Semua"));
  renderProducts();
});

productGrid.addEventListener("click", (event) => {
  const button = event.target.closest(".add-to-cart");
  if (!button) return;
  const result = addToCart(button.dataset.id, 1);
  showToast(result.message, result.ok ? "success" : "danger");
});

renderProducts();
