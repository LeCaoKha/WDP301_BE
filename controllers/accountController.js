const xlsx = require("xlsx");
const bcrypt = require("bcryptjs");
const Account = require("../models/Account");
const Vehicle = require("../models/Vehicle");
const VehicleSubscription = require("../models/VehicleSubscription");
const SubscriptionPlan = require("../models/SubscriptionPlan");
const Company = require("../models/Company");

// Create Company Admin Account
exports.createCompanyAdmin = async (req, res) => {
  try {
    const { username, email, phone, password, company_id } = req.body;

    // Validate required fields
    if (!username || !email || !phone || !password) {
      return res.status(400).json({
        message: "Missing required fields: username, email, phone, password",
      });
    }

    // Validate company_id is required
    if (!company_id) {
      return res.status(400).json({
        message: "company_id is required for company admin account",
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // Validate phone format
    const phoneRegex = /^\+?[0-9]{9,15}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ message: "Invalid phone format" });
    }

    // Validate company exists
    const company = await Company.findById(company_id);
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    // Check duplicates email/phone/username
    const existingAccount = await Account.findOne({
      $or: [{ email }, { phone }, { username }],
    });
    if (existingAccount) {
      if (existingAccount.email === email) {
        return res.status(400).json({ message: "Email already in use" });
      }
      if (existingAccount.phone === phone) {
        return res.status(400).json({ message: "Phone already in use" });
      }
      if (existingAccount.username === username) {
        return res.status(400).json({ message: "Username already in use" });
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create company admin account
    const newAccount = new Account({
      username,
      email,
      phone,
      password: hashedPassword,
      role: "company", // Fixed role for company admin
      status: "active",
      isCompany: true, // Fixed isCompany = true
      company_id: company_id, // Set company_id from request body
    });

    await newAccount.save();

    // Populate company_id for response
    const populatedAccount = await Account.findById(newAccount._id)
      .select("-password")
      .populate("company_id", "name address contact_email");

    res.status(201).json({
      message: "Company admin account created successfully",
      account: populatedAccount,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all accounts
exports.getAllAccounts = async (req, res) => {
  try {
    const accounts = await Account.find()
      .select("-password")
      .populate("company_id", "name address contact_email");
    res.status(200).json(accounts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get account by id
exports.getAccountById = async (req, res) => {
  try {
    const { id } = req.params;
    const account = await Account.findById(id)
      .select("-password")
      .populate("company_id", "name address contact_email");
    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }
    res.status(200).json(account);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update account by id
exports.updateAccountById = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, phone, role, status, isCompany } = req.body;

    // optional: validate email/phone when provided
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Invalid email format" });
      }
    }
    if (phone) {
      const phoneRegex = /^\+?[0-9]{9,15}$/;
      if (!phoneRegex.test(phone)) {
        return res.status(400).json({ message: "Invalid phone format" });
      }
    }
    if (status && !["active", "inactive"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    // prevent duplicate unique fields
    if (email || phone || username) {
      const conflict = await Account.findOne({
        _id: { $ne: id },
        $or: [
          email ? { email } : null,
          phone ? { phone } : null,
          username ? { username } : null,
        ].filter(Boolean),
      });
      if (conflict) {
        if (email && conflict.email === email) {
          return res.status(400).json({ message: "Email already in use" });
        }
        if (phone && conflict.phone === phone) {
          return res.status(400).json({ message: "Phone already in use" });
        }
        if (username && conflict.username === username) {
          return res.status(400).json({ message: "Username already in use" });
        }
      }
    }

    const { company_id } = req.body;
    const updateData = { username, email, phone, role, status };
    if (isCompany !== undefined) {
      updateData.isCompany = isCompany === true ? true : false;
    }
    if (company_id !== undefined) {
      updateData.company_id = company_id || null;
    }

    const updated = await Account.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .select("-password")
      .populate("company_id", "name address contact_email");
    if (!updated) {
      return res.status(404).json({ message: "Account not found" });
    }
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Ban account by id (set status inactive)
exports.banAccountById = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Account.findByIdAndUpdate(
      id,
      { status: "inactive" },
      { new: true }
    )
      .select("-password")
      .populate("company_id", "name address contact_email");
    if (!updated) {
      return res.status(404).json({ message: "Account not found" });
    }
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Unban account by id (set status active)
exports.unbanAccountById = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Account.findByIdAndUpdate(
      id,
      { status: "active" },
      { new: true }
    )
      .select("-password")
      .populate("company_id", "name address contact_email");
    if (!updated) {
      return res.status(404).json({ message: "Account not found" });
    }
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get my account (current user's account)
exports.getMyAccount = async (req, res) => {
  try {
    // Get user ID from JWT token (set by auth middleware)
    const userId = req.user.accountId;

    const account = await Account.findById(userId)
      .select("-password")
      .populate("company_id", "name address contact_email");
    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }

    res.status(200).json(account);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.importManyUser = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Lấy company_id và subscription_id từ request body
    const { company_id, subscription_id } = req.body;

    // Validate company_id nếu được cung cấp
    if (company_id) {
      const company = await Company.findById(company_id);
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }
    }

    // Validate subscription_id nếu được cung cấp
    let subscriptionPlan = null;
    if (subscription_id) {
      subscriptionPlan = await SubscriptionPlan.findById(subscription_id);
      if (!subscriptionPlan) {
        return res.status(404).json({ message: "Subscription plan not found" });
      }
      if (!subscriptionPlan.is_active) {
        return res
          .status(400)
          .json({ message: "Subscription plan is not active" });
      }
    }

    // Đọc buffer của file Excel
    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convert thành JSON - Bỏ qua dòng 1 (User/Car header), đọc từ dòng 2 làm header
    const data = xlsx.utils.sheet_to_json(worksheet, { range: 1 });

    if (!data.length) {
      return res.status(400).json({ message: "Excel file is empty" });
    }

    // Map từng user
    const usersToInsert = await Promise.all(
      data.map(async (item) => {
        const rawPassword = item.password ? String(item.password) : "123456";
        const hashedPassword = await bcrypt.hash(rawPassword, 10);

        return {
          username: item.username,
          email: item.email,
          phone: item.phone,
          role: item.role || "driver",
          status: item.status || "active",
          isCompany: true, // Tự động set là true khi import
          company_id: company_id || null, // Set company_id từ request body
          password: hashedPassword,
          excelData: {
            // Lưu thông tin xe từ Excel để dùng sau
            plate_number: item.plate_number,
            model: item.model,
            batteryCapacity: item.batteryCapacity,
          },
        };
      })
    );

    // Thêm users vào DB
    const createdUsers = await Account.insertMany(
      usersToInsert.map(({ excelData, ...user }) => user)
    );

    // Tạo vehicles cho từng user
    const vehiclesToInsert = [];
    for (let i = 0; i < createdUsers.length; i++) {
      const user = createdUsers[i];
      const excelData = usersToInsert[i].excelData;

      // Chỉ tạo vehicle nếu có thông tin plate_number
      if (excelData.plate_number) {
        vehiclesToInsert.push({
          user_id: user._id,
          company_id: company_id || null,
          plate_number: excelData.plate_number,
          model: excelData.model || "",
          batteryCapacity: excelData.batteryCapacity || 0,
          vehicle_subscription_id: null, // Sẽ cập nhật sau
        });
      }
    }

    // Thêm vehicles vào DB nếu có
    let createdVehicles = [];
    let createdSubscriptions = [];

    if (vehiclesToInsert.length > 0) {
      createdVehicles = await Vehicle.insertMany(vehiclesToInsert);

      // Nếu có subscription_id, tự động tạo VehicleSubscription cho từng xe
      if (subscription_id && subscriptionPlan) {
        // Tính toán start_date và end_date dựa trên billing_cycle
        const startDate = new Date();
        let daysToAdd = 0;

        switch (subscriptionPlan.billing_cycle) {
          case "1 month":
            daysToAdd = 30;
            break;
          case "3 months":
            daysToAdd = 90;
            break;
          case "6 months":
            daysToAdd = 180;
            break;
          case "1 year":
            daysToAdd = 365;
            break;
          default:
            daysToAdd = 30;
        }

        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + daysToAdd);

        // Tạo VehicleSubscription cho từng xe
        const subscriptionsToInsert = createdVehicles.map((vehicle) => ({
          vehicle_id: vehicle._id,
          subscription_id: subscription_id,
          start_date: startDate,
          end_date: endDate,
          status: "active",
          auto_renew: false,
          payment_status: "paid", // Admin tạo thì mặc định là đã thanh toán
        }));

        createdSubscriptions = await VehicleSubscription.insertMany(
          subscriptionsToInsert
        );

        // Cập nhật vehicle_subscription_id cho từng xe
        for (let i = 0; i < createdVehicles.length; i++) {
          await Vehicle.findByIdAndUpdate(createdVehicles[i]._id, {
            vehicle_subscription_id: createdSubscriptions[i]._id,
          });
        }
      }
    }

    // Populate company_id cho createdUsers
    const populatedUsers = await Account.find({
      _id: { $in: createdUsers.map((u) => u._id) },
    })
      .select("-password")
      .populate("company_id", "name address contact_email");

    res.status(201).json({
      message: `Imported ${createdUsers.length} users, ${
        createdVehicles.length
      } vehicles${
        createdSubscriptions.length > 0
          ? `, and ${createdSubscriptions.length} subscriptions`
          : ""
      } successfully`,
      usersCount: createdUsers.length,
      vehiclesCount: createdVehicles.length,
      subscriptionsCount: createdSubscriptions.length,
      users: populatedUsers,
      vehicles: createdVehicles,
      subscriptions: createdSubscriptions,
    });
  } catch (error) {
    console.error("Error importing users:", error);
    res.status(500).json({ message: error.message });
  }
};
