const socket = io()                                                              //send and receive events from both server and client

//Elements
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $locationSendButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')


//Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationMessageTemplate = document.querySelector('#location-message-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

//Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true } )

const autoscroll = () => {
    // New message element
    const $newMessage = $messages.lastElementChild

    // Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // Visible height
    const visibleHeight = $messages.offsetHeight

    // Height of messages container
    const containerHeight = $messages.scrollHeight

    // How far have I scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }
}

socket.on('message', (message) => {
    console.log(message)
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('hh:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()

})

socket.on('locationMessage', (message) => {
    console.log(message)
    const html = Mustache.render(locationMessageTemplate, {
        username: message.username,
        url: message.url,
        createdAt: moment(message.createdAt).format('hh:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('roomData', ({room, users}) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html

    console.log(users)
    console.log(room)
})

document.querySelector('#message-form').addEventListener('submit', (e) => {     //e rep  resent form
    e.preventDefault()                                                           //to avoid auto refresh

    $messageFormButton.setAttribute('disabled', 'disabled')                            //disable to button
    const message = e.target.elements.message.value                             //message is name of input element in form
    
    socket.emit('sendMessage',message, (messageFromServer) => {                 //this call back fxn run when message is received by server
         $messageFormButton.removeAttribute('disabled')                                //reenable button
         $messageFormInput.value = ' '
         $messageFormInput.focus()
        if(messageFromServer) {

            return console.log(messageFromServer)
        }
        
        console.log('Message delivered to server!')
    })
})


document.querySelector('#send-location').addEventListener('click', () => {
    if(!navigator.geolocation)
    {
       return alert('Geolocation is not supported by browser!')
    }
    $locationSendButton.setAttribute('disabled','disabled')

    navigator.geolocation.getCurrentPosition( (position) => {
        socket.emit('sendLocation', {
            latitude: position.coords.latitude, 
            longitude: position.coords.longitude
        }, () => {
            console.log('Location Shared!')
        })      
    })

    $locationSendButton.removeAttribute('disabled')
})

socket.emit('join', { username, room }, (error) => {
    if(error){
        alert(error)
        location.href='/'

    }
    
})


