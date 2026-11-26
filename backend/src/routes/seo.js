const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Category = require('../models/Category');

router.get('/sitemap.xml', async (req, res) => {
  try {
    const products = await Product.find({ isActive: true, deletedAt: null }).select('_id updatedAt');
    const categories = await Category.find().select('_id');

    const baseUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');

    let xml = '<?xml version="1.0" encoding="UTF-8"?>';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';

    const staticPaths = [
      { path: '/', priority: '1.0', changefreq: 'daily' },
      { path: '/trabajos', priority: '0.9', changefreq: 'weekly' },
      { path: '/insumos', priority: '0.9', changefreq: 'daily' },
      { path: '/turnos', priority: '0.8', changefreq: 'weekly' },
    ];

    for (const page of staticPaths) {
      xml += `
      <url>
        <loc>${baseUrl}${page.path}</loc>
        <changefreq>${page.changefreq}</changefreq>
        <priority>${page.priority}</priority>
      </url>`;
    }

    categories.forEach((cat) => {
      xml += `
        <url>
          <loc>${baseUrl}/insumos?categoria=${cat._id}</loc>
          <changefreq>weekly</changefreq>
          <priority>0.7</priority>
        </url>`;
    });

    products.forEach((prod) => {
      xml += `
        <url>
          <loc>${baseUrl}/insumos/${prod._id}</loc>
          <lastmod>${prod.updatedAt.toISOString().split('T')[0]}</lastmod>
          <changefreq>weekly</changefreq>
          <priority>0.6</priority>
        </url>`;
    });

    xml += '</urlset>';

    res.header('Content-Type', 'application/xml');
    res.send(xml);
  } catch (error) {
    console.error('Sitemap error:', error);
    res.status(500).send('Error generating sitemap');
  }
});

module.exports = router;
