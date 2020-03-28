const express = require('express')
const http = require('http')
const https = require('https')
const path = require('path')
const socketio = require('socket.io')
const firebase = require('firebase')
const uuid = require('uuid/v1')
const formatMessage = require('./public/utils/messages')
const { userJoin, getCurrentUser, userLeave, getRoomUsers } = require('./public/utils/users')
const useHTTPS = true
const botName = 'WerChat Bot'

PORT = 3000 || process.env.PORT
//set express app and socket io
const app = express()
if (useHTTPS) {
	const fs = require('fs')
	const privateKey = fs.readFileSync('/etc/letsencrypt/live/werdev.com/privkey.pem', 'utf8')
	const certificate = fs.readFileSync('/etc/letsencrypt/live/werdev.com/cert.pem', 'utf8')
	const credentials = { key: privateKey, cert: certificate }
	const server = https.createServer(credentials, app)
} else {
	const server = http.createServer(app)
}
const io = socketio(server)

//set static folder
app.use('/', express.static(path.join(__dirname, 'public')))
app.use('/jquery', express.static(__dirname + '/node_modules/jquery/dist/'))
app.use('/bootstrap', express.static(__dirname + '/node_modules/bootstrap/dist/'))
app.use('/firebaseui', express.static(__dirname + '/node_modules/firebaseui/dist/'))

//middleware
app.use(express.urlencoded({ extended: true }))
app.use(express.json())

//set firebase
const firebaseConfig = {
	apiKey: "AIzaSyAHNZnuehhoTAkbT4mtMdRDTAP5K_Lur08",
	authDomain: "edodevs.firebaseapp.com",
	databaseURL: "https://edodevs.firebaseio.com",
	projectId: "edodevs",
	storageBucket: "edodevs.appspot.com",
	messagingSenderId: "1078463799111",
	appId: "1:1078463799111:web:25e65ec18c35a2d2407662"
}

firebase.initializeApp(firebaseConfig)
var defaultDatabase = firebase.database()
// Provide custom logger which prefixes log statements with "[FIREBASE]"
firebase.database.enableLogging(function (message) {
	console.log("[FIREBASE]", message)
})

//routes
app.get('/messages', function (req, res) {
	firebase.database().ref('messages/').once('value').then(function (snapshot) {
		res.send(snapshot)
	})
})

app.post('/deleteMessage', function (req, res) {
	deleted_id = req.body.message_id
	var userEventRef = firebase.database().ref('messages')
	userEventRef.child(deleted_id).remove()
		.then(function (resp) {
			io.emit('messageDeleted', { message_id: deleted_id })
		})
		.catch(function (error) {
			console.log("Remove failed: " + error.message, userEventRef)
		})
	res.send({ id: deleted_id, message: 'data deleted', resp: userEventRef })
})

io.sockets.on('connection', function (socket) {

	socket.on('joinRoom', ({ username, room }) => {
		const user = userJoin(socket.id, username, room)

		socket.join(user.room)

		// Welcome current user
		socket.emit('message', formatMessage(uuid(), botName, 'Welcome to ChatCord!'))

		// Broadcast when a user connects
		socket.broadcast
			.to(user.room)
			.emit(
				'message',
				formatMessage(uuid(), botName, `${user.username} has joined the chat`)
			)

		// Send users and room info
		io.to(user.room).emit('roomUsers', {
			room: user.room,
			users: getRoomUsers(user.room)
		})
	})

	// Listen for chatMessage
	socket.on('chatMessage', msg => {
		const message_id = uuid()
		const user = getCurrentUser(socket.id)
		const message = formatMessage(message_id, user.username, msg)

		firebase.database().ref('messages/' + message_id).set(message)

		io.to(user.room).emit('message', message)
	})

	// Runs when client disconnects
	socket.on('disconnect', () => {
		const user = userLeave(socket.id)

		if (user) {
			io.to(user.room).emit(
				'message',
				formatMessage(uuid(), botName, `${user.username} has left the chat`)
			)

			// Send users and room info
			io.to(user.room).emit('roomUsers', {
				room: user.room,
				users: getRoomUsers(user.room)
			})
		}
	})
})

server.listen(PORT, function () {
	console.log(`Server running on port : ${PORT}`)
})