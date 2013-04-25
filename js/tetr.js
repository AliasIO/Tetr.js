(function($) {
	var app = {
		blockSize: { main: 30, next: 15 },
		el: {},
		grid: null,
		shapes: [ 'ddd', 'drr', 'ddr', 'drd', 'rdr', 'dru', 'rdur' ],
		delay: 1000,
		lastId: 0,
		tetrimino: null,
		queue: [],

		/**
		 * Initialise
		 */
		init: function() {
			app.el = {
				main: $('#main'),
				queue: $('#queue')
			};

			app.grid = new app.Grid(10, 20);

			_(_.range(6)).each(function() {
				app.queue.push(new app.Tetrimino);
			});

			app.next();

			// Key bindings
			KeyboardJS.on('w, up',    function() { app.tetrimino.rotate().render(); });
			KeyboardJS.on('a, left',  function() { app.tetrimino  .left().render(); });
			KeyboardJS.on('s, down',  function() { app.tetrimino  .down().render(); });
			KeyboardJS.on('d, right', function() { app.tetrimino .right().render(); });

			KeyboardJS.on('space', function() { app.tetrimino  .drop().render(); });

			app.interval = setInterval(app.progress, app.delay);
		},

		/**
		 *
		 */
		Tetrimino: function() {
			var
				move,
				self   = this,
				blocks = [],
				x      = 0,
				y      = 0
				;

			self.id = ++ app.lastId;

			// Generate a random tetrimino
			self.shape = app.shapes[_.random(app.shapes.length - 1)];

			blocks.push(new app.Block(self, x, y));

			_.map(self.shape.split(''), function(direction) {
				switch ( direction ) {
					case 'r': x ++; break;
					case 'd': y ++; break;
					case 'u': y --; break;
				}

				blocks.push(new app.Block(self, x, y));
			});

			/**
			 *
			 */
			move = function(x, y) {
				_.each(blocks, function(block) {
					block.pos.x += x;
					block.pos.y += y;

					app.grid.place(block);
				});

				/*
				if ( self.collision() && y ) {
					return app.land();
				}
				*/

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
			self.drop = function() {
				console.log('drop');

				var id = self.id;

				while ( self.down().id === id );

				return self.render();
			};

			/**
			 *
			 */
			self.rotate = function() {
				console.log('rotate');

				var
					oldGrid = _.clone(self.grid.grid),
					grid    = new app.Grid(4, 4)
					;

				self.grid.map(function(col, row, block) {
					if ( block ) {
						grid.fill(3 - row, col, block);
					}
				});

				self.grid.grid = grid.grid;

				//self.grid.trim();

				return self;
			};

			/**
			 *
			 */
			self.collision = function() {
				_.each(blocks, function(block) {
					block.collision();
				});

				return self;
			};

			/**
			 *
			 */
			self.render = function() {
				blocks.map(function(block) {
					block.render();
				});

				return self;
			};
		},

		Block: function(tetrimino, x, y) {
			var self = this;

			self.tetrimino = tetrimino;

			self.pos = { x: x, y: y };

			self.oldPos = _.clone(self.pos);

			self.el = $('<div>').addClass('block').addClass(tetrimino.shape);

			app.el.main.append(self.el);

			/**
			 *
			 */
			self.collision = function() {
				self.pos = _.clone(self.oldPos);
			}

			/**
			 *
			 */
			self.render = function() {
				self.oldPos = _.clone(self.pos);

				self.el
					.stop()
					.appendTo(app.el.main)
					.css({
						left: self.pos.x * app.blockSize.main,
						top:  self.pos.y * app.blockSize.main
					});
			}

			return self;
		},

		/**
		 *
		 */
		progress: function() {
			app.tetrimino.down().render();
		},

		/**
		 *
		 */
		land: function() {
			var
				filledCols = {},
				filledRows = []
				;

			app.tetrimino.render();

			// Check main grid for completed lines
			app.grid.map(function(col, row, block) {
				if ( _.isUndefined(filledCols[row]) ) {
					filledCols[row] = 0;
				}

				filledCols[row] += block ? 1 : 0;

				if ( filledCols[row] === app.grid.cols ) {
					filledRows.push(row);
				}
			});

			// Remove completed lines
			if ( filledRows ) {
				_.map(filledRows, function(row) {
					app.grid.map(function(x, y, block) {
						if ( y === row ) {
							block.el.fadeOut(x * 50, function() {
								app.grid.clear(x, y);

								app.grid.map(function(x2, y2, block) {
									if ( !_.isNull(block) && y2 < y ) {
										app.grid.clear(x2, y2, block);
										app.grid.fill(x2, y2 + 1, block);

										setTimeout(function() {
											block.el
												.stop()
												.animate({
													top: ( y2 + 1 ) * app.blockSize.main
												}, 50);
										}, x2 * 50);
									}
								});
							});
						}
					});
				});
			}

			// Check for game over
			app.grid.map(function(col, row, block) {
				if ( block && row === 0 ) {
					console.log(row);
					app.gameOver();
				}
			});

			return app.next();
		},

		/**
		 *
		 */
		next: function() {
			console.log('next');

			var posX = 0;

			if ( app.tetrimino ) {
				app.tetrimino.render();
			}

			app.tetrimino = app.queue.shift();

			app.queue.push(new app.Tetrimino);

			_.each(app.queue, function(tetrimino, i) {
				_.each(tetrimino.blocks, function(block) {
					if ( block.el.parent()[0] !== app.el.queue[0] ) {
						app.el.queue.append(block.el);

						block.el
							.css({
								left: ( col + posX ) * app.blockSize.next,
								top:  row            * app.blockSize.next
							});
					}

					block.el
						.stop()
						.animate({
							left: ( col + posX ) * app.blockSize.next
						}, 'fast')
						;
				});
			});


			return app.tetrimino.render();
		},

		/**
		 *
		 */
		gameOver: function() {
			console.log('gameOver');

			clearInterval(app.interval);
		},

		/**
		 * Create a null-filled grid
		 */
		Grid: function(cols, rows) {
			var
				//trim,
				self = this
				;

			self.cols = cols;
			self.rows = rows;

			self.grid = _(_.range(cols)).map(function() {
				return _(_.range(rows)).map(function() {
					return null;
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
				return ( x < 0 || x > self.grid.cols || y > 0 ) && ( _.isUndefined(self.grid[x]) || _.isUndefined(self.grid[x][y]) || self.grid[x][y] );
			};

			/**
			 *
			 */
			self.place = function(block) {
				if ( !self.isFilled(block.pos.x, block.pos.y) ) {
					self.grid[block.pos.x][block.pos.y] = block;
				} else {
					block.tetrimino.collision();
				}

				return self;
			};

			/**
			 *
			 */
			/*
			self.fill = function(x, y, block) {
				if ( !self.isFilled(x, y) ) {
					self.grid[x][y] = block;

					block.pos = { x: x, y: y };
				} else {
					block.el.remove();
				}

				return self;
			};
			*/

			/**
			 *
			 */
			self.clear = function(x, y, block) {
				if ( self.isFilled(x, y) ) {
					self.grid[x][y].el.remove();

					self.grid[x][y] = null;
				}

				return self;
			};

			/**
			 *
			 */
			/*
			self.move = function(x, y, block) {
				if ( self.isFilled(x, y) ) {
					self.grid[x][y].el.remove();

					self.grid[x][y] = null;
				}

				return self;
			};
			*/

			/**
			 *
			 */
			self.map = function(callback) {
				_.each(self.grid, function(col, x) {
					_.each(col, function(block, y) {
						callback(x, y, block);
					});
				});
			};

			/**
			 *
			 */
			/*
			self.trim = function() {
				self.trimmed = new app.Grid(4, 4);

				self.trimmed.grid = _.clone(self.grid);

				trim();

				return self;
			};
			*/

			/**
			 *
			 */
			/*
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

				if ( right  ) { g.shift();                                 self.trimmed.cols --; }
				if ( left   ) { g.pop();                                   self.trimmed.cols --; }
				if ( top    ) { _.each(g, function(row) { row.shift(); }); self.trimmed.rows --; }
				if ( bottom ) { _.each(g, function(row) { row.pop();   }); self.trimmed.rows --; }

				if ( top || right || bottom || left ) {
					trim();
				}
			};
			*/

			return self;
		}
	}

	$(app.init);
})(jQuery);
