'use strict';

var DDPClient = require('ddp-client');
var React = require('react-native');
var _ = require('lodash');
var ddpClient;
var {
  AppRegistry,
  StyleSheet,
  Text,
  View,
  ListView,
  TextInput
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

  listView: {
      paddingTop: 10,
      backgroundColor: 'white',
      textAlign: 'left'
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
            dataSource: new ListView.DataSource({
                rowHasChanged: (row1, row2) => !_.isEqual(row1, row2),
            }),
            loaded: false,
        };
    },

    componentDidMount: function(){
        ddpClient = new DDPClient({url: 'ws://localhost:3000/websocket'});
        // Subscribe to publication
        ddpClient.connect(() => ddpClient.subscribe("users", [], function(){
            console.log(ddpClient.collections.presences);
        } ));
        // Observe "presences" collection
        var observer = ddpClient.observe("presences");
        // When something is added, changed, or removed, deep copy the data
        observer.added = () => this.updateRows(_.cloneDeep(_.values(ddpClient.collections.presences)));
        observer.changed = () => this.updateRows(_.cloneDeep(_.values(ddpClient.collections.presences)));
        observer.removed = () => this.updateRows(_.cloneDeep(_.values(ddpClient.collections.presences)));
    },

    updateRows: function(rows){
        this.setState({
            dataSource: this.state.dataSource.cloneWithRows(rows),
            loaded: true,
        });
    },

    render: function() {
        // If data is not loaded, return other view
        if(!this.state.loaded){
            return this.renderLoadingView();
        }

        return(
            <View>
                <View style={styles.container}>
                    <Text style={styles.title}>
                        Online users
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
                    dataSource={this.state.dataSource}
                    renderRow={this.renderList}
                    style={styles.listView}
                />
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

    renderList: function(presences){
        return(
            <View >
                <Text style={styles.user}>{presences.username} ({presences.address}) - {presences.connectedOn.toDateString()}</Text>
            </View>
        );
    }
});

AppRegistry.registerComponent('ReactNativePresence', () => ReactNativePresence);
