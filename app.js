var path = require("path");
var express = require("express");
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"],
        transports: ['websocket', 'polling'],
        credentials: true
    },
    allowEIO3: true
});
const port = 3000

app.use(express.static('public'));

app.get("/", function (req, res) {
    res.sendFile(path.join(__dirname + '/views/chat.html'));
});

io.on('connection', function (socket) {
    socket.on('send', function (data) {
        io.sockets.emit('send', data);
    });
});

server.listen(port, () => {
    console.log(`Server is up on port ${port}`)
});
