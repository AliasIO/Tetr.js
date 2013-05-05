(function($) {
	/** @namespace */
	var tetris = {};

	/**
	 * Create a new game
	 *
	 * @constructor
	 * @return {Game}
	 */
	tetris.Game = function() {
		var self = this;

		/** @member */
		this.shapes = ['ddd', 'drr', 'ddr', 'drd', 'rdr', 'dru', 'rdur'];
		this.shapes = ['dddruuurdddruuurddd'];

		/** @member */
		this.blockSize = { main: 30, queue: 15 };

		/** @member */
		this.delay = 1000;

		/** @member */
		this.lastId = 0;

		/** @member */
		this.tetrimino = null;

		/** @member */
		this.queue = [];

		/** @member */
		this.el = {
			main:  $('#main'),
			queue: $('#queue')
			};

		/** @member */
		this.field = {
			main:  new tetris.Field(this, 'main',  10, 20),
			queue: new tetris.Field(this, 'queue', 99, 4)
			};

		/** @member */
		this.interval = setInterval(function() { self.progress(self); }, this.delay);

		$.each(new Array(6), function() { self.queueAdd(); });

		this.next();

		// Key bindings
		Mousetrap.bind('space',        function() { self.tetrimino.drop()     .place(); });
		Mousetrap.bind(['w', 'up'   ], function() { self.tetrimino.rotate()   .place().render(); });
		Mousetrap.bind(['a', 'left' ], function() { self.tetrimino.move(-1, 0).place().render(); });
		Mousetrap.bind(['s', 'down' ], function() { self.tetrimino.move( 0, 1).place().render(); });
		Mousetrap.bind(['d', 'right'], function() { self.tetrimino.move( 1, 0).place().render(); });

		return this;
	};

	/**
	 * Progress the game
	 *
	 * @param {Game} self
	 * @return {Game}
	 */
	tetris.Game.prototype.progress = function(self) {
		//self.tetrimino.move(0, 1).place().render();

		return self;
	};

	/**
	 * Get the next tetrimino in the queue
	 *
	 * @return {Game}
	 */
	tetris.Game.prototype.next = function() {
		var size;

		this.tetrimino = this.queue.shift();

		size = this.tetrimino.size();

		// Reset position, move to main grid
		this.tetrimino.move(- this.tetrimino.offset().x, - size.y + 1).field = this.field.main;

		// Move remaining queue to the left
		$.each(this.queue, function() {
			this.move(- size.x - 1, 0);
		});

		$.each(this.queue, function() {
			this.place().render();
		});

		this.tetrimino.place().render();

		return this.queueAdd();
	};

	/**
	 * Add a tetrimino to the queue
	 *
	 * @return {Game}
	 */
	tetris.Game.prototype.queueAdd = function() {
		var
			tetrimino = new tetris.Tetrimino(this.field.queue),
			offset    = 0
			;

		// Append to the queue
		$.each(this.queue, function() {
			offset += this.size().x + 1;
		});

		tetrimino.move(offset, 0).place().render();

		this.queue.push(tetrimino);

		return this;
	};

	/**
	 * Game over
	 *
	 * @return {Game}
	 */
	tetris.Game.prototype.gameOver = function() {
		console.log('gameOver');

		clearInterval(this.interval);

		return this;
	};

	/**
	 * Create a new tetrimino
	 *
	 * @constructor
	 * @param {Field} field
	 * @param {Block} [block]
	 */
	tetris.Tetrimino = function(field, block) {
		var
			self = this,
			x    = 0,
			y    = 0
			;

		/** @member */
		this.field  = field;

		/** @member */
		this.game = field.game;

		/** @member */
		this.id = ++ this.game.lastId;

		if ( block ) {
			this.blocks = [ block ];
		} else {
			this.blocks = [];

			// Generate a random tetrimino
			this.shape = this.game.shapes[Math.ceil(Math.random() * this.game.shapes.length - 1)];

			this.blocks.push(new tetris.Block(this, x, y));

			$.each(this.shape.split(''), function() {
				var available = true;

				switch ( this.toString() ) {
					case 'r': x ++; break;
					case 'd': y ++; break;
					case 'u': y --; break;
				}

				$.each(self.blocks, function() {
					if ( this.pos.x === x && this.pos.y === y ) {
						available = false;
					}
				});

				if ( available ) {
					self.blocks.push(new tetris.Block(self, x, y));
				}
			});
		}

		return this;
	};

	/**
	 * Move each block
	 *
	 * @param {integer} x
	 * @param {integer} y
	 * @return {Tetrimino}
	 */
	tetris.Tetrimino.prototype.move = function(x, y) {
		$.each(this.blocks, function() {
			this.move(x, y);
		});

		return this;
	};

	/**
	 * Move the tetrimino down until it collides
	 *
	 * @return {Tetrimino}
	 */
	tetris.Tetrimino.prototype.drop = function() {
		while ( this.id === this.game.tetrimino.id ) {
			this.move(0, 1).place();
		}

		return this;
	};

	/**
	 * Rotate 90 degrees clockwise
	 *
	 * @return {Tetrimino}
	 */
	tetris.Tetrimino.prototype.rotate = function() {
		var
			size   = this.size(),
			offset = this.offset()
			;

		$.each(this.blocks, function() {
			this.move(
				offset.x - ( this.pos.y - offset.y ) + size.y - 1 - this.pos.x,
				offset.y + ( this.pos.x - offset.x )              - this.pos.y
				);
		});

		return this.place();
	};

	/**
	 * Place each block on the grid and check for collisions
	 *
	 * @param {boolean} [stopRecursion]
	 * @return {Tetrimino}
	 */
	tetris.Tetrimino.prototype.place = function(stopRecursion) {
		var
			field     = this.field,
			collision = false,
			land      = false
			;

		$.each(this.blocks, function() {
			var block = field.get(this.pos.x, this.pos.y);

			if ( this.destroyed ) {
				return true;
			}

			if ( block === null || block.tetrimino === this.tetrimino ) {
				field.grid[this.pos.x][this.pos.y] = this;
			} else {
				collision = true;
			}
		});

		if ( collision ) {
			// Restore blocks to their previous position
			$.each(this.blocks, function() {
				if ( this.pos.y > this.oldPos.y && field.get(this.pos.x, this.pos.y + 1, this) ) {
					land = true;
				}

				this.move(this.oldPos.x - this.pos.x, this.oldPos.y - this.pos.y);

				this.pos = $.extend({}, this.oldPos);
			});

			if ( !stopRecursion ) {
				this.place(true);
			} else {
				console.log('Unrecoverable collision');
			}

			if ( land ) {
				this.land();
			}
		}

		$.each(this.blocks, function() {
			this.oldPos = $.extend({}, this.pos);
		});

		return this;
	};

	/**
	 * Land the tetrimino when it touches down
	 *
	 * @return {Tetrimino}
	 */
	tetris.Tetrimino.prototype.land = function() {
		this.render().split();

		this.field.checkLines();

		this.game.next();

		return this;
	};

	/**
	 * Get the left and top offset
	 *
	 * @return {object}
	 */
	tetris.Tetrimino.prototype.offset = function() {
		var offset = { x: Infinity, y: Infinity };

		$.each(this.blocks, function() {
			offset = {
				x: Math.min(offset.x, this.pos.x),
				y: Math.min(offset.y, this.pos.y)
				};
		});

		return offset;
	};

	/**
	 * Get the dimensions
	 *
	 * @return {object}
	 */
	tetris.Tetrimino.prototype.size = function() {
		var
			offset = this.offset(),
			max    = { x: 0, y: 0 }
			;

		$.each(this.blocks, function() {
			max = {
				x: Math.max(max.x, this.pos.x + 1),
				y: Math.max(max.y, this.pos.y + 1)
				};
		});

		return { x: max.x - offset.x, y: max.y - offset.y };
	};

	/**
	 * Animate each block
	 *
	 * @param {boolean|string} animation
	 * @return {Tetrimino}
	 */
	tetris.Tetrimino.prototype.animate = function(animation) {
		$.each(this.blocks, function() {
			this.animation = animation;
		});

		return this;
	};

	/**
	 * Render each block
	 *
	 * @return {Tetrimino}
	 */
	tetris.Tetrimino.prototype.render = function() {
		$.each(this.blocks, function() {
			this.render();
		});

		return this;
	};

	/**
	 * Split the tetrimino into a separate tetrimino for each block
	 *
	 * @return {Tetrimino}
	 */
	tetris.Tetrimino.prototype.split = function() {
		$.each(this.blocks, function() {
			this.tetrimino = new tetris.Tetrimino(this.tetrimino.field, this);
		});

		this.blocks = [];

		return this;
	};

	/**
	 * Create a new block
	 *
	 * @constructor
	 * @param {Tetrimino} tetrimino
	 * @param {integer} x
	 * @param {integer} y
	 * @return {Block}
	 */
	tetris.Block = function(tetrimino, x, y) {
		/** @member */
		this.tetrimino = tetrimino;

		/** @member */
		this.game = tetrimino.game;

		/** @member */
		this.animation = false;

		/** @member */
		this.destroyed = false;

		/** @member */
		this.pos = { x: x, y: y };

		/** @member */
		this.oldPos = { x: x, y: y };

		/** @member */
		this.el = $('<div>').addClass('block').addClass(tetrimino.shape).attr('data-tetrimino-id', tetrimino.id);

		return this;
	};

	/**
	 * Animate
	 *
	 * @param {object} animation
	 * @return {Block}
	 */
	tetris.Block.prototype.animate = function(animation) {
		this.animation = $.extend({ delay: 0, duration: 0, easing: null }, this.animation);

		return this;
	};

	/**
	 * Render the block
	 *
	 * @return {Block}
	 */
	tetris.Block.prototype.render = function() {
		if ( this.animation.delay ) {
			(function(block) { setTimeout(function() { block.render() }, block.animation.delay); })(this);

			this.animation.delay = 0;

			return this;
		}

		if ( this.destroyed ) {
			this.el.animate({ opacity: 0 }, this.animation.duration, this.animation.easing, function() { $(this).remove(); });
		} else {
			this.el
				.stop()
				.appendTo(this.game.el[this.tetrimino.field.id])
				.css({ opacity: 1 })
				.animate({
					left: this.pos.x * this.game.blockSize[this.tetrimino.field.id],
					top:  this.pos.y * this.game.blockSize[this.tetrimino.field.id]
				}, this.animation.duration, this.animation.easing);

			if ( this.pos.y < 0 ) {
				this.el.css({ opacity: .5 });
			}
		}

		this.animate({});

		return this;
	};

	/**
	 * Move the block
	 *
	 * @param {integer} x
	 * @param {integer} y
	 * @return {Block}
	 */
	tetris.Block.prototype.move = function(x, y) {
		var field = this.tetrimino.field;

		if ( field.get(this.pos.x, this.pos.y) === this ) {
			field.grid[this.pos.x][this.pos.y] = null;
		}

		this.pos.x += x;
		this.pos.y += y;

		return this;
	}

	/**
	 * Destroy the block
	 *
	 * @return {Block}
	 */
	tetris.Block.prototype.destroy = function() {
		this.destroyed = true;

		return this.move(0, 0).animate({ duration: 1000, easing: 'easeOutBounce' }).render();
	}

	/**
	 * Create a new field
	 *
	 * @constructor
	 * @param {Game} game
	 * @param {string} id
	 * @param {integer} cols
	 * @param {integer} rows
	 * @return {Field}
	 */
	tetris.Field = function(game, id, cols, rows) {
		var self = this;

		/** @member */
		this.game = game;

		/** @member */
		this.cols = cols;

		/** @member */
		this.rows = rows;

		/** @member */
		this.id = id;

		/** @member */
		this.grid = [];

		$.each(Array(cols), function(x) {
			self.grid[x] = {};

			$.each(Array(rows), function(y) {
				self.grid[x][y] = null;
			});
		});

		return this;
	};

	/**
	 * Get the value of a grid cell
	 * Returns a boolean if the coordinate is invalid, true invokes a landing
	 *
	 * @param {integer} x
	 * @param {integer} y
	 * @param {Block} [block]
	 * @return {Block|null|boolean}
	 */
	tetris.Field.prototype.get = function(x, y, block) {
		if ( x < 0 || x >= this.cols ) {
			return false;
		}

		if ( y >= this.rows ) {
			return true;
		}

		if ( y < 0 ) {
			return null;
		}

		if ( this.grid[x][y] === block ) {
			return null;
		}

		return this.grid[x][y];
	};

	/**
	 * Check for completed lines
	 *
	 * @return {Field}
	 */
	tetris.Field.prototype.checkLines = function() {
		var x, y, count,
			self = this
			;

		for ( y = this.rows - 1; y >= 0; y -- ) {
			count = 0;

			for ( x = 0; x < this.cols; x ++ ) {
				count += this.grid[x][y] ? 1 : 0;
			}

			if ( count === this.cols ) {
				this.clearLine(y);

				y ++;
			}
		}

		this.each(function(x, y, block) {
			block.tetrimino.render();
		}, true);

		for ( x = 0; x < this.cols; x ++ ) {
			if ( this.grid[x][0] ) {
				self.game.gameOver();
			}
		}

		return this;
	}

	/**
	 * Clean a completed line
	 *
	 * @param {integer} row
	 * @return {field}
	 */
	tetris.Field.prototype.clearLine = function(row) {
		var self = this;

		this.each(function(x, y, block) {
			if ( y === row ) {
				self.grid[x][row].destroy();
			}

			// Drop blocks above cleared line
			if ( y < row  ) {
				block.tetrimino
					.move(0, 1)
					.place()
					.animate({ delay: 1000, duration: 700, easing: 'easeOutBounce' })
					;
			}
		}, true);

		return this;
	};

	/**
	 * Loop through each position on the field, bottom to top
	 *
	 * @param {requestCallback} callback
	 * @param {boolean}         [skipEmpty] Only return blocks
	 */
	tetris.Field.prototype.each = function(callback, skipEmpty) {
		var x, y;

		for ( x = 0; x < this.cols; x ++ ) {
			for ( y = this.rows - 1; y >= 0; y -- ) {
				if ( this.grid[x][y] || !skipEmpty ) {
					callback(x, y, this.grid[x][y]);
				}
			}
		}

		return this;
	};

	$(function() { new tetris.Game; });

	return tetris;
})(jQuery);
