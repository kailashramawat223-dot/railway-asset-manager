const express = require('express');
const router = express.Router();
const Asset = require('../models/Asset');
const { protect } = require('../middleware/auth');

// Helper: escape CSV cell
const csvCell = (val) => {
  if (val === null || val === undefined) return '';
  const str = String(val).replace(/"/g, '""');
  return str.includes(',') || str.includes('"') || str.includes('\n') ? `"${str}"` : str;
};

// @route GET /api/export/csv
router.get('/csv', protect, async (req, res) => {
  try {
    const { status, category, zone } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (zone) filter['location.zone'] = zone;

    const assets = await Asset.find(filter)
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    const headers = [
      'Asset ID', 'Name', 'Category', 'Status', 'Serial Number',
      'Zone', 'Division', 'Station', 'Track',
      'Manufacturer', 'Model',
      'Purchase Date', 'Warranty Expiry',
      'Last Inspected', 'Next Inspection Due',
      'Total Maintenance Logs', 'Description', 'Created By', 'Created At'
    ];

    const rows = assets.map(a => [
      a.assetId, a.name, a.category, a.status, a.serialNumber || '',
      a.location?.zone || '', a.location?.division || '',
      a.location?.station || '', a.location?.track || '',
      a.manufacturer || '', a.model || '',
      a.purchaseDate ? new Date(a.purchaseDate).toLocaleDateString('en-IN') : '',
      a.warrantyExpiry ? new Date(a.warrantyExpiry).toLocaleDateString('en-IN') : '',
      a.lastInspectionDate ? new Date(a.lastInspectionDate).toLocaleDateString('en-IN') : '',
      a.nextInspectionDate ? new Date(a.nextInspectionDate).toLocaleDateString('en-IN') : '',
      a.maintenanceLogs?.length || 0,
      a.description || '',
      a.createdBy?.name || '',
      new Date(a.createdAt).toLocaleDateString('en-IN')
    ].map(csvCell));

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="railtrack_assets_${Date.now()}.csv"`);
    res.send(csv);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route GET /api/export/json
router.get('/json', protect, async (req, res) => {
  try {
    const assets = await Asset.find()
      .populate('createdBy', 'name email')
      .select('-qrCode') // exclude large base64
      .sort({ createdAt: -1 });

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="railtrack_assets_${Date.now()}.json"`);
    res.send(JSON.stringify({ exported: new Date(), total: assets.length, assets }, null, 2));
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route GET /api/export/maintenance-csv
router.get('/maintenance-csv', protect, async (req, res) => {
  try {
    const assets = await Asset.find({ 'maintenanceLogs.0': { $exists: true } })
      .select('assetId name category maintenanceLogs');

    const headers = ['Asset ID', 'Asset Name', 'Category', 'Date', 'Type', 'Description', 'Technician', 'Cost (INR)', 'Next Scheduled'];
    const rows = [];

    for (const a of assets) {
      for (const log of a.maintenanceLogs) {
        rows.push([
          a.assetId, a.name, a.category,
          log.date ? new Date(log.date).toLocaleDateString('en-IN') : '',
          log.type, log.description, log.technician,
          log.cost || 0,
          log.nextScheduled ? new Date(log.nextScheduled).toLocaleDateString('en-IN') : ''
        ].map(csvCell));
      }
    }

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="railtrack_maintenance_${Date.now()}.csv"`);
    res.send(csv);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
