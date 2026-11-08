const products = [
  { id: 1, name: "Sepatu Sneakers Putih", category: "Fashion", price: 349000, image: "https://picsum.photos/seed/sneakers/400/300" },
  { id: 2, name: "Tas Ransel Kanvas", category: "Fashion", price: 199000, image: "https://picsum.photos/seed/backpack/400/300" },
  { id: 3, name: "Jaket Hoodie Polos", category: "Fashion", price: 175000, image: "https://picsum.photos/seed/hoodie/400/300" },
  { id: 4, name: "Earbuds Nirkabel", category: "Elektronik", price: 259000, image: "https://picsum.photos/seed/earbuds/400/300" },
  { id: 5, name: "Power Bank 10000 mAh", category: "Elektronik", price: 149000, image: "https://picsum.photos/seed/powerbank/400/300" },
  { id: 6, name: "Keyboard Mekanik Mini", category: "Elektronik", price: 425000, image: "https://picsum.photos/seed/keyboard/400/300" },
  { id: 7, name: "Set Panci Anti Lengket", category: "Rumah Tangga", price: 289000, image: "https://picsum.photos/seed/cookware/400/300" },
  { id: 8, name: "Lampu Meja LED", category: "Rumah Tangga", price: 89000, image: "https://picsum.photos/seed/desklamp/400/300" },
  { id: 9, name: "Botol Minum Stainless", category: "Olahraga", price: 79000, image: "https://picsum.photos/seed/bottle/400/300" },
  { id: 10, name: "Matras Yoga Tebal", category: "Olahraga", price: 135000, image: "https://picsum.photos/seed/yogamat/400/300" },
  { id: 11, name: "Raket Badminton Ringan", category: "Olahraga", price: 215000, image: "https://picsum.photos/seed/racket/400/300" },
  { id: 12, name: "Speaker Bluetooth Portabel", category: "Elektronik", price: 319000, image: "https://picsum.photos/seed/speaker/400/300" }
];

const state = {
  keyword: "",
  category: "Semua",
  sort: "default",
  cartCount: 0
};

const productGrid = document.getElementById("productGrid");
const emptyState = document.getElementById("emptyState");
const resultInfo = document.getElementById("resultInfo");
const cartBadge = document.getElementById("cartBadge");
const searchForm = document.getElementById("searchForm");
const searchInput = document.getElementById("searchInput");
const sortSelect = document.getElementById("sortSelect");
const categoryButtons = document.querySelectorAll("#categoryFilter button");
const resetButton = document.getElementById("resetButton");
const toastElement = document.getElementById("cartToast");
const toastMessage = document.getElementById("toastMessage");
const toast = new bootstrap.Toast(toastElement, { delay: 2500 });

const formatRupiah = (value) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);

const getVisibleProducts = () => {
  let list = products.filter((item) => {
    const matchCategory = state.category === "Semua" || item.category === state.category;
    const matchKeyword = item.name.toLowerCase().includes(state.keyword.toLowerCase());
    return matchCategory && matchKeyword;
  });

  if (state.sort === "low") list = [...list].sort((a, b) => a.price - b.price);
  if (state.sort === "high") list = [...list].sort((a, b) => b.price - a.price);
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
          <img src="${item.image}" class="card-img-top" alt="${item.name}" loading="lazy">
          <div class="card-body d-flex flex-column">
            <span class="badge category-badge align-self-start mb-2">${item.category}</span>
            <h6 class="card-title">${item.name}</h6>
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
  resultInfo.textContent = `Menampilkan ${list.length} produk` + (state.category !== "Semua" ? ` pada kategori ${state.category}` : "");
};

const updateCartBadge = () => {
  cartBadge.textContent = state.cartCount;
  cartBadge.classList.remove("badge-bump");
  void cartBadge.offsetWidth;
  cartBadge.classList.add("badge-bump");
};

const showToast = (text) => {
  toastMessage.innerHTML = `<i class="bi bi-check-circle-fill me-2"></i>${text}`;
  toast.show();
};

searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  state.keyword = searchInput.value.trim();
  renderProducts();
});

searchInput.addEventListener("input", () => {
  state.keyword = searchInput.value.trim();
  renderProducts();
});

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
  searchInput.value = "";
  sortSelect.value = "default";
  categoryButtons.forEach((item) => item.classList.toggle("active", item.dataset.category === "Semua"));
  renderProducts();
});

productGrid.addEventListener("click", (event) => {
  const button = event.target.closest(".add-to-cart");
  if (!button) return;
  const product = products.find((item) => item.id === Number(button.dataset.id));
  state.cartCount += 1;
  updateCartBadge();
  showToast(`${product.name} berhasil ditambahkan ke keranjang`);
});

renderProducts();