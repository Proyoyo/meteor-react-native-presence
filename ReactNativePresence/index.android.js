'use strict';

var DDPClient = require('ddp-client');
var React = require('react-native');
var _ = require('lodash');
var ddpClient;
var ddpClientTwo;
var {
  AppRegistry,
  StyleSheet,
  Text,
  View,
  ListView,
  TextInput,
  TouchableHighlight,
  Platform
} = React;

var styles = StyleSheet.create({
  container: {
    flex: 1,
    alignSelf: 'center',
    paddingTop: 30
  },

  title: {
    fontSize: 20,
  },

  user: {
    textAlign: 'left',
    color: '#666666',
    marginTop: 5,
    marginBottom: 5,
    alignSelf: 'center',
    fontSize: 12
  },

  loginForm: {
    flexDirection: "row",
    alignItems: "center"
  },

  loginBox: {
    flex: 2,
    borderColor: "#ffaa80",
    borderWidth: 1
  },

  loginButton: {
    flex: 1,
    backgroundColor: "#6699ff",
    flexDirection: "column",
    alignItems: "center",
    borderRadius: 5
  },

  loginButtonText:{
      color: "#ffffff",
      flex: 1
  },

  listView: {
      paddingTop: 10,
      backgroundColor: 'white'
  },

  nameInput: {
      height: 40,
      borderColor: '#ffaa80',
      borderWidth: 1
  }
});

var ReactNativePresence = React.createClass({

    getInitialState: function(){
        return{
            anonData: new ListView.DataSource({
                rowHasChanged: (row1, row2) => !_.isEqual(row1, row2),
            }),
            loggedData: new ListView.DataSource({
                rowHasChanged: (row1, row2) => !_.isEqual(row1, row2),
            }),
            anonLoaded: false,
            loggedLoaded: false,
            loginState: false
        };
    },

    componentDidMount: function(){
        ddpClient = new DDPClient({url: 'ws://10.0.3.2:3000/websocket'});
        //ddpClientTwo = new DDPClient({url: 'ws://localhost:3000/websocket'});
        // Subscribe to publication
        ddpClient.connect(() => {
            ddpClient.subscribe("presences", [], function(){
                console.log(ddpClient.collections.presences);
            });


            ddpClient.subscribe("users", [], function(){
                console.log(ddpClient.collections.logged);
            });


        });

        /*
        ddpClientTwo.connect(() => ddpClientTwo.subscribe("users", [], function(){
            console.log(ddpClientTwo.collections.logged);
        }));
        */
        // Observe "presences" collection
        var observer = ddpClient.observe("presences");
        var loggedObserver = ddpClient.observe("logged")
        // When something is added, changed, or removed, deep copy the data
        observer.added = () => this.updateAnonRows(_.cloneDeep(_.values(ddpClient.collections.presences)));
        observer.changed = () => this.updateAnonRows(_.cloneDeep(_.values(ddpClient.collections.presences)));
        observer.removed = () => this.updateAnonRows(_.cloneDeep(_.values(ddpClient.collections.presences)));

        loggedObserver.added = () => this.updateLoggedRows(_.cloneDeep(_.values(ddpClient.collections.logged)));
        loggedObserver.changed = () => this.updateLoggedRows(_.cloneDeep(_.values(ddpClient.collections.logged)));
        loggedObserver.removed = () => this.updateLoggedRows(_.cloneDeep(_.values(ddpClient.collections.logged)));
    },

    updateAnonRows: function(rows){
        this.setState({
            anonData: this.state.anonData.cloneWithRows(rows),
            anonLoaded: true,
        });
    },

    updateLoggedRows: function(rows){
        this.setState({
            loggedData: this.state.loggedData.cloneWithRows(rows),
            loggedLoaded: true,
        });
    },

    onLoginPressed(){
        var username = this.state.username;
        var password = this.state.password;
        var self = this;
        console.log(username + password);
        ddpClient.call('login', [{user: {username: username}, password: password}],
        function(err, result) {
            console.log(err)
            if(!err){
                ddpClient.call('customLogin', [], function(err, result) {console.log(err)}, function(){console.log('updated entry')});
                self.state.loginState = true;
            }
        },
        function() {
            console.log("Called login function");
        });
    },

    onLogoutPressed(){
        var self = this;
        ddpClient.call('logout', [], function(err, result) {
            console.log(err);
            if(!err){
                ddpClient.call('customLogout', [], function(err, result) {console.log(err)}, function(){console.log('removed entry')});
                self.state.loginState = false;
            }
        },
        function(){
            console.log("Called logout function");
        });
    },

    renderLogin: function(){
        if(this.state.loginState){
            return(
                <View style={styles.loginForm}>
                    <TouchableHighlight
                        style={styles.loginButton}
                        onPress={this.onLogoutPressed}>
                        <Text style={styles.loginButtonText}>Logout</Text>
                    </TouchableHighlight>
                </View>
            );
        } else {
            return(
                <View style={styles.loginForm}>
                    <TextInput
                        style={styles.loginBox}
                        placeholder= "username"
                        onChangeText={(text) => this.setState({username: text})}
                        value={this.state.username}
                    />
                    <TextInput
                        style={styles.loginBox}
                        placeholder= "password"
                        password={true}
                        onChangeText={(text) => this.setState({password: text})}
                        value={this.state.password}
                    />
                    <TouchableHighlight
                        style={styles.loginButton}
                        onPress={this.onLoginPressed}>
                        <Text style={styles.loginButtonText}>Login</Text>
                    </TouchableHighlight>
                </View>
            );
        }
    },

    render: function() {
        // If data is not loaded, return other view
        if(!this.state.anonLoaded && this.state.loggedLoaded){
            return this.renderLoadingView();
        }

        return(
            <View>
                <View style={styles.container}>
                    <Text style={styles.title}>
                        Registered Users
                    </Text>
                </View>

                {this.renderLogin()}

                <ListView
                    dataSource={this.state.loggedData}
                    renderRow={this.renderLogged}
                    style={styles.listView}
                />

                <View>
                    <View style={styles.container}>
                        <Text style={styles.title}>
                            Anonymous users
                        </Text>
                    </View>

                    <TextInput
                        style={styles.nameInput}
                        onChangeText={(text) => {ddpClient.call(
                            'changeName',
                            [text],
                            function(err, result) {console.log('called function')},
                            function() {console.log('updated')}
                        )}}
                        value={this.state.text}
                        placeholder= 'Type to change your name'
                        placeholderTextColor= '#ffbb99'
                    />

                    <ListView
                        dataSource={this.state.anonData}
                        renderRow={this.renderAnon}
                        style={styles.listView}
                    />
                </View>
            </View>
        );
    },

    // View to be displayed when data isn't loaded
    renderLoadingView: function(){
        return(
            <View style={styles.container}>
                <Text>
                    Loading users
                </Text>
            </View>
        );
    },

    renderAnon: function(presences){
        return(
            <View >
                <Text style={styles.user}>{presences.username} ({presences.address}) - {presences.connectedOn.toDateString()}</Text>
            </View>
        );
    },

    renderLogged: function(logged){
        return(
            <View>
                <Text style={styles.user}>{logged.username} ({logged.address}) - {logged.connectedOn.toDateString()}</Text>
            </View>
        );
    }
});

AppRegistry.registerComponent('ReactNativePresence', () => ReactNativePresence);
