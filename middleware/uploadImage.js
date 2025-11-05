const multer = require("multer");
const path = require("path");

// Cấu hình lưu file vào memory (RAM) thay vì disk
// Giúp tránh lỗi khi deploy lên server không có thư mục uploads/
const storage = multer.memoryStorage();

// Kiểm tra loại file
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error("Chỉ chấp nhận file ảnh (jpeg, jpg, png, gif, webp)"));
  }
};

// Upload nhiều files (tối đa 10 ảnh)
const multerConfig = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // Giới hạn 5MB mỗi file
  },
  fileFilter: fileFilter,
});

const uploadMultiple = multerConfig.array("images", 10); // Field name là "images", tối đa 10 files

// Middleware xử lý lỗi upload
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        message: "File quá lớn. Kích thước tối đa là 5MB mỗi file",
      });
    }
    if (err.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({
        message: "Quá nhiều file. Tối đa 10 ảnh mỗi lần upload",
      });
    }
    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({
        message: `Field name không đúng. Phải là "images", nhận được: ${err.field}`,
      });
    }
    return res.status(400).json({
      message: err.message,
      code: err.code,
    });
  } else if (err) {
    return res.status(400).json({
      message: err.message,
    });
  }
  next();
};

module.exports = { uploadMultiple, handleUploadError };
