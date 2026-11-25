/**
 * Seed local demo data for MDFK Tattoo.
 * Usage: node scripts/seedMdfk.js  (from backend/)
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Category = require('../src/models/Category');
const Product = require('../src/models/Product');
const Artist = require('../src/models/Artist');
const PortfolioItem = require('../src/models/PortfolioItem');
const StudioSettings = require('../src/models/StudioSettings');

const img = (id, w = 800) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected:', process.env.MONGO_URI?.split('@')[1]?.slice(0, 40));

  // Admin user
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@mdfk.tattoo';
  let admin = await User.findOne({ email: adminEmail });
  if (!admin) {
    admin = await User.create({
      nombre: 'Admin',
      apellido: 'MDFK',
      email: adminEmail,
      password: 'admin123', // hashed by User pre-save hook
      role: 'admin',
      telefono: '1137764237',
    });
    console.log('Admin created:', adminEmail, '/ admin123');
  } else {
    console.log('Admin exists:', adminEmail);
  }

  await StudioSettings.getSettings();

  // Categories
  const catNames = [
    { nombre: 'Piercing', descripcion: 'Piercings y joyería' },
    { nombre: 'Aftercare', descripcion: 'Cuidado post tattoo / piercing' },
    { nombre: 'Insumos estudio', descripcion: 'Material profesional' },
    { nombre: 'Merch', descripcion: 'Ropa y merchandising' },
  ];
  const cats = {};
  for (const c of catNames) {
    cats[c.nombre] = await Category.findOneAndUpdate(
      { nombre: c.nombre },
      { $set: c, isActive: true, deletedAt: null },
      { upsert: true, new: true }
    );
  }
  console.log('Categories ready');

  // Artists
  await Artist.deleteMany({});
  const artist1 = await Artist.create({
    nombre: 'MDFK',
    bio: 'Fundador del estudio. Blackwork y fine line.',
    especialidades: ['blackwork', 'fine line', 'ornamental'],
    foto: {
      url: img('photo-1590246814883-57c511e8d4a7', 400),
      publicId: 'seed/artist1',
    },
    instagram: 'mdfk.tattoo',
    weeklyAvailability: [
      { dayOfWeek: 1, startTime: '11:00', endTime: '19:00', slotMinutes: 60 },
      { dayOfWeek: 2, startTime: '11:00', endTime: '19:00', slotMinutes: 60 },
      { dayOfWeek: 3, startTime: '11:00', endTime: '19:00', slotMinutes: 60 },
      { dayOfWeek: 4, startTime: '11:00', endTime: '19:00', slotMinutes: 60 },
      { dayOfWeek: 5, startTime: '11:00', endTime: '18:00', slotMinutes: 60 },
    ],
    orden: 1,
  });
  const artist2 = await Artist.create({
    nombre: 'Guest Artist',
    bio: 'Invitado — realismo y color.',
    especialidades: ['realismo', 'color'],
    foto: {
      url: img('photo-1611501275019-9b5cda994e8d', 400),
      publicId: 'seed/artist2',
    },
    weeklyAvailability: [
      { dayOfWeek: 5, startTime: '12:00', endTime: '20:00', slotMinutes: 90 },
      { dayOfWeek: 6, startTime: '12:00', endTime: '20:00', slotMinutes: 90 },
    ],
    orden: 2,
  });
  console.log('Artists:', artist1.nombre, artist2.nombre);

  // Portfolio
  await PortfolioItem.deleteMany({});
  const portfolio = [
    { titulo: 'Serpiente ornamental', estilo: 'ornamental', artista: artist1._id, id: 'photo-1568515045052-f9a854d97bc4' },
    { titulo: 'Fine line botanical', estilo: 'fine line', artista: artist1._id, id: 'photo-1611532736597-de2d4265fba3' },
    { titulo: 'Blackwork sleeve detail', estilo: 'blackwork', artista: artist1._id, id: 'photo-1590246814883-57c511e8d4a7' },
    { titulo: 'Minimal script', estilo: 'lettering', artista: artist1._id, id: 'photo-1611501275019-9b5cda994e8d' },
    { titulo: 'Geometric forearm', estilo: 'geométrico', artista: artist2._id, id: 'photo-1610859929396-b0e6d7a8a0c3' },
    { titulo: 'Floral shoulder', estilo: 'fine line', artista: artist1._id, id: 'photo-1605497788044-5a32c707b26e' },
    { titulo: 'Japanese inspired', estilo: 'tradicional', artista: artist2._id, id: 'photo-1541346739870-05b93f1d1c6e' },
    { titulo: 'Dotwork mandala', estilo: 'dotwork', artista: artist1._id, id: 'photo-1578662996442-48f60103fc96' },
  ];
  for (let i = 0; i < portfolio.length; i++) {
    const p = portfolio[i];
    await PortfolioItem.create({
      titulo: p.titulo,
      estilo: p.estilo,
      artista: p.artista,
      destacado: i < 6,
      orden: i,
      imagen: { url: img(p.id, 900), publicId: `seed/portfolio${i}` },
    });
  }
  console.log('Portfolio items:', portfolio.length);

  // Products
  await Product.deleteMany({});
  const products = [
    {
      nombre: 'Piercing Nostril engarzado — Acero quirúrgico',
      descripcion: 'Nostril L-shape en acero quirúrgico. Hipoalergénico. Varios colores de gema.',
      precio: 4000,
      stock: 40,
      categoria: cats['Piercing']._id,
      tags: ['piercing', 'nariz', 'nostril'],
      imagenes: [{ url: img('photo-1611591437281-460bfbe1220a', 800), publicId: 'seed/p1' }],
      colores: [
        { nombre: 'Dorado', codigo: '#C9A227', habilitado: true, imagen: { url: img('photo-1611591437281-460bfbe1220a', 600), publicId: 'seed/p1g' } },
        { nombre: 'Plateado', codigo: '#C0C0C0', habilitado: true, imagen: { url: img('photo-1515562141207-7a88fb7ce338', 600), publicId: 'seed/p1s' } },
        { nombre: 'Negro', codigo: '#1a1a1a', habilitado: true, imagen: { url: img('photo-1605100804763-247f67b3557e', 600), publicId: 'seed/p1b' } },
      ],
      tallas: { habilitadas: ['6mm', '8mm'], rango: 'largo' },
    },
    {
      nombre: 'Crema anestésica tópica 10g',
      descripcion: 'Crema anestésica para uso previo a tattoo o piercing. Sin variantes de color.',
      precio: 8500,
      stock: 25,
      categoria: cats['Aftercare']._id,
      tags: ['anestesia', 'cuidado'],
      imagenes: [{ url: img('photo-1584308666744-24d5c474f2ae', 800), publicId: 'seed/p2' }],
      colores: [],
      tallas: { habilitadas: [], rango: '' },
    },
    {
      nombre: 'Aftercare ointment — Healing balm',
      descripcion: 'Bálsamo cicatrizante post tattoo. Uso diario.',
      precio: 6200,
      stock: 30,
      categoria: cats['Aftercare']._id,
      tags: ['aftercare', 'cicatrizacion'],
      imagenes: [{ url: img('photo-1556228578-0d85b1a4d571', 800), publicId: 'seed/p3' }],
      colores: [],
    },
    {
      nombre: 'Guantes nitrilo caja x100',
      descripcion: 'Guantes descartables nitrilo. Talles disponibles.',
      precio: 12000,
      stock: 15,
      categoria: cats['Insumos estudio']._id,
      tags: ['guantes', 'estudio'],
      imagenes: [{ url: img('photo-1583947215259-38e31be8751f', 800), publicId: 'seed/p4' }],
      tallas: { habilitadas: ['S', 'M', 'L', 'XL'], rango: '' },
      colores: [
        { nombre: 'Negro', codigo: '#111111', habilitado: true, imagen: { url: '', publicId: '' } },
        { nombre: 'Azul', codigo: '#3B82F6', habilitado: true, imagen: { url: '', publicId: '' } },
      ],
    },
    {
      nombre: 'Barbell curved 1.2mm',
      descripcion: 'Barbell curvo acero quirúrgico para ceja / rook / daith.',
      precio: 3500,
      stock: 50,
      categoria: cats['Piercing']._id,
      tags: ['piercing', 'barbell'],
      imagenes: [{ url: img('photo-1602751584552-8ba73aad10e1', 800), publicId: 'seed/p5' }],
      colores: [
        { nombre: 'Plateado', codigo: '#D4D4D4', habilitado: true, imagen: { url: img('photo-1602751584552-8ba73aad10e1', 600), publicId: 'seed/p5s' } },
        { nombre: 'Dorado', codigo: '#B8860B', habilitado: true, imagen: { url: img('photo-1611591437281-460bfbe1220a', 600), publicId: 'seed/p5g' } },
      ],
      tallas: { habilitadas: ['6mm', '8mm', '10mm'], rango: 'largo' },
    },
    {
      nombre: 'Remera MDFK oversized',
      descripcion: 'Merch del estudio. Algodón pesado.',
      precio: 18000,
      precioOferta: 15000,
      stock: 20,
      categoria: cats['Merch']._id,
      tags: ['merch', 'remera'],
      imagenes: [{ url: img('photo-1521572163474-6864f9cf17ab', 800), publicId: 'seed/p6' }],
      tallas: { habilitadas: ['S', 'M', 'L', 'XL'], rango: '' },
      colores: [
        { nombre: 'Negro', codigo: '#0a0a0a', habilitado: true, imagen: { url: img('photo-1521572163474-6864f9cf17ab', 600), publicId: 'seed/p6b' } },
        { nombre: 'Blanco', codigo: '#f5f5f5', habilitado: true, imagen: { url: img('photo-1583743814966-8936f5b7be1a', 600), publicId: 'seed/p6w' } },
      ],
    },
  ];

  for (const p of products) {
    await Product.create(p);
  }
  console.log('Products:', products.length);

  console.log('\n✅ Seed MDFK listo.');
  console.log('Login admin:', adminEmail, 'password: admin123 (si se creó ahora)');
  await mongoose.disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
