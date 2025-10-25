// swagger.js
const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

function buildSwaggerSpec(baseUrl) {
  const options = {
    definition: {
      openapi: "3.0.0",
      info: {
        title: "EV Driver API",
        version: "1.0.0",
        description: "API documentation for EV Driver Backend - Electric Vehicle Charging Management System",
        contact: {
          name: "EV Driver Team",
          email: "support@evdriver.com"
        },
        license: {
          name: "MIT",
          url: "https://opensource.org/licenses/MIT"
        }
      },
      servers: [
        { 
          url: baseUrl,
          description: "Dynamic server based on request"
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
            description: "Enter your JWT token in the format: Bearer {token}"
          },
        },
        schemas: {
          Account: {
            type: "object",
            properties: {
              _id: { type: "string", example: "507f1f77bcf86cd799439011" },
              username: { type: "string", example: "john_doe" },
              email: { type: "string", format: "email", example: "john@example.com" },
              phone: { type: "string", example: "+84901234567" },
              role: { type: "string", enum: ["driver", "admin", "company"], example: "driver" },
              status: { type: "string", enum: ["active", "inactive"], example: "active" },
              createdAt: { type: "string", format: "date-time" },
              updatedAt: { type: "string", format: "date-time" }
            }
          },
          Vehicle: {
            type: "object",
            properties: {
              _id: { type: "string", example: "507f1f77bcf86cd799439011" },
              user_id: { type: "string", example: "507f1f77bcf86cd799439012" },
              company_id: { type: "string", example: "507f1f77bcf86cd799439013" },
              plate_number: { type: "string", example: "29A-12345" },
              model: { type: "string", example: "Tesla Model 3" },
              batteryCapacity: { type: "number", format: "double", example: 75.0 },
              createdAt: { type: "string", format: "date-time" },
              updatedAt: { type: "string", format: "date-time" }
            }
          },
          Company: {
            type: "object",
            properties: {
              _id: { type: "string", example: "507f1f77bcf86cd799439011" },
              name: { type: "string", example: "EV Solutions Corp" },
              address: { type: "string", example: "123 Tech Street, Ho Chi Minh City" },
              contact_email: { type: "string", format: "email", example: "contact@evsolutions.com" },
              createdAt: { type: "string", format: "date-time" },
              updatedAt: { type: "string", format: "date-time" }
            }
          },
          SubscriptionPlan: {
            type: "object",
            properties: {
              _id: { type: "string", example: "507f1f77bcf86cd799439011" },
              type: { type: "string", enum: ["prepaid"], example: "prepaid" },
              name: { type: "string", example: "Premium Monthly Plan" },
              price: { type: "number", format: "decimal", example: 299000 },
              billing_cycle: { type: "string", enum: ["monthly", "quarterly", "yearly", "one-time"], example: "monthly" },
              limit_type: { type: "string", enum: ["vehicles", "stations", "charging_sessions", "users", "unlimited"], example: "vehicles" },
              limit_value: { type: "number", example: 10 },
              description: { type: "string", example: "Premium plan with up to 10 vehicles" },
              is_active: { type: "boolean", example: true },
              createdAt: { type: "string", format: "date-time" },
              updatedAt: { type: "string", format: "date-time" }
            }
          },
          VehicleSubscription: {
            type: "object",
            properties: {
              _id: { type: "string", example: "507f1f77bcf86cd799439011" },
              vehicle_id: { type: "string", example: "507f1f77bcf86cd799439012" },
              subscription_id: { type: "string", example: "507f1f77bcf86cd799439013" },
              start_date: { type: "string", format: "date-time" },
              end_date: { type: "string", format: "date-time" },
              status: { type: "string", enum: ["active", "expired", "cancelled", "suspended"], example: "active" },
              auto_renew: { type: "boolean", example: false },
              payment_status: { type: "string", enum: ["paid", "pending", "failed", "refunded"], example: "paid" },
              createdAt: { type: "string", format: "date-time" },
              updatedAt: { type: "string", format: "date-time" }
            }
          },
          Station: {
            type: "object",
            properties: {
              _id: { type: "string", example: "507f1f77bcf86cd799439011" },
              name: { type: "string", example: "Station A" },
              address: { type: "string", example: "123 Main Street, District 1" },
              latitude: { type: "number", example: 10.762622 },
              longitude: { type: "number", example: 106.660172 },
              connector_type: { type: "string", enum: ["AC", "DC"], example: "AC" },
              status: { type: "string", enum: ["online", "offline", "maintenance"], example: "online" },
              createdAt: { type: "string", format: "date-time" }
            }
          },
          ChargingPoint: {
            type: "object",
            properties: {
              _id: { type: "string", example: "507f1f77bcf86cd799439011" },
              stationId: { type: "string", example: "507f1f77bcf86cd799439012" },
              power_capacity: { type: "number", example: 50 },
              status: { type: "string", enum: ["available", "in_use", "maintenance"], example: "available" },
              create_at: { type: "string", format: "date-time" }
            }
          },
          Booking: {
            type: "object",
            properties: {
              _id: { type: "string", example: "507f1f77bcf86cd799439011" },
              user_id: { type: "string", example: "507f1f77bcf86cd799439012" },
              station_id: { type: "string", example: "507f1f77bcf86cd799439013" },
              vehicle_id: { type: "string", example: "507f1f77bcf86cd799439014" },
              chargingPoint_id: { type: "string", example: "507f1f77bcf86cd799439015" },
              start_time: { type: "string", format: "date-time" },
              end_time: { type: "string", format: "date-time" },
              status: { type: "string", enum: ["pending", "confirmed", "active", "completed", "cancelled", "expired"], example: "pending" },
              createdAt: { type: "string", format: "date-time" },
              updatedAt: { type: "string", format: "date-time" }
            }
          },
          ChargingSession: {
            type: "object",
            properties: {
              _id: { type: "string", example: "507f1f77bcf86cd799439011" },
              booking_id: { type: "string", example: "507f1f77bcf86cd799439012" },
              chargingPoint_id: { type: "string", example: "507f1f77bcf86cd799439013" },
              vehicle_id: { type: "string", example: "507f1f77bcf86cd799439014" },
              start_time: { type: "string", format: "date-time" },
              end_time: { type: "string", format: "date-time" },
              status: { type: "string", enum: ["pending", "in_progress", "completed", "cancelled"], example: "pending" },
              initial_battery_level: { type: "number", example: 30 },
              final_battery_level: { type: "number", example: 80 },
              energy_delivered_kwh: { type: "number", example: 37.5 },
              charging_duration_minutes: { type: "number", example: 120 },
              base_fee: { type: "number", example: 50000 },
              price_per_kwh: { type: "number", example: 3000 },
              charging_fee: { type: "number", example: 112500 },
              total_amount: { type: "number", example: 162500 },
              qr_code_token: { type: "string" },
              createdAt: { type: "string", format: "date-time" },
              updatedAt: { type: "string", format: "date-time" }
            }
          },
          Error: {
            type: "object",
            properties: {
              message: { type: "string", example: "Error message" }
            }
          },
          Pagination: {
            type: "object",
            properties: {
              currentPage: { type: "integer", example: 1 },
              totalPages: { type: "integer", example: 10 },
              totalItems: { type: "integer", example: 100 },
              itemsPerPage: { type: "integer", example: 10 }
            }
          }
        },
        responses: {
          Unauthorized: {
            description: "Access token required or invalid",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          },
          Forbidden: {
            description: "Invalid or expired token",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          },
          NotFound: {
            description: "Resource not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          },
          BadRequest: {
            description: "Bad request or validation error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          },
          InternalServerError: {
            description: "Internal server error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          }
        }
      },
      tags: [
        {
          name: "Authentication",
          description: "User authentication and authorization endpoints"
        },
        {
          name: "Account",
          description: "Account management endpoints"
        },
        {
          name: "Vehicle",
          description: "Vehicle management endpoints"
        },
        {
          name: "Company",
          description: "Company management endpoints"
        },
        {
          name: "SubscriptionPlan",
          description: "Subscription plan management endpoints"
        },
        {
          name: "VehicleSubscription",
          description: "Vehicle subscription management endpoints"
        },
        {
          name: "Station",
          description: "Charging station management endpoints"
        },
        {
          name: "ChargingPoint",
          description: "Charging point management endpoints"
        },
        {
          name: "Booking",
          description: "Charging station booking endpoints"
        },
        {
          name: "ChargingSession",
          description: "Charging session and QR code endpoints"
        }
      ]
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
        persistAuthorization: true,
        docExpansion: "none",
        filter: true,
        showRequestHeaders: true,
        tryItOutEnabled: true
      },
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: "EV Driver API Documentation"
    })
  );
}

module.exports = swaggerDocs;
