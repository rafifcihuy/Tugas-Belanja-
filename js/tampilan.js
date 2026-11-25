const temaSwitch = document.getElementById("temaSwitch");
const temaStatus = document.getElementById("temaStatus");
const temaIcon = document.getElementById("temaIcon");

const renderTemaSwitch = () => {
  const dark = currentTheme() === "dark";
  temaSwitch.checked = dark;
  temaSwitch.setAttribute("aria-checked", String(dark));
  temaStatus.textContent = dark ? "Aktif" : "Nonaktif";
  temaIcon.className = `bi ${dark ? "bi-moon-stars-fill" : "bi-sun-fill"}`;
};

temaSwitch.addEventListener("change", () => {
  applyTheme(temaSwitch.checked ? "dark" : "light");
  renderTemaSwitch();
});

renderTemaSwitch();
