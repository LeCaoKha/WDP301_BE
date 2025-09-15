// swagger.js
const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "EV Charger API",
      version: "1.0.0",
      description: "API documentation for EV Charger project",
    },
servers: [
  {
    url: `http://localhost:${process.env.PORT || 5000}`,
  },
],
  },
  apis: ["./routes/*.js"], // 👈 nơi bạn viết swagger comment
};

const swaggerSpec = swaggerJsDoc(options);

function swaggerDocs(app, port) {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

module.exports = swaggerDocs;
