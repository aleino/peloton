import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import { getOpenAPIDocument } from '../config/openapi.js';

const router = Router();

// Generate OpenAPI document
const openapiDocument = getOpenAPIDocument();

// Swagger UI options
const swaggerOptions = {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Peloton API Documentation',
};

// Serve Swagger UI
router.use('/docs', swaggerUi.serve);
router.get('/docs', swaggerUi.setup(openapiDocument, swaggerOptions));

// Serve raw OpenAPI spec as JSON
router.get('/openapi.json', (_req, res) => {
  res.json(openapiDocument);
});

export default router;
