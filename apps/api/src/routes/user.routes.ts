import { changePasswordSchema, updateProfileSchema } from "@eventure/shared";
import { Router } from "express";
import * as userController from "../controllers/user.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { uploadAvatar } from "../middleware/upload.js";
import { validate } from "../middleware/validate.js";

export const userRouter = Router();

userRouter.use(authenticate);

userRouter.get("/me", userController.getProfile);
userRouter.patch(
  "/me",
  uploadAvatar,
  validate({ body: updateProfileSchema }),
  userController.updateProfile,
);
userRouter.patch(
  "/me/password",
  validate({ body: changePasswordSchema }),
  userController.changePassword,
);
userRouter.get("/me/points", userController.getPointsHistory);
userRouter.get("/me/coupons", userController.getCoupons);
userRouter.get("/me/referrals", userController.getReferrals);
userRouter.get("/me/orders", userController.getUserOrders);
