import express, { Request, Response } from "express";
import { check, validationResult } from "express-validator";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/user";
import verifyToken from "../middleware/auth";
const router = express.Router();

router.get(
  "/validate-token",
  verifyToken,
  (req: express.Request, res: express.Response) => {
    console.log("AT VALIDATE-TOKEN");
    try {
      res.status(200).send({ userId: req.userId });
    } catch (error) {
      console.log(error);
      res.status(500).send({ message: error });
    }
  }
);

router.post("/logout", (req: Request, res: Response) => {
  // res.cookie("auth_token", "", {
  //   httpOnly: true,
  //   secure: false, //process.env.NODE_ENV === "production",
  //   maxAge: 86400000,
  //   sameSite: "none",
  // });
  res.cookie("auth_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // Ensure secure is true in production
    maxAge: 86400000,
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // Use Lax for local dev
  });
  res.send();
});

router.post(
  "/login",
  [
    check("email", "Email is required").isEmail(),
    check("password", "Password with 6 or more Character required").isLength({
      min: 6,
    }),
  ],
  async (req: express.Request, res: express.Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array() });
    }

    const { email, password } = req.body;
    try {
      const user = await User.findOne({
        email,
      });
      if (!user) {
        return res.status(400).json({ message: "USER NOT FOUND" });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: "USER NOT FOUND" });
      }

      const token = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET_KEY as string,
        {
          expiresIn: "1d",
        }
      );
      res.cookie("auth_token", token, {
        httpOnly: true,
        secure: true, //process.env.NODE_ENV === "production",
        maxAge: 86400000,
        sameSite: "none",
      });
      res.status(200).json({ userId: user._id });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "SOMETHING WENT WRONG" });
    }
  }
);

export default router;
