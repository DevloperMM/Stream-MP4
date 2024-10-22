import { Router } from "express";
import {
  createPulse,
  deletePulse,
  getUserPulses,
  updatePulse,
} from "../controllers/pulse.controller.js";
import { verifyJWT } from "../middlewares/auth.midware.js";

const router = Router();
router.use(verifyJWT);

router.route("/").post(createPulse);
router.route("/user/:userId").get(getUserPulses);
router.route("/:pulseId").patch(updatePulse).delete(deletePulse);

export default router;
