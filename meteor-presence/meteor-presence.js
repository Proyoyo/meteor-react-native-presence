Presences = new Mongo.Collection('presences');
Logged = new Mongo.Collection('logged');

var trimInput = function(val){
    return val.replace(/^\s*|\s*$/g, "");
}

var isValidPassword = function(val, field){
    if (val.length >= 6){
        return true;
    } else{
        return false;
    }
}

var isValidUsername = function(val, field){
    if(val.length > 0){
        return true;
    } else{
        return false;
    }
}

Meteor.methods({
    changeName: function(name){
        Presences.update(this.connection.id, {$set: {username: name}});
    },

    removeAnon: function(){
        Presences.remove(this.connection.id);
    },

    addLogged: function(username){
        Logged.insert({
            _id: this.connection.id,
            username: username,
            connectedOn: new Date(),
            address: this.connection.clientAddress
        });
    },

    removeLogged: function(){
        Logged.remove(this.connection.id);
    },

    addAnon: function(){
        Presences.insert({
            _id: this.connection.id,
            username: this.connection.id,
            connectedOn: new Date(),
            address: this.connection.clientAddress
        });
    },

    customLogin: function(username){
        Meteor.call("addLogged", username);
        Meteor.call("removeAnon");
    },

    customLogout: function(){
        Meteor.call("removeLogged");
        Meteor.call("addAnon");
    },

});

if (Meteor.isClient) {

    // Subscribe to "users" publication
    Meteor.subscribe("presences");
    Meteor.subscribe("users");


    Template.body.helpers({
        presences: function(){
            return Presences.find({});
        }
    });

    Template.body.helpers({
        registeredUsers: function(){
            return Logged.find({});
        }
    });

    Template.body.events({
        "input .change-name": function (event) {
            event.preventDefault();
            var text = event.currentTarget.text.value;
            Meteor.call("changeName", text);
        }
    });

    Template.body.events({
        "submit .change-name": function (event) {
            event.preventDefault();
            var text = event.target.text.value;
            Meteor.call("changeName", text);
            event.target.text.value = "";
        }
    });

    Template.body.events({
        "submit .logout" : function(event, t){
            event.preventDefault();
            console.log("LOGGING OUT");
            // Retrieve the input field values
            Meteor.logout(function(err){
                if(err){
                    console.log("logout failed");
                } else {
                    Meteor.call("customLogout");
                }
            });

            return false;
        }
    });

    Template.body.events({
        "submit #login-form" : function(event, t){
            event.preventDefault();
            // Retrieve the input field values
            var username = event.target.username.value;
            username = trimInput(username);
            var password = event.target.password.value;

            Meteor.loginWithPassword(username, password, function(err){
                if(err){
                    console.log("failed");
                } else{
                    event.target.username.value = "";
                    event.target.password.value = "";
                }
            });

            return false;
        }
    });

    Template.body.events({
        "submit #register-form" : function(event, t){
            event.preventDefault();
            // Retrieve the input field values
            var username = event.target.username.value;
            username = trimInput(username);
            var password = event.target.password.value;

            if (isValidPassword(password) && isValidUsername(username)){
                Accounts.createUser({username: username, password: password}, function(err){
                    if(err){
                        console.log("Account creation failed")
                        // Inform user that account creation failed
                    } else {
                        console.log("Successfully created account")
                        event.target.username.value = "";
                        event.target.password.value = "";
                        // Success. Account has been created and the user has logged in successfully.
                    }
                });
            }

            return false;
        }
    });

}

if (Meteor.isServer) {
  Meteor.startup(function () {
      // Clean up collection
      Presences.remove({});
      Logged.remove({});
  });

  Meteor.onConnection(function(connection){
      console.log("connected: " + connection.id + " " + connection.clientAddress);
      // Create new entry in collection with ID, date, and IP address
      Presences.insert({
          _id: connection.id,
          username: connection.id,
          connectedOn: new Date(),
          address: connection.clientAddress
      });
      connection.onClose( () => {
          // Remove entry from collection
          Presences.remove(connection.id);
          Logged.remove(connection.id);
          console.log("closed: " + connection.id);
      });
  });

  //Accounts.onLogout
  Accounts.onLogin(function(user){
     Meteor.call('customLogin', user.user.username);
  });

  // Publish collection
  Meteor.publish("presences", () => Presences.find({}));
  Meteor.publish("users", () => Logged.find({}));
}
