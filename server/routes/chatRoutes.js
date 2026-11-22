import { Router } from 'express';
import {
  startSession,
  postMessage,
  pollMessages,
  requestHandoff,
  recordInquiry,
  lookupInquiryStatus,
} from '../controllers/chatController.js';

const router = Router();

router.post('/session', startSession);
router.post('/message', postMessage);
router.get('/messages', pollMessages);
router.post('/handoff', requestHandoff);
router.post('/inquiry-submitted', recordInquiry);
router.post('/inquiry-status', lookupInquiryStatus);

export default router;
