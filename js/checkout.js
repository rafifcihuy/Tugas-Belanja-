const items = cartDetails();

if (!items.length) {
  window.location.replace("keranjang.html");
} else {
  document.getElementById("steps").innerHTML = renderSteps(2);

  const form = document.getElementById("checkoutForm");
  const orderItems = document.getElementById("orderItems");
  const orderSummary = document.getElementById("orderSummary");
  const submitButton = document.getElementById("submitButton");
  const submitSpinner = document.getElementById("submitSpinner");
  const submitText = document.getElementById("submitText");

  const savedProfile = readJSON("tokoku_profile", null);
  if (savedProfile) {
    ["nama", "telepon", "alamat", "kota", "kodepos"].forEach((id) => {
      const field = document.getElementById(id);
      if (field && savedProfile[id]) field.value = savedProfile[id];
    });
  }

  const subtotal = cartSubtotal();
  const discount = cartDiscount();

  const selectedShipping = () => form.querySelector('input[name="shipping"]:checked').value;

  const priceLabel = (type) => {
    const cost = shippingCost(type, subtotal);
    return cost === 0 ? '<span class="text-success fw-semibold">Gratis</span>' : formatRupiah(cost);
  };

  document.getElementById("priceReguler").innerHTML = priceLabel("reguler");
  document.getElementById("priceExpress").innerHTML = priceLabel("express");

  orderItems.innerHTML = items
    .map(
      (item) => `
      <div class="d-flex justify-content-between align-items-center mb-2">
        <div class="d-flex align-items-center gap-2">
          <img src="${item.image}" alt="${item.name}" width="48" height="48" class="rounded" style="object-fit: cover;">
          <div>
            <div class="small fw-semibold">${item.name}</div>
            <div class="small text-muted">${item.qty} x ${formatRupiah(item.price)}</div>
          </div>
        </div>
        <div class="small fw-semibold">${formatRupiah(item.price * item.qty)}</div>
      </div>`
    )
    .join("");

  const renderSummary = () => {
    const shipping = shippingCost(selectedShipping(), subtotal);
    const total = subtotal - discount + shipping;
    orderSummary.innerHTML = `
      <div class="d-flex justify-content-between mb-2"><span>Subtotal</span><span>${formatRupiah(subtotal)}</span></div>
      <div class="d-flex justify-content-between mb-2 text-success"><span>Diskon</span><span>- ${formatRupiah(discount)}</span></div>
      <div class="d-flex justify-content-between mb-2"><span>Ongkos kirim</span><span>${shipping === 0 ? "Gratis" : formatRupiah(shipping)}</span></div>
      <hr>
      <div class="d-flex justify-content-between fw-bold fs-5"><span>Total</span><span class="text-brand">${formatRupiah(total)}</span></div>`;
    return { shipping, total };
  };

  form.querySelectorAll('input[name="shipping"]').forEach((radio) => radio.addEventListener("change", renderSummary));

  renderSummary();

  const rules = {
    nama: {
      empty: "Nama penerima wajib diisi.",
      chars: /^[\p{L} .'’-]+$/u,
      charMsg: "Nama hanya boleh berisi huruf, spasi, titik, dan tanda hubung.",
      check: (value) => (value.length < 3 ? "Nama minimal 3 karakter." : "")
    },
    telepon: {
      empty: "Nomor telepon wajib diisi.",
      chars: /^[0-9]+$/,
      charMsg: "Nomor telepon hanya boleh berisi angka, tanpa spasi atau tanda hubung.",
      check: (value) => {
        if (!value.startsWith("08")) return "Nomor telepon harus diawali 08.";
        if (value.length < 10 || value.length > 13) return "Nomor telepon harus 10 sampai 13 digit.";
        return "";
      }
    },
    alamat: {
      empty: "Alamat lengkap wajib diisi.",
      check: (value) => (value.length < 10 ? "Alamat minimal 10 karakter agar kurir mudah menemukan lokasi." : "")
    },
    kota: {
      empty: "Kota wajib diisi.",
      chars: /^[\p{L} .'’-]+$/u,
      charMsg: "Nama kota hanya boleh berisi huruf.",
      check: (value) => (value.length < 3 ? "Nama kota minimal 3 karakter." : "")
    },
    kodepos: {
      empty: "Kode pos wajib diisi.",
      chars: /^[0-9]+$/,
      charMsg: "Kode pos hanya boleh berisi angka.",
      check: (value) => (value.length !== 5 ? "Kode pos harus 5 digit angka." : "")
    },
    pembayaran: {
      empty: "Pilih salah satu metode pembayaran.",
      check: () => ""
    }
  };

  const fieldIds = Object.keys(rules);
  const touched = new Set();

  const getValue = (id) => document.getElementById(id).value.trim();

  const validate = (id) => {
    const rule = rules[id];
    const value = getValue(id);
    if (!value) return rule.empty;
    if (rule.chars && !rule.chars.test(value)) return rule.charMsg;
    return rule.check(value);
  };

  const paint = (id, message) => {
    const field = document.getElementById(id);
    const feedback = field.parentElement.querySelector(".invalid-feedback");
    field.classList.toggle("is-invalid", Boolean(message));
    field.classList.toggle("is-valid", !message);
    field.setAttribute("aria-invalid", message ? "true" : "false");
    if (message && feedback) feedback.textContent = message;
  };

  const resetPaint = (id) => {
    const field = document.getElementById(id);
    field.classList.remove("is-invalid", "is-valid");
    field.removeAttribute("aria-invalid");
  };

  const onInput = (id) => {
    const rule = rules[id];
    const value = getValue(id);

    if (touched.has(id)) {
      paint(id, validate(id));
      return;
    }

    if (!value) {
      resetPaint(id);
      return;
    }

    if (rule.chars && !rule.chars.test(value)) {
      paint(id, rule.charMsg);
      return;
    }

    if (validate(id)) {
      resetPaint(id);
    } else {
      paint(id, "");
    }
  };

  const validateAll = () => {
    let firstInvalid = null;

    fieldIds.forEach((id) => {
      touched.add(id);
      const message = validate(id);
      paint(id, message);
      if (message && !firstInvalid) firstInvalid = document.getElementById(id);
    });

    if (firstInvalid) {
      firstInvalid.scrollIntoView({ behavior: "smooth", block: "center" });
      firstInvalid.focus({ preventScroll: true });
    }

    return !firstInvalid;
  };

  fieldIds.forEach((id) => {
    const field = document.getElementById(id);

    if (id === "telepon") field.setAttribute("maxlength", "13");
    if (id === "kodepos") field.setAttribute("maxlength", "5");

    if (id === "pembayaran") {
      field.addEventListener("change", () => {
        touched.add(id);
        paint(id, validate(id));
      });
      return;
    }

    field.addEventListener("input", () => onInput(id));
    field.addEventListener("blur", () => {
      touched.add(id);
      paint(id, validate(id));
    });
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!validateAll()) {
      showToast("Periksa kembali data yang belum sesuai", "danger");
      return;
    }

    submitButton.disabled = true;
    submitSpinner.classList.remove("d-none");
    submitText.textContent = "Memproses pesanan...";

    const thumbs = [...orderItems.querySelectorAll("img")];
    thumbs.forEach((thumb, index) => flyTo(thumb, submitButton, thumb.src, { delay: index * 140, bump: 1.04 }));
    const wait = 900 + thumbs.length * 140;

    const { shipping, total } = renderSummary();
    const shippingType = selectedShipping();

    const order = {
      id: `TK${Date.now().toString().slice(-8)}`,
      date: new Date().toISOString(),
      customer: {
        nama: document.getElementById("nama").value.trim(),
        telepon: document.getElementById("telepon").value.trim(),
        alamat: document.getElementById("alamat").value.trim(),
        kota: document.getElementById("kota").value.trim(),
        kodepos: document.getElementById("kodepos").value.trim()
      },
      shippingLabel: shippingType === "reguler" ? "Reguler (3 sampai 5 hari)" : "Express (1 sampai 2 hari)",
      payment: document.getElementById("pembayaran").value,
      items: items.map((item) => ({ name: item.name, qty: item.qty, price: item.price })),
      subtotal,
      discount,
      shipping,
      total
    };

    setTimeout(() => {
      writeJSON(STORAGE_ORDER, order);
      clearCart();
      window.location.href = "sukses.html";
    }, wait);
  });
}