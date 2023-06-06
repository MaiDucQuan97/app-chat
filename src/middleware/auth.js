const User = require('../models/user')

const auth = async (req, res, next) => {
    if (req.session && req.session.isLoggedIn) {
        next();
    } else {
        res.redirect('/login');
    }
    // try {
    //     const token = req.header('Authorization').replace('Bearer ', '')
    //     const decocedToken = jwt.verify(token, process.env.JWT_SECRET_KEY)
    //     const user = await User.findOne({ _id: decocedToken._id, 'tokens.token': token })

    //     if (!user) {
    //         throw new Error()
    //     }

    //     req.token = token
    //     req.user = user
    //     next()
    // } catch (error) {
    //     res.status(400).send({ error: 'Please authenticate.' })
    // }
}

module.exports = auth