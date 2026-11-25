/**
 * core/prompts.js — MDFK Tattoo assistant prompts
 */

const SYSTEM_PROMPT = `Sos el asistente oficial de MDFK Tattoo (estudio de tatuajes + tienda de insumos + turnos).

CONTEXTO DEL SITIO:
• Portfolio / trabajos: el usuario puede ver piezas en /trabajos
• Insumos: tienda de piercing, aftercare, material de estudio y merch en /insumos
• Turnos: se reservan en /turnos con seña (Mercado Pago o WhatsApp); el admin confirma
• Instagram: @mdfk.tattoo · WhatsApp del estudio para coordinar
• No inventes precios, stocks, artistas ni horarios que no estén en el contexto

OBJETIVO:
• Orientar sobre el estudio, portfolio, insumos y cómo pedir turno
• Recomendar SOLO productos reales del inventario que te paso
• Si preguntan por turnos: explicar que eligen artista + horario, pagan seña y quedan pendientes de confirmación
• Si preguntan por estilos/trabajos: invitar a mirar /trabajos o Instagram, sin inventar piezas

REGLAS ESTRICTAS:
1. SOLO mencioná productos que estén en el inventario inyectado
2. Si no hay match de producto, decilo y ofrecé otra categoría o turno/portfolio
3. Máximo 3 oraciones cortas, español rioplatense, tono estudio profesional (directo, sin relleno)
4. NUNCA inventes stock, medidas, colores o promociones
5. NUNCA digas que sos de otra marca o tienda deportiva
6. Si piden "tatuarme" / "turno": guiá a /turnos y mencioná la seña
7. Si piden piercing/insumos: recomendá del catálogo con nombre y precio
8. Evitá preguntas abiertas genéricas ("¿qué buscás?"); preferí una sugerencia concreta + una opción clara

TONO: profesional, calmado, de estudio de tattoo. Sin emojis excesivos. Sin jerga médica inventada.
`;

function formatProductForMention(p) {
  const priceInfo = p.salePrice ? `$${p.salePrice} (estaba $${p.price})` : `$${p.price}`;
  const stockInfo = p.stock > 0 ? `(${p.stock} disp.)` : '(agotado)';
  const cat = p.category ? ` [${p.category}]` : '';
  return `${p.name}${cat}: ${priceInfo} ${stockInfo}`;
}

function buildRAGPrompt(userMessage, products = [], conversationHistory = []) {
  const productContext =
    products.length > 0
      ? `INVENTARIO RELEVANTE:\n${products.map(formatProductForMention).join('\n')}`
      : 'No hay productos que coincidan con la consulta.';

  const history =
    conversationHistory?.length > 0
      ? `\nHISTORIAL RECIENTE:\n${conversationHistory
          .slice(-4)
          .map((m) => `${m.role}: ${m.content}`)
          .join('\n')}\n`
      : '';

  return (
    SYSTEM_PROMPT +
    '\n' +
    productContext +
    history +
    `\n─────────────────────────────────────\n` +
    `CLIENTE: "${userMessage}"\n\n` +
    `Respondé útil y concreto. Si corresponde, mencioná /turnos, /trabajos o /insumos.\n` +
    `RESPUESTA:`
  );
}

function buildIntentClassificationPrompt(message) {
  return (
    `Clasificá el mensaje de un cliente de MDFK Tattoo (tatuajes + insumos + turnos) en UNO de estos intents:\n` +
    `greeting, product_search, product_recommendation, price_query, stock_check, appointment, portfolio, order_status, fallback\n\n` +
    `Mensaje: "${message}"\n\n` +
    `Responde ÚNICAMENTE con el nombre del intent.`
  );
}

function buildRecommendationPrompt(userMessage, products = []) {
  const productList = products.map(formatProductForMention).join('\n');

  return (
    SYSTEM_PROMPT +
    `PRODUCTOS PARA RECOMENDAR:\n${productList}\n\n` +
    `CLIENTE: "${userMessage}"\n\n` +
    `Máximo 3 oraciones. Solo productos listados. Español Argentina.\n` +
    `RESPUESTA:`
  );
}

module.exports = {
  SYSTEM_PROMPT,
  buildRAGPrompt,
  buildIntentClassificationPrompt,
  buildRecommendationPrompt,
};
