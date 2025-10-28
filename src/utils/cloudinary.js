import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config({
    path: "./.env"
})


//configure cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

//upload fn 
const uploadOnCloudinary = async (localFilePath) => {
    try {
        // console.log("Cloudinary Config:", {
        //     cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        //     api_key: process.env.CLOUDINARY_API_KEY,
        //     api_secret: process.env.CLOUDINARY_API_SECRET
        // });

        if (!localFilePath) return null //not proceeding
        const response = await cloudinary.uploader.upload(
            localFilePath, {
            resource_type: "auto" //automatically detects file type
        }
        )
        console.log("file uplaoded on cloudinary. File src: " + response.url);
        //once the file is uplaoded, we would like to delete it from our server
        fs.unlinkSync(localFilePath)
        return response;
    }
    catch (error) { // <- ADDED MISSING OPENING BRACE
        // If problem arises, remove it from local storage
        console.log("Error on Cloudinary", error);

        // Only try to delete if file exists
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }

        return null; // Things didn't go as planned
    }
};

const deleteFromCloudinary = async (publicId) => {
    try {
        const result = await cloudinary.uploader.destroy(publicId)
        console.log("Deleted from cloudinary. Public id",publicId);
        
    }
    catch (error) {
        console.log("Error deleting from cloudinary", error);
        return null;
    }
}
export { uploadOnCloudinary, deleteFromCloudinary };