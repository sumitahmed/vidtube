import {Router} from "express";

import {healthcheck} from "../controllers/healthcheck.controller.js"

//similar to creating app from express
const router = Router()
//api/v1/healthcheck

router.route("/").get(healthcheck) // we will handle it when will have the users 


export default router;