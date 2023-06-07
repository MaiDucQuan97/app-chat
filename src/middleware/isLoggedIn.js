const isLoggedIn = async (req, res, next) => {
    if (req.session && req.session.isLoggedIn) {
        res.redirect('/index');
    } else {
        next();
    }
}

module.exports = isLoggedIn