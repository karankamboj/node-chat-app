const path = require('path') // to set html files path
const http = require('http') 
const express = require('express')
const socketio = require('socket.io') //make connection of server to client and send and receive data
const Filter = require('bad-words') //to avoid sending of specific text
const { generateMessage, generateLocationMessage } = require('./utils/messages')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')

const app = express()
const server = http.createServer(app)  
const io = socketio(server)   //now server supports socketio

const port = process.env.PORT || 3000
const publicDirectoryPath = path.join(__dirname, '../public')  //define path for html files

app.use(express.static(publicDirectoryPath)) //for setting static html files path


io.on('connection', (socket) => { //socket contain info of connection
    console.log('New WebSOcket Connection')

    socket.on('join', ({ username, room }, callback) => {
        const { error, user } = addUser({ id: socket.id, username, room})
        if(error) {
            
            return callback(error)
        }


        socket.join(user.room)                                                                // joins the room
        socket.emit('message', generateMessage('Admin','Welcome!'))                           //send message to the user who just joined
        socket.broadcast.to(user.room ).emit('message', generateMessage('Admin',user.username + ' has joined!'))   //send message to every user except the one who just joined
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })
        callback()
    })
   
    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id)
        console.log(user)
        const filter = new Filter()
        if(filter.isProfane(message)){
            return callback('Profanity not allowed')
        }

        socket.broadcast.to(user.room).emit('message', generateMessage(user.username,message))
        socket.emit('sentMessage', generateMessage(user.username,message))
        
        callback()
    })

    socket.on('sendLocation', ( {latitude, longitude}, callback ) => {
        const user = getUser(socket.id)
        socket.broadcast.to(user.room).emit('locationMessage', generateLocationMessage(user.username, 'http://google.com/maps?q=' + latitude+',' + longitude))
        socket.emit('sentlocationMessage',generateLocationMessage(user.username, 'http://google.com/maps?q=' + latitude+',' + longitude))
        callback()
    })

    socket.on('disconnect', () => {                                        //this works when connection is disconnected
        const user = removeUser(socket.id)
        
        if(user) {
            io.to(user.room).emit('message', generateMessage('Admin', user.username +' has left!'))            //send message to all others (not itself bcoz its disconnected already) that a person left
            io.to(user.room).emit('roomData',  {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
     })

})
server.listen(port, () =>{
    console.log('Server started at port '+3000)
})