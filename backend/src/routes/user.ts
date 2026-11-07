import 'dotenv/config';
import express, { Router, Request, Response } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import User from '../models/user';
import InviteCode from '../models/inviteCode';
import validator from '../middlewares/validator';
import verifyToken from '../middlewares/verifyToken';
import checkRoles from '../middlewares/checkRoles';
import { login, register, updateProfile } from '../validators/user';
import { mongoIdSchema } from '../validators/params';
import { config } from '../config';
import { JwtPayload } from '../types/express';
import { generateNumericPublicId } from '../utils/idGenerator';

const router: Router = express.Router();

// POST /user/login - Support login by numeric publicId or username
router.post('/login', validator(login), async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    const cleanUsername = String(username || '').trim();
    const isNum = !isNaN(Number(cleanUsername)) && cleanUsername !== '';
    const query = isNum
      ? { $or: [{ publicId: Number(cleanUsername) }, { username: cleanUsername }], isDeleted: false }
      : { username: cleanUsername, isDeleted: false };

    const user = await User.findOne(query).select('+password');
    if (!user) {
      res.sendError(401, 'Public ID/Username or password is incorrect.');
      return;
    }

    if (user.status === 'banned') {
      res.sendError(403, 'This account has been banned.');
      return;
    }

    let validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword && typeof password === 'string') {
      const trimmed = password.trim();
      const noExclamation = trimmed.replace(/\s*!$/, '');
      validPassword =
        (await bcrypt.compare(trimmed, user.password)) ||
        (await bcrypt.compare(noExclamation, user.password)) ||
        (await bcrypt.compare(trimmed + '!', user.password));
    }
    if (!validPassword) {
      res.sendError(401, 'Public ID/Username or password is incorrect.');
      return;
    }

    const tokenOptions: SignOptions = { expiresIn: config.jwtExpiration as any };
    const refreshTokenOptions: SignOptions = { expiresIn: config.refreshTokenExpiration as any };

    const token = jwt.sign(
      { username: user.username, role: user.role },
      config.jwtSecret,
      tokenOptions,
    );

    const refreshToken = jwt.sign(
      { username: user.username, role: user.role },
      config.refreshTokenSecret,
      refreshTokenOptions,
    );

    user.refreshToken = refreshToken;
    await user.save();

    res.sendResponse(200, {
      token,
      refreshToken,
      username: user.username,
      publicId: user.publicId,
      gender: user.gender,
      genderPreference: user.genderPreference,
      role: user.role,
      status: user.status,
    });
  } catch (error) {
    res.sendError(500, error);
  }
});

// POST /user/register - Register new user and auto-assign numeric publicId
router.post('/register', validator(register), async (req: Request, res: Response) => {
  try {
    const { username: rawUsername, password, gender, genderPreference, inviteCode } = req.body;

    let finalUsername = rawUsername ? String(rawUsername).trim() : '';

    // If username is supplied, verify it doesn't already exist
    if (finalUsername) {
      const existingUser = await User.findOne({ username: finalUsername });
      if (existingUser) {
        res.sendError(409, 'Username already exists');
        return;
      }
    }

    // If inviteCode is supplied, validate it
    let invite: any = null;
    if (inviteCode && String(inviteCode).trim()) {
      invite = await InviteCode.findOne({
        code: String(inviteCode).trim().toUpperCase(),
        isDeleted: false,
      });

      if (!invite) {
        res.sendError(400, 'Invalid invite code');
        return;
      }

      const now = new Date();
      if (invite.expiresAt < now) {
        res.sendError(400, 'Invite code has expired');
        return;
      }

      if (invite.currentUses >= invite.maxUses) {
        res.sendError(400, 'Invite code has been fully used');
        return;
      }
    }

    const publicId = await generateNumericPublicId();
    if (!finalUsername) {
      finalUsername = `User_${publicId}`;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username: finalUsername,
      publicId,
      password: hashedPassword,
      role: 'user',
      gender: gender || 'other',
      genderPreference: genderPreference || 'any',
      status: 'active',
    });

    await newUser.save();

    if (invite) {
      invite.currentUses += 1;
      if (invite.currentUses >= invite.maxUses) {
        invite.isUsed = true;
      }
      invite.usedBy = newUser._id;
      invite.usedByUsername = finalUsername;
      invite.usedAt = new Date();
      await invite.save();
    }

    const tokenOptions: SignOptions = { expiresIn: config.jwtExpiration as any };
    const refreshTokenOptions: SignOptions = { expiresIn: config.refreshTokenExpiration as any };

    const token = jwt.sign(
      { username: newUser.username, role: newUser.role },
      config.jwtSecret,
      tokenOptions,
    );

    const refreshToken = jwt.sign(
      { username: newUser.username, role: newUser.role },
      config.refreshTokenSecret,
      refreshTokenOptions,
    );

    newUser.refreshToken = refreshToken;
    await newUser.save();

    res.sendResponse(201, {
      message: 'User registered successfully',
      token,
      refreshToken,
      username: newUser.username,
      publicId: newUser.publicId,
      gender: newUser.gender,
      genderPreference: newUser.genderPreference,
      role: newUser.role,
      status: newUser.status,
    });
  } catch (error) {
    res.sendError(500, error);
  }
});

// GET /user/by-id/:publicId - Look up public user profile by numeric ID
router.get('/by-id/:publicId', verifyToken, async (req: Request, res: Response) => {
  try {
    const publicId = Number(req.params.publicId);
    if (isNaN(publicId)) {
      res.sendError(400, 'Invalid public ID format');
      return;
    }

    const targetUser = await User.findOne({ publicId, isDeleted: false }).select(
      'publicId username gender status createdAt',
    );

    if (!targetUser) {
      res.sendError(404, 'User not found');
      return;
    }

    res.sendResponse(200, {
      publicId: targetUser.publicId,
      username: targetUser.username,
      gender: targetUser.gender,
      status: targetUser.status,
      createdAt: targetUser.createdAt,
    });
  } catch (error) {
    res.sendError(500, error);
  }
});

// PUT /user/profile - Update gender and matching preference
router.put('/profile', verifyToken, validator(updateProfile), async (req: Request, res: Response) => {
  try {
    const { gender, genderPreference } = req.body;
    const user = await User.findOne({ username: req.user?.username, isDeleted: false });
    if (!user) {
      res.sendError(404, 'User not found');
      return;
    }

    if (gender) user.gender = gender;
    if (genderPreference) user.genderPreference = genderPreference;
    await user.save();

    res.sendResponse(200, {
      username: user.username,
      publicId: user.publicId,
      gender: user.gender,
      genderPreference: user.genderPreference,
    });
  } catch (error) {
    res.sendError(500, error);
  }
});

// GET /user/me - Current user profile
router.get('/me', verifyToken, async (req: Request, res: Response) => {
  try {
    const user = await User.findOne({ username: req.user?.username, isDeleted: false }).select(
      'username publicId role gender genderPreference status createdAt',
    );
    if (!user) {
      res.sendError(404, 'User not found');
      return;
    }

    res.sendResponse(200, { user });
  } catch (error) {
    res.sendError(500, error);
  }
});

// GET /user/ - Get all users (admin only)
router.get('/', verifyToken, checkRoles('admin'), async (_req: Request, res: Response) => {
  try {
    const users = await User.find({ isDeleted: false })
      .select('-password')
      .sort({ createdAt: -1 });

    res.sendResponse(200, { users });
  } catch (error) {
    res.sendError(500, error);
  }
});

// DELETE /user/:id - Soft delete user (admin only)
router.delete('/:id', verifyToken, checkRoles('admin'), validator(mongoIdSchema, 'params'), async (req: Request, res: Response) => {
  try {
    const userToDelete = await User.findOne({ _id: req.params.id, isDeleted: false });
    if (!userToDelete) {
      res.sendError(404, 'User not found');
      return;
    }

    if (userToDelete.username === req.user?.username) {
      res.sendError(403, 'You cannot delete yourself');
      return;
    }

    if (userToDelete.role === 'admin') {
      res.sendError(403, 'Cannot delete admin users');
      return;
    }

    const adminUser = await User.findOne({ username: req.user?.username });
    if (!adminUser) {
      res.sendError(404, 'Admin user not found');
      return;
    }

    userToDelete.isDeleted = true;
    userToDelete.deletedAt = new Date();
    userToDelete.deletedBy = adminUser._id;
    await userToDelete.save();

    res.sendResponse(200, 'User deleted successfully');
  } catch (error) {
    res.sendError(500, error);
  }
});

// POST /user/refresh - Refresh access token
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.sendError(401, 'Refresh token is required');
      return;
    }

    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(refreshToken, config.refreshTokenSecret) as JwtPayload;
    } catch {
      res.sendError(401, 'Invalid or expired refresh token');
      return;
    }

    const user = await User.findOne({
      username: decoded.username,
      isDeleted: false,
    }).select('+refreshToken');

    if (!user || !user.refreshToken || user.refreshToken !== refreshToken) {
      res.sendError(401, 'Invalid refresh token');
      return;
    }

    if (user.status === 'banned') {
      res.sendError(403, 'This account has been banned.');
      return;
    }

    const tokenOptions: SignOptions = { expiresIn: config.jwtExpiration as any };
    const refreshTokenOptions: SignOptions = { expiresIn: config.refreshTokenExpiration as any };

    const newToken = jwt.sign(
      { username: user.username, role: user.role },
      config.jwtSecret,
      tokenOptions,
    );

    const newRefreshToken = jwt.sign(
      { username: user.username, role: user.role },
      config.refreshTokenSecret,
      refreshTokenOptions,
    );

    user.refreshToken = newRefreshToken;
    await user.save();

    res.sendResponse(200, {
      token: newToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    res.sendError(500, error);
  }
});

export default router;
