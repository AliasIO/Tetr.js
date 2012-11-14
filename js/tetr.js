(function() {
	var app = {
		blockSize: 30,
		el: {},
		field: {
			grid: null
		},
		tetrimino: null,
		queue: [],

		/**
		 * Initialise
		 */
		init: function() {
			app.el = {
				main: $('#main')
			};

			app.field.grid = new app.Grid(10, 20);

			_(_.range(5)).each(function(i) {
				app.queue.push(new app.Tetrimino);
			});

			app.next();

			_(_.range(200)).each(function(i) {
				setTimeout(function() {
					if ( Math.round(Math.random()) ) {
						app.tetrimino.rotate(Math.round(Math.random()));
					}

					if ( Math.round(Math.random()) ) {
						app.tetrimino.left();
					} else {
						app.tetrimino.right();
					}

					app.tetrimino.down().render();
				}, 10 * i);
			});
		},

		/**
		 *
		 */
		Tetrimino: function() {
			var
				move, random, diff,
				self = this,
				x    = 0,
				y    = 0
				;

			self.id = '';

			self.pos = { x: 0, y: 0 };

			// Generate a random tetrimino
			self.grid = new app.Grid(4, 4).fill(x, y);

			while ( self.id.length < 3 ) {
				random = _.random(3);

				diff = {
					x: random > 1 ? ( random % 2 && x > 0 ? -1 : 1 ) : 0,
					y: random < 2 ? ( random % 2 && y > 0 ? -1 : 1 ) : 0
				};

				if ( !self.grid.isFilled(x + diff.x, y + diff.y) ) {
					self.grid.fill(x += diff.x, y += diff.y);

					self.id += diff.x ? diff.x < 0 ? 'a' : 'b' : diff.y < 0 ? 'c' : 'd';
				}
			}

			self.grid.trim();

			/**
			 *
			 */
			move = function(x, y) {
				var oldPos = _.clone(self.pos);

				self.pos.x += x;
				self.pos.y += y;

				if ( self.collision() ) {
					self.pos = oldPos;

					if ( y ) {
						self.grid.trimmed.map(function(col, row, filled) {
							if ( filled ) {
								app.field.grid.fill(self.pos.x + col, self.pos.y + row);
							}
						});

						return app.next();
					}
				}

				return self;
			};

			/**
			 *
			 */
			self.left = function() {
				console.log('left');

				return move(-1, 0);
			};

			/**
			 *
			 */
			self.right = function() {
				console.log('right');

				return move(1, 0);
			};

			/**
			 *
			 */
			self.down = function() {
				console.log('down');

				return move(0, 1);
			};

			/**
			 *
			 */
			self.rotate = function(clockwise) {
				console.log('rotate ' + ( clockwise ? '' : 'counter ' ) + 'clockwise');

				var
					oldGrid = _.clone(self.grid.grid),
					grid    = new app.Grid(4, 4)
					;

				self.grid.map(function(col, row, filled) {
					if ( filled ) {
						grid.fill(clockwise ? 3 - row : row, clockwise ? col : 3 - col);
					}
				});

				self.grid.grid = grid.grid;

				self.grid.trim();

				if ( self.collision() ) {
					self.grid.grid = oldGrid;

					self.grid.trim();
				}

				return self;
			};

			/**
			 *
			 */
			self.collision = function() {
				var collision;

				self.grid.trimmed.map(function(col, row, filled) {
					collision = collision || filled && app.field.grid.isFilled(self.pos.x + col, self.pos.y + row);
				});

				return collision;
			};

			/**
			 *
			 */
			self.render = function() {
				_.map(self.el, function(el) { el.remove(); });

				self.el = [];

				self.grid.trimmed.map(function(col, row, filled) {
					if ( filled ) {
						var $block = $('<div>');

						$block
							.addClass('block')
							.addClass(self.id)
							.css({
								left: ( self.pos.x + col ) * app.blockSize,
								top:  ( self.pos.y + row ) * app.blockSize
							});

						self.el.push($block);

						app.el.main.append($block);
					}
				});

				return self;
			};
		},

		/**
		 *
		 */
		next: function() {
			if ( app.tetrimino ) {
				app.tetrimino.render();
			}

			app.tetrimino = app.queue.shift();

			app.queue.push(new app.Tetrimino);

			return app.tetrimino;
		},

		/**
		 * Create a zero-filled grid
		 */
		Grid: function(cols, rows) {
			var
				trim,
				self = this
				;

			self.grid = _(_.range(cols)).map(function() {
				return _(_.range(rows)).map(function() {
					return 0;
				});
			});

			/**
			 * Check if a cell is empty
			 *
			 * @param integer x
			 * @param integer y
			 * @return boolean
			 */
			self.isFilled = function(x, y) {
				return _.isUndefined(self.grid[x]) || _.isUndefined(self.grid[x][y]) || self.grid[x][y];
			};

			/**
			 *
			 */
			self.fill = function(x, y) {
				if ( !self.isFilled(x, y) ) {
					self.grid[x][y] = 1;
				}

				return self;
			};

			/**
			 *
			 */
			self.map = function(callback) {
				_.each(self.grid, function(col, x) {
					_.each(col, function(filled, y) {
						callback(x, y, filled);
					});
				});
			};

			/**
			 *
			 */
			self.trim = function() {
				self.trimmed = new app.Grid(4, 4);

				self.trimmed.grid = _.clone(self.grid);

				trim();

				return self;
			};

			/**
			 *
			 */
			trim = function() {
				var
					g      = self.trimmed.grid,
					top    = true,
					right  = true,
					bottom = true,
					left   = true
					;

				_.each(g[0],            function(col) { if ( col                 ) { right  = false; } });
				_.each(g[g.length - 1], function(col) { if ( col                 ) { left   = false; } });
				_.each(g,               function(row) { if ( row[0]              ) { top    = false; } });
				_.each(g,               function(row) { if ( row[row.length - 1] ) { bottom = false; } });

				if ( right  ) { g.shift(); }
				if ( left   ) { g.pop();   }
				if ( top    ) { _.each(g, function(row) { row.shift(); }); }
				if ( bottom ) { _.each(g, function(row) { row.pop();   }); }

				if ( top || right || bottom || left ) {
					trim();
				}
			};

			return self;
		}
	}

	$(function() { app.init(); });

	return app;
})();
