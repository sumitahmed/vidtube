import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const healthcheck = asyncHandler(async(req, res) => {
   return res.status(200).json(
    new ApiResponse(200, {
      status: 'OK',
      uptime: process.uptime(), //hwo long server has been running
      timestamp: new Date().toISOString(),
      message: "Server is running smoothly"
    },"Healthcheck successful")
   )
})

export { healthcheck }