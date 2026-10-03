const express = require("express")
const { chatController } = require("../controllers/chat.controller")
const { internalAuth } = require("../middlewares/internalAuth.middleware")

const router = express.Router()

router.post("/document/chat",internalAuth, chatController)

module.exports = router