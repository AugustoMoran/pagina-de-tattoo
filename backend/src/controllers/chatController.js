/**
 * Chat controller — MDFK Tattoo (AI-first orientation)
 *
 * Flow:
 *  1. Build live studio context (artists, styles, products, seña, WhatsApp)
 *  2. Ask Gemini to interpret the user and orient them
 *  3. Optionally attach product cards / action links from AI intent
 *  4. Heuristic fallbacks only if AI is down
 */

const Product = require('../models/Product');
const Artist = require('../models/Artist');
const PortfolioItem = require('../models/PortfolioItem');
const StudioSettings = require('../models/StudioSettings');
const { fuzzyMatch } = require('../../ai-ecommerce-engine/utils/fuzzyMatch');
const gemini = require('../../ai-ecommerce-engine/providers/gemini');
const {
  createAIEngine,
  createRecommendationPlugin,
  createAnalyticsPlugin,
} = require('../../ai-ecommerce-engine');

const analyticsPlugin = createAnalyticsPlugin({
  onEvent: process.env.NODE_ENV === 'development' ? async () => {} : null,
});
const recommendationPlugin = createRecommendationPlugin({
  maxRecommendations: 4,
  priceTolerancePercent: 35,
  productPoolSize: 30,
});

const engine = createAIEngine({
  mode: process.env.AI_ENGINE_MODE || 'balanced',
  provider: process.env.AI_PROVIDER || 'gemini',
  fallbackProvider: process.env.AI_FALLBACK || 'groq',
  fallbackEnabled: Boolean(process.env.AI_FALLBACK || process.env.GROQ_API_KEY),
  useCache: false,
  maxProducts: 5,
  maxAIRequestsPerMinute: Number(process.env.AI_RPM) || 40,
  geminiApiKey: process.env.GEMINI_API_KEY,
  groqApiKey: process.env.GROQ_API_KEY,
  openaiApiKey: process.env.OPENAI_API_KEY,
  plugins: [recommendationPlugin, analyticsPlugin],
});

