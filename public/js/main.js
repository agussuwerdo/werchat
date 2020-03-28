const myStorage = window.localStorage
const socket = io({
	"force new connection": true,
	secure: false,
	transports: ['websocket']
})

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

// Initialize the FirebaseUI Widget using Firebase.
var ui = new firebaseui.auth.AuthUI(firebase.auth())

firebase.auth().signOut().then(function () {
	// Sign-out successful.
}).catch(function (error) {
	// An error happened.
});

function initializeFirebaseUi () {
	ui.start('#firebaseui-auth-container', {
		callbacks: {
			signInSuccessWithAuthResult: function (authResult, redirectUrl) {
				// User successfully signed in.
				// Return type determines whether we continue the redirect automatically
				// or whether we leave that to developer to handle.
				console.log(authResult)
				const userData = authResult.user.displayName ? authResult.user.displayName : authResult.user.phoneNumber;
				console.log('signInSuccessWithAuthResult', userData)
				myStorage.setItem('is_login', true)
				myStorage.setItem('user_name', userData)
				location.reload()
				return false
			},
			uiShown: function () {
				// The widget is rendered.
				// Hide the loader.
				console.log('uiShown')
			},
			signInFailure: function (error) {
				console.log('signInFailure', error)
				// For merge conflicts, the error.code will be
				// 'firebaseui/anonymous-upgrade-merge-conflict'.
				if (error.code != 'firebaseui/anonymous-upgrade-merge-conflict') {
					return Promise.resolve()
				}
				// The credential the user tried to sign in with.
				var cred = error.credential
				// Copy data from anonymous user to permanent user and delete anonymous
				// user.
				// ...
				// Finish sign-in after data is copied.
				return firebase.auth().signInWithCredential(cred)
			}
		},
		signInFlow: 'popup',
		signInSuccessUrl: '/chat.html',
		// Whether to upgrade anonymous users should be explicitly provided.
		// The user must already be signed in anonymously before FirebaseUI is
		// rendered.
		autoUpgradeAnonymousUsers: true,
		signInOptions: [
			{
				provider: firebase.auth.EmailAuthProvider.PROVIDER_ID,
				requireDisplayName: false
			},
			firebase.auth.GoogleAuthProvider.PROVIDER_ID,
			// firebase.auth.FacebookAuthProvider.PROVIDER_ID,
			// firebase.auth.TwitterAuthProvider.PROVIDER_ID,
			// firebase.auth.GithubAuthProvider.PROVIDER_ID,
			{
				provider: firebase.auth.PhoneAuthProvider.PROVIDER_ID,
				recaptchaParameters: {
					type: 'image', // 'audio'
					size: 'normal', // 'invisible' or 'compact'
					badge: 'bottomleft' //' bottomright' or 'inline' applies to invisible.
				},
				defaultCountry: 'ID', // Set default country to the United Kingdom (+44).
			}
		]
	})
}

function arrayToObj (unindexed_array) {
	var indexed_array = {}
	$.map(unindexed_array, function (n, i) {
		indexed_array[n['name']] = n['value']
	})
	return indexed_array
}

$(document).ready(function () {
	if (myStorage.getItem('is_login')) {
		window.location = '/chat.html'
	} else {
		initializeFirebaseUi()
	}
	$('#messageForm').on('submit', function (event) {
		event.preventDefault()
		var formData = arrayToObj($(this).serializeArray())
		socket.emit('send_message', formData)
	})
})
