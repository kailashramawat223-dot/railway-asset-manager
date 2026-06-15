const express = require('express');
const router = express.Router();
const Asset = require('../models/Asset');
const { protect } = require('../middleware/auth');

// @route GET /api/notifications
// Returns overdue inspections, faulty assets, warranty expiring soon
router.get('/', protect, async (req, res) => {
  try {
    const now = new Date();
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const in7Days  = new Date(now.getTime() + 7  * 24 * 60 * 60 * 1000);

    const [overdueInspections, faultyAssets, warrantyExpiring, maintenanceDue] = await Promise.all([
      // Inspections overdue (past due date, not decommissioned)
      Asset.find({
        nextInspectionDate: { $lt: now },
        status: { $ne: 'Decommissioned' }
      }).select('assetId name location status nextInspectionDate category').limit(20),

      // Faulty assets
      Asset.find({ status: 'Faulty' })
        .select('assetId name location category lastInspectionDate').limit(20),

      // Warranty expiring within 30 days
      Asset.find({
        warrantyExpiry: { $gte: now, $lte: in30Days }
      }).select('assetId name warrantyExpiry category location').limit(20),

      // Next inspection due within 7 days
      Asset.find({
        nextInspectionDate: { $gte: now, $lte: in7Days },
        status: { $ne: 'Decommissioned' }
      }).select('assetId name nextInspectionDate location category').limit(20),
    ]);

    const notifications = [
      ...overdueInspections.map(a => ({
        type: 'overdue',
        severity: 'high',
        assetId: a.assetId,
        assetDbId: a._id,
        name: a.name,
        category: a.category,
        location: a.location?.zone,
        message: `Inspection overdue since ${new Date(a.nextInspectionDate).toLocaleDateString('en-IN')}`,
        date: a.nextInspectionDate
      })),
      ...faultyAssets.map(a => ({
        type: 'faulty',
        severity: 'high',
        assetId: a.assetId,
        assetDbId: a._id,
        name: a.name,
        category: a.category,
        location: a.location?.zone,
        message: `Asset is marked as Faulty`,
        date: a.lastInspectionDate
      })),
      ...warrantyExpiring.map(a => ({
        type: 'warranty',
        severity: 'medium',
        assetId: a.assetId,
        assetDbId: a._id,
        name: a.name,
        category: a.category,
        location: a.location?.zone,
        message: `Warranty expires on ${new Date(a.warrantyExpiry).toLocaleDateString('en-IN')}`,
        date: a.warrantyExpiry
      })),
      ...maintenanceDue.map(a => ({
        type: 'upcoming',
        severity: 'low',
        assetId: a.assetId,
        assetDbId: a._id,
        name: a.name,
        category: a.category,
        location: a.location?.zone,
        message: `Inspection due on ${new Date(a.nextInspectionDate).toLocaleDateString('en-IN')}`,
        date: a.nextInspectionDate
      })),
    ];

    res.json({
      success: true,
      count: notifications.length,
      summary: {
        overdue: overdueInspections.length,
        faulty: faultyAssets.length,
        warrantyExpiring: warrantyExpiring.length,
        upcomingInspections: maintenanceDue.length
      },
      notifications
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
