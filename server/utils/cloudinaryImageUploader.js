import cloudinary from '../config/cloudinary.js';
import { BadRequestError } from "../errors/index.js";
import { StatusCodes } from "http-status-codes";

export const cloudinaryImageUploader = async (req, res, next, cloudinaryFolder) => {
    try {

        const image = req.file; // Ensure only one image is handled
        if (!image) {
            return next(new BadRequestError('Please select an image file'));
        }

       

        // Validate image type and size
        const maxSize = 1024 * 1024 * 2; // 2MB
        if (image.mimetype !== 'image/jpeg' && image.mimetype !== 'image/png') {
            return next(new BadRequestError('Please upload a JPEG or PNG file'));
        }
        if (image.size > maxSize) {
            return next(new BadRequestError('Image file too big, max size is 2MB'));
        }

        // Upload the image to Cloudinary
        const cloudinaryUpload = (buffer) => {
            return new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    {
                        folder: cloudinaryFolder,
                        public_id: image.filename, // Optional: to specify public ID
                    },
                    (error, result) => {
                        if (error) reject(new Error('An error occurred while uploading to Cloudinary'));
                        resolve(result);
                    }
                );
                stream.end(buffer);
            });
        };

        const result = await cloudinaryUpload(image.buffer);

        // Pass the uploaded image data to the next middleware or controller
        req.uploadedImage = result; // Attach the Cloudinary result to the request object
        next(); // Pass control to the next middleware/controller
    } catch (err) {
        console.error(err);
        return res.status(StatusCodes.BAD_REQUEST).json({ err: err.message });
    }
};
