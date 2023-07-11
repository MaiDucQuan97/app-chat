require('./db/mongoose')
const express = require("express")
const socketio = require('socket.io')
const http = require('http')
const { sessionMiddleware } = require('./utils/session')
let { stream } = require( './ws/stream' );

const app = express();
const server = http.createServer(app)
const io = socketio(server)
const routeUser = require('./routers/user')
const routePage = require('./routers/page')
const port = process.env.PORT
const hostname = process.env.HOSTNAME

app.use(sessionMiddleware);
io.use((socket, next) => {
    sessionMiddleware(socket.request, {}, next);
});

app.use(express.json())
app.use(routeUser)
app.use(routePage)
app.use(express.static('src/public'));

io.use((socket, next) => {
    let session = socket.request.session

    if (!session.isLoggedIn) {
        return;
    }

    let user = session.user,
        username = user.username,
        userID = user._id,
        sessionID = session.sessionID

    socket.username = username
    socket.sessionID = sessionID
    socket.userID = userID
    next();
});

io.on( 'connection', (socket) => {
    stream(socket, io)
});

server.listen(port, () => {
    console.log(`Server is up on port https://${hostname}:${port}`)
});
