export const generateWhatsAppLink = (items, total, phone) => {
  const number = phone || import.meta.env.VITE_WHATSAPP_NUMBER || '5491100000000';
  const itemsList = items
    .map((i) => {
      const price = i.producto?.precioOferta || i.producto?.precio || i.precio;
      let itemText = `• ${i.producto?.nombre || i.nombre} x${i.cantidad}`;
      if (i.talla) itemText += ` - Talla: ${i.talla}`;
      if (i.color) itemText += ` - Color: ${i.color}`;
      itemText += ` = $${(price * i.cantidad).toFixed(2)}`;
      return itemText;
    })
    .join('\n');

  const message = encodeURIComponent(
    `🛍️ *Pedido MDFK Tattoo — Insumos*\n\n${itemsList}\n\n*Total: $${Number(total).toLocaleString('es-AR')}*\n\nQuiero coordinar este pedido.`
  );

  return `https://wa.me/${number}?text=${message}`;
};

export const generateOrderWhatsAppLink = (order, phone) => {
  const number = phone || import.meta.env.VITE_WHATSAPP_NUMBER || '5491137764237';
  const itemsList = (order.items || [])
    .map((item) => {
      let line = `• ${item.nombre} x${item.cantidad}`;
      if (item.talla) line += ` — Talla: ${item.talla}`;
      if (item.color) line += ` — Color: ${item.color}`;
      return line;
    })
    .join('\n');

  const total = Number(order.total || 0).toLocaleString('es-AR');
  const message = encodeURIComponent(
    `Hola, ya pagué por Mercado Pago.\n\n*Pedido ${order.codigo}*\n${itemsList}\n\n*Total: $${total}*\n\nQuiero coordinar la entrega.`
  );

  return `https://wa.me/${number}?text=${message}`;
};
