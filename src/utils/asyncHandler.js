//job to get recive function, all those callbacks will be stored and sendint it back

//HIgher Order fn, accepting parameter as fn, aswell as returning parameter as a fn
const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise.resolve(requestHandler(req,res,next)).catch((err) => next(err))
    }
}

//exportin
export {asyncHandler}