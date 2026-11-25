const STORAGE_SESSION = "tokoku_session";

const readSession = () => {
  try {
    const raw = localStorage.getItem(STORAGE_SESSION) || sessionStorage.getItem(STORAGE_SESSION);
    const session = raw ? JSON.parse(raw) : null;
    return session && typeof session.email === "string" && session.email.trim() ? session : null;
  } catch (error) {
    return null;
  }
};

const session = readSession();

if (!session) {
  window.location.replace("login.html?next=akun.html");
}

const accountContent = document.getElementById("accountContent");
accountContent.hidden = !session;
syncLastOrder();

const STORAGE_PROFILE = "tokoku_profile";
const STORAGE_USERS = "tokoku_users";
const STORAGE_PROFILE_COMPLETE_DISMISSED = "tokoku_profile_complete_dismissed";
const emptyProfile = { nama: "", email: "", telepon: "", alamat: "", kota: "", kodepos: "" };
const profileFields = ["nama", "email", "telepon", "kota", "alamat", "kodepos"];
const passwordFields = ["passwordCurrent", "passwordNew", "passwordConfirm"];
const passwordToggles = Array.from(document.querySelectorAll("[data-password-toggle]"), (toggle) => {
  const field = document.getElementById(toggle.dataset.passwordToggle);
  const showLabel = toggle.getAttribute("aria-label");
  const hideLabel = showLabel.replace(/^Tampilkan /, "Sembunyikan ");

  toggle.addEventListener("click", () => {
    const show = field.type === "password";
    field.type = show ? "text" : "password";
    toggle.firstElementChild.className = show ? "bi bi-eye-slash" : "bi bi-eye";
    toggle.setAttribute("aria-label", show ? hideLabel : showLabel);
    toggle.setAttribute("aria-pressed", String(show));
  });

  return { field, toggle, showLabel };
});
const resetPasswordInputs = () => {
  passwordToggles.forEach(({ field, toggle, showLabel }) => {
    field.value = "";
    field.type = "password";
    toggle.firstElementChild.className = "bi bi-eye";
    toggle.setAttribute("aria-label", showLabel);
    toggle.setAttribute("aria-pressed", "false");
  });
};

const hashSandi = async (text) => {
  if (window.crypto && window.crypto.subtle) {
    const data = new TextEncoder().encode(text);
    const buffer = await window.crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(buffer))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  }
  return btoa(unescape(encodeURIComponent(text)));
};

const profileRules = {
  nama: {
    required: true,
    empty: "Nama lengkap wajib diisi.",
    chars: /^[\p{L} .'’-]+$/u,
    charMsg: "Nama hanya boleh berisi huruf, spasi, titik, dan tanda hubung.",
    check: (value) => (value.length < 3 ? "Nama minimal 3 karakter." : "")
  },
  email: {
    required: true,
    empty: "Email wajib diisi.",
    check: (value, field) => (field.validity.typeMismatch ? "Format email belum benar." : "")
  },
  telepon: {
    required: true,
    empty: "Nomor telepon wajib diisi.",
    chars: /^[0-9]+$/,
    charMsg: "Nomor telepon hanya boleh berisi angka, tanpa spasi atau tanda hubung.",
    check: (value) => {
      if (!value.startsWith("08")) return "Nomor telepon harus diawali 08.";
      if (value.length < 10 || value.length > 13) return "Nomor telepon harus 10 sampai 13 digit.";
      return "";
    }
  },
  kota: {
    required: true,
    empty: "Silakan pilih kota.",
    check: (value) => {
      const cities = Array.from(document.querySelectorAll("#daftarKota option"), (option) => option.value);
      return cities.includes(value) ? "" : "Pilih kota yang tersedia dari daftar.";
    }
  },
  alamat: {
    required: true,
    empty: "Alamat wajib diisi.",
    check: (value) => (value.length < 10 ? "Alamat minimal 10 karakter agar kurir mudah menemukan lokasi." : "")
  },
  kodepos: {
    required: true,
    empty: "Kode pos wajib diisi.",
    chars: /^[0-9]+$/,
    charMsg: "Kode pos hanya boleh berisi angka.",
    check: (value) => (value.length !== 5 ? "Kode pos harus 5 digit angka." : "")
  }
};

const getProfile = () => {
  const profile = readJSON(STORAGE_PROFILE, {});
  return {
    ...emptyProfile,
    ...profile,
    nama: profile.nama || (session && session.nama) || "",
    email: (session && session.email) || ""
  };
};

const akunHeader = document.getElementById("akunHeader");
const recentOrders = document.getElementById("recentOrders");
const profileForm = document.getElementById("profileForm");
const profileComplete = document.getElementById("profileComplete");
const accountSecuritySettings = document.getElementById("accountSecuritySettings");
let accountUpdateModal = null;
let accountUpdateModalTimer = null;
let accountSettingsOpen = false;

const hideAccountUpdateConfirmation = () => {
  if (accountUpdateModalTimer !== null) {
    window.clearTimeout(accountUpdateModalTimer);
    accountUpdateModalTimer = null;
  }
  if (accountUpdateModal) accountUpdateModal.hide();
};

const showAccountUpdateConfirmation = () => {
  if (!accountUpdateModal) {
    const modalElement = document.createElement("div");
    modalElement.className = "modal fade cart-added-modal";
    modalElement.tabIndex = -1;
    modalElement.setAttribute("aria-labelledby", "accountUpdateModalLabel");
    modalElement.setAttribute("aria-hidden", "true");
    modalElement.innerHTML = `
      <div class="modal-dialog modal-dialog-centered modal-sm">
        <div class="modal-content text-center">
          <div class="modal-body py-4">
            <div class="cart-added-check" aria-hidden="true"><i class="bi bi-check-lg"></i></div>
            <h5 class="fw-bolder mt-3 mb-0" id="accountUpdateModalLabel">Data sudah diperbarui!</h5>
          </div>
        </div>
      </div>`;
    document.body.appendChild(modalElement);
    accountUpdateModal = new bootstrap.Modal(modalElement);
    modalElement.addEventListener("show.bs.modal", () => {
      document.body.classList.add("cart-added-notice-active");
    });
    modalElement.addEventListener("hidden.bs.modal", () => {
      document.body.classList.remove("cart-added-notice-active");
    });
  }

  if (accountUpdateModalTimer !== null) window.clearTimeout(accountUpdateModalTimer);
  accountUpdateModal.show();
  accountUpdateModalTimer = window.setTimeout(() => {
    accountUpdateModal.hide();
    accountUpdateModalTimer = null;
  }, 1500);
};

akunHeader.addEventListener("click", (event) => {
  const settingsButton = event.target.closest("#editAccountSettings");
  if (!settingsButton) return;
  hideAccountUpdateConfirmation();

  if (accountSettingsOpen) {
    accountSettingsOpen = false;
    settingsButton.setAttribute("aria-expanded", "false");
    profileForm.hidden = true;
    accountSecuritySettings.hidden = true;
    resetPasswordInputs();
    const profile = getProfile();
    const isComplete = profileFields.every((id) => Boolean(String(profile[id] || "").trim()));
    profileComplete.hidden = !isComplete || readJSON(STORAGE_PROFILE_COMPLETE_DISMISSED, false) === true;
    return;
  }

  accountSettingsOpen = true;
  settingsButton.setAttribute("aria-expanded", "true");
  accountSecuritySettings.hidden = false;
  profileForm.hidden = false;
  profileComplete.hidden = true;
  profileForm.scrollIntoView({ behavior: "smooth", block: "start" });
});

const initialOf = (name) => (name.trim() ? name.trim().charAt(0).toUpperCase() : "T");

const renderHeader = () => {
  const profile = getProfile();
  const orders = getOrders();
  const spent = orders.reduce((sum, order) => sum + order.total, 0);

  akunHeader.innerHTML = `
    <div class="d-flex align-items-center gap-3">
      <div class="avatar">${escapeHTML(initialOf(profile.nama))}</div>
      <div class="flex-grow-1">
        <h5 class="fw-bold mb-0">${escapeHTML(profile.nama || "Pengguna Nekoyo")}</h5>
        <small class="text-muted">${escapeHTML(profile.email || "Lengkapi data diri Anda di bawah")}</small>
      </div>
      <div class="d-flex gap-2 flex-shrink-0">
        <button type="button" class="btn btn-outline-primary btn-sm" id="editAccountSettings" aria-label="Pengaturan akun" aria-controls="profileForm" aria-expanded="false">
          <i class="bi bi-gear-fill"></i><span class="d-none d-sm-inline ms-1">Pengaturan</span>
        </button>
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
      const stageIndex = currentStageIndex(order);
      const finished = stageIndex === TRACK_STAGES.length - 1;
      const stage = TRACK_STAGES[stageIndex].title;
      return `
        <a class="recent-order ${finished ? "sudah" : "belum"}" href="lacak.html?id=${order.id}">
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
  const isComplete = profileFields.every((id) => Boolean(String(profile[id] || "").trim()));
  profileForm.hidden = isComplete;
  profileComplete.hidden = !isComplete || readJSON(STORAGE_PROFILE_COMPLETE_DISMISSED, false) === true;
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

profileForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const isSettingsUpdate = accountSettingsOpen;

  if (!validateAll()) {
    showToast("Periksa kembali data yang belum sesuai", "danger");
    return;
  }

  const profile = {};
  profileFields.forEach((id) => {
    profile[id] = document.getElementById(id).value.trim();
  });
  profile.email = profile.email.toLowerCase();

  const users = readJSON(STORAGE_USERS, []);
  const userList = Array.isArray(users) ? users : [];
  const userIndex = userList.findIndex((user) => user && user.email === session.email);
  if (userIndex === -1) {
    showToast("Data akun tidak ditemukan. Silakan masuk kembali.", "danger");
    return;
  }
  if (userList.some((user, index) =>
    index !== userIndex && user && typeof user.email === "string" && user.email.toLowerCase() === profile.email
  )) {
    paintField("email", "Email ini sudah digunakan oleh akun lain.");
    showToast("Gunakan email yang belum terdaftar.", "danger");
    return;
  }

  const passwordValues = passwordFields.map((id) => document.getElementById(id).value);
  const changingPassword = passwordValues.some(Boolean);
  let newPasswordHash = "";

  if (changingPassword) {
    const emptyPasswordIndex = passwordValues.findIndex((value) => !value);
    if (emptyPasswordIndex !== -1) {
      showToast("Isi kata sandi saat ini, kata sandi baru, dan konfirmasinya.", "danger");
      document.getElementById(passwordFields[emptyPasswordIndex]).focus();
      return;
    }

    const [currentPassword, newPassword, confirmPassword] = passwordValues;
    if (newPassword.length < 8 || !/[A-Za-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      showToast("Kata sandi baru harus minimal 8 karakter dan mengandung huruf serta angka.", "danger");
      document.getElementById("passwordNew").focus();
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast("Konfirmasi kata sandi baru belum cocok.", "danger");
      document.getElementById("passwordConfirm").focus();
      return;
    }

    try {
      const currentPasswordHash = await hashSandi(currentPassword);
      if (currentPasswordHash !== userList[userIndex].sandi) {
        showToast("Kata sandi saat ini salah.", "danger");
        document.getElementById("passwordCurrent").focus();
        return;
      }
      newPasswordHash = await hashSandi(newPassword);
    } catch (error) {
      showToast("Kata sandi tidak dapat diproses. Silakan coba lagi.", "danger");
      return;
    }
  }

  const updatedUser = { ...userList[userIndex], nama: profile.nama, email: profile.email };
  if (changingPassword) updatedUser.sandi = newPasswordHash;
  userList[userIndex] = updatedUser;
  const updatedSession = { ...session, nama: profile.nama, email: profile.email };

  try {
    localStorage.setItem(STORAGE_USERS, JSON.stringify(userList));
    localStorage.setItem(STORAGE_PROFILE, JSON.stringify(profile));
    const sessionStorageTarget = localStorage.getItem(STORAGE_SESSION) ? localStorage : sessionStorage;
    sessionStorageTarget.setItem(STORAGE_SESSION, JSON.stringify(updatedSession));
  } catch (error) {
    showToast("Pengaturan akun tidak dapat disimpan. Silakan coba lagi.", "danger");
    return;
  }

  Object.assign(session, updatedSession);
  resetPasswordInputs();
  accountSettingsOpen = false;
  renderHeader();
  accountSecuritySettings.hidden = true;
  profileForm.hidden = true;
  if (isSettingsUpdate) showAccountUpdateConfirmation();
  else hideAccountUpdateConfirmation();
  profileComplete.hidden = isSettingsUpdate || readJSON(STORAGE_PROFILE_COMPLETE_DISMISSED, false) === true;
});

document.getElementById("startShopping").addEventListener("click", () => {
  writeJSON(STORAGE_PROFILE_COMPLETE_DISMISSED, true);
  profileComplete.hidden = true;
});

document.getElementById("confirmLogout").addEventListener("click", () => {
  localStorage.removeItem(STORAGE_SESSION);
  sessionStorage.removeItem(STORAGE_SESSION);
  window.location.replace("login.html");
});

document.getElementById("confirmResetAll").addEventListener("click", () => {
  const clearAppData = (storage) => {
    const keys = [];
    for (let index = 0; index < storage.length; index += 1) {
      const key = storage.key(index);
      if (key && key.startsWith("tokoku_")) keys.push(key);
    }
    keys.forEach((key) => storage.removeItem(key));
  };
  clearAppData(localStorage);
  clearAppData(sessionStorage);
  const resetModal = bootstrap.Modal.getInstance(document.getElementById("resetAllModal"));
  if (resetModal) resetModal.hide();
  accountContent.hidden = true;
  document.getElementById("resetComplete").hidden = false;
  document.documentElement.setAttribute(
    "data-bs-theme",
    matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
  );
  updateBadge(false);
});

renderHeader();
renderRecent();
fillForm();