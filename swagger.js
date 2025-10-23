// swagger.js
const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

function buildSwaggerSpec(baseUrl) {
  const options = {
    definition: {
      openapi: "3.0.0",
      info: {
        title: "EV Charger API",
        version: "1.0.0",
        description: "API documentation for EV Charger project",
      },
      servers: [
        { url: baseUrl },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
        },
      },
    },
    apis: ["./routes/*.js"],
  };

  return swaggerJsDoc(options);
}

function swaggerDocs(app) {
  // JSON spec that adapts to the incoming request host and protocol
  app.get("/api-docs.json", (req, res) => {
    const proto = (req.headers["x-forwarded-proto"] || req.protocol || "http").split(",")[0];
    const host = req.headers["x-forwarded-host"] || req.get("host");
    const baseUrl = process.env.PUBLIC_BASE_URL || `${proto}://${host}`;
    const spec = buildSwaggerSpec(baseUrl);
    res.setHeader("Content-Type", "application/json");
    res.send(spec);
  });

  // UI configured to fetch the dynamic JSON spec above
  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(null, {
      swaggerOptions: {
        url: "/api-docs.json",
      },
    })
  );
}

module.exports = swaggerDocs;
