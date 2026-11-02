import express, { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import verifyToken from '../middlewares/verifyToken';
import checkRoles from '../middlewares/checkRoles';
import User from '../models/user';
import Block from '../models/block';
import Report from '../models/report';
import Room from '../models/room';
import { matchingService } from '../services/matchingService';
import { io } from '../app';

const router: Router = express.Router();

// Strict rate limiter for reports and blocks (max 10 actions per 5 minutes per user)
const moderationActionLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 10,
  message: { error: 'Too many moderation requests. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// POST /moderation/block/:publicId - Block a user
router.post('/block/:publicId', verifyToken, moderationActionLimiter, async (req: Request, res: Response) => {
  try {
    const targetPublicId = Number(req.params.publicId);
    if (!targetPublicId || isNaN(targetPublicId)) {
      res.sendError(400, 'Invalid public ID format');
      return;
    }

    const caller = await User.findOne({ username: req.user?.username, isDeleted: false });
    if (!caller) {
      res.sendError(404, 'User not found');
      return;
    }

    if (caller.publicId === targetPublicId) {
      res.sendError(400, 'You cannot block yourself');
      return;
    }

    const targetUser = await User.findOne({ publicId: targetPublicId, isDeleted: false });
    if (!targetUser) {
      res.sendError(404, 'Target user not found');
      return;
    }

    // Check if already blocked
    const existingBlock = await Block.findOne({
      blockerId: caller._id,
      blockedId: targetUser._id,
    });

    if (!existingBlock) {
      await Block.create({
        blockerId: caller._id,
        blockedId: targetUser._id,
      });
      matchingService.addBlock(caller._id.toString(), targetUser._id.toString());
    }

    res.sendResponse(200, {
      message: `User #${targetPublicId} has been blocked`,
      blockedPublicId: targetPublicId,
    });
  } catch (error) {
    res.sendError(500, error);
  }
});

// DELETE /moderation/block/:publicId - Unblock a user
router.delete('/block/:publicId', verifyToken, async (req: Request, res: Response) => {
  try {
    const targetPublicId = Number(req.params.publicId);
    const caller = await User.findOne({ username: req.user?.username, isDeleted: false });
    if (!caller) {
      res.sendError(404, 'User not found');
      return;
    }

    const targetUser = await User.findOne({ publicId: targetPublicId, isDeleted: false });
    if (!targetUser) {
      res.sendError(404, 'Target user not found');
      return;
    }

    await Block.deleteOne({
      blockerId: caller._id,
      blockedId: targetUser._id,
    });

    matchingService.removeBlock(caller._id.toString(), targetUser._id.toString());

    res.sendResponse(200, {
      message: `User #${targetPublicId} has been unblocked`,
    });
  } catch (error) {
    res.sendError(500, error);
  }
});

// GET /moderation/blocks - List all blocked users for caller
router.get('/blocks', verifyToken, async (req: Request, res: Response) => {
  try {
    const caller = await User.findOne({ username: req.user?.username, isDeleted: false });
    if (!caller) {
      res.sendError(404, 'User not found');
      return;
    }

    const blocks = await Block.find({ blockerId: caller._id }).populate(
      'blockedId',
      'publicId username gender createdAt',
    );

    res.sendResponse(200, { blocks });
  } catch (error) {
    res.sendError(500, error);
  }
});

// POST /moderation/report - Submit a report against a user or conversation
router.post('/report', verifyToken, moderationActionLimiter, async (req: Request, res: Response) => {
  try {
    const { targetPublicId, roomId, reason } = req.body;

    if (!targetPublicId || isNaN(Number(targetPublicId))) {
      res.sendError(400, 'Valid target public ID is required');
      return;
    }

    if (!reason || String(reason).trim().length < 3) {
      res.sendError(400, 'Reason must be at least 3 characters long');
      return;
    }

    const caller = await User.findOne({ username: req.user?.username, isDeleted: false });
    if (!caller) {
      res.sendError(404, 'User not found');
      return;
    }

    const targetUser = await User.findOne({ publicId: Number(targetPublicId), isDeleted: false });
    if (!targetUser) {
      res.sendError(404, 'Reported user not found');
      return;
    }

    const report = new Report({
      reporterId: caller._id,
      reporterPublicId: caller.publicId,
      reportedUserId: targetUser._id,
      reportedPublicId: targetUser.publicId,
      roomId: roomId || undefined,
      reason: String(reason).trim(),
      status: 'pending',
    });

    await report.save();

    res.sendResponse(201, {
      message: 'Report submitted successfully. Administrators have been notified.',
      reportId: report._id,
    });
  } catch (error) {
    res.sendError(500, error);
  }
});

// ================= ADMIN MODERATION ROUTES ================= //

// GET /moderation/admin/reports - Get report queue
router.get('/admin/reports', verifyToken, checkRoles('admin'), async (req: Request, res: Response) => {
  try {
    const status = req.query.status as string;
    const filter: Record<string, unknown> = {};
    if (status && ['pending', 'reviewed', 'dismissed'].includes(status)) {
      filter.status = status;
    }

    const reports = await Report.find(filter)
      .sort({ createdAt: -1 })
      .populate('reporterId', 'username publicId')
      .populate('reportedUserId', 'username publicId status');

    res.sendResponse(200, { reports });
  } catch (error) {
    res.sendError(500, error);
  }
});

// PUT /moderation/admin/reports/:id - Review and update report status
router.put('/admin/reports/:id', verifyToken, checkRoles('admin'), async (req: Request, res: Response) => {
  try {
    const { status, actionTaken } = req.body;
    if (!status || !['reviewed', 'dismissed'].includes(status)) {
      res.sendError(400, "Status must be 'reviewed' or 'dismissed'");
      return;
    }

    const adminUser = await User.findOne({ username: req.user?.username });

    const report = await Report.findById(req.params.id);
    if (!report) {
      res.sendError(404, 'Report not found');
      return;
    }

    report.status = status;
    if (actionTaken) report.actionTaken = actionTaken;
    report.reviewedBy = adminUser?._id;
    report.reviewedAt = new Date();
    await report.save();

    res.sendResponse(200, { report });
  } catch (error) {
    res.sendError(500, error);
  }
});

// PUT /moderation/admin/users/:publicId/status - Change user account status (active, suspended, banned)
router.put('/admin/users/:publicId/status', verifyToken, checkRoles('admin'), async (req: Request, res: Response) => {
  try {
    const targetPublicId = Number(req.params.publicId);
    const { status } = req.body;

    if (!status || !['active', 'suspended', 'banned'].includes(status)) {
      res.sendError(400, "Status must be 'active', 'suspended', or 'banned'");
      return;
    }

    const user = await User.findOne({ publicId: targetPublicId, isDeleted: false });
    if (!user) {
      res.sendError(404, 'User not found');
      return;
    }

    if (user.role === 'admin') {
      res.sendError(403, 'Cannot change status of an admin account');
      return;
    }

    user.status = status;
    await user.save();

    // If banned or suspended, kick their active socket immediately
    if (status === 'banned' || status === 'suspended') {
      const onlineRecord = matchingService.getOnlineUserByPublicId(targetPublicId);
      if (onlineRecord) {
        const sock = io.sockets.sockets.get(onlineRecord.socketId);
        if (sock) {
          sock.emit('error', { message: `Your account has been ${status} by an administrator.` });
          sock.disconnect(true);
        }
      }
    }

    res.sendResponse(200, {
      message: `User #${targetPublicId} status updated to ${status}`,
      user: {
        publicId: user.publicId,
        username: user.username,
        status: user.status,
      },
    });
  } catch (error) {
    res.sendError(500, error);
  }
});

// POST /moderation/admin/rooms/:id/terminate - Immediately terminate an abusive room
router.post('/admin/rooms/:id/terminate', verifyToken, checkRoles('admin'), async (req: Request, res: Response) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) {
      res.sendError(404, 'Room not found');
      return;
    }

    room.status = 'ended';
    room.endedAt = new Date();
    await room.save();

    io.to(room._id.toString()).emit('room_terminated', {
      message: 'This conversation has been terminated by an administrator for moderation reasons.',
    });

    res.sendResponse(200, { message: 'Room terminated successfully' });
  } catch (error) {
    res.sendError(500, error);
  }
});

export default router;

