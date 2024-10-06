import { Router, Request, Response } from "express";
import cloudinary from "cloudinary";
import multer from "multer";
import verifyToken from "../middleware/auth";
import { body } from "express-validator";
import { HotelType } from "../types/types";
import Hotel from "../models/hotel";
const router = Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, //5 mb
  },
});
//api/add-hotel
router.post(
  "/",
  verifyToken,
  [
    body("name").notEmpty().withMessage("Name is required"),
    body("city").notEmpty().withMessage("City is required"),
    body("description").notEmpty().withMessage("Description is required"),
    body("type").notEmpty().withMessage("Hotel type is required"),
    body("pricePerNight")
      .notEmpty()
      .isNumeric()
      .withMessage("Price per night is required and must be a number"),
    body("fascilities")
      .notEmpty()
      .isArray()
      .withMessage("Fascilities are required"),
  ],
  upload.array("imageFiles", 6),
  async (req: Request, res: Response) => {
    try {
      const imageFiles = req.files as Express.Multer.File[];
      const newHotel: HotelType = req.body;
      console.log("here at server my hotel", newHotel);
      const uploadPromises = imageFiles.map(async (image) => {
        const b64 = Buffer.from(image.buffer).toString("base64");
        let dataURI = "data:" + image.mimetype + ";base64," + b64;
        const res = await cloudinary.v2.uploader.upload(dataURI);
        return res.url;
      });

      const imageUrls = await Promise.all(uploadPromises);
      newHotel.imageUrls = imageUrls;
      newHotel.userId = req.userId;
      newHotel.lastUpdated = new Date();

      const hotel = new Hotel(newHotel);
      await hotel.save().catch((error) => {
        console.log("Error saving hotel to database:", error);
      });
      console.log("DETAILS", hotel);

      res.status(201).send(hotel);
    } catch (error) {
      console.log(error);
      res.status(401).send({ message: error });
    }
  }
);

router.get("/", verifyToken, async (req: Request, res: Response) => {
  try {
    const hotels = await Hotel.find({ userId: req.userId });
    res.json(hotels);
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: error });
  }
});

export default router;
