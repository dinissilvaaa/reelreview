// ============================================================================
// routes/userRoutes.ts
// Mounted at /api/users in app.ts. Admin panel only.
// ============================================================================

import { Router } from 'express'; // Express router
import { deleteUser, getUsers, updateUserRole } from '../controllers/userController'; // Handlers
import { adminOnly, protect } from '../middleware/auth'; // Auth guards
import { validateObjectId } from '../middleware/validateObjectId'; // 400 for malformed ids

const router = Router(); // New router instance

router.use(protect, adminOnly); // Every route below: must be logged in AND be an admin

router.get('/', getUsers); // GET    /api/users          -> list users
router.patch('/:id/role', validateObjectId('id'), updateUserRole); // PATCH  /api/users/:id/role -> change role
router.delete('/:id', validateObjectId('id'), deleteUser); // DELETE /api/users/:id      -> delete account

export default router; // Exported so app.ts can mount it
