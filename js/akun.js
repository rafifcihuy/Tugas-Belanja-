syncLastOrder();

const STORAGE_PROFILE = "tokoku_profile";
const emptyProfile = { nama: "", email: "", telepon: "", alamat: "", kota: "", kodepos: "" };
const profileFields = ["nama", "email", "telepon", "kota", "alamat", "kodepos"];
const profileRules = {
  nama: {
    required: true,
    empty: "Nama lengkap wajib diisi.",
    chars: /^[\p{L} .'’-]+$/u,
    charMsg: "Nama hanya boleh berisi huruf, spasi, titik, dan tanda hubung.",
    check: (value) => (value.length < 3 ? "Nama minimal 3 karakter." : "")
  },
  email: {
    check: (value, field) => (field.validity.typeMismatch ? "Format email belum benar." : "")
  },
  telepon: {
    chars: /^[0-9]+$/,
    charMsg: "Nomor telepon hanya boleh berisi angka, tanpa spasi atau tanda hubung.",
    check: (value) => {
      if (!value) return "";
      if (!value.startsWith("08")) return "Nomor telepon harus diawali 08.";
      if (value.length < 10 || value.length > 13) return "Nomor telepon harus 10 sampai 13 digit.";
      return "";
    }
  },
  kota: {
    chars: /^[\p{L} .'’-]+$/u,
    charMsg: "Nama kota hanya boleh berisi huruf.",
    check: (value) => (value && value.length < 3 ? "Nama kota minimal 3 karakter." : "")
  },
  alamat: {
    check: (value) => (value && value.length < 10 ? "Alamat minimal 10 karakter agar kurir mudah menemukan lokasi." : "")
  },
  kodepos: {
    chars: /^[0-9]+$/,
    charMsg: "Kode pos hanya boleh berisi angka.",
    check: (value) => (value && value.length !== 5 ? "Kode pos harus 5 digit angka." : "")
  }
};

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

const touchedFields = new Set();

const getFieldValue = (id) => document.getElementById(id).value.trim();

const validateField = (id) => {
  const field = document.getElementById(id);
  const rule = profileRules[id];
  const value = getFieldValue(id);

  if (!value) return rule.required ? rule.empty : "";
  if (rule.chars && !rule.chars.test(value)) return rule.charMsg;
  return rule.check(value, field);
};

const paintField = (id, message) => {
  const field = document.getElementById(id);
  const feedback = field.parentElement.querySelector(".invalid-feedback");
  field.classList.toggle("is-invalid", Boolean(message));
  field.classList.toggle("is-valid", !message);
  field.setAttribute("aria-invalid", message ? "true" : "false");
  if (message && feedback) feedback.textContent = message;
};

const resetFieldPaint = (id) => {
  const field = document.getElementById(id);
  field.classList.remove("is-invalid", "is-valid");
  field.removeAttribute("aria-invalid");
};

const validateAll = () => {
  let firstInvalid = null;

  profileFields.forEach((id) => {
    touchedFields.add(id);
    const message = validateField(id);
    if (!getFieldValue(id) && !profileRules[id].required) {
      resetFieldPaint(id);
      return;
    }
    paintField(id, message);
    if (message && !firstInvalid) firstInvalid = document.getElementById(id);
  });

  if (firstInvalid) {
    firstInvalid.scrollIntoView({ behavior: "smooth", block: "center" });
    firstInvalid.focus({ preventScroll: true });
  }

  return !firstInvalid;
};

profileFields.forEach((id) => {
  const field = document.getElementById(id);
  if (id === "telepon") field.setAttribute("maxlength", "13");
  if (id === "kodepos") field.setAttribute("maxlength", "5");

  field.addEventListener("input", () => {
    const value = getFieldValue(id);
    const rule = profileRules[id];

    if (!value && !rule.required) {
      resetFieldPaint(id);
      return;
    }
    if (touchedFields.has(id)) {
      paintField(id, validateField(id));
      return;
    }
    if (value && rule.chars && !rule.chars.test(value)) {
      paintField(id, rule.charMsg);
      return;
    }
    if (validateField(id)) resetFieldPaint(id);
    else paintField(id, "");
  });

  field.addEventListener("blur", () => {
    touchedFields.add(id);
    if (!getFieldValue(id) && !profileRules[id].required) {
      resetFieldPaint(id);
      return;
    }
    paintField(id, validateField(id));
  });
});

profileForm.addEventListener("submit", (event) => {
  event.preventDefault();

  if (!validateAll()) {
    showToast("Periksa kembali data yang belum sesuai", "danger");
    return;
  }

  const profile = {};
  profileFields.forEach((id) => {
    profile[id] = document.getElementById(id).value.trim();
  });
  writeJSON(STORAGE_PROFILE, profile);
  writeJSON(STORAGE_PROFILE, profile);
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