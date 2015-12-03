Presences = new Mongo.Collection('presences');

Meteor.methods({
    changeName: function(name){
        Presences.update(this.connection.id, {$set: {username: name}});
    }
});

if (Meteor.isClient) {

    // Subscribe to "users" publication
    Meteor.subscribe("users");

    Template.body.helpers({
        users: function(){
            return Presences.find({});
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

}

if (Meteor.isServer) {
  Meteor.startup(function () {
      // Clean up collection
      Presences.remove({});
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
          console.log("closed: " + connection.id);
      });
  });

  // Publish collection
  Meteor.publish("users", () => Presences.find({}));
}
