const recentFavorites = document.getElementById("recentFavorites");
const favoriteTotal = document.getElementById("favoriteTotal");

const renderRecentFavorites = () => {
  const favorites = getFavorites()
    .map(findProduct)
    .filter(Boolean)
    .reverse();

  favoriteTotal.textContent = favorites.length ? `(${favorites.length})` : "";

  if (!favorites.length) {
    recentFavorites.innerHTML = `
      <div class="text-center py-3">
        <i class="bi bi-heart fs-1 text-muted"></i>
        <p class="small text-muted mb-2">Belum ada favorit, yuk cari yang kamu suka~</p>
        <a href="index.html" class="btn btn-primary btn-sm">Jelajahi Produk</a>
      </div>`;
    return;
  }

  const preview = favorites
    .slice(0, 5)
    .map((item) => `
      <a class="fav-mini" href="produk.html?id=${item.id}">
        <img class="fav-mini-img" src="${item.image}" alt="${escapeHTML(item.name)}" loading="lazy">
        <span class="fav-mini-body">
          <span class="fav-mini-name">${escapeHTML(item.name)}</span>
          <span class="fav-mini-price">${formatRupiah(item.price)}</span>
        </span>
      </a>`)
    .join("");

  const rest = favorites.length - 5;
  const more = rest > 0 ? `<a class="fav-more" href="favorit.html">+${rest} produk lainnya</a>` : "";

  recentFavorites.innerHTML = `<div class="fav-preview">${preview}</div>${more}`;
};

window.addEventListener("pageshow", renderRecentFavorites);

renderRecentFavorites();
