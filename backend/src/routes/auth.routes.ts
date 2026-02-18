import { Router } from "express";
import { getUserNonce, login } from "../controllers/auth.controller";

const router = Router();

router.get("/nonce/:walletAddress", getUserNonce);

router.post("/login", login);

export default router;
