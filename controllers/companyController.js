const Company = require("../models/Company");

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
