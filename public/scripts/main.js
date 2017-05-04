'use strict';

function TestApp() {
  this.checkSetup();

  this.userPic = document.getElementById('user-pic');
  this.userName = document.getElementById('user-name');
  this.signInButton = document.getElementById('sign-in');
  this.signOutButton = document.getElementById('sign-out');
  this.signInSnackbar = document.getElementById('must-signin-snackbar');

  this.initFirebase();
}

TestApp.prototype.initFirebase = function() {
  this.auth = firebase.auth();
  this.database = firebase.database();
  this.storage = firebase.storage();
};

TestApp.prototype.checkSetup = function() {
  if (!window.firebase || !(firebase.app instanceof Function) || !firebase.app().options) {
    window.alert('You have not configured and imported the Firebase SDK. ' +
        'Make sure you go through the codelab setup instructions and make ' +
        'sure you are running the codelab using `firebase serve`');
  }
};

TestApp.prototype.signIn = function() {
  var provider = new firebase.auth.GoogleAuthProvider();
  this.auth.signInWithPopup(provider).then(function(){
    // window.location.reload()
  });
};

TestApp.prototype.signOut = function() {
  this.auth.signOut();
};

TestApp.prototype.checkSignedInWithMessage = function() {
  if (this.auth.currentUser) {
    return this.auth.currentUser;
  }

  // Display a message to the user using a Toast.
  var data = {
    message: 'You must sign-in first',
    timeout: 2000
  };
  this.signInSnackbar.MaterialSnackbar.showSnackbar(data);
  return false;
};

window.onload = function() {
  window.firebaseApp = new TestApp();
  window.firebaseApp.auth.onAuthStateChanged(window.onAuthStateChanged);
};

window.onAuthStateChanged = function authStateChange(user){
  window.firebaseApp.checkSignedInWithMessage();
  var valuesRef = window.firebaseApp.database.ref('money/' + user.uid);
  var vueDefinition = {
    el: '#app',
    data: {
      newValue: '',
      signedIn: false,
      profilePicUrl: '/images/profile_placeholder.png',
      userName: '',
      user: '',
    },
    computed: {
      total: function() {
        var total = 0;
        for(var i = 0, len = this.values.length; i < len; i++) {
            total += +this.values[i].value;
        }
        return total.toFixed(2);
      }
    },
    firebase: {
      values: valuesRef.limitToLast(25)
    },
    methods: {
      addValue: function () {
        if(window.firebaseApp.checkSignedInWithMessage()){
          if (this.newValue) {
            valuesRef.push({
              value: this.newValue,
              user: firebase.auth().currentUser.uid
            })
            this.newValue = ''
          }
        }
      },
      updateValue: function (value, newValue) {
        if(window.firebaseApp.checkSignedInWithMessage()){
          valuesRef.child(value['.key']).child('value').set(newValue)
        }
      },
      removeValue: function (value) {
        if(window.firebaseApp.checkSignedInWithMessage()){
          valuesRef.child(value['.key']).remove()
        }
      },
      signIn: function () {
        window.firebaseApp.signIn()
      },
      signOut: function () {
        window.firebaseApp.signOut()
      },
      onAuthStateChanged: function (user) {
        this.user = user;
        if (user) { // User is signed in!
          this.userName = user.displayName;
          this.profilePicUrl = user.photoURL;
          this.signedIn = true;
        } else { // User is signed out!
          this.signedIn = false;
        }
      }
    }
  }
  if((window.vueApp == undefined) && (user)){
    window.vueApp = new Vue(vueDefinition);  
  }
  if(window.vueApp != undefined){
    window.vueApp.onAuthStateChanged(user);
  }
}