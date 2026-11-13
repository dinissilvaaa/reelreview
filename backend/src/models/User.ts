// ============================================================================
// models/User.ts
// Mongoose schema + model for the "users" collection.
// Passwords are hashed with bcrypt before being saved and are never
// returned by default queries (select: false).
// ============================================================================

import { Schema, model, type HydratedDocument, type Model } from 'mongoose'; // Mongoose building blocks
import bcrypt from 'bcryptjs'; // Password hashing library (pure JavaScript, no native build needed)
import { USER_ROLES, type UserRole } from '../constants/roles'; // Allowed roles: 'user' | 'admin'

// Shape of a user document as stored in MongoDB
export interface IUser {
  username: string; // Public name shown next to reviews
  email: string; // Login identifier (unique, stored in lowercase)
  password: string; // bcrypt hash - NEVER the plain-text password
  role: UserRole; // 'user' or 'admin'
  createdAt: Date; // Added automatically by `timestamps: true`
  updatedAt: Date; // Added automatically by `timestamps: true`
}

// Instance methods available on every user document
export interface IUserMethods {
  comparePassword(candidate: string): Promise<boolean>; // Checks a login password against the stored hash
}

export type UserModel = Model<IUser, object, IUserMethods>; // Model type (static side)
export type UserDocument = HydratedDocument<IUser, IUserMethods>; // A loaded user document (instance side)

// Schema definition: fields, types and database-level validation rules
const userSchema = new Schema<IUser, UserModel, IUserMethods>(
  {
    username: {
      type: String, // Stored as text
      required: [true, 'Username is required'], // Cannot be empty
      unique: true, // MongoDB unique index: two users cannot share a username
      trim: true, // Remove spaces at the start/end
      minlength: [3, 'Username must have at least 3 characters'], // Minimum length
      maxlength: [30, 'Username must have at most 30 characters'], // Maximum length
    },
    email: {
      type: String, // Stored as text
      required: [true, 'Email is required'], // Cannot be empty
      unique: true, // MongoDB unique index: one account per email
      lowercase: true, // "John@Mail.com" is saved as "john@mail.com"
      trim: true, // Remove spaces at the start/end
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, 'Email format is invalid'], // Simple email format check
    },
    password: {
      type: String, // Stored as text (the bcrypt hash)
      required: [true, 'Password is required'], // Cannot be empty
      minlength: [8, 'Password must have at least 8 characters'], // Checked before hashing
      select: false, // Excluded from query results unless we explicitly ask for it
    },
    role: {
      type: String, // Stored as text
      enum: { values: USER_ROLES, message: 'Role must be user or admin' }, // Only allowed values
      default: 'user', // New accounts are normal users
    },
  },
  { timestamps: true, versionKey: false }, // Manage createdAt/updatedAt automatically and skip the internal "__v" field
);

// "pre save" hook: runs before every .save() / .create()
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return; // Only hash when the password is new or was changed
  const salt = await bcrypt.genSalt(10); // Random salt, 10 = cost factor (higher = slower = safer)
  this.password = await bcrypt.hash(this.password, salt); // Replace the plain text with the hash
});

// Instance method: user.comparePassword('typed password')
userSchema.method('comparePassword', function (candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.password); // bcrypt hashes the candidate and compares safely
});

// Compile the schema into a model bound to the "users" collection
export const User = model<IUser, UserModel>('User', userSchema);
