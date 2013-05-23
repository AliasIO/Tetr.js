/*global tetriscide:false, goinstant:false, $:false, console:false */
window.tetriscide = window.tetriscide || {};

(function() {
  var DATA_ROOT = "/tetriscide22/";
  var GS_PLAYERS_KEY = DATA_ROOT + "players";
  var GS_MASTER_KEY = 'master';
  var STATUS = DATA_ROOT + "status";
  var KEYPRESS = DATA_ROOT + "keypress";

  // global player object representing me me me.
  var go;

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
    this._reference.set({ id: this.id, name: this.name });
  };

  Me.prototype.isMaster = function() {
    return this.id == tetriscide.gameState.master;
  };

  Me.prototype.unregister = function() {
    this._reference.remove();
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
    tetriscide.keyPress = go.key(KEYPRESS);

    // Create the players key if it does not exist.
    // Update the game state whenever the players list changes. This will
    // be triggered when I come into the game.
    var players = go.key(GS_PLAYERS_KEY);
    players.remove();

    players.on('set', function(resp) {
      tetriscide.gameState.players = resp.value;
    });

    tetriscide.me = new Me();

    // Create the master key if it does not exist and update the game state
    // whenever the master changes.
    var master = go.key(GS_MASTER_KEY);
    master.on('set', function(resp) {
      tetriscide.gameState.master = resp.value;
    });

    // temporary setting of the master to the current player
    master.set(tetriscide.me.id);

    players.get(function(resp) {
      tetriscide.gameState.players = resp.value;
    });

    tetriscide.gameState.status = {};
    tetriscide.status = go.key(STATUS);
    tetriscide.status.get(function (data) {
      if (data === undefined) {
        tetriscide.status.set({ newgame: true });
      }
      tetriscide.gameState.status = data;
    });

  }

  // initialize all the things after the body is loaded.
  $(document).ready(init);

}());
