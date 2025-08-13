import express from 'express';
import { 
  registerOrganization, 
  getOnboardingProgress, 
  completeOnboardingStep, 
  inviteUsers 
} from '../controllers/onboardingController';

const router = express.Router();

// Rutas de onboarding
router.post('/register-organization', registerOrganization);
router.get('/progress/:organizacionId', getOnboardingProgress);
router.post('/complete-step/:organizacionId/:stepId', completeOnboardingStep);
router.post('/invite-users/:organizacionId', inviteUsers);

export default router; 