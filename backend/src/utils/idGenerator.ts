import User from '../models/user';

/**
 * Generates a unique numeric public ID (4-6 digits, e.g. 2134, 58491)
 * Guarantees uniqueness against the User collection.
 */
export async function generateNumericPublicId(): Promise<number> {
  // First attempt: 4-digit numbers (1000 - 9999)
  for (let attempt = 0; attempt < 25; attempt++) {
    const candidate = Math.floor(1000 + Math.random() * 9000);
    const exists = await User.exists({ publicId: candidate });
    if (!exists) {
      return candidate;
    }
  }

  // Second attempt: 5-digit numbers (10000 - 99999)
  for (let attempt = 0; attempt < 50; attempt++) {
    const candidate = Math.floor(10000 + Math.random() * 90000);
    const exists = await User.exists({ publicId: candidate });
    if (!exists) {
      return candidate;
    }
  }

  // Fallback: 6-digit numbers (100000 - 999999)
  while (true) {
    const candidate = Math.floor(100000 + Math.random() * 900000);
    const exists = await User.exists({ publicId: candidate });
    if (!exists) {
      return candidate;
    }
  }
}