function sa(str) {
  return String(str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function toOut(p) {
  const id = String(p._id || p.id || '').trim();
  const name = String(p.nombre || p.name || '').trim();
  const price = Number(p.precioOferta || p.precio || p.price || 0) || 0;
  const image = (p.imagenes && p.imagenes[0] && p.imagenes[0].url) || p.image || '';
  return { id, name, price, image, url: id ? `/insumos/${id}` : '' };
}

function buildDependencies() {
  const getProducts = async (query, opts = {}) => {
    const limit = Math.min(opts.limit || 10, 50);
    if (!query || !String(query).trim()) {
      return Product.find({ isActive: true, deletedAt: null })
        .select('_id nombre descripcion precio precioOferta stock imagenes tags')
        .populate('categoria', 'nombre')
        .limit(limit)
        .lean();
    }

    const stop = new Set([
      'que', 'los', 'las', 'una', 'uno', 'para', 'por', 'con', 'del', 'algo', 'este', 'esta',
      'como', 'tiene', 'tienen', 'hacen', 'haces', 'quiero', 'busco', 'tengo', 'me', 'el', 'la',
      'de', 'un', 'mi', 'tu', 'se', 'en', 'al', 'lo', 'ya', 'si', 'no', 'mas', 'muy',
    ]);

    const rawTerms = sa(query)
      .split(/\s+/)
      .filter((t) => t.length >= 3 && !stop.has(t));

    // Alias slang → catalog terms
    const aliases = {
      arito: 'piercing', aritos: 'piercing', aro: 'piercing', aros: 'piercing',
      lengua: 'piercing', dermal: 'piercing', dermicos: 'piercing',
      anestesia: 'crema', anestesica: 'crema',
    };
    const expanded = [];
    for (const t of rawTerms) {
      expanded.push(t);
      if (aliases[t]) expanded.push(aliases[t]);
    }

    let all = await Product.find({ isActive: true, deletedAt: null })
      .select('_id nombre descripcion precio precioOferta stock imagenes tags')
      .populate('categoria', 'nombre')
      .lean();

    const nameWords = [
      ...new Set(all.flatMap((p) => sa(p.nombre).split(/\s+/).filter((w) => w.length >= 4))),
    ];
    const terms = [
      ...new Set(
        expanded.flatMap((term) => {
          const fuzzy = fuzzyMatch(term, nameWords, 0.82);
          return [term, ...fuzzy];
        })
      ),
    ];

    return all
      .filter((p) => {
        const hay = [
          sa(p.nombre),
          sa(p.descripcion || ''),
          sa(p.categoria?.nombre || ''),
          ...(p.tags || []).map((t) => sa(t)),
        ].join(' ');
        return terms.some((t) => t.length >= 3 && hay.includes(t));
      })
      .slice(0, limit);
  };

  return {
    getProducts,
    getProductById: async (id) =>
      Product.findOne({ _id: id, isActive: true, deletedAt: null }).populate('categoria', 'nombre').lean(),
    searchProductsSemantic: (q, o) => getProducts(q, o),
    getAvailableProducts: async (limit = 40) => {
      const products = await Product.find({ isActive: true, deletedAt: null })
        .select('_id nombre precio precioOferta stock tags')
        .populate('categoria', 'nombre')
        .limit(limit)
        .lean();
      return products.map((p) => ({
        id: p._id,
        nombre: p.nombre,
        precio: p.precioOferta || p.precio,
        stock: p.stock,
        tags: p.tags || [],
        categoria: p.categoria?.nombre,
      }));
    },
  };
}

async function buildStudioContext() {
  const [artists, styles, products, settings, portfolioCount] = await Promise.all([
    Artist.find({ isActive: true }).select('nombre especialidades bio').lean(),
    PortfolioItem.distinct('estilo', { isActive: true, estilo: { $ne: '' } }),
    Product.find({ isActive: true, deletedAt: null })
      .select('nombre precio precioOferta stock tags categoria')
      .populate('categoria', 'nombre')
      .limit(40)
      .lean(),
    StudioSettings.getSettings(),
    PortfolioItem.countDocuments({ isActive: true }),
  ]);

  const artistLines = artists.length
    ? artists
        .map(
          (a) =>
            `- ${a.nombre}${a.especialidades?.length ? ` (${a.especialidades.join(', ')})` : ''}`
        )
        .join('\n')
    : '- (sin artistas cargados aún)';

  const productLines = products
    .slice(0, 25)
    .map((p) => {
      const price = p.precioOferta || p.precio;
      const cat = p.categoria?.nombre || 'general';
      return `- ${p.nombre} | $${price} | stock ${p.stock} | cat: ${cat}`;
    })
    .join('\n');

  return {
    settings,
    artists,
    text: `
ESTUDIO: ${settings.nombreEstudio || 'MDFK Tattoo'}
INSTAGRAM: ${settings.instagram || 'https://instagram.com/mdfk.tattoo'}
WHATSAPP: ${settings.whatsappNumero || process.env.WHATSAPP_NUMBER || '5491137764237'}
DIRECCIÓN: ${settings.direccion || 'consultar por WhatsApp'}
SEÑA TURNO: $${settings.montoSenia ?? 10000} (Mercado Pago o WhatsApp; queda pendiente de confirmación del admin)

SERVICIOS:
- Tatuajes (varios estilos). Reserva en /turnos con seña.
- Piercing convencional (nariz, oreja, etc.). Reserva turno.
- Venta de insumos: piercing/joyería, aftercare, material, merch en /insumos.
- Portfolio de trabajos en /trabajos (${portfolioCount} piezas).

NO afirmes que hacen procedimientos extremos (ej. tongue split / cortar lengua a la mitad, scarification, implants raros) salvo que el usuario solo pregunte y vos orientes a consultar por WhatsApp porque se evalúa caso por caso. Preferí honestidad: si no está claro, derivá a WhatsApp o turno.

ARTISTAS:
${artistLines}

ESTILOS EN PORTFOLIO: ${styles.filter(Boolean).join(', ') || 'varios (blackwork, fine line, realismo, etc.)'}

INSUMOS (inventario real — no inventes otros):
${productLines || '- (sin productos)'}
`.trim(),
  };
}

function buildOrientationPrompt(userMessage, studioContext, history = []) {
  const hist =
    history.length > 0
      ? history
          .slice(-6)
          .map((m) => `${m.role === 'user' ? 'USER' : 'ASISTENTE'}: ${m.content || m.text || ''}`)
          .join('\n')
      : '(sin historial)';

  return `Sos el asistente de orientación de MDFK Tattoo (estudio en Argentina).
Tu trabajo NO es solo vender: es ENTENDER lo que la persona quiere y ORIENTARLA con claridad (turno, piercing, portfolio, insumos o WhatsApp).

${studioContext}

HISTORIAL:
${hist}

MENSAJE DEL USUARIO:
"${userMessage}"

REGLAS:
1. Español rioplatense, tono de estudio: directo, calmo, sin dramatizar.
2. Interpretá jerga e intención (ej. "tatuarme el culo" = tatuaje en glúteo → turno; "dermal" = piercing dérmico → turno/consulta; "cortan la lengua a la mitad" = tongue split → no lo trates como joya de piercing, orientá a WhatsApp/consulta; "quiero hablar con alguien" → WhatsApp).
3. No inventes stock, precios ni que hacen un servicio extremo si no está en el contexto.
4. Máximo 3 oraciones útiles. Orientá al siguiente paso concreto.
5. Respondé SOLO en este formato exacto (sin markdown extra):

TEXT: <respuesta al usuario>
INTENT: <turnos|portfolio|insumos|contacto|info|servicio>
PRODUCTS: <none|piercing|aftercare|merch|insumos|nombre corto de búsqueda o none>
LINKS: <turnos,trabajos,insumos,whatsapp — lista separada por comas, solo los útiles>
`;
}

function parseAIOrientation(raw) {
  const text =
    (raw.match(/TEXT:\s*([\s\S]*?)(?=\nINTENT:|$)/i) || [])[1]?.trim() ||
    raw.replace(/INTENT:[\s\S]*/i, '').trim();
  const intent = ((raw.match(/INTENT:\s*(\w+)/i) || [])[1] || 'info').toLowerCase();
  const products = ((raw.match(/PRODUCTS:\s*([^\n]+)/i) || [])[1] || 'none').trim().toLowerCase();
  const linksRaw = ((raw.match(/LINKS:\s*([^\n]+)/i) || [])[1] || '').toLowerCase();

  return {
    text: text || raw.slice(0, 280),
    intent,
    productQuery: !products || products === 'none' || products === 'no' ? null : products,
    links: linksRaw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  };
}

function linksToActions(links, settings) {
  const wa = settings?.whatsappNumero || process.env.WHATSAPP_NUMBER || '5491137764237';
  const map = {
    turnos: { type: 'link', label: 'Reservar turno', href: '/turnos' },
    trabajos: { type: 'link', label: 'Ver trabajos', href: '/trabajos' },
    portfolio: { type: 'link', label: 'Ver trabajos', href: '/trabajos' },
    insumos: { type: 'link', label: 'Ver insumos', href: '/insumos' },
    whatsapp: {
      type: 'link',
      label: 'WhatsApp',
      href: `https://wa.me/${wa}?text=${encodeURIComponent('Hola! Quiero consultar con MDFK Tattoo.')}`,
    },
    contacto: {
      type: 'link',
      label: 'WhatsApp',
      href: `https://wa.me/${wa}?text=${encodeURIComponent('Hola! Quiero hablar con alguien del estudio.')}`,
    },
  };
  const actions = [];
  const seen = new Set();
  for (const l of links) {
    const a = map[l];
    if (a && !seen.has(a.href)) {
      seen.add(a.href);
      actions.push(a);
    }
  }
  return actions;
}

/** Cheap heuristic only when AI is unavailable */
function heuristicFallback(msg, settings) {
  const n = sa(msg);
  const wa = settings?.whatsappNumero || process.env.WHATSAPP_NUMBER || '5491137764237';
  const waLink = `https://wa.me/${wa}?text=${encodeURIComponent('Hola! Quiero consultar con MDFK Tattoo.')}`;

  if (/\b(hablar|alguien|persona|humano|asesor|consultar|whatsapp|llamar)\b/i.test(n)) {
    return {
      text: 'Dale, escribinos por WhatsApp y te atiende alguien del estudio.',
      intent: 'contacto',
      actions: [{ type: 'link', label: 'WhatsApp', href: waLink }],
      products: [],
    };
  }

  if (/\b(tongue.?split|bifida|partir|cort(ar|an|o).+lengua|lengua a la mitad)\b/i.test(n)) {
    return {
      text: 'Eso es una modificación especial (tongue split). No lo resolvemos por chat: consultá por WhatsApp y te dicen si lo trabajan y bajo qué condiciones.',
      intent: 'servicio',
      actions: [
        { type: 'link', label: 'WhatsApp', href: waLink },
        { type: 'link', label: 'Reservar turno', href: '/turnos' },
      ],
      products: [],
    };
  }

  if (/\b(dermal|dermico|microdermal|surface)\b/i.test(n)) {
    return {
      text: 'Los dérmicos se evalúan en persona (zona, cicatrización, joya). Reservá turno o escribinos por WhatsApp y lo vemos.',
      intent: 'servicio',
      actions: [
        { type: 'link', label: 'Reservar turno', href: '/turnos' },
        { type: 'link', label: 'WhatsApp', href: waLink },
      ],
      products: [],
    };
  }

  if (/\b(tatuar|tatuarme|tatuaje|tattoo|espalda|brazo|pierna|culo|gluteo|pecho)\b/i.test(n)) {
    return {
      text: 'Para tatuarte, reservá turno en /turnos (seña por MP o WhatsApp), llevá referencias y el artista te orienta.',
      intent: 'turnos',
      actions: [
        { type: 'link', label: 'Reservar turno', href: '/turnos' },
        { type: 'link', label: 'Ver trabajos', href: '/trabajos' },
      ],
      products: [],
    };
  }

  return {
    text: 'Contame un poco más: ¿turno para tattoo/piercing, ver trabajos, o un insumo de la tienda? También podés escribir por WhatsApp.',
    intent: 'info',
    actions: [
      { type: 'link', label: 'Reservar turno', href: '/turnos' },
      { type: 'link', label: 'Ver trabajos', href: '/trabajos' },
      { type: 'link', label: 'WhatsApp', href: waLink },
    ],
    products: [],
  };
}

async function handleChat(req, res) {
  const { message, history, conversationHistory } = req.body;

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({ error: 'El campo "message" es requerido.' });
  }

  const msg = message.trim();
  const dependencies = buildDependencies();
  const hist = Array.isArray(conversationHistory)
    ? conversationHistory
    : Array.isArray(history)
      ? history
      : [];

  try {
    const { text: studioContext, settings } = await buildStudioContext();
    const prompt = buildOrientationPrompt(msg, studioContext, hist);

    let oriented;
    try {
      if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY missing');
      const raw = await gemini.generateResponse(prompt, {}, process.env.GEMINI_API_KEY);
      oriented = parseAIOrientation(raw);
      console.log('[chat AI]', { intent: oriented.intent, products: oriented.productQuery, links: oriented.links });
    } catch (aiErr) {
      console.error('[chat AI failed]', aiErr.message);
      oriented = heuristicFallback(msg, settings);
      return res.json(oriented);
    }

    // Attach products only when AI says so AND query is shop-like (never for tongue-split etc.)
    let products = [];
    const blockedProductIntents = /tongue|split|partir|cortar|hablar|whatsapp|turno|tatu/;
    if (
      oriented.productQuery &&
      !blockedProductIntents.test(sa(oriented.productQuery + ' ' + msg)) &&
      !/\b(cort(ar|an)|partir|mitad|tongue.?split|hablar con)\b/i.test(msg)
    ) {
      const found = await dependencies.getProducts(oriented.productQuery, { limit: 4 });
      products = found.map(toOut);
    }

    let actions = linksToActions(oriented.links, settings);
    if (products.length) {
      actions = [
        ...products.map((p) => ({ type: 'view_product', label: `Ver ${p.name}`, url: p.url })),
        ...actions,
      ];
    }
    if (actions.length === 0) {
      actions = linksToActions(['turnos', 'trabajos', 'whatsapp'], settings);
    }

    // Soften empty/generic AI text
    let text = oriented.text;
    if (!text || /contame qu[eé] busc[aá]s/i.test(text)) {
      text = heuristicFallback(msg, settings).text;
    }

    return res.json({
      text,
      intent: oriented.intent || 'ai',
      products,
      actions: actions.slice(0, 6),
    });
  } catch (err) {
    console.error('[chat]', err.message);
    return res.status(500).json({
      text: 'Hubo un problema. Escribinos por WhatsApp y te ayudamos.',
      products: [],
      intent: 'error',
      actions: [
        {
          type: 'link',
          label: 'WhatsApp',
          href: `https://wa.me/${process.env.WHATSAPP_NUMBER || '5491137764237'}`,
        },
      ],
    });
  }
}

function getChatStats(req, res) {
  res.json(engine.getStats());
}
function getChatAnalytics(req, res) {
  res.json(analyticsPlugin.getReport());
}
function clearChatCache(req, res) {
  engine.clearCache();
  res.json({ message: 'Cache del chat limpiado correctamente.' });
}

module.exports = {
  handleChat,
  getChatStats,
  getChatAnalytics,
  clearChatCache,
};
