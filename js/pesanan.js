const STORAGE_ORDERS = "tokoku_orders";

const TRACK_STAGES = [
  { title: "Pesanan dibuat", desc: "Pesanan Anda sudah kami terima.", icon: "bi-receipt", offset: 0 },
  { title: "Pesanan dikonfirmasi", desc: "Data pesanan dan pembayaran sudah diverifikasi.", icon: "bi-patch-check", offset: 60000 },
  { title: "Sedang dikemas", desc: "Penjual sedang menyiapkan dan mengemas barang.", icon: "bi-box-seam", offset: 180000 },
  { title: "Diserahkan ke kurir", desc: "Paket sudah diterima kurir dan nomor resi terbit.", icon: "bi-person-check", offset: 360000 },
  { title: "Dalam perjalanan", desc: "Paket sedang dibawa menuju alamat Anda.", icon: "bi-truck", offset: 600000 },
  { title: "Tiba di tujuan", desc: "Paket sudah sampai. Terima kasih sudah berbelanja.", icon: "bi-house-check", offset: 900000 }
];

const KURIR_STAGE_INDEX = 3;

const getOrders = () => readJSON(STORAGE_ORDERS, []);

const saveOrders = (orders) => writeJSON(STORAGE_ORDERS, orders);

const simpanRiwayat = (order) => {
  if (!order) return;
  const orders = getOrders();
  if (orders.some((item) => item.id === order.id)) return;
  orders.unshift({ ...order, shift: 0 });
  saveOrders(orders);
};

const syncLastOrder = () => simpanRiwayat(readJSON(STORAGE_ORDER, null));

const currentStageIndex = (order) => {
  const elapsed = Date.now() - new Date(order.date).getTime() + (order.shift || 0);
  let index = 0;
  TRACK_STAGES.forEach((stage, i) => {
    if (elapsed >= stage.offset) index = i;
  });
  return index;
};

const stageTime = (order, index) => {
  const start = new Date(order.date).getTime();
  return Math.max(start, start + TRACK_STAGES[index].offset - (order.shift || 0));
};

const skipStage = (id) => {
  const orders = getOrders();
  const order = orders.find((item) => item.id === id);
  if (!order) return;
  const index = currentStageIndex(order);
  if (index >= TRACK_STAGES.length - 1) return;
  order.shift = TRACK_STAGES[index + 1].offset - (Date.now() - new Date(order.date).getTime());
  saveOrders(orders);
};

const resetStage = (id) => {
  const orders = getOrders();
  const order = orders.find((item) => item.id === id);
  if (!order) return;
  order.shift = -(Date.now() - new Date(order.date).getTime());
  saveOrders(orders);
};