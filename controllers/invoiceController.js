const Invoice = require('../models/Invoice');
const ChargingSession = require('../models/ChargingSession');

// ============== GET ALL INVOICES (ADMIN) ==============
exports.getAllInvoices = async (req, res) => {
  try {
    const { page = 1, limit = 10, payment_status, user_id, station_id } = req.query;
    
    let filter = {};
    if (payment_status) filter.payment_status = payment_status;
    if (user_id) filter.user_id = user_id;
    if (station_id) filter.station_id = station_id;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const invoices = await Invoice.find(filter)
      .populate('user_id', 'username email phone')
      .populate('vehicle_id', 'plate_number model')
      .populate('station_id', 'name address')
      .populate('chargingPoint_id', 'name')
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
    
    res.status(200).json({
      invoices,
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
      .populate('vehicle_id', 'plate_number model battery_capacity')
      .populate('station_id', 'name address')
      .populate('chargingPoint_id', 'name connector_type')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Invoice.countDocuments(filter);
    
    // Thống kê theo trạng thái thanh toán
    const stats = await Invoice.aggregate([
      { $match: { user_id: filter.user_id } },
      {
        $group: {
          _id: '$payment_status',
          total_amount: { $sum: '$total_amount' },
          total_energy: { $sum: '$energy_delivered_kwh' },
          count: { $sum: 1 },
        },
      },
    ]);
    
    // Tổng hợp
    const summary = {
      total_invoices: total,
      unpaid: stats.find(s => s._id === 'unpaid') || { total_amount: 0, total_energy: 0, count: 0 },
      paid: stats.find(s => s._id === 'paid') || { total_amount: 0, total_energy: 0, count: 0 },
      refunded: stats.find(s => s._id === 'refunded') || { total_amount: 0, total_energy: 0, count: 0 },
    };
    
    res.status(200).json({
      invoices: invoices.map(inv => ({
        id: inv._id,
        created_at: inv.createdAt,
        
        // Station & Vehicle
        station: inv.station_name,
        address: inv.station_address,
        vehicle: `${inv.vehicle_model} - ${inv.vehicle_plate_number}`,
        
        // Charging Info
        start_time: inv.start_time,
        end_time: inv.end_time,
        duration: inv.charging_duration_formatted,
        
        // Energy
        energy_delivered: `${inv.energy_delivered_kwh.toFixed(2)} kWh`,
        battery_charged: `${inv.battery_charged_percentage}%`,
        
        // Pricing
        total_amount: `${inv.total_amount.toLocaleString('vi-VN')} VND`,
        payment_status: inv.payment_status,
        payment_method: inv.payment_method,
        payment_date: inv.payment_date,
      })),
      summary: {
        total_invoices: summary.total_invoices,
        unpaid: {
          count: summary.unpaid.count,
          total_amount: `${summary.unpaid.total_amount.toLocaleString('vi-VN')} VND`,
          total_energy: `${summary.unpaid.total_energy.toFixed(2)} kWh`,
        },
        paid: {
          count: summary.paid.count,
          total_amount: `${summary.paid.total_amount.toLocaleString('vi-VN')} VND`,
          total_energy: `${summary.paid.total_energy.toFixed(2)} kWh`,
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
    
    const invoice = await Invoice.findById(invoice_id)
      .populate('user_id', 'username email phone')
      .populate('vehicle_id', 'plate_number model battery_capacity')
      .populate('station_id', 'name address location')
      .populate('chargingPoint_id', 'name connector_type')
      .populate('session_id')
      .populate('booking_id');
    
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    
    res.status(200).json({
      invoice_info: {
        id: invoice._id,
        created_at: invoice.createdAt,
        updated_at: invoice.updatedAt,
      },
      
      user_info: {
        id: invoice.user_id._id,
        username: invoice.user_id.username,
        email: invoice.user_id.email,
        phone: invoice.user_id.phone,
      },
      
      station_info: {
        id: invoice.station_id._id,
        name: invoice.station_name,
        address: invoice.station_address,
        charging_point: invoice.chargingPoint_id.name,
        connector_type: invoice.chargingPoint_id.connector_type,
      },
      
      vehicle_info: {
        id: invoice.vehicle_id._id,
        model: invoice.vehicle_model,
        plate_number: invoice.vehicle_plate_number,
        battery_capacity: `${invoice.battery_capacity_kwh} kWh`,
      },
      
      charging_session: {
        session_id: invoice.session_id._id,
        booking_id: invoice.booking_id._id,
        
        start_time: invoice.start_time,
        end_time: invoice.end_time,
        duration: invoice.charging_duration_formatted,
        duration_minutes: invoice.charging_duration_minutes,
        duration_hours: invoice.charging_duration_hours,
        
        initial_battery: `${invoice.initial_battery_percentage}%`,
        final_battery: `${invoice.final_battery_percentage}%`,
        target_battery: `${invoice.target_battery_percentage}%`,
        battery_charged: `${invoice.battery_charged_percentage}%`,
        target_reached: invoice.target_reached,
        
        power_capacity: `${invoice.power_capacity_kw} kW`,
        energy_delivered: `${invoice.energy_delivered_kwh.toFixed(2)} kWh`,
        charging_efficiency: `${(invoice.charging_efficiency * 100)}%`,
        calculation_method: invoice.calculation_method,
      },
      
      pricing: {
        base_fee: invoice.base_fee,
        base_fee_formatted: `${invoice.base_fee.toLocaleString('vi-VN')} VND`,
        
        price_per_kwh: invoice.price_per_kwh,
        price_per_kwh_formatted: `${invoice.price_per_kwh.toLocaleString('vi-VN')} VND/kWh`,
        
        charging_fee: invoice.charging_fee,
        charging_fee_formatted: `${invoice.charging_fee.toLocaleString('vi-VN')} VND`,
        
        total_amount: invoice.total_amount,
        total_amount_formatted: `${invoice.total_amount.toLocaleString('vi-VN')} VND`,
        
        breakdown: `${invoice.base_fee.toLocaleString('vi-VN')} VND (phí cơ bản) + ${invoice.energy_delivered_kwh.toFixed(2)} kWh × ${invoice.price_per_kwh.toLocaleString('vi-VN')} VND/kWh = ${invoice.total_amount.toLocaleString('vi-VN')} VND`,
      },
      
      payment: {
        status: invoice.payment_status,
        method: invoice.payment_method,
        payment_date: invoice.payment_date,
        transaction_id: invoice.transaction_id,
      },
      
      notes: invoice.notes,
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
    if (!validStatuses.includes(payment_status)) {
      return res.status(400).json({
        message: 'Invalid payment status',
        valid_statuses: validStatuses,
      });
    }
    
    // Validate payment_method (chỉ chấp nhận vnpay)
    if (payment_method && payment_method !== 'vnpay') {
      return res.status(400).json({
        message: 'Invalid payment method. Only VNPay is supported.',
        valid_method: 'vnpay',
      });
    }
    
    // Update fields
    invoice.payment_status = payment_status;
    if (payment_method) invoice.payment_method = payment_method;
    if (transaction_id) invoice.transaction_id = transaction_id;
    if (notes) invoice.notes = notes;
    
    // Set payment_date when status changes to 'paid'
    if (payment_status === 'paid' && invoice.payment_status !== 'paid') {
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
        total_amount: `${invoice.total_amount.toLocaleString('vi-VN')} VND`,
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
    })
      .populate('station_id', 'name address')
      .populate('vehicle_id', 'plate_number model')
      .sort({ createdAt: -1 });
    
    const total_unpaid = invoices.reduce((sum, inv) => sum + inv.total_amount, 0);
    
    res.status(200).json({
      unpaid_invoices: invoices.map(inv => ({
        id: inv._id,
        created_at: inv.createdAt,
        station: inv.station_name,
        vehicle: `${inv.vehicle_model} - ${inv.vehicle_plate_number}`,
        energy_delivered: `${inv.energy_delivered_kwh.toFixed(2)} kWh`,
        total_amount: `${inv.total_amount.toLocaleString('vi-VN')} VND`,
        duration: inv.charging_duration_formatted,
      })),
      summary: {
        count: invoices.length,
        total_unpaid: total_unpaid,
        total_unpaid_formatted: `${total_unpaid.toLocaleString('vi-VN')} VND`,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
