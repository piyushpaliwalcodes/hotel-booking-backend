import express from "express";
import User from "../models/user";

const router = express.Router();
import jwt from "jsonwebtoken";
router.post(
  "/register",
  async (req: express.Request, res: express.Response) => {
    console.log("At register server side");
    try {
      let user = await User.findOne({
        email: req.body.email,
      });

      if (user) {
        return res.status(400).json({ message: "User alreay exists" });
      }

      user = new User(req.body);
      await user.save();

      const token = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET_KEY as string,
        {
          expiresIn: "1d",
        }
      );
      console.log("TOEKN AT REGISTER END", token);

      res.cookie("auth_token", token, {
        httpOnly: true,
        secure: true, //process.env.NODE_ENV === "production",
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
