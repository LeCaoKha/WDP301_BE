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
        description:
          "API documentation for EV Driver Backend - Electric Vehicle Charging Management System",
        contact: {
          name: "EV Driver Team",
          email: "support@evdriver.com",
        },
        license: {
          name: "MIT",
          url: "https://opensource.org/licenses/MIT",
        },
      },
      servers: [
        {
          url: baseUrl,
          description: "Dynamic server based on request",
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
            description: "Enter your JWT token in the format: Bearer {token}",
          },
        },
        schemas: {
          Account: {
            type: "object",
            properties: {
              _id: { type: "string", example: "507f1f77bcf86cd799439011" },
              username: { type: "string", example: "john_doe" },
              email: {
                type: "string",
                format: "email",
                example: "john@example.com",
              },
              phone: { type: "string", example: "+84901234567" },
              role: {
                type: "string",
                enum: ["driver", "admin", "staff", "company"],
                example: "driver",
              },
              status: {
                type: "string",
                enum: ["active", "inactive"],
                example: "active",
              },
              isCompany: {
                type: "boolean",
                example: false,
                description: "Whether this account represents a company",
              },
              company_id: {
                oneOf: [
                  { type: "string", example: "507f1f77bcf86cd799439012" },
                  { type: "null" },
                ],
                description:
                  "Reference to Company (optional, defaults to null). When populated, returns company object with name, address, contact_email",
              },
              createdAt: { type: "string", format: "date-time" },
              updatedAt: { type: "string", format: "date-time" },
            },
          },
          Vehicle: {
            type: "object",
            properties: {
              _id: { type: "string", example: "507f1f77bcf86cd799439011" },
              user_id: { type: "string", example: "507f1f77bcf86cd799439012" },
              company_id: {
                type: "string",
                example: "507f1f77bcf86cd799439013",
              },
              plate_number: { type: "string", example: "29A-12345" },
              model: { type: "string", example: "Tesla Model 3" },
              batteryCapacity: {
                type: "number",
                format: "double",
                example: 75.0,
              },
              createdAt: { type: "string", format: "date-time" },
              updatedAt: { type: "string", format: "date-time" },
            },
          },
          Company: {
            type: "object",
            properties: {
              _id: { type: "string", example: "507f1f77bcf86cd799439011" },
              name: { type: "string", example: "EV Solutions Corp" },
              address: {
                type: "string",
                example: "123 Tech Street, Ho Chi Minh City",
              },
              contact_email: {
                type: "string",
                format: "email",
                example: "contact@evsolutions.com",
              },
              createdAt: { type: "string", format: "date-time" },
              updatedAt: { type: "string", format: "date-time" },
            },
          },
          SubscriptionPlan: {
            type: "object",
            properties: {
              _id: { type: "string", example: "507f1f77bcf86cd799439011" },
              type: { type: "string", enum: ["prepaid"], example: "prepaid" },
              name: { type: "string", example: "Premium Monthly Plan" },
              price: { type: "number", format: "decimal", example: 299000 },
              billing_cycle: {
                type: "string",
                enum: ["monthly", "quarterly", "yearly", "one-time"],
                example: "monthly",
              },
              limit_type: {
                type: "string",
                enum: [
                  "vehicles",
                  "stations",
                  "charging_sessions",
                  "users",
                  "unlimited",
                ],
                example: "vehicles",
              },
              limit_value: { type: "number", example: 10 },
              description: {
                type: "string",
                example: "Premium plan with up to 10 vehicles",
              },
              is_active: { type: "boolean", example: true },
              createdAt: { type: "string", format: "date-time" },
              updatedAt: { type: "string", format: "date-time" },
            },
          },
          VehicleSubscription: {
            type: "object",
            properties: {
              _id: { type: "string", example: "507f1f77bcf86cd799439011" },
              vehicle_id: {
                type: "string",
                example: "507f1f77bcf86cd799439012",
              },
              subscription_id: {
                type: "string",
                example: "507f1f77bcf86cd799439013",
              },
              start_date: { type: "string", format: "date-time" },
              end_date: { type: "string", format: "date-time" },
              status: {
                type: "string",
                enum: ["active", "expired", "cancelled", "suspended"],
                example: "active",
              },
              auto_renew: { type: "boolean", example: false },
              payment_status: {
                type: "string",
                enum: ["paid", "pending", "failed", "refunded"],
                example: "paid",
              },
              createdAt: { type: "string", format: "date-time" },
              updatedAt: { type: "string", format: "date-time" },
            },
          },
          Station: {
            type: "object",
            properties: {
              _id: { type: "string", example: "507f1f77bcf86cd799439011" },
              name: { type: "string", example: "Station A" },
              address: {
                type: "string",
                example: "123 Main Street, District 1",
              },
              latitude: { type: "number", example: 10.762622 },
              longitude: { type: "number", example: 106.660172 },
              connector_type: {
                type: "string",
                enum: ["AC", "DC"],
                example: "AC",
              },
              power_capacity: {
                type: "number",
                example: 50,
                description:
                  "Công suất của trạm (kW) - áp dụng cho tất cả charging points",
              },
              price_per_kwh: {
                type: "number",
                example: 3000,
                description: "Giá điện của trạm (VND/kWh)",
              },
              base_fee: {
                type: "number",
                example: 10000,
                description: "Phí cơ bản mỗi lần sạc (VND)",
              },
              status: {
                type: "string",
                enum: ["online", "offline", "maintenance"],
                example: "online",
              },
              createdAt: { type: "string", format: "date-time" },
            },
          },
          ChargingPoint: {
            type: "object",
            properties: {
              _id: { type: "string", example: "507f1f77bcf86cd799439011" },
              stationId: {
                type: "string",
                example: "507f1f77bcf86cd799439012",
                description: "ID của trạm sạc (lấy power_capacity từ station)",
              },
              type: {
                type: "string",
                enum: ["online", "offline"],
                example: "online",
                description: "online: cho booking, offline: sử dụng trực tiếp",
              },
              status: {
                type: "string",
                enum: ["available", "in_use", "maintenance"],
                example: "available",
              },
              create_at: { type: "string", format: "date-time" },
            },
          },
          Booking: {
            type: "object",
            properties: {
              _id: { type: "string", example: "507f1f77bcf86cd799439011" },
              user_id: { type: "string", example: "507f1f77bcf86cd799439012" },
              station_id: {
                type: "string",
                example: "507f1f77bcf86cd799439013",
              },
              vehicle_id: {
                type: "string",
                example: "507f1f77bcf86cd799439014",
              },
              chargingPoint_id: {
                type: "string",
                example: "507f1f77bcf86cd799439015",
              },
              start_time: { type: "string", format: "date-time" },
              end_time: { type: "string", format: "date-time" },
              status: {
                type: "string",
                enum: [
                  "pending",
                  "confirmed",
                  "active",
                  "completed",
                  "cancelled",
                  "expired",
                ],
                example: "pending",
              },
              createdAt: { type: "string", format: "date-time" },
              updatedAt: { type: "string", format: "date-time" },
            },
          },
          ChargingSession: {
            type: "object",
            properties: {
              _id: { type: "string", example: "507f1f77bcf86cd799439011" },
              booking_id: {
                type: "string",
                example: "507f1f77bcf86cd799439012",
              },
              chargingPoint_id: {
                type: "string",
                example: "507f1f77bcf86cd799439013",
              },
              vehicle_id: {
                type: "string",
                example: "507f1f77bcf86cd799439014",
              },
              start_time: { type: "string", format: "date-time" },
              end_time: { type: "string", format: "date-time" },
              status: {
                type: "string",
                enum: ["pending", "in_progress", "completed", "cancelled"],
                example: "pending",
              },
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
              updatedAt: { type: "string", format: "date-time" },
            },
          },
          Invoice: {
            type: "object",
            properties: {
              _id: { type: "string", example: "507f1f77bcf86cd799439011" },
              session_id: {
                type: "string",
                example: "507f1f77bcf86cd799439012",
                description: "Charging session reference",
              },
              user_id: {
                type: "string",
                example: "507f1f77bcf86cd799439013",
                description: "User/Driver ID",
              },
              vehicle_id: {
                type: "string",
                example: "507f1f77bcf86cd799439014",
                description: "Vehicle ID",
              },
              station_id: {
                type: "string",
                example: "507f1f77bcf86cd799439015",
                description: "Station ID",
              },
              station_name: {
                type: "string",
                example: "EV Station Downtown",
                description: "Denormalized station name",
              },
              station_address: {
                type: "string",
                example: "123 Main St, District 1, HCMC",
                description: "Denormalized station address",
              },
              vehicle_model: {
                type: "string",
                example: "Tesla Model 3",
                description: "Denormalized vehicle model",
              },
              vehicle_plate_number: {
                type: "string",
                example: "29A-12345",
                description: "Denormalized vehicle plate",
              },
              battery_capacity_kwh: {
                type: "number",
                example: 75,
                description: "Vehicle battery capacity in kWh",
              },
              start_time: {
                type: "string",
                format: "date-time",
                description: "Charging start time",
              },
              end_time: {
                type: "string",
                format: "date-time",
                description: "Charging end time",
              },
              charging_duration_seconds: {
                type: "number",
                example: 5400,
                description: "Duration in seconds",
              },
              charging_duration_minutes: {
                type: "number",
                example: 90,
                description: "Duration in minutes",
              },
              charging_duration_hours: {
                type: "number",
                example: 1.5,
                description: "Duration in hours",
              },
              charging_duration_formatted: {
                type: "string",
                example: "1 giờ 30 phút",
                description: "Human-readable duration",
              },
              initial_battery_percentage: {
                type: "number",
                example: 30,
                description: "Battery % at start",
              },
              final_battery_percentage: {
                type: "number",
                example: 80,
                description: "Battery % at end",
              },
              target_battery_percentage: {
                type: "number",
                example: 80,
                description: "Target battery %",
              },
              battery_charged_percentage: {
                type: "number",
                example: 50,
                description: "Battery % charged",
              },
              target_reached: {
                type: "boolean",
                example: true,
                description: "Whether target was reached",
              },
              energy_delivered_kwh: {
                type: "number",
                example: 37.5,
                description: "Energy delivered in kWh",
              },
              power_capacity_kw: {
                type: "number",
                example: 50,
                description: "Charging power capacity in kW",
              },
              calculation_method: {
                type: "string",
                enum: ["actual", "estimated"],
                example: "actual",
                description: "How energy was calculated",
              },
              base_fee: {
                type: "number",
                example: 10000,
                description: "Base fee (VND) - paid at booking",
              },
              price_per_kwh: {
                type: "number",
                example: 3000,
                description: "Price per kWh (VND)",
              },
              charging_fee: {
                type: "number",
                example: 112500,
                description: "Energy cost only (VND)",
              },
              total_amount: {
                type: "number",
                example: 122500,
                description: "Total: base_fee + charging_fee (VND)",
              },
              payment_status: {
                type: "string",
                enum: ["unpaid", "paid", "refunded", "cancelled"],
                example: "unpaid",
                description: "Payment status",
              },
              payment_method: {
                type: "string",
                enum: ["vnpay"],
                example: "vnpay",
                description: "Payment method (VNPay only)",
              },
              payment_date: {
                type: "string",
                format: "date-time",
                description: "When payment was completed",
              },
              transaction_id: {
                type: "string",
                example: "VNPAY123456789",
                description: "VNPay transaction ID",
              },
              notes: {
                type: "string",
                description: "Additional notes",
              },
              createdAt: { type: "string", format: "date-time" },
              updatedAt: { type: "string", format: "date-time" },
            },
          },
          Error: {
            type: "object",
            properties: {
              message: { type: "string", example: "Error message" },
            },
          },
          Pagination: {
            type: "object",
            properties: {
              currentPage: { type: "integer", example: 1 },
              totalPages: { type: "integer", example: 10 },
              totalItems: { type: "integer", example: 100 },
              itemsPerPage: { type: "integer", example: 10 },
            },
          },
        },
        responses: {
          Unauthorized: {
            description: "Access token required or invalid",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          Forbidden: {
            description: "Invalid or expired token",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          NotFound: {
            description: "Resource not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          BadRequest: {
            description: "Bad request or validation error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          InternalServerError: {
            description: "Internal server error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
      tags: [
        {
          name: "Authentication",
          description: "User authentication and authorization endpoints",
        },
        {
          name: "Account",
          description: "Account management endpoints",
        },
        {
          name: "Vehicle",
          description: "Vehicle management endpoints",
        },
        {
          name: "Company",
          description: "Company management endpoints",
        },
        {
          name: "SubscriptionPlan",
          description: "Subscription plan management endpoints",
        },
        {
          name: "VehicleSubscription",
          description: "Vehicle subscription management endpoints",
        },
        {
          name: "Station",
          description: "Charging station management endpoints",
        },
        {
          name: "ChargingPoint",
          description: "Charging point management endpoints",
        },
        {
          name: "Booking",
          description: "Charging station booking endpoints",
        },
        {
          name: "ChargingSession",
          description: "Charging session and QR code endpoints",
        },
        {
          name: "Payment",
          description:
            "Payment processing with VNPay for subscriptions, charging fees, and base fees",
        },
        {
          name: "Invoices",
          description: "Invoice management and payment tracking endpoints",
        },
      ],
    },
    apis: ["./routes/*.js"],
  };

  return swaggerJsDoc(options);
}

function swaggerDocs(app) {
  // JSON spec that adapts to the incoming request host and protocol
  app.get("/api-docs.json", (req, res) => {
    const proto = (
      req.headers["x-forwarded-proto"] ||
      req.protocol ||
      "http"
    ).split(",")[0];
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
        tryItOutEnabled: true,
      },
      customCss: ".swagger-ui .topbar { display: none }",
      customSiteTitle: "EV Driver API Documentation",
    })
  );
}

module.exports = swaggerDocs;
