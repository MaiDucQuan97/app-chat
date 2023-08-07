require('./db/mongoose')
const express = require("express")
const socketio = require('socket.io')
const http = require('http')
const { sessionMiddleware } = require('./utils/session')
let { stream } = require( './ws/stream' );
let { convertBufferToImage } = require('./utils/uploadFiles')

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
        avatar = convertBufferToImage(user.avatar),
        userID = user._id,
        userEmail = user.email
        sessionID = session.sessionID

    socket.username = username
    socket.email = userEmail
    socket.avatar = avatar
    socket.sessionID = sessionID
    socket.userID = userID
    socket.allUsers = session.allUsers
    
    next();
});

io.on( 'connection', (socket) => {
    stream(socket, io)
});

server.listen(port, () => {
    console.log(`Server is up on port https://${hostname}:${port}`)
});
