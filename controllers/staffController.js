const StaffReport = require("../models/StaffReport");
const Account = require("../models/Account");
const cloudinary = require("../config/cloudinary");

// Tạo report mới (Create)
exports.createReport = async (req, res) => {
  try {
    const { title, content } = req.body;
    const userId = req.user.accountId; // Lấy từ JWT token

    // Validate input
    if (!title || !content) {
      return res.status(400).json({
        message: "Title và content là bắt buộc",
      });
    }

    // Lấy station_id từ account đang đăng nhập
    const currentAccount = await Account.findById(userId).select("station_id");
    const station_id = currentAccount ? currentAccount.station_id : null;

    const images = [];

    // Kiểm tra xem có files được upload không
    // Multer sẽ parse files vào req.files nếu field name là "images"
    if (req.files && req.files.length > 0) {
      try {
        // Upload từng ảnh lên Cloudinary
        for (const file of req.files) {
          // Với memoryStorage, file được lưu trong buffer thay vì path
          // Upload buffer trực tiếp lên Cloudinary
          const uploadResult = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              {
                folder: "staff_reports",
                resource_type: "image",
              },
              (error, result) => {
                if (error) reject(error);
                else resolve(result);
              }
            );
            stream.end(file.buffer);
          });

          images.push({
            imageUrl: uploadResult.secure_url,
            imagePublicId: uploadResult.public_id,
          });
        }
      } catch (uploadError) {
        console.error("Error uploading to Cloudinary:", uploadError);

        // Nếu lỗi giữa chừng, xóa các ảnh đã upload
        for (const img of images) {
          try {
            await cloudinary.uploader.destroy(img.imagePublicId);
          } catch (err) {
            console.error("Error cleaning up:", err);
          }
        }

        return res.status(500).json({
          message: "Lỗi khi upload hình ảnh",
          error: uploadError.message,
        });
      }
    }

    // Tạo report mới
    const newReport = new StaffReport({
      title,
      content,
      userId,
      station_id, // Tự động lấy từ account đang đăng nhập
      images,
    });

    await newReport.save();

    // Populate thông tin user và station
    await newReport.populate("userId", "username email role");
    await newReport.populate("station_id", "name address");

    res.status(201).json({
      message: "Tạo report thành công",
      report: newReport,
    });
  } catch (error) {
    console.error("Error creating report:", error);
    res.status(500).json({
      message: "Lỗi khi tạo report",
      error: error.message,
    });
  }
};

// Lấy tất cả reports (Read All)
exports.getAllReports = async (req, res) => {
  try {
    const { status, userId } = req.query;
    const filter = {};

    if (status) {
      filter.status = status;
    }

    if (userId) {
      filter.userId = userId;
    }

    const reports = await StaffReport.find(filter)
      .populate("userId", "username email role")
      .sort({ createdAt: -1 }); // Sắp xếp mới nhất trước

    res.status(200).json({
      total: reports.length,
      reports,
    });
  } catch (error) {
    console.error("Error getting reports:", error);
    res.status(500).json({
      message: "Lỗi khi lấy danh sách reports",
      error: error.message,
    });
  }
};

// Lấy report theo ID (Read One)
exports.getReportById = async (req, res) => {
  try {
    const { id } = req.params;

    const report = await StaffReport.findById(id).populate(
      "userId",
      "username email role"
    );

    if (!report) {
      return res.status(404).json({
        message: "Không tìm thấy report",
      });
    }

    res.status(200).json(report);
  } catch (error) {
    console.error("Error getting report:", error);
    res.status(500).json({
      message: "Lỗi khi lấy report",
      error: error.message,
    });
  }
};

// Lấy reports của user hiện tại
exports.getMyReports = async (req, res) => {
  try {
    const userId = req.user.accountId;

    const reports = await StaffReport.find({ userId })
      .populate("userId", "username email role")
      .sort({ createdAt: -1 });

    res.status(200).json({
      total: reports.length,
      reports,
    });
  } catch (error) {
    console.error("Error getting my reports:", error);
    res.status(500).json({
      message: "Lỗi khi lấy danh sách reports của bạn",
      error: error.message,
    });
  }
};

// Cập nhật report (Update)
exports.updateReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, status, removeImageIds } = req.body;
    const userId = req.user.accountId;

    // Tìm report
    const report = await StaffReport.findById(id);

    if (!report) {
      return res.status(404).json({
        message: "Không tìm thấy report",
      });
    }

    // Kiểm tra quyền: chỉ người tạo hoặc admin mới được update
    if (
      report.userId.toString() !== userId.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        message: "Bạn không có quyền cập nhật report này",
      });
    }

    // Cập nhật các trường
    if (title) report.title = title;
    if (content) report.content = content;
    if (status && req.user.role === "admin") {
      // Chỉ admin mới được đổi status
      report.status = status;
    }

    // Xóa các ảnh được chỉ định (nếu có)
    if (removeImageIds) {
      try {
        const idsToRemove = Array.isArray(removeImageIds)
          ? removeImageIds
          : [removeImageIds];

        for (const publicId of idsToRemove) {
          // Tìm và xóa ảnh khỏi Cloudinary
          const imageToRemove = report.images.find(
            (img) => img.imagePublicId === publicId
          );
          if (imageToRemove) {
            await cloudinary.uploader.destroy(publicId);
            report.images = report.images.filter(
              (img) => img.imagePublicId !== publicId
            );
          }
        }
      } catch (deleteError) {
        console.error("Error deleting images:", deleteError);
      }
    }

    // Nếu có files mới, upload và thêm vào mảng
    if (req.files && req.files.length > 0) {
      try {
        const newImages = [];

        // Upload từng ảnh mới
        for (const file of req.files) {
          // Với memoryStorage, file được lưu trong buffer thay vì path
          const uploadResult = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              {
                folder: "staff_reports",
                resource_type: "image",
              },
              (error, result) => {
                if (error) reject(error);
                else resolve(result);
              }
            );
            stream.end(file.buffer);
          });

          newImages.push({
            imageUrl: uploadResult.secure_url,
            imagePublicId: uploadResult.public_id,
          });
        }

        // Thêm ảnh mới vào mảng
        report.images = [...report.images, ...newImages];
      } catch (uploadError) {
        console.error("Error uploading to Cloudinary:", uploadError);
        return res.status(500).json({
          message: "Lỗi khi upload hình ảnh",
          error: uploadError.message,
        });
      }
    }

    await report.save();
    await report.populate("userId", "username email role");

    res.status(200).json({
      message: "Cập nhật report thành công",
      report,
    });
  } catch (error) {
    console.error("Error updating report:", error);
    res.status(500).json({
      message: "Lỗi khi cập nhật report",
      error: error.message,
    });
  }
};

// Xóa report (Delete)
exports.deleteReport = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.accountId;

    const report = await StaffReport.findById(id);

    if (!report) {
      return res.status(404).json({
        message: "Không tìm thấy report",
      });
    }

    // Kiểm tra quyền: chỉ người tạo hoặc admin mới được xóa
    if (
      report.userId.toString() !== userId.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        message: "Bạn không có quyền xóa report này",
      });
    }

    // Xóa tất cả ảnh trên Cloudinary
    if (report.images && report.images.length > 0) {
      for (const image of report.images) {
        try {
          await cloudinary.uploader.destroy(image.imagePublicId);
        } catch (deleteError) {
          console.error("Error deleting image from Cloudinary:", deleteError);
          // Tiếp tục xóa các ảnh khác
        }
      }
    }

    await StaffReport.findByIdAndDelete(id);

    res.status(200).json({
      message: "Xóa report thành công",
    });
  } catch (error) {
    console.error("Error deleting report:", error);
    res.status(500).json({
      message: "Lỗi khi xóa report",
      error: error.message,
    });
  }
};

// Cập nhật status report (chỉ dành cho admin)
exports.updateReportStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["pending", "processing", "resolved", "rejected"].includes(status)) {
      return res.status(400).json({
        message: "Status không hợp lệ",
      });
    }

    const report = await StaffReport.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).populate("userId", "username email role");

    if (!report) {
      return res.status(404).json({
        message: "Không tìm thấy report",
      });
    }

    res.status(200).json({
      message: "Cập nhật status thành công",
      report,
    });
  } catch (error) {
    console.error("Error updating status:", error);
    res.status(500).json({
      message: "Lỗi khi cập nhật status",
      error: error.message,
    });
  }
};

// Lấy tất cả staff không có station (station_id = null)
exports.getStaffWithoutStation = async (req, res) => {
  try {
    const staffs = await Account.find({
      role: "staff",
      station_id: null,
    })
      .select("-password")
      .populate("company_id", "name address contact_email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      total: staffs.length,
      staffs,
    });
  } catch (error) {
    console.error("Error getting staff without station:", error);
    res.status(500).json({
      message: "Lỗi khi lấy danh sách staff không có station",
      error: error.message,
    });
  }
};

// Lấy tất cả staff trong một station cụ thể
exports.getStaffInStation = async (req, res) => {
  try {
    const { station_id } = req.params;

    if (!station_id) {
      return res.status(400).json({
        message: "station_id là bắt buộc",
      });
    }

    const staffs = await Account.find({
      role: "staff",
      station_id: station_id,
    })
      .select("-password")
      .populate("station_id", "name address")
      .populate("company_id", "name address contact_email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      station_id: station_id,
      total: staffs.length,
      staffs,
    });
  } catch (error) {
    console.error("Error getting staff in station:", error);
    res.status(500).json({
      message: "Lỗi khi lấy danh sách staff trong station",
      error: error.message,
    });
  }
};
