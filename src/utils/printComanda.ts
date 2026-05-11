import { DbOrder } from "@/contexts/OrderContext";

const deliveryLabels: Record<string, string> = {
  entrega: "ENTREGA",
  retirada: "RETIRADA",
  local: "NO LOCAL",
};

const deliveryIcons: Record<string, string> = {
  entrega: "🚗",
  retirada: "🏪",
  local: "🍽️",
};

const paymentLabels: Record<string, string> = {
  dinheiro: "Dinheiro",
  pix: "PIX",
  cartao_credito: "Crédito",
  cartao_debito: "Débito",
  "": "—",
};

export function printComanda(order: DbOrder, type: "cozinha" | "entrega" | "completo" = "cozinha", printWidth: "58mm" | "80mm" = "58mm") {
  const isCozinha = type === "cozinha";
  const isCompleto = type === "completo";
  
  const date = new Date(order.created_at).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
  });
  const now = new Date().toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit",
  });
  const fmt = (v: number) => `R$${v.toFixed(2).replace(".", ",")}`;

  const W = printWidth === "80mm" ? 48 : 32;

  function line(ch: string) {
    return ch.repeat(W);
  }

  function pad(left: string, right: string) {
    const gap = W - left.length - right.length;
    return left + (gap > 0 ? " ".repeat(gap) : " ") + right;
  }

  // Items block
  const itemLines = order.items.map((item) => {
    const qty = `${item.quantity}x`;
    const nameLimit = printWidth === "80mm" ? 32 : 18;
    const name = item.product_name.length > nameLimit ? item.product_name.substring(0, nameLimit) : item.product_name;
    const price = fmt(item.price * item.quantity);
    let html = `<tr><td class="qty">${qty}</td><td class="name">${name}</td><td class="price">${price}</td></tr>`;
    if (item.addons.length > 0) {
      html += `<tr><td></td><td colspan="2" class="addon">+ ${item.addons.join(", ")}</td></tr>`;
    }
    if (item.notes) {
      html += `<tr><td></td><td colspan="2" class="addon">* ${item.notes}</td></tr>`;
    }
    return html;
  }).join("");

  const customerBlock = (type === "entrega" || isCompleto) ? `
    <div class="sep">${line("─")}</div>
    <div class="section-label">CLIENTE</div>
    <div class="info-row"><b>${order.customer_name}</b></div>
    ${order.customer_phone ? `<div class="info-row">📞 ${order.customer_phone}</div>` : ""}
    ${order.address ? `<div class="info-row">📍 ${order.address}</div>` : ""}
    <div class="sep">${line("─")}</div>
    <div class="section-label">PAGAMENTO</div>
    <div class="info-row">💳 ${paymentLabels[order.payment] || order.payment || "—"}</div>
    ${order.change_for ? `<div class="info-row">💵 Troco p/ ${fmt(order.change_for)}</div>` : ""}
  ` : "";

  // Observations block - only show if exists
  const obsBlock = order.notes ? `
    <div class="sep">${line("─")}</div>
    <div class="section-label">OBSERVAÇÕES DO CLIENTE</div>
    <div class="obs">⚠️ ${order.notes}</div>
  ` : "";

  // Receipt block at the end (Proof of order)
  const receiptProof = `
    <div class="sep-bold"></div>
    <div class="center small bold">COMPROVANTE DE PEDIDO</div>
    <div class="info-row small">${pad("Pedido:", "#" + order.number)}</div>
    <div class="info-row small">${pad("Data:", date)}</div>
    <div class="info-row small">${pad("Status:", order.status.toUpperCase().replace("_", " "))}</div>
    <div class="center footer">Obrigado pela preferência!</div>
  `;

  let headerLabel = "★ COZINHA ★";
  if (type === "entrega") headerLabel = "★ ENTREGA ★";
  if (isCompleto) headerLabel = "★ PEDIDO COMPLETO ★";

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Pedido #${order.number}</title>
<style>
  @page { margin: 0; size: ${printWidth} auto; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Courier New', 'Lucida Console', 'Consolas', monospace;
    font-size: ${printWidth === "80mm" ? "14px" : "12px"};
    line-height: 1.35;
    width: ${printWidth};
    max-width: ${printWidth};
    margin: 0 auto;
    padding: 2mm 1.5mm;
    color: #000;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .center { text-align: center; }
  .bold { font-weight: bold; }
  .small { font-size: 10px; }
  .header-type {
    font-size: ${printWidth === "80mm" ? "18px" : "14px"};
    font-weight: 900;
    letter-spacing: 1px;
    padding: 2px 0;
    border-top: 2px solid #000;
    border-bottom: 2px solid #000;
    margin-bottom: 3px;
  }
  .order-num {
    font-size: ${printWidth === "80mm" ? "36px" : "28px"};
    font-weight: 900;
    line-height: 1.1;
  }
  .delivery-badge {
    display: inline-block;
    border: 1px solid #000;
    padding: 1px 6px;
    font-size: 11px;
    font-weight: 900;
    margin: 2px 0;
  }
  .meta { font-size: 10px; color: #333; }
  .sep { font-size: 10px; color: #666; overflow: hidden; margin: 1px 0; letter-spacing: -1px; }
  .sep-bold { border-top: 2px solid #000; margin: 3px 0; }
  .section-label { font-size: 10px; font-weight: 900; letter-spacing: 1px; margin: 1px 0; }
  table { width: 100%; border-collapse: collapse; }
  td { vertical-align: top; padding: 1px 0; }
  .qty { width: 22px; font-weight: 900; font-size: 13px; }
  .name { font-size: 12px; font-weight: 700; }
  .price { text-align: right; font-size: 11px; white-space: nowrap; }
  .addon { font-size: 9px; color: #444; padding-left: 4px; }
  .total-box {
    border: 2px solid #000;
    padding: 3px 4px;
    margin: 3px 0;
    font-size: 16px;
    font-weight: 900;
    text-align: center;
  }
  .obs {
    font-size: 12px;
    font-weight: bold;
    padding: 4px;
    border: 1px dashed #000;
    margin: 2px 0;
    background-color: #f0f0f0;
  }
  .info-row { font-size: 11px; line-height: 1.3; }
  .footer { font-size: 8px; color: #666; margin-top: 3px; }
  .cut-line { border-bottom: 1px dashed #999; margin: 6px 0 2px; }
</style></head><body>

  <div class="center header-type">${headerLabel}</div>

  <div class="center order-num">#${order.number}</div>
  <div class="center"><span class="delivery-badge">${deliveryIcons[order.delivery_type] || ""} ${deliveryLabels[order.delivery_type] || order.delivery_type}</span></div>
  <div class="center meta">${date}${isCozinha ? ` • ${order.customer_name}` : ""}</div>

  <div class="sep-bold"></div>
  <div class="section-label">ITENS</div>
  <table>${itemLines}</table>

  <div class="total-box">${pad("TOTAL", fmt(order.total))}</div>

  ${obsBlock}

  ${customerBlock}

  ${receiptProof}

  <div class="cut-line"></div>
  <div class="center footer">LucenaDelivery • ${now}</div>
  <div style="height:8mm"></div>

</body></html>`;

  const w = window.open("", "_blank", "width=250,height=600");
  if (!w) return;
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => { w.print(); w.close(); }, 300);
}

export function shareComandaWhatsApp(order: DbOrder, phone?: string) {
  const fmt = (v: number) => `R$${v.toFixed(2).replace(".", ",")}`;
  const date = new Date(order.created_at).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
  });
  const dt = deliveryLabels[order.delivery_type] || order.delivery_type;

  const items = order.items.map((item) => {
    let l = `  ${item.quantity}x ${item.product_name} — ${fmt(item.price * item.quantity)}`;
    if (item.addons.length > 0) l += `\n     + ${item.addons.join(", ")}`;
    if (item.notes) l += `\n     📝 ${item.notes}`;
    return l;
  }).join("\n");

  let msg = `📋 *COMANDA #${order.number}*\n`;
  msg += `📅 ${date} • ${dt}\n`;
  msg += `━━━━━━━━━━━━━━━\n`;
  msg += `👤 *${order.customer_name}*\n`;
  if (order.customer_phone) msg += `📞 ${order.customer_phone}\n`;
  if (order.address) {
    const mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(order.address)}`;
    msg += `📍 ${order.address}\n🗺️ ${mapsUrl}\n`;
  }
  msg += `━━━━━━━━━━━━━━━\n`;
  msg += `🍽️ *ITENS:*\n${items}\n`;
  msg += `━━━━━━━━━━━━━━━\n`;
  msg += `💰 *TOTAL: ${fmt(order.total)}*\n`;
  if (order.payment) msg += `💳 ${paymentLabels[order.payment] || order.payment}\n`;
  if (order.change_for) msg += `💵 Troco para: ${fmt(order.change_for)}\n`;
  if (order.notes) msg += `\n⚠️ *Obs:* ${order.notes}\n`;

  const encoded = encodeURIComponent(msg);
  const cleanPhone = phone ? phone.replace(/\D/g, "") : "";
  const url = cleanPhone
    ? `https://wa.me/${cleanPhone.startsWith("55") ? cleanPhone : "55" + cleanPhone}?text=${encoded}`
    : `https://wa.me/?text=${encoded}`;

  window.open(url, "_blank");
}
