const Invoice = require('../models/Invoice');
const ChargingSession = require('../models/ChargingSession');
const { default: mongoose } = require('mongoose');

// ============== GET ALL INVOICES (ADMIN) ==============
exports.getAllInvoices = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      payment_status,
      user_id,
      station_id,
    } = req.query;

    let filter = {};
    if (payment_status) filter.payment_status = payment_status;
    if (user_id) filter.user_id = user_id;
    if (station_id) filter.station_id = station_id;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // ✅ BỎ POPULATE, CHỈ LẤY DATA TỪ INVOICE
    const invoices = await Invoice.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Invoice.countDocuments(filter);

    // Thống kê tổng doanh thu
    const stats = await Invoice.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          total_revenue: { $sum: '$total_amount' },
          total_energy: { $sum: '$energy_delivered_kwh' },
          count: { $sum: 1 },
        },
      },
    ]);

    // ✅ FORMAT RESPONSE VỚI DATA ĐÃ LƯU TRONG INVOICE
    const formattedInvoices = invoices.map((inv) => ({
      id: inv._id,
      created_at: inv.createdAt,

      // ✅ LẤY TỪ INVOICE (đã lưu sẵn)
      station: inv.station_name,
      address: inv.station_address,
      vehicle: `${inv.vehicle_model} - ${inv.vehicle_plate_number}`,
      start_time: inv.start_time,
      end_time: inv.end_time,
      duration: inv.charging_duration_formatted,
      energy_delivered: `${inv.energy_delivered_kwh.toFixed(2)} kWh`,
      battery_charged: `${inv.battery_charged_percentage}%`,
      total_amount: `${inv.total_amount.toLocaleString('vi-VN')} đ`,
      payment_status: inv.payment_status,
      payment_method: inv.payment_method,
    }));

    res.status(200).json({
      invoices: formattedInvoices,
      statistics: stats[0] || { total_revenue: 0, total_energy: 0, count: 0 },
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

// ============== GET USER'S INVOICES ==============
exports.getUserInvoices = async (req, res) => {
  try {
    const { user_id } = req.params;
    const { page = 1, limit = 10, payment_status } = req.query;
    
    let filter = { user_id };
    if (payment_status) filter.payment_status = payment_status;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const invoices = await Invoice.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Invoice.countDocuments(filter);
    
    // ✅ Tính tổng theo payment_status (unpaid không bao gồm base_fee)
    const summary = await Invoice.aggregate([
      { $match: { user_id: new mongoose.Types.ObjectId(user_id) } },
      {
        $group: {
          _id: '$payment_status',
          count: { $sum: 1 },
          // ✅ Nếu unpaid chỉ lấy charging_fee, còn paid lấy total_amount
          total_amount: { 
            $sum: { 
              $cond: [
                { $eq: ['$payment_status', 'unpaid'] },
                '$charging_fee',  // Chỉ phí sạc
                '$total_amount'   // Tổng đầy đủ
              ]
            }
          },
          total_energy: { $sum: '$energy_delivered_kwh' },
        },
      },
    ]);
    
    // Format summary
    const unpaid = summary.find(s => s._id === 'unpaid') || { count: 0, total_amount: 0, total_energy: 0 };
    const paid = summary.find(s => s._id === 'paid') || { count: 0, total_amount: 0, total_energy: 0 };
    
    const formattedInvoices = invoices.map(inv => ({
      id: inv._id,
      created_at: inv.createdAt,
      
      station: inv.station_name,
      address: inv.station_address,
      vehicle: `${inv.vehicle_model} - ${inv.vehicle_plate_number}`,
      
      duration: inv.charging_duration_formatted,
      energy_delivered: `${inv.energy_delivered_kwh.toFixed(2)} kWh`,
      battery_charged: `${inv.battery_charged_percentage}%`,
      
      // ✅ Hiển thị số tiền cần trả (unpaid = charging_fee, paid = total_amount)
      total_amount: inv.payment_status === 'unpaid' 
        ? `${inv.charging_fee.toLocaleString('vi-VN')} đ`
        : `${inv.total_amount.toLocaleString('vi-VN')} đ`,
      payment_status: inv.payment_status,
      payment_method: inv.payment_method,
    }));
    
    res.status(200).json({
      invoices: formattedInvoices,
      summary: {
        total_invoices: total,
        unpaid: {
          count: unpaid.count,
          total_amount: `${unpaid.total_amount.toLocaleString('vi-VN')} đ`,  // Chỉ charging_fee
          total_energy: `${unpaid.total_energy.toFixed(2)} kWh`,
          note: 'Base fee already paid at booking confirmation'
        },
        paid: {
          count: paid.count,
          total_amount: `${paid.total_amount.toLocaleString('vi-VN')} đ`,  // Total amount đầy đủ
          total_energy: `${paid.total_energy.toFixed(2)} kWh`,
        },
      },
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

// ============== GET INVOICE DETAIL ==============
exports.getInvoiceDetail = async (req, res) => {
  try {
    const { invoice_id } = req.params;

    // ✅ BỎ POPULATE, CHỈ LẤY DATA ĐÃ LƯU
    const invoice = await Invoice.findById(invoice_id);

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // ✅ FORMAT RESPONSE ĐẦY ĐỦ
    res.status(200).json({
      invoice_info: {
        id: invoice._id,
        created_at: invoice.createdAt,
      },
      station_info: {
        name: invoice.station_name,
        address: invoice.station_address,
      },
      vehicle_info: {
        model: invoice.vehicle_model,
        plate_number: invoice.vehicle_plate_number,
        battery_capacity: `${invoice.battery_capacity_kwh} kWh`,
      },
      charging_session: {
        start_time: invoice.start_time,
        end_time: invoice.end_time,
        duration: invoice.charging_duration_formatted,

        initial_battery: `${invoice.initial_battery_percentage}%`,
        final_battery: `${invoice.final_battery_percentage}%`,
        target_battery: `${invoice.target_battery_percentage}%`,
        battery_charged: `${invoice.battery_charged_percentage}%`,
        target_reached: invoice.target_reached,

        energy_delivered: `${invoice.energy_delivered_kwh.toFixed(2)} kWh`,
        power_capacity: `${invoice.power_capacity_kw} kW`,
        calculation_method: invoice.calculation_method,
      },
      pricing: {
        base_fee: invoice.base_fee,
        base_fee_formatted: `${invoice.base_fee.toLocaleString('vi-VN')} đ`,
        price_per_kwh: invoice.price_per_kwh,
        price_per_kwh_formatted: `${invoice.price_per_kwh.toLocaleString(
          'vi-VN'
        )} đ/kWh`,
        charging_fee: invoice.charging_fee,
        charging_fee_formatted: `${invoice.charging_fee.toLocaleString(
          'vi-VN'
        )} đ`,
        total_amount: invoice.total_amount,
        total_amount_formatted: `${invoice.total_amount.toLocaleString(
          'vi-VN'
        )} đ`,
        breakdown: invoice.formatted.breakdown,
      },
      payment: {
        status: invoice.payment_status,
        method: invoice.payment_method,
        payment_date: invoice.payment_date,
        transaction_id: invoice.transaction_id,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ============== UPDATE PAYMENT STATUS ==============
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { invoice_id } = req.params;
    const { payment_status, payment_method, transaction_id, notes } = req.body;

    const invoice = await Invoice.findById(invoice_id);

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // Validate payment_status
    const validStatuses = ['unpaid', 'paid', 'refunded', 'cancelled'];
    if (payment_status && !validStatuses.includes(payment_status)) {
      return res.status(400).json({
        message: 'Invalid payment status',
        valid_statuses: validStatuses,
      });
    }

    // ✅ CHỈ CHO PHÉP VNPAY
    if (payment_method && payment_method !== 'vnpay') {
      return res.status(400).json({
        message: 'Invalid payment method. Only VNPay is supported.',
        valid_method: 'vnpay',
      });
    }

    // Update
    if (payment_status) invoice.payment_status = payment_status;
    if (payment_method) invoice.payment_method = payment_method;
    if (transaction_id) invoice.transaction_id = transaction_id;
    if (notes) invoice.notes = notes;

    if (payment_status === 'paid' && !invoice.payment_date) {
      invoice.payment_date = new Date();
    }

    await invoice.save();

    res.status(200).json({
      message: 'Payment status updated successfully',
      invoice: {
        id: invoice._id,
        payment_status: invoice.payment_status,
        payment_method: invoice.payment_method,
        payment_date: invoice.payment_date,
        transaction_id: invoice.transaction_id,
        total_amount: `${invoice.total_amount.toLocaleString('vi-VN')} đ`,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ============== GET UNPAID INVOICES ==============
exports.getUnpaidInvoices = async (req, res) => {
  try {
    const { user_id } = req.params;
    
    const invoices = await Invoice.find({
      user_id,
      payment_status: 'unpaid',
    }).sort({ createdAt: -1 });
    
    // ✅ Tổng unpaid chỉ tính charging_fee
    const totalUnpaid = invoices.reduce((sum, inv) => sum + inv.charging_fee, 0);
    
    const formattedInvoices = invoices.map(inv => ({
      id: inv._id,
      created_at: inv.createdAt,
      station: inv.station_name,
      vehicle: `${inv.vehicle_model} - ${inv.vehicle_plate_number}`,
      energy_delivered: `${inv.energy_delivered_kwh.toFixed(2)} kWh`,
      // ✅ Chỉ hiển thị charging_fee
      charging_fee: `${inv.charging_fee.toLocaleString('vi-VN')} đ`,
      base_fee_paid: `${inv.base_fee.toLocaleString('vi-VN')} đ`,
      duration: inv.charging_duration_formatted,
    }));
    
    res.status(200).json({
      unpaid_invoices: formattedInvoices,
      summary: {
        count: invoices.length,
        total_unpaid: totalUnpaid,  // Chỉ charging_fee
        total_unpaid_formatted: `${totalUnpaid.toLocaleString('vi-VN')} đ`,
        note: 'Base fee already paid at booking confirmation. Amount shown is charging fee only.'
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
