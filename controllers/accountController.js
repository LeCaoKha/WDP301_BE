const Account = require("../models/Account");

// Get all accounts
exports.getAllAccounts = async (req, res) => {
  try {
    const accounts = await Account.find().select("-password");
    res.status(200).json(accounts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get account by id
exports.getAccountById = async (req, res) => {
  try {
    const { id } = req.params;
    const account = await Account.findById(id).select("-password");
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
    const { username, email, phone, role, status } = req.body;

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

    const updated = await Account.findByIdAndUpdate(
      id,
      { username, email, phone, role, status },
      { new: true, runValidators: true }
    ).select("-password");
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
    ).select("-password");
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
    ).select("-password");
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

    const account = await Account.findById(userId).select("-password");
    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }

    res.status(200).json(account);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
