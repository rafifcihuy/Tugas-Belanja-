syncLastOrder();

const STORAGE_PROFILE = "tokoku_profile";
const emptyProfile = { nama: "", email: "", telepon: "", alamat: "", kota: "", kodepos: "" };
const profileFields = ["nama", "email", "telepon", "kota", "alamat", "kodepos"];

const getProfile = () => ({ ...emptyProfile, ...readJSON(STORAGE_PROFILE, {}) });

const akunHeader = document.getElementById("akunHeader");
const recentOrders = document.getElementById("recentOrders");
const profileForm = document.getElementById("profileForm");

const initialOf = (name) => (name.trim() ? name.trim().charAt(0).toUpperCase() : "T");

const renderHeader = () => {
  const profile = getProfile();
  const orders = getOrders();
  const spent = orders.reduce((sum, order) => sum + order.total, 0);

  akunHeader.innerHTML = `
    <div class="d-flex align-items-center gap-3">
      <div class="avatar">${escapeHTML(initialOf(profile.nama))}</div>
      <div class="flex-grow-1">
        <h5 class="fw-bold mb-0">${escapeHTML(profile.nama || "Pengguna TokoKu")}</h5>
        <small class="text-muted">${escapeHTML(profile.email || "Lengkapi data diri Anda di bawah")}</small>
      </div>
    </div>
    <div class="row g-2 g-md-3 mt-2 text-center">
      <div class="col-4"><div class="stat-box"><div class="stat-value">${orders.length}</div><small>Pesanan</small></div></div>
      <div class="col-4"><div class="stat-box"><div class="stat-value">${formatRupiah(spent)}</div><small>Total belanja</small></div></div>
      <div class="col-4"><div class="stat-box"><div class="stat-value">${cartCount()}</div><small>Di keranjang</small></div></div>
    </div>`;
};

const renderRecent = () => {
  const orders = getOrders().slice(0, 3);

  if (!orders.length) {
    recentOrders.innerHTML = `
      <div class="text-center py-3">
        <i class="bi bi-box-seam fs-1 text-muted"></i>
        <p class="small text-muted mb-2">Belum ada pesanan.</p>
        <a href="index.html" class="btn btn-primary btn-sm">Mulai Belanja</a>
      </div>`;
    return;
  }

  recentOrders.innerHTML = orders
    .map((order) => {
      const stage = TRACK_STAGES[currentStageIndex(order)].title;
      return `
        <a class="recent-order" href="lacak.html?id=${order.id}">
          <div>
            <div class="fw-semibold">${order.id}</div>
            <small class="text-muted">${stage}</small>
          </div>
          <div class="text-end">
            <div class="fw-semibold small">${formatRupiah(order.total)}</div>
            <i class="bi bi-chevron-right text-muted"></i>
          </div>
        </a>`;
    })
    .join("");
};

const fillForm = () => {
  const profile = getProfile();
  profileFields.forEach((id) => {
    document.getElementById(id).value = profile[id];
  });
};

profileForm.addEventListener("submit", (event) => {
  event.preventDefault();

  if (!profileForm.checkValidity()) {
    profileForm.classList.add("was-validated");
    const firstInvalid = profileForm.querySelector(":invalid");
    if (firstInvalid) firstInvalid.focus();
    showToast("Periksa kembali data yang belum sesuai", "danger");
    return;
  }

  const profile = {};
  profileFields.forEach((id) => {
    profile[id] = document.getElementById(id).value.trim();
  });

  writeJSON(STORAGE_PROFILE, profile);
  profileForm.classList.remove("was-validated");
  renderHeader();
  showToast("Data akun berhasil disimpan");
});

const setTheme = (mode) => {
  const dark = mode === "dark" || (mode === "auto" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.setAttribute("data-bs-theme", dark ? "dark" : "light");
  try {
    if (mode === "auto") {
      localStorage.removeItem(STORAGE_THEME);
    } else {
      localStorage.setItem(STORAGE_THEME, mode);
    }
  } catch (error) {
    return;
  }
};

const readSavedTheme = () => {
  try {
    return localStorage.getItem(STORAGE_THEME) || "auto";
  } catch (error) {
    return "auto";
  }
};

const themeRadios = document.querySelectorAll('input[name="tema"]');

themeRadios.forEach((radio) => {
  radio.checked = radio.value === readSavedTheme();
  radio.addEventListener("change", () => {
    setTheme(radio.value);
    showToast("Tampilan diperbarui");
  });
});

document.getElementById("resetData").addEventListener("click", () => {
  if (!confirm("Semua data toko di perangkat ini (profil, keranjang, riwayat pesanan, tema) akan dihapus. Lanjutkan?")) return;
  Object.keys(localStorage)
    .filter((key) => key.startsWith("tokoku_"))
    .forEach((key) => localStorage.removeItem(key));
  showToast("Semua data berhasil dihapus");
  setTimeout(() => window.location.reload(), 900);
});

renderHeader();
renderRecent();
fillForm();