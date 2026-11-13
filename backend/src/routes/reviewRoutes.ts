// ============================================================================
// routes/reviewRoutes.ts
// Mounted at /api/reviews in app.ts. Every route requires login.
// (Creating/reading reviews of a movie lives in movieRoutes.ts:
//  /api/movies/:movieId/reviews)
// ============================================================================

import { Router } from 'express'; // Express router
import { deleteReview, getMyReviews, updateReview } from '../controllers/reviewController'; // Handlers
import { protect } from '../middleware/auth'; // Requires a valid token
import { validateObjectId } from '../middleware/validateObjectId'; // 400 for malformed ids

const router = Router(); // New router instance

router.use(protect); // Apply `protect` to EVERY route below

router.get('/me', getMyReviews); // GET    /api/reviews/me  -> my reviews
router.put('/:id', validateObjectId('id'), updateReview); // PUT    /api/reviews/:id -> edit my review
router.delete('/:id', validateObjectId('id'), deleteReview); // DELETE /api/reviews/:id -> delete (author or admin)

export default router; // Exported so app.ts can mount it
