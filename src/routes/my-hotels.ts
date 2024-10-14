import { Router, Request, Response } from "express";
import cloudinary from "cloudinary";
import multer from "multer";
import verifyToken from "../middleware/auth";
import { body } from "express-validator";
import { HotelType } from "../types/types";
import Hotel from "../models/hotel";

const router = Router();

// Multer storage setup
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // Limit file size to 5MB
  },
});

// Function to upload images to Cloudinary
async function uploadImages(imageFiles: Express.Multer.File[]) {
  const uploadPromises = imageFiles.map(async (image) => {
    const b64 = Buffer.from(image.buffer).toString("base64");
    let dataURI = "data:" + image.mimetype + ";base64," + b64;
    const res = await cloudinary.v2.uploader.upload(dataURI);
    return res.url;
  });

  const imageUrls = await Promise.all(uploadPromises);
  return imageUrls;
}

// Add a new hotel
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

      const imageUrls = await uploadImages(imageFiles);
      newHotel.imageUrls = imageUrls;
      newHotel.userId = req.userId;
      newHotel.lastUpdated = new Date();

      const hotel = new Hotel(newHotel);
      await hotel.save();

      res.status(201).json(hotel);
    } catch (error) {
      console.log("Error adding hotel:", error);
      res
        .status(500)
        .json({ message: "Something went wrong while adding the hotel" });
    }
  }
);

// Get all hotels for the logged-in user
router.get("/", verifyToken, async (req: Request, res: Response) => {
  try {
    const hotels = await Hotel.find({ userId: req.userId });
    res.status(200).json(hotels);
  } catch (error) {
    console.log("Error fetching hotels:", error);
    res.status(500).json({ message: "Error fetching hotels" });
  }
});

// Get a specific hotel by its ID
router.get("/:id", verifyToken, async (req: Request, res: Response) => {
  const id = req.params.id.toString();
  try {
    const hotel = await Hotel.findOne({ _id: id });
    if (!hotel) {
      return res.status(404).json({ message: "Hotel not found" });
    }
    res.status(200).json(hotel);
  } catch (error) {
    console.log("Error fetching hotel:", error);
    res.status(500).json({ message: `Error fetching hotel with id ${id}` });
  }
});

// Update a hotel
router.put(
  "/:id",
  verifyToken,
  upload.array("imageFiles"),
  async (req: Request, res: Response) => {
    try {
      const updatedHotel: HotelType = req.body;
      updatedHotel.lastUpdated = new Date();

      const hotel = await Hotel.findOneAndUpdate(
        {
          _id: req.params.id,
          userId: req.userId,
        },
        updatedHotel,
        { new: true }
      );

      if (!hotel) {
        return res.status(404).json({ message: "Hotel not found" });
      }

      // If there are new image files, upload them and update the image URLs
      const files = req.files as Express.Multer.File[];
      if (files.length > 0) {
        const updatedImageUrls = await uploadImages(files);
        hotel.imageUrls = [
          ...updatedImageUrls,
          ...(updatedHotel.imageUrls || []),
        ];
      }

      await hotel.save();
      res.status(200).json(hotel);
    } catch (error) {
      console.log("Error updating hotel:", error);
      res
        .status(500)
        .json({ message: "Something went wrong while updating the hotel" });
    }
  }
);

// Delete a hotel
router.delete(
  "/delete/:hotelId",
  verifyToken,
  async (req: Request, res: Response) => {
    const hotelId = req.params.hotelId;

    try {
      const hotel = await Hotel.findOneAndDelete({
        _id: hotelId,
        userId: req.userId,
      });

      if (!hotel) {
        return res.status(404).json({
          message:
            "Hotel not found or you don't have permission to delete this hotel",
        });
      }

      res.status(200).json({ message: "Hotel deleted successfully" });
    } catch (error) {
      console.log("Error deleting hotel:", error);
      res
        .status(500)
        .json({ message: "Something went wrong while deleting the hotel" });
    }
  }
);

router.get('/bookings')

export default router;
