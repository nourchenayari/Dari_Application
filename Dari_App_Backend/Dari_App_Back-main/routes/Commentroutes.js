const express = require('express');
const router = express.Router();
const CommentController = require('../controllers/CommentController');
const auth = require('../middleware/auth'); 
const { verifyAdmin }  = require('../middleware/auth');

router.post('/:houseId/comments', auth, CommentController.addComment);
router.put('/:commentId/comments', auth, CommentController.updateComment);
router.delete('/:commentId/comments', auth, CommentController.deleteComment);
router.get('/:houseId/comments', CommentController.getAllCommentsByHouse);
router.get('/', CommentController.getCommPen);
router.put('/:id/approveComm', auth,  verifyAdmin, CommentController.approveComment);
router.put('/:id/rejectComm', auth,  verifyAdmin, CommentController.rejectComment);
module.exports = router;
