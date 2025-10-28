import express from 'express';
//who should be able to talk to yer database? CROSS (cross origin recourse policy/ source)
import cors from 'cors';
import cookieParser from 'cookie-parser';

//create app from express
const app = express();

//middleware from cors 
app.use(
    cors({
        //objs as options, so what should and shoulnt be allowed
        origin: process.env.CORS_ORIGIN,
        credentials: true
    })
)
//middlewares from express to make it more secure
app.use(express.json({limit: "32kb"}))//all the json data is allowed to come in
app.use(express.urlencoded({extended: true, limit: "32kb"})) //data to come in url formatted
//serving assests (images, css, etc)
app.use(express.static("public"))

app.use(cookieParser())


//bring in routes
//import routes
// Import ALL routes
import healthcheckRouter from "./routes/healthcheck.routes.js"
import userRouter from "./routes/user.routes.js"
import videoRouter from "./routes/video.routes.js"
import tweetRouter from "./routes/tweet.routes.js"
import commentRouter from "./routes/comment.routes.js"
import subscriptionRouter from "./routes/subscription.routes.js"
import playlistRouter from "./routes/playlist.routes.js"
import likeRouter from "./routes/like.routes.js"
import dashboardRouter from "./routes/dashboard.routes.js"
import {errorHandler} from "./middlewares/error.middleware.js"

// Use ALL routes
app.use("/api/v1/healthcheck", healthcheckRouter)
app.use("/api/v1/users", userRouter)
app.use("/api/v1/videos", videoRouter)
app.use("/api/v1/tweets", tweetRouter)
app.use("/api/v1/comments", commentRouter)
app.use("/api/v1/subscriptions", subscriptionRouter)
app.use("/api/v1/playlists", playlistRouter)
app.use("/api/v1/likes", likeRouter)
app.use("/api/v1/dashboard", dashboardRouter)


//errorhandler

//We didnt use as the error solved, but this is a production level stuff
//app.use(errorHandler)
// Error handler at the end
app.use(errorHandler)

//export the app
export {app}