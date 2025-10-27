const multer = require("multer");

const storage = multer.memoryStorage(); // lưu file trong bộ nhớ (RAM)
const uploadExcel = multer({ storage });

module.exports = uploadExcel;
