window.tetriscide = window.tetriscide || {};

(function() {
  var DATA_ROOT = "/tetriscide/";
  var GS_PLAYERS_KEY = DATA_ROOT + "players";

  // global player object representing me me me.
  var _me = {};

  // initialization
  function init() {
    // create a connection to the platform.
    var go = new goinstant.Platform();

    // generate a random value here to represent me. This is
    // just a random 7 digit number for now (kinda lame)
    _me.name = 'a player';
    _me.id = Math.floor(Math.random() * 8999999) + 1000000;

    window.tetriscide.gameState = {};
    window.tetriscide.gameState.players = {};

    // create the players key if it does not exist.
    var players = go.key(GS_PLAYERS_KEY);

    // update the game state whenever the players list changes. This will
    // be triggered when I come into the game.
    players.on('set', function(resp) {
      window.tetriscide.gameState.players = resp.value;
    });

    // create my key in the players list
    var me = players.key('/' + _me.id);
    me.set(_me);
  }

  // initialize all the things after the body is loaded.
  $(document).ready(init);
}());
