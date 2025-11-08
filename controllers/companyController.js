const Company = require("../models/Company");
const Account = require("../models/Account");
const Vehicle = require("../models/Vehicle");
const Payment = require("../models/Payment");

// Create Company
exports.createCompany = async (req, res) => {
  try {
    const { name, address, contact_email } = req.body;

    // Check if email already exists
    const existingCompany = await Company.findOne({ contact_email });
    if (existingCompany) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const company = await Company.create({
      name,
      address,
      contact_email,
    });
    res.status(201).json(company);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all Companies
exports.getAllCompanies = async (req, res) => {
  try {
    const companies = await Company.find();
    res.status(200).json(companies);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Company by id
exports.getCompanyById = async (req, res) => {
  try {
    const { id } = req.params;
    const company = await Company.findById(id);
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }
    res.status(200).json(company);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update Company by id
exports.updateCompanyById = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, address, contact_email } = req.body;

    // Check if email already exists (if provided)
    if (contact_email) {
      const existingCompany = await Company.findOne({
        _id: { $ne: id },
        contact_email,
      });
      if (existingCompany) {
        return res.status(400).json({ message: "Email already in use" });
      }
    }

    const updated = await Company.findByIdAndUpdate(
      id,
      { name, address, contact_email },
      { new: true, runValidators: true }
    );
    if (!updated) {
      return res.status(404).json({ message: "Company not found" });
    }
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete Company by id
exports.deleteCompanyById = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Company.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "Company not found" });
    }
    res.status(200).json({ message: "Company deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ============== GET MY COMPANY DRIVERS ==============
exports.getMyCompanyDrivers = async (req, res) => {
  try {
    // Get current user account
    const accountId = req.user.accountId;
    const currentAccount = await Account.findById(accountId);

    if (!currentAccount) {
      return res.status(404).json({ message: "Account not found" });
    }

    // Get company_id from current account
    const companyId = currentAccount.company_id;

    if (!companyId) {
      return res.status(403).json({
        message: "You are not associated with any company",
      });
    }

    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Find all drivers that belong to this company
    // Only get drivers with role="driver" and company_id matching
    const filter = {
      role: "driver",
      company_id: companyId,
    };

    const drivers = await Account.find(filter)
      .select("username email phone status role company_id createdAt updatedAt")
      .populate("company_id", "name address contact_email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Account.countDocuments(filter);

    res.status(200).json({
      drivers,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ============== GET MY COMPANY VEHICLES ==============
exports.getMyCompanyVehicles = async (req, res) => {
  try {
    // Get current user account
    const accountId = req.user.accountId;
    const currentAccount = await Account.findById(accountId);

    if (!currentAccount) {
      return res.status(404).json({ message: "Account not found" });
    }

    // Get company_id from current account
    const companyId = currentAccount.company_id;

    if (!companyId) {
      return res.status(403).json({
        message: "You are not associated with any company",
      });
    }

    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Find all vehicles that belong to this company
    // Only get vehicles with company_id matching (not null)
    const filter = {
      company_id: companyId,
    };

    const vehicles = await Vehicle.find(filter)
      .populate("user_id", "username email phone role status")
      .populate("company_id", "name address contact_email")
      .populate({
        path: "vehicle_subscription_id",
        select:
          "subscription_id start_date end_date status auto_renew payment_status createdAt updatedAt",
        populate: {
          path: "subscription_id",
          select: "name price billing_cycle description isCompany discount",
        },
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Vehicle.countDocuments(filter);

    res.status(200).json({
      vehicles,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ============== GET MY COMPANY PAYMENTS ==============
exports.getMyCompanyPayments = async (req, res) => {
  try {
    // Get current user account
    const accountId = req.user.accountId;
    const currentAccount = await Account.findById(accountId);

    if (!currentAccount) {
      return res.status(404).json({ message: "Account not found" });
    }

    // Get company_id from current account
    const companyId = currentAccount.company_id;

    if (!companyId) {
      return res.status(403).json({
        message: "You are not associated with any company",
      });
    }

    const { page = 1, limit = 10, type } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Find all drivers that belong to this company
    const companyDrivers = await Account.find({
      role: "driver",
      company_id: companyId,
    }).select("_id");

    const driverIds = companyDrivers.map((driver) => driver._id);

    if (driverIds.length === 0) {
      return res.status(200).json({
        payments: [],
        pagination: {
          currentPage: parseInt(page),
          totalPages: 0,
          totalItems: 0,
          itemsPerPage: parseInt(limit),
        },
      });
    }

    // Find all payments made by these drivers
    let filter = { madeBy: { $in: driverIds } };
    if (type) filter.type = type;

    const payments = await Payment.find(filter)
      .populate({
        path: "madeBy",
        select: "username email phone role company_id",
        populate: {
          path: "company_id",
          select: "name address contact_email",
        },
      })
      .populate({
        path: "invoice_ids",
        select:
          "total_amount payment_status station_name vehicle_plate_number start_time end_time charging_duration_formatted energy_delivered_kwh",
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(); // Use lean() to get plain objects and avoid virtuals

    const total = await Payment.countDocuments(filter);

    // Filter out null invoices from invoice_ids array
    const formattedPayments = payments.map((payment) => {
      if (payment.invoice_ids && Array.isArray(payment.invoice_ids)) {
        payment.invoice_ids = payment.invoice_ids.filter(
          (inv) => inv !== null && inv !== undefined
        );
      }
      return payment;
    });

    res.status(200).json({
      payments: formattedPayments,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
