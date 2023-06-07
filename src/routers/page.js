const path = require("path");
const express = require("express");
const router = express.Router()
const auth = require("../middleware/auth")
const isLoggedIn = require('../middleware/isLoggedIn')

router.get("/index", auth, function (req, res) {
    res.render('chat', {
        username: req.session.user.username
    })
});

router.get("/login", isLoggedIn, function (req, res) {
    res.render('login')
})

router.get("/signup", isLoggedIn, function (req, res) {
    res.render('signup')
})

module.exports = router