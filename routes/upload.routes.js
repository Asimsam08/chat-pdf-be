const express = require("express")
const { uploadController } = require("../controllers/upload.controller")
const upload = require("../middlewares/upload.middleware")  
const { internalAuth } = require("../middlewares/internalAuth.middleware")



const router = express.Router()

router.post("/document/upload",  internalAuth, upload.single("file"), uploadController)


module.exports = router