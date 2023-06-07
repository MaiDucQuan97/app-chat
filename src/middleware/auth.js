const auth = async (req, res, next) => {
    if (req.session && req.session.isLoggedIn) {
        next();
    } else {
        res.redirect('/login');
    }
}

module.exports = auth