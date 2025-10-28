//decode, & verify with jwt
import jwt from "jsonwebtoken";
//api error to sned some error
import {User} from "../models/user.models.js"
import { ApiError } from "../utils/ApiError.js"
import { asyncHandler } from "../utils/asyncHandler.js"

export const verifyJWT = asyncHandler(async(req, _, next)=>
{
    const token = req.cookies.accessToken || req.header("Authorization")?.replace("Bearer ", "")

    if(!token)
    {
        throw new ApiError(401, "Unauthorized")
    }
    try{
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
        //grab the user, req a uery from the database get it back 
        const user=await User.findById(decodedToken?._id).
        select("-password -refreshToken")
        //to check if user actually came in
        if(!user)
        {
            throw new ApiError(401, "Unauthorized")
        }
        req.user=user
        //to transfer the flow control, to one middleware to another or to the final route
        next()
    }
    catch(error)
    {
        throw new ApiError(401, error?.message || "Invalid access token")
    }

})