const STORAGE_USERS = "tokoku_users";
const STORAGE_SESSION = "tokoku_session";
const STORAGE_PROFILE_KEY = "tokoku_profile";

const form = document.getElementById("loginForm");
const judul = document.getElementById("judul");
const subjudul = document.getElementById("subjudul");
const grupNama = document.getElementById("grupNama");
const barisOpsi = document.getElementById("barisOpsi");
const alertBox = document.getElementById("alertBox");
const tombolKirim = document.getElementById("tombolKirim");
const teksKirim = document.getElementById("teksKirim");
const tombolGanti = document.getElementById("tombolGanti");
const teksGanti = document.getElementById("teksGanti");
const toggleSandi = document.getElementById("toggleSandi");
const loginPanel = document.querySelector(".login-panel");
const characterDesktop = document.querySelector(".char-desktop");
const characterMobile = document.querySelector(".char-mobile");
const inputs = {
  nama: document.getElementById("nama"),
  email: document.getElementById("email"),
  sandi: document.getElementById("sandi")
};

let mode = "masuk";

const copy = {
  masuk: {
    judul: "Hai, selamat datang kembali~",
    sub: "Masuk dulu ya, biar belanjaanmu nggak ketinggalan.",
    kirim: "Masuk",
    ganti: "Belum punya akun?",
    tombolGanti: "Daftar yuk",
    autocomplete: "current-password",
    imageDesktop: "img/4.png",
    imageMobile: "img/2.png"
  },
  daftar: {
    judul: "Yuk bikin akun dulu~",
    sub: "Cuma sebentar kok, habis ini langsung bisa belanja.",
    kirim: "Daftar",
    ganti: "Sudah punya akun?",
    tombolGanti: "Masuk aja",
    autocomplete: "new-password",
    imageDesktop: "img/6.png",
    imageMobile: "img/6.png"
  }
};

const readJSON = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    return fallback;
  }
};

const writeJSON = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    return false;
  }
};

const getUsers = () => {
  const users = readJSON(STORAGE_USERS, []);
  return Array.isArray(users) ? users : [];
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

const rules = {
  nama: (value) => {
    if (!value) return "Nama wajib diisi.";
    if (value.length < 3) return "Nama minimal 3 karakter.";
    if (!/^[\p{L} .'’-]+$/u.test(value)) return "Nama hanya boleh berisi huruf, spasi, titik, dan tanda hubung.";
    return "";
  },
  email: (value) => {
    if (!value) return "Email wajib diisi.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) return "Format email belum benar, contoh: nama@email.com.";
    return "";
  },
  sandi: (value) => {
    if (!value) return "Kata sandi wajib diisi.";
    if (value.length < 8) return "Kata sandi minimal 8 karakter.";
    if (!/[A-Za-z]/.test(value) || !/[0-9]/.test(value)) return "Kombinasikan huruf dan angka ya.";
    return "";
  }
};

const fieldBox = (name) => inputs[name].closest(".field");
const errorBox = (name) => document.querySelector(`.field-error[data-for="${name}"]`);

const setFieldState = (name, message) => {
  const box = fieldBox(name);
  const err = errorBox(name);
  box.classList.toggle("invalid", Boolean(message));
  box.classList.toggle("valid", !message && inputs[name].value.trim() !== "");
  err.textContent = message;
  inputs[name].setAttribute("aria-invalid", message ? "true" : "false");
};

const validateField = (name) => {
  const value = name === "sandi" ? inputs[name].value : inputs[name].value.trim();
  const message = rules[name](value);
  setFieldState(name, message);
  return !message;
};

const activeFields = () => (mode === "daftar" ? ["nama", "email", "sandi"] : ["email", "sandi"]);

const showAlert = (message, type = "error") => {
  alertBox.textContent = message;
  alertBox.className = `alert-box${type === "error" ? "" : " " + type}`;
  alertBox.hidden = false;
  if (type === "error") {
    alertBox.classList.remove("shake");
    void alertBox.offsetWidth;
    alertBox.classList.add("shake");
  }
};

const hideAlert = () => {
  alertBox.hidden = true;
};

const setLoading = (loading) => {
  tombolKirim.disabled = loading;
  tombolKirim.classList.toggle("loading", loading);
};

const setMode = (next) => {
  mode = next;
  const text = copy[next];
  judul.textContent = text.judul;
  subjudul.textContent = text.sub;
  teksKirim.textContent = text.kirim;
  teksGanti.textContent = text.ganti;
  tombolGanti.textContent = text.tombolGanti;
  grupNama.hidden = next !== "daftar";
  barisOpsi.classList.toggle("sembunyi", next === "daftar");
  loginPanel.classList.toggle("mode-daftar", next === "daftar");
  characterDesktop.src = text.imageDesktop;
  characterMobile.src = text.imageMobile;
  inputs.sandi.setAttribute("autocomplete", text.autocomplete);
  document.title = next === "daftar" ? "Daftar - Nekoyo" : "Masuk - Nekoyo";
  Object.keys(inputs).forEach((name) => {
    fieldBox(name).classList.remove("invalid", "valid");
    errorBox(name).textContent = "";
  });
  hideAlert();
};

const nextUrl = () => {
  const target = new URLSearchParams(location.search).get("next");
  return target && /^[a-z0-9_-]+\.html(\?[\w=&%-]*)?$/i.test(target) ? target : "akun.html";
};

const startSession = (user, remember) => {
  const session = { nama: user.nama, email: user.email, masuk: Date.now() };
  try {
    localStorage.removeItem(STORAGE_SESSION);
    sessionStorage.removeItem(STORAGE_SESSION);
    (remember ? localStorage : sessionStorage).setItem(STORAGE_SESSION, JSON.stringify(session));
  } catch (error) {
    return false;
  }
  const profile = readJSON(STORAGE_PROFILE_KEY, {});
  writeJSON(STORAGE_PROFILE_KEY, {
    nama: "",
    telepon: "",
    alamat: "",
    kota: "",
    kodepos: "",
    ...profile,
    nama: profile.nama || user.nama,
    email: user.email
  });
  return true;
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const finish = async (message) => {
  showAlert(message, "ok");
  await wait(900);
  location.href = nextUrl();
};

const handleDaftar = async () => {
  const users = getUsers();
  const email = inputs.email.value.trim().toLowerCase();
  if (users.some((user) => user.email === email)) {
    setFieldState("email", "Email ini sudah terdaftar. Coba masuk saja.");
    showAlert("Yah, emailnya sudah dipakai. Yuk masuk aja~");
    return;
  }
  const user = {
    nama: inputs.nama.value.trim(),
    email,
    sandi: await hashSandi(inputs.sandi.value),
    dibuat: Date.now()
  };
  if (!writeJSON(STORAGE_USERS, [...users, user])) {
    showAlert("Penyimpanan browser sedang tidak bisa dipakai. Coba matikan mode privat ya.");
    return;
  }
  if (!startSession(user, true)) {
    showAlert("Akun berhasil dibuat, tetapi sesi masuk tidak tersimpan. Coba masuk lagi.");
    return;
  }
  await finish("Yeay, akun berhasil dibuat! Mengalihkan kamu~");
};

const firstNameFromEmail = (email) => {
  const firstName = email.split("@")[0].split(/[.+_]/)[0].trim();
  return firstName ? `${firstName[0].toUpperCase()}${firstName.slice(1)}` : "Pengguna Demo";
};

const handleMasuk = async () => {
  const users = getUsers();
  const email = inputs.email.value.trim().toLowerCase();
  let user = users.find((item) => item.email === email);
  const hash = await hashSandi(inputs.sandi.value);
  let isNewUser = false;
  if (!user) {
    const nama = firstNameFromEmail(email);
    user = { nama, email, sandi: hash, dibuat: Date.now() };
    if (!writeJSON(STORAGE_USERS, [...users, user])) {
      showAlert("Penyimpanan browser sedang tidak bisa dipakai. Coba matikan mode privat ya.");
      return;
    }
    isNewUser = true;
  } else if (hash !== user.sandi) {
    setFieldState("sandi", "Kata sandi salah.");
    showAlert("Ups, kata sandinya belum cocok. Coba lagi ya~");
    inputs.sandi.focus();
    return;
  }
  if (!startSession(user, document.getElementById("ingat").checked)) {
    showAlert("Sesi masuk tidak tersimpan. Periksa penyimpanan browser lalu coba lagi.");
    return;
  }
  await finish(
    isNewUser
      ? "Akun demo berhasil dibuat! Mengalihkan kamu~"
      : `Halo lagi, ${user.nama.split(" ")[0]}! Mengalihkan kamu~`
  );
};

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  hideAlert();
  const results = activeFields().map((name) => validateField(name));
  if (results.includes(false)) {
    const firstBad = activeFields().find((name) => fieldBox(name).classList.contains("invalid"));
    if (firstBad) inputs[firstBad].focus();
    return;
  }
  setLoading(true);
  await wait(700);
  try {
    if (mode === "daftar") await handleDaftar();
    else await handleMasuk();
  } finally {
    setLoading(false);
  }
});

Object.keys(inputs).forEach((name) => {
  inputs[name].addEventListener("blur", () => {
    if (!activeFields().includes(name)) return;
    if (inputs[name].value === "" && !fieldBox(name).classList.contains("invalid")) return;
    validateField(name);
  });
  inputs[name].addEventListener("input", () => {
    hideAlert();
    if (fieldBox(name).classList.contains("invalid")) validateField(name);
  });
});

toggleSandi.addEventListener("click", () => {
  const show = inputs.sandi.type === "password";
  inputs.sandi.type = show ? "text" : "password";
  toggleSandi.firstElementChild.className = show ? "bi bi-eye-slash" : "bi bi-eye";
  toggleSandi.setAttribute("aria-label", show ? "Sembunyikan kata sandi" : "Tampilkan kata sandi");
});

tombolGanti.addEventListener("click", () => {
  setMode(mode === "masuk" ? "daftar" : "masuk");
});

document.getElementById("lupaSandi").addEventListener("click", () => {
  showAlert("Fitur atur ulang kata sandi belum tersedia di versi demo ini. Kamu bisa daftar dengan email baru.", "info");
});

const googleDemoModal = document.getElementById("googleDemoModal");
const closeGoogleDemo = document.getElementById("closeGoogleDemo");
const openGoogleDemo = () => {
  googleDemoModal.hidden = false;
  document.body.classList.add("google-demo-open");
  closeGoogleDemo.focus();
};
const hideGoogleDemo = () => {
  googleDemoModal.hidden = true;
  document.body.classList.remove("google-demo-open");
  document.getElementById("tombolGoogle").focus();
};

document.getElementById("tombolGoogle").addEventListener("click", openGoogleDemo);
closeGoogleDemo.addEventListener("click", hideGoogleDemo);
googleDemoModal.addEventListener("click", (event) => {
  if (event.target === googleDemoModal) hideGoogleDemo();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !googleDemoModal.hidden) hideGoogleDemo();
});

const sudahMasuk = () => {
  try {
    return localStorage.getItem(STORAGE_SESSION) || sessionStorage.getItem(STORAGE_SESSION);
  } catch (error) {
    return null;
  }
};

if (sudahMasuk() && new URLSearchParams(location.search).get("ganti") !== "1") {
  showAlert("Kamu sudah masuk. Mengalihkan ke akun~", "info");
  setTimeout(() => {
    location.href = nextUrl();
  }, 800);
}

if (new URLSearchParams(location.search).get("mode") === "daftar") setMode("daftar");
