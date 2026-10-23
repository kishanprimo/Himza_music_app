import bcrypt from 'bcryptjs';

/**
 * Hash a password using bcrypt
 * @param password The password to hash
 * @param saltRounds Number of salt rounds (default: 10)
 * @returns Promise<string> The hashed password
 */
export const hashPassword = async (password: string, saltRounds: number = 10): Promise<string> => {
    try {
        const salt = await bcrypt.genSalt(saltRounds);
        return await bcrypt.hash(password, salt);
    } catch (error) {
        throw new Error('Error hashing password');
    }
};

/**
 * Compare a password with a hash
 * @param password The plain text password to compare
 * @param hash The hashed password to compare against
 * @returns Promise<boolean> True if the password matches the hash
 */
export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
    try {
        return await bcrypt.compare(password, hash);
    } catch (error) {
        throw new Error('Error comparing password');
    }
}; 