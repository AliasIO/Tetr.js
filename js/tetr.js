(function($) {
	$(function() { new Tetris; });

	function Tetris() {
		var self = this;

		this.shapes    = ['ddd', 'drr', 'ddr', 'drd', 'rdr', 'dru', 'rdur'];
		this.blockSize = { main: 30, queue: 15 };
		this.delay     = 1000;
		this.lastId    = 0;
		this.tetrimino = null;
		this.queue     = [];

		this.el = {
			main:  $('#main'),
			queue: $('#queue')
			};

		this.field = {
			main:  new Field(this, 'main',  10, 20),
			queue: new Field(this, 'queue', 99, 4)
			};

		$.each(new Array(6), function() { self.queueAdd(); });

		this.next();

		// Key bindings
		Mousetrap.bind('space',        function() { self.tetrimino.drop()     .place().render(); });
		Mousetrap.bind(['w', 'up'   ], function() { self.tetrimino.rotate()   .place().render(); });
		Mousetrap.bind(['a', 'left' ], function() { self.tetrimino.move(-1, 0).place().render(); });
		Mousetrap.bind(['s', 'down' ], function() { self.tetrimino.move( 0, 1).place().render(); });
		Mousetrap.bind(['d', 'right'], function() { self.tetrimino.move( 1, 0).place().render(); });

		this.interval = setInterval(function() { self.progress(self); }, this.delay);

		return this;
	};

	/**
	 *
	 */
	Tetris.prototype.progress = function(self) {
		//self.tetrimino.move(0, 1).render();
	};

	/**
	 *
	 */
	Tetris.prototype.next = function() {
		var size;

		this.tetrimino = this.queue.shift();

		size = this.tetrimino.size();

		// Reset position, move to main grid
		this.tetrimino.move(- this.tetrimino.offset().x, 0).field = this.field.main;

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
	 *
	 */
	Tetris.prototype.queueAdd = function() {
		var
			tetrimino = new Tetrimino(this.field.queue),
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
	 *
	 */
	Tetris.prototype.gameOver = function() {
		console.log('gameOver');

		clearInterval(this.interval);

		return this;
	};

	/**
	 *
	 */
	function Tetrimino(field, block) {
		var
			self = this,
			x    = 0,
			y    = 0
			;

		this.field  = field;
		this.tetris = field.tetris;

		this.id = ++ this.tetris.lastId;

		if ( block ) {
			this.blocks = [ block ];
		} else {
			this.blocks = [];

			// Generate a random tetrimino
			this.shape = this.tetris.shapes[Math.ceil(Math.random() * this.tetris.shapes.length - 1)];
			this.shape = this.tetris.shapes[0];

			this.blocks.push(new Block(this, x, y));

			$.each(this.shape.split(''), function() {
				switch ( this.toString() ) {
					case 'r': x ++; break;
					case 'd': y ++; break;
					case 'u': y --; break;
				}

				self.blocks.push(new Block(self, x, y));
			});
		}

		return this;
	};

	/**
	 *
	 */
	Tetrimino.prototype.move = function(x, y) {
		$.each(this.blocks, function() {
			this.move(x, y);
		});

		return this;
	};

	/**
	 *
	 */
	Tetrimino.prototype.drop = function() {
		while ( this.id === this.tetris.tetrimino.id ) {
			this.move(0, 1).place();
		}

		return this;
	};

	/**
	 *
	 */
	Tetrimino.prototype.rotate = function() {
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
	 *
	 */
	Tetrimino.prototype.place = function() {
		var
			field     = this.field,
			collision = false,
			land      = false
			;

		$.each(this.blocks, function() {
			if ( field.available(this.pos.x, this.pos.y, this) ) {
				field.grid[this.pos.x][this.pos.y] = this;
			} else {
				collision = true;
			}
		});

		if ( collision ) {
			console.log('collision on field ' + this.field.id);

			// Restore blocks to their previous position
			$.each(this.blocks, function() {
				land = land || this.pos.y > this.oldPos.y;

				this.move(this.oldPos.x - this.pos.x, this.oldPos.y - this.pos.y);

				this.pos = $.extend({}, this.oldPos);
			});

			this.place();

			if ( land ) {
				this.land();
			}
		}

		$.each(this.blocks, function() {
			this.oldPos = $.extend({}, this.pos);
		});

		this.tetris.field.main.debug(); //

		return this;
	};

	/**
	 *
	 */
	Tetrimino.prototype.land = function() {
		this.render().split();

		this.field.checkLines();

		this.tetris.next();

		return this;
	};

	/**
	 *
	 */
	Tetrimino.prototype.offset = function() {
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
	 *
	 */
	Tetrimino.prototype.size = function() {
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
	 *
	 */
	Tetrimino.prototype.render = function() {
		$.each(this.blocks, function() {
			this.render();
		});

		return this;
	};

	/**
	 *
	 */
	Tetrimino.prototype.split = function() {
		$.each(this.blocks, function() {
			this.tetrimino = new Tetrimino(this.tetrimino.field, this);
		});

		this.blocks = [];

		return this;
	};

	/**
	 *
	 */
	function Block(tetrimino, x, y) {
		this.tetrimino = tetrimino;
		this.tetris    = tetrimino.tetris;

		this.pos    = { x: x, y: y };
		this.oldPos = { x: x, y: y };

		this.el = $('<div>').addClass('block').addClass(tetrimino.shape).attr('data-tetrimino-id', tetrimino.id);

		return this;
	};

	/**
	 *
	 */
	Block.prototype.render = function() {
		this.el
			.stop()
			.appendTo(this.tetris.el[this.tetrimino.field.id])
			.css({
				left: this.pos.x * this.tetris.blockSize[this.tetrimino.field.id],
				top:  this.pos.y * this.tetris.blockSize[this.tetrimino.field.id]
			});

		return this;
	};

	/**
	 *
	 */
	Block.prototype.move = function(x, y) {
		var field = this.tetrimino.field;

		if ( field.available(this.pos.x, this.pos.y, this) && field.grid[this.pos.x][this.pos.y] === this ) {
			field.grid[this.pos.x][this.pos.y] = null;
		}

		this.pos.x += x;
		this.pos.y += y;

		return this;
	}

	/**
	 * Create an empty field
	 */
	function Field(tetris, id, cols, rows) {
		var self = this;

		this.tetris = tetris;
		this.cols   = cols;
		this.rows   = rows;
		this.id     = id;
		this.grid   = [];

		$.each(Array(cols), function(x) {
			self.grid[x] = [];

			$.each(Array(rows), function(y) {
				self.grid[x][y] = null;
			});
		});

		return this;
	};

	/**
	 * Check if a cell is empty
	 *
	 * @param integer x
	 * @param integer y
	 * @param object block
	 * @return boolean
	 */
	Field.prototype.available = function(x, y, block) {
		if ( typeof this.grid[x] === 'undefined' || typeof this.grid[x][y] === 'undefined' ) {
			return false;
		}

		if ( !this.grid[x][y] ) {
			return true;
		}

		if ( block && block.tetrimino && this.grid[x][y].tetrimino ) {
			return this.grid[x][y].tetrimino === block.tetrimino;
		}
	};

	/**
	 *
	 */
	Field.prototype.checkLines = function() {
		var x, y, blocks,
			self = this
			;

		for ( y = this.rows - 1; y >= 0; y -- ) {
			blocks = 0;

			for ( x = 0; x < this.cols; x ++ ) {
				blocks += this.grid[x][y] ? 1 : 0;
			}

			if ( blocks === this.cols ) {
				this.clearLine(y);

				y ++;
			}
		}

		this.each(function(x, y, block) {
			block.tetrimino.render();
		}, true);

		for ( x = 0; x < this.cols; x ++ ) {
			if ( this.grid[x][0] ) {
				self.tetris.gameOver();
			}
		}
	}

	/**
	 *
	 */
	Field.prototype.clearLine = function(row) {
		var self = this;

		this.each(function(x, y, block) {
			if ( y === row ) {
				self.grid[x][y] = null;

				setTimeout(function() {
					block.el.remove();

					block = null;
				}, ( x + 1 ) * 20);
			}
		});

		this.each(function(x, y, block) {
			if ( y < row  ) {
				block.tetrimino.move(0, 1);
			}
		}, true);

		this.each(function(x, y, block) {
			if ( y < row  ) {
				block.tetrimino.place();
			}
		}, true);
	};

	/**
	 *
	 */
	Field.prototype.debug = function() {
		var grid = '';

		$.each(this.grid, function(x) {
			$.each(this, function(y) {
				grid += this instanceof Block ? 'X' : '.';
			});

			grid += "\n";
		});

		$('#debug').text(grid);
	};

	/**
	 *
	 */
	Field.prototype.each = function(callback, skipEmpty) {
		$.each(this.grid, function(x) {
			$.each(this, function(y, block) {
				if ( block || !skipEmpty ) {
					callback(x, y, block);
				}
			});
		});

		return this;
	};
})(jQuery);
