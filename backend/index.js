'use strict';

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const { testConnection } = require('./config/db');
const routes = require('./routes/index');
const errorHandler = require('./middlewares/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares globales

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger UI  →  http://localhost:3000/api-docs

app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
        customSiteTitle: 'Sistema Clínica API Docs',
        customCss: `
      /* Fondo oscuro premium */
      body { background: #0f1117; }
      .swagger-ui { font-family: 'Inter', sans-serif; }
      .swagger-ui .topbar { background: linear-gradient(135deg, #1a1f35 0%, #0d1b2a 100%); border-bottom: 2px solid #3b82f6; }
      .swagger-ui .topbar .download-url-wrapper { display: none; }
      .swagger-ui .topbar-wrapper .link { display: flex; align-items: center; gap: 10px; }
      .swagger-ui .info .title { color: #60a5fa; font-weight: 700; font-size: 2rem; }
      .swagger-ui .info .description p { color: #94a3b8; }
      .swagger-ui .scheme-container { background: #1e2535; box-shadow: none; border: 1px solid #334155; border-radius: 8px; }
      .swagger-ui .opblock.opblock-get .opblock-summary { border-color: #3b82f6; }
      .swagger-ui .opblock.opblock-get { background: rgba(59,130,246,0.08); border-color: #3b82f6; }
      .swagger-ui .opblock.opblock-post .opblock-summary { border-color: #10b981; }
      .swagger-ui .opblock.opblock-post { background: rgba(16,185,129,0.08); border-color: #10b981; }
      .swagger-ui .opblock.opblock-put .opblock-summary { border-color: #f59e0b; }
      .swagger-ui .opblock.opblock-put { background: rgba(245,158,11,0.08); border-color: #f59e0b; }
      .swagger-ui .opblock.opblock-delete .opblock-summary { border-color: #ef4444; }
      .swagger-ui .opblock.opblock-delete { background: rgba(239,68,68,0.08); border-color: #ef4444; }
      .swagger-ui .opblock-summary-method { border-radius: 6px; font-weight: 700; min-width: 80px; }
      .swagger-ui .btn.execute { background: #3b82f6; border-color: #3b82f6; border-radius: 6px; }
      .swagger-ui .btn.execute:hover { background: #2563eb; }
      .swagger-ui .responses-table .response-col_status { color: #34d399; }
      .swagger-ui section.models { background: #1e2535; border: 1px solid #334155; border-radius: 8px; }
      .swagger-ui .model-title { color: #60a5fa; }
      .swagger-ui .parameter__name { color: #f8fafc; }
      .swagger-ui .parameter__type { color: #a78bfa; }
      .swagger-ui table thead tr td, .swagger-ui table thead tr th { color: #94a3b8; border-color: #334155; }
    `,
        customCssUrl: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
        customJsStr: `
          window.addEventListener('load', function() {
            var checkUi = setInterval(function() {
              if (window.ui && window.ui.authActions) {
                clearInterval(checkUi);
                var origFetch = window.fetch;
                window.fetch = async function() {
                  var resp = await origFetch.apply(this, arguments);
                  try {
                    var cloned = resp.clone();
                    var data = await cloned.json();
                    if (data && data.token && data.success) {
                      window.ui.authActions.authorize({
                        bearerAuth: {
                          name: 'bearerAuth',
                          schema: { type: 'http', scheme: 'bearer' },
                          value: data.token
                        }
                      });
                      var authBtn = document.querySelector('.btn.authorize');
                      if (authBtn) {
                        authBtn.style.boxShadow = '0 0 12px #10b981';
                        setTimeout(function() { authBtn.style.boxShadow = ''; }, 2000);
                      }
                    }
                  } catch (e) {}
                  return resp;
                };
              }
            }, 300);
          });
        `,
        swaggerOptions: {
            persistAuthorization: true,
            displayRequestDuration: true,
            filter: true,
            syntaxHighlight: { activate: true, theme: 'monokai' },
        },
    })
);

// Endpoint para descargar el JSON de la especificación OpenAPI
app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
});

// Rutas

app.use('/api', routes);

// Ruta raíz → redirige a la documentación
app.get('/', (req, res) => {
    res.redirect('/api-docs');
});

// Ruta 404 para paths no encontrados
app.use((req, res) => {
    res.status(404).json({ success: false, mensaje: 'Ruta no encontrada' });
});

app.use(errorHandler);

(async () => {
    await testConnection();
    app.listen(PORT, () => {
        console.log(`Servidor corriendo en http://localhost:${PORT}`);
        console.log(`Entorno: ${process.env.NODE_ENV || 'development'}`);
    });
})();