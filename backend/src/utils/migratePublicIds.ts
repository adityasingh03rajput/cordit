import User from '../models/user';
import { generateNumericPublicId } from './idGenerator';
import { logger } from './logger';

/**
 * Migration helper ensuring all existing users have numeric publicIds,
 * gender, genderPreference, and status defaults.
 */
export async function ensurePublicIds(): Promise<void> {
  try {
    const usersWithoutId = await User.find({
      $or: [
        { publicId: { $exists: false } },
        { publicId: null },
      ],
    });

    if (usersWithoutId.length === 0) {
      return;
    }

    logger.info(`Migrating ${usersWithoutId.length} users missing publicId...`);

    for (const user of usersWithoutId) {
      const publicId = await generateNumericPublicId();
      user.publicId = publicId;
      if (!user.gender) user.gender = 'other';
      if (!user.genderPreference) user.genderPreference = 'any';
      if (!user.status) user.status = 'active';
      await user.save();
      logger.info(`Assigned publicId ${publicId} to user "${user.username}"`);
    }

    logger.info('Public ID migration completed successfully');
  } catch (error) {
    logger.error('Failed to migrate public IDs:', error);
  }
}

