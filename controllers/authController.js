const Account = require("../models/Account");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

//Register account
exports.register = async (req, res) => {
  try {
    const { username, email, phone, password, role } = req.body;

    // Check email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // Check phone format (E.164-ish or local 9-15 digits)
    const phoneRegex = /^\+?[0-9]{9,15}$/;
    if (!phone || !phoneRegex.test(phone)) {
      return res.status(400).json({ message: "Invalid phone format" });
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
    const hashedPassword = await bcrypt.hash(password, 10);
    const newAccount = new Account({
      username,
      email,
      phone,
      password: hashedPassword,
      role: role || "driver",
      status: "active",
    });
    await newAccount.save();
    //  User profile
    // const newUser = new User({ accountId: newAccount._id });
    // await newUser.save();
    // newAccount.userId = newUser._id;
    // await newAccount.save();
    res.status(201).json({
      message: "Account created successfully",
      accountId: newAccount._id,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//Login account
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const account = await Account.findOne({ email });
    if (!account) {
      return res.status(400).json({ message: "Invalid email or password" });
    }
    const isPasswordValid = await bcrypt.compare(password, account.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid email or password" });
    }
    const token = jwt.sign(
      { accountId: account._id, role: account.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    res.status(200).json({ token, accountId: account._id, role: account.role });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
