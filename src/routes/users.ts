import express, { Request, Response } from "express";
import User from "../models/user";

const router = express.Router();
import jwt from "jsonwebtoken";
import { verify } from "crypto";
import verifyToken from "../middleware/auth";

router.get("/me", verifyToken, async (req: Request, res: Response) => {
  const userId = req.userId;

  try {
    const user = await User.findById(userId).select("-password");
    if (!user) {
      res.status(400).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.log(error);
    res.status(501).json({ message: "INTERNAL SERVER ERROR" });
  }
});

router.post(
  "/register",
  async (req: express.Request, res: express.Response) => {
    try {
      let user = await User.findOne({
        email: req.body.email,
      });

      if (user) {
        return res.status(400).json({ message: "User alreay exists" });
      }

      user = new User(req.body);
      console.log("REGISTER USER", user);

      await user.save();

      const token = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET_KEY as string,
        {
          expiresIn: "1d",
        }
      );

      res.cookie("auth_token", token, {
        httpOnly: true,
        secure: true,
        maxAge: 86400000,
        sameSite: "none",
      });
      return res.status(200).send({ message: "User registered ok" });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Something went wrong" });
    }
  }
);

export default router;
