const express = require('express')
const User = require('../models/user')
const Message = require('../models/message')
const auth = require('../middleware/auth')
const router = express.Router()

router.post('/user/create', async (req, res) => {
    try {
        const user = await User(req.body)
        // await user.generateAuthToken()

        await user.save()
        res.send(user)
    } catch (error) {
        res.status(400).send(error)
    }
})

router.post('/user/logout', auth, (req, res) => {
    try {
        req.session.destroy((err) => {
            if (err) {
                console.error('Error destroying session:', err);
            } else {
                res.redirect('/login');
            }
        });
    } catch (error) {
        res.status(500).send()
    }
})

router.get('/user/me', auth, async (req, res) => {
    res.send(req.user)
})

router.post('/user/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.username, req.body.password)

        // const token = await user.generateAuthToken()

        req.session.isLoggedIn = true;
        req.session.user = user;

        res.send({ user, isLoggedIn: true })
    } catch (e) {
        res.status(400).send(e)
    }
})

const multer = require('multer')
const sharp = require('sharp')
const upload = multer({
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(jpg|png|jpeg)$/)) {
            cb(new Error('Please upload a PDF file!'))
        }

        cb(undefined, true)
    }
})

router.post('/user/me/avatar', auth, upload.single('avatar'), async (req, res) => {
    const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer()

    req.user.avatar = buffer
    await req.user.save()
    res.send(req.user);
}, (error, req, res, next) => {
    res.status(400).send({ error: error.message })
})

router.delete('/user/me/avatar', auth, async (req, res) => {
    req.user.avatar = undefined
    await req.user.save()
    res.send(req.user)
})

router.get('/user/me/messages', auth, async (req, res) => {
    try {
        let user = req.session.user,
            messages = await Message.getAllMessagesOfCurrentUser(user.username, req.query.recipientUsername)

        res.send(messages)
    } catch (error) {
        res.status(400).send(error)
    }
})

module.exports = router