const express = require('express');
const router = express.Router();
const QRCode = require('qrcode');
const Asset = require('../models/Asset');
const { protect, authorize } = require('../middleware/auth');

// Generate QR code for an asset
const generateQR = async (assetId, frontendUrl) => {
  const qrData = `${frontendUrl || 'http://localhost:3000'}/pages/asset-public.html?id=${assetId}`;
  const qrImage = await QRCode.toDataURL(qrData, {
    errorCorrectionLevel: 'H',
    margin: 2,
    width: 300,
    color: { dark: '#1a2744', light: '#ffffff' }
  });
  return { qrImage, qrData };
};

// @route   GET /api/assets
router.get('/', protect, async (req, res) => {
  try {
    const { status, category, zone, search, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (category) filter.category = category;
    if (zone) filter['location.zone'] = zone;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { assetId: { $regex: search, $options: 'i' } },
        { serialNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await Asset.countDocuments(filter);
    const assets = await Asset.find(filter)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .select('-qrCode'); // Exclude large QR base64 from list view

    res.json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      assets
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/assets/stats
router.get('/stats', protect, async (req, res) => {
  try {
    const total = await Asset.countDocuments();
    const byStatus = await Asset.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    const byCategory = await Asset.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);
    res.json({ success: true, total, byStatus, byCategory });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/assets/:id  (public access for QR scanning)
router.get('/:id', async (req, res) => {
  try {
    const asset = await Asset.findOne({
      $or: [{ _id: req.params.id }, { assetId: req.params.id }]
    })
      .populate('createdBy', 'name')
      .populate('updatedBy', 'name');

    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found.' });
    }

    res.json({ success: true, asset });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/assets
router.post('/', protect, authorize('admin', 'inspector'), async (req, res) => {
  try {
    const assetData = { ...req.body, createdBy: req.user._id };
    const asset = new Asset(assetData);
    await asset.validate();

    // Generate QR after assetId is set
    const frontendUrl = req.headers.origin || 'http://localhost:3000';
    const { qrImage, qrData } = await generateQR(asset.assetId, frontendUrl);
    asset.qrCode = qrImage;
    asset.qrCodeData = qrData;

    await asset.save();

    res.status(201).json({ success: true, message: 'Asset created successfully.', asset });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/assets/:id
router.put('/:id', protect, authorize('admin', 'inspector'), async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id);
    if (!asset) return res.status(404).json({ success: false, message: 'Asset not found.' });

    const updates = { ...req.body, updatedBy: req.user._id };
    delete updates.assetId;  // Cannot change asset ID
    delete updates.qrCode;
    delete updates.qrCodeData;

    Object.assign(asset, updates);
    await asset.save();

    res.json({ success: true, message: 'Asset updated successfully.', asset });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   DELETE /api/assets/:id
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const asset = await Asset.findByIdAndDelete(req.params.id);
    if (!asset) return res.status(404).json({ success: false, message: 'Asset not found.' });
    res.json({ success: true, message: 'Asset deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/assets/:id/maintenance
router.post('/:id/maintenance', protect, authorize('admin', 'inspector'), async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id);
    if (!asset) return res.status(404).json({ success: false, message: 'Asset not found.' });

    asset.maintenanceLogs.push(req.body);
    asset.lastInspectionDate = req.body.date;
    if (req.body.nextScheduled) asset.nextInspectionDate = req.body.nextScheduled;
    asset.updatedBy = req.user._id;

    await asset.save();
    res.json({ success: true, message: 'Maintenance log added.', asset });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/assets/:id/qr  — returns QR image only
router.get('/:id/qr', protect, async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id).select('qrCode assetId name');
    if (!asset) return res.status(404).json({ success: false, message: 'Asset not found.' });
    res.json({ success: true, qrCode: asset.qrCode, assetId: asset.assetId, name: asset.name });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
