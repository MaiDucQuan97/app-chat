const path = require("path");
const express = require("express");
const router = express.Router()
const auth = require("../middleware/auth")

router.get("/index", auth, function (req, res) {
    res.sendFile(path.join(__dirname + '/../views/chat.html'));
});

router.get("/login", function (req, res) {
    res.sendFile(path.join(__dirname + '/../views/login.html'));
})

router.get("/signup", function (req, res) {
    res.sendFile(path.join(__dirname + '/../views/signup.html'));
})

module.exports = router