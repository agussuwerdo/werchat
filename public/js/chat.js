const chatForm = document.getElementById('chat-form')
const chatMessages = document.querySelector('.chat-messages')
const roomName = document.getElementById('room-name')
const userList = document.getElementById('users')
const myStorage = window.localStorage

// Get username and room from URL
const room = 'PUBLIC'
const username = myStorage.getItem('user_name')

const socket = io()

// Join chatroom
socket.emit('joinRoom', { username, room })

// Get room and users
socket.on('roomUsers', ({ room, users }) => {
	outputRoomName(room)
	outputUsers(users)
})

// Message from server
socket.on('message', message => {
	console.log(message)
	outputMessage(message)

	// Scroll down
	chatMessages.scrollTop = chatMessages.scrollHeight
})

// Deleted messages from server
socket.on('messageDeleted', resp =>{
	const message_id = resp.message_id 
	setMessageDeleted(message_id)
})

// Message submit
chatForm.addEventListener('submit', e => {
	e.preventDefault()

	// Get message text
	const msg = e.target.elements.msg.value

	// Emit message to server
	socket.emit('chatMessage', msg)

	// Clear input
	e.target.elements.msg.value = ''
	e.target.elements.msg.focus()
})

// Output message to DOM
function outputMessage (message) {
	const div = document.createElement('div')
	var deleteBtn = ''
	if(message.username === username)
	deleteBtn = `<button onclick="deleteMessages('${message.id}')" class="btn delete-btn">
	<i class="fas fa-trash-alt"></i>
	</button>`
	div.classList.add('message')
	div.innerHTML = `<p class="meta">${message.username} <span>${message.time}</span></p>
	${deleteBtn}
  <p class="text" id="${message.id}">
    ${message.text}
  </p>`
	document.querySelector('.chat-messages').appendChild(div)
}

// set text message deleted
function setMessageDeleted (message_id){
	const delete_msg = `<p>---CHAT DELETED---</p>`
	document.getElementById(message_id).innerHTML = delete_msg;

}

// Add room name to DOM
function outputRoomName (room) {
	roomName.innerText = room
}

// Add users to DOM
function outputUsers (users) {
	userList.innerHTML = `
    ${users.map(user => `<li>${user.username}</li>`).join('')}
  `
}

// logout app
function logout () {
	myStorage.clear()
	window.location = 'index.html'
}

// list message route
function getListMessages () {
	$.ajax({
		url: '/messages',
		dataType: 'json',
		success: function (response) {
			console.log(response)
			for (const data in response) {
				outputMessage(response[data])
				// Scroll down
				chatMessages.scrollTop = chatMessages.scrollHeight
			}
		},
		error: function (jqXhr, textStatus, errorThrown) {
			console.log(jqXhr.responseJSON)
		}
	})
}

// delete message route
function deleteMessages (id) {
	$.ajax({
		url: '/deleteMessage',
		dataType: 'json',
		type: 'POST',
		data: {
			message_id: id
		},
		success: function (response) {
			console.log('delete success', response)
		},
		error: function (jqXhr, textStatus, errorThrown) {
			console.log(jqXhr.responseJSON)
		}
	})
}

$(document).ready(function () {
	if (myStorage.getItem('is_login')) {
		getListMessages()
	}else{
		window.location = '/index.html'
	}
})