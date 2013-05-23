/*global tetriscide:false, goinstant:false, $:false, console:false */
window.tetriscide = window.tetriscide || {};

(function() {
  var DATA_ROOT = "/tetriscide-gordie/";
  var GS_PLAYERS_KEY = DATA_ROOT + "players";
  var GS_MASTER_KEY = DATA_ROOT + 'master';
  var KEYPRESS = DATA_ROOT + "keypress";

  // global player object representing me me me.
  var go;
  var players;
  var master;
  var keypress;


  function Me() {
    // generate a random value here to represent me. This is
    // just a random 7 digit number for now (kinda lame)
    this.id = Math.floor(Math.random() * 8999999) + 1000000;
    this._key = GS_PLAYERS_KEY + '/' + this.id;

    // add me to the list of players
    this._reference = go.key(this._key);

    this._updateMe();
  }
  Me.prototype.id = 0;
  Me.prototype.name = 'a player';
  Me.prototype._key = 'unknown';
  Me.prototype._reference = null;

  Me.prototype._updateMe = function() {
    var updateObj = {};
    updateObj[this.id] = { id: this.id, name: this.name };

    tetriscide.gameState.players[this.id] = updateObj[this.id];

    players.update(updateObj);

    this._reference.get(function(resp) {
      console.log("Added player:", JSON.stringify(resp.value));
      console.log(tetriscide.gameState.players);
    });
  };

  Me.prototype.isMaster = function() {
    return this.id == tetriscide.gameState.master;
  };

  Me.prototype.unregister = function() {
    var updateObj = {};
    updateObj[this.id] = { id: 0, name: this.name };
    players.update(updateObj);    // set the value to 0 to indicate a deletion
    this._reference.remove();     // remove the reference

    delete tetriscide.gameState.players[this.id];
    console.log("Removed player " + this.id + "from player list");
    console.log(JSON.stringify(tetriscide.gameState.players));
  };

  Me.prototype.setName = function(name) {
    this._name = name;
    this._updateMe();
  };


  // initialization
  function init() {
    // remove my player when we leave the page.
    $(window).unload(function() {
      if (tetriscide.me) tetriscide.me.unregister();
    });

    // create a connection to the platform.
    go = new goinstant.Platform();

    // initialize an empty gamestate.
    tetriscide.gameState = {};
    tetriscide.gameState.players = {};

    tetriscide.gameState.master = null;
    tetriscide.gameState.setMaster = function(masterId) {
      tetriscide.gameState.master = masterId;
      master.set(tetriscide.gameState.master);
    };

    tetriscide.gameState.sendKeyPress = function(keyCode) {
      console.log("Sending keypress:" + keyCode);
      keypress.set({ from: tetriscide.me.id, key: keyCode });
    };

    var keypressCallbacks = [];
		tetriscide.gameState.handleKeyPress = function(cb) {
      keypressCallbacks.push(cb);
    };

    // initialize the keypress reference
    keypress = go.key(KEYPRESS);
    keypress.on('set', function(data) {
      console.log("receiving keypress:" + JSON.stringify(data.value));
      keypressCallbacks.forEach(function(cb) {
        cb(data.value);
      });
		});

    // Create the players key if it does not exist.
    // Update the game state whenever the players list changes. This will
    // be triggered when I come into the game.
    players = go.key(GS_PLAYERS_KEY);

    players.on('update', function(resp) {
      console.log("Getting some players updating action: ", resp.value);
      var updatedPlayers = resp.value;
      for (var playerId in updatedPlayers) {
        console.log(playerId, updatedPlayers[playerId]);
        if (updatedPlayers[playerId].id === 0) {
          console.log(JSON.stringify(tetriscide.gameState.players));
          delete tetriscide.gameState.players[playerId];
          console.log("Removing player " + playerId + " from player list");
          console.log(JSON.stringify(tetriscide.gameState.players) + "\n");

        } else {
          tetriscide.gameState.players[playerId] = updatedPlayers[playerId];
          console.log("Updating player " + playerId + " in player listi");
          console.log(JSON.stringify(tetriscide.gameState.players));
        }
      }

      tetriscide.gameState.players = resp.value;
    });

    tetriscide.me = new Me();

    // Create the master key if it does not exist and update the game state
    // whenever the master changes.
    master = go.key(GS_MASTER_KEY);
    master.on('set', function(resp) {
      console.log("Getting some master setting action: ", resp.value);
      tetriscide.gameState.master = resp.value;
    });

    // temporary setting of the master to the current player
    tetriscide.gameState.setMaster(tetriscide.me.id);

    players.get(function(resp) {
      tetriscide.gameState.players = resp.value;
    });

  }

  // initialize all the things after the body is loaded.
  $(document).ready(init);

}());
