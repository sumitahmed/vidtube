class ApiError extends Error {
    constructor(statusCode,
        message = "Somethign went wrong",
        errors = [],
        //stack doesnt come in production, only comesup in dev env
        stack = "" //entire stack tray (where the errors are)
    )
    {
        super(message) //calling constructur from error class
        this.statusCode = statusCode
        this.data = null
        this.message = message
        this.success = false
        this.errors = errors;

        //if stack comesup1 
        if(stack)
        {
            this.stack = stack
        }
        else
        {
            Error.captureStackTrace(this, this.constructor)
        }
    }
}

export {ApiError}