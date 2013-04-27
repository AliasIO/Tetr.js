(function($) {
	$(function() { new Tetris; });

	var Tetris = function() {
		var self = this;

		this.shapes    = [ 'ddd', 'drr', 'ddr', 'drd', 'rdr', 'dru', 'rdur' ];
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

		$.each(new Array(6), function() {
			self.queueAdd();
		});

		this.next();

		// Key bindings
		Mousetrap.bind('space',        function() { self.tetrimino.drop()     .render(); });
		Mousetrap.bind(['w', 'up'   ], function() { self.tetrimino.rotate()   .render(); });
		Mousetrap.bind(['a', 'left' ], function() { self.tetrimino.move(-1, 0).render(); });
		Mousetrap.bind(['s', 'down' ], function() { self.tetrimino.move( 0, 1).render(); });
		Mousetrap.bind(['d', 'right'], function() { self.tetrimino.move( 1, 0).render(); });

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
	Tetris.prototype.land = function(tetrimino) {
		var
			self       = this,
			filledCols = {},
			filledRows = []
			;

		tetrimino.render();

		// Check main field for completed lines
		this.field.main.each(function(x, y, block) {
			if ( filledCols[y] === undefined ) {
				filledCols[y] = 0;
			}

			filledCols[y] += block ? 1 : 0;

			if ( filledCols[y] === self.field.main.cols ) {
				filledRows.push(y);
			}
		});

		// Remove completed lines
		if ( filledRows ) {
			$.forEach(filledRows, function(row) {
				self.field.main.each(function(x, y, block) {
					if ( y === row ) {
						block.el.fadeOut(x * 50, function() {
							self.field.main.clear(x, y);

							// Drop above rows
							self.field.main.each(function(x2, y2, block) {
								if ( block && y2 < y ) {
									self.field.main.move(block, x2, y2 + 1);

									block.render();
								}
							});
						});
					}
				});
			});
		}

		// Check for tetris over
		this.field.main.each(function(x, y, block) {
			if ( !y && block ) {
				self.gameOver();
			}
		});

		return this.next();
	};

	/**
	 *
	 */
	Tetris.prototype.next = function() {
		var pos;

		console.log('next');

		this.tetrimino = this.queue.shift();

		pos = this.tetrimino.pos();

		$.each(this.tetrimino.blocks, function() {
			this.tetrimino.field.grid[this.pos.x][this.pos.y] = null;

			this.pos.x -= pos.x;
			this.pos.y -= pos.y;
		});

		this.tetrimino.field = this.field.main;

		$.each(this.tetrimino.blocks, function() {
			this.tetrimino.field.place(this);
		});

		this.tetrimino.render();

		this.queueAdd();

		return this;
	};

	/**
	 *
	 */
	Tetris.prototype.queueAdd = function() {
		var
			tetrimino = new Tetrimino(this.field.queue),
			offset    = 0
			;

		$.each(this.queue, function() {
			offset += this.size().x + 2;
		});

		this.queue.push(tetrimino);

		tetrimino.move(offset, 0);

		return tetrimino.render();
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
	var Tetrimino = function(field) {
		var
			self = this,
			x    = 0,
			y    = 0
			;

		this.field  = field;
		this.tetris = field.tetris;

		this.id = ++ this.tetris.lastId;

		this.blocks = [];

		// Generate a random tetrimino
		this.shape = this.tetris.shapes[Math.ceil(Math.random() * this.tetris.shapes.length - 1)];

		this.blocks.push(new Block(this, x, y));

		$.each(this.shape.split(''), function() {
			switch ( this.toString() ) {
				case 'r': x ++; break;
				case 'd': y ++; break;
				case 'u': y --; break;
			}

			self.blocks.push(new Block(self, x, y));
		});

		return this;
	};

	/**
	 *
	 */
	Tetrimino.prototype.move = function(x, y) {
		var self = this;

		$.each(this.blocks, function() {
			if ( self.field.available(this.pos.x + x, this.pos.y + y, this) ) {
				self.field.grid[this.pos.x][this.pos.y] = null;
			}

			this.pos.x += x;
			this.pos.y += y;
		});

		$.each(this.blocks, function() {
			return self.field.place(this);
		});

		return this;
	};

	/**
	 *
	 */
	Tetrimino.prototype.drop = function() {
		console.log('drop');

		//while ( self.id === tetris.tetrimino.id ) {
			this.move(0, 1);
		//}

		return this.render();
	};

	/**
	 *
	 */
	Tetrimino.prototype.rotate = function() {
		console.log('rotate');

		return this;
	};

	/**
	 *
	 */
	Tetrimino.prototype.collision = function() {
		var
			self = this,
			land = false
			;

		if ( this.field.id !== 'queue' ) {
			console.log('collision');
		}

		$.each(this.blocks, function() {
			this.collision();

			land = land || this.pos.y === self.tetris.field.rows - 1 || this.pos.y > this.oldPos.y;
		});

		$.each(this.blocks, function() {
			//self.field.place(this);
		});

		if ( land ) {
			this.tetris.land(this);
		}

		return this;
	};

	/**
	 *
	 */
	Tetrimino.prototype.pos = function() {
		var pos = { x: Infinity, y: Infinity };

		$.each(this.blocks, function() {
			pos = {
				x: Math.min(pos.x, this.pos.x),
				y: Math.min(pos.y, this.pos.y)
				};
		});

		return pos;
	};

	/**
	 *
	 */
	Tetrimino.prototype.size = function() {
		var max = { x: 0, y: 0 };

		$.each(this.blocks, function() {
			max = {
				x: Math.max(max.x, this.pos.x),
				y: Math.max(max.y, this.pos.y)
				};
		});

		return { x: max.x - this.pos().x, y: max.y - this.pos().y };
	};

	/**
	 *
	 */
	Tetrimino.prototype.render = function() {
		this.blocks.map(function(block) {
			block.render();
		});

		return this;
	};

	/**
	 *
	 */
	var Block = function(tetrimino, x, y) {
		this.tetrimino = tetrimino;
		this.tetris    = tetrimino.tetris;

		this.pos    = { x: x, y: y };
		this.oldPos = { x: x, y: y };

		this.el = $('<div>').addClass('block').addClass(tetrimino.shape).attr('data-tetrimino-id', tetrimino.id);

		tetrimino.field.place(this);

		return this;
	};

	/**
	 *
	 */
	Block.prototype.collision = function() {
		this.pos = $.extend({}, this.oldPos);

		return this;
	};

	/**
	 *
	 */
	Block.prototype.render = function() {
		this.oldPos = $.extend({}, this.pos);

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
	 * Create an empty field
	 */
	Field = function(tetris, id, cols, rows) {
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
	 *
	 */
	Field.prototype.valid = function(x, y) {
		return typeof this.grid[x] !== 'undefined' && typeof this.grid[x][y] !== 'undefined';
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
		if ( !this.valid(x, y) ) {
			return false;
		}

		if ( !this.grid[x][y] ) {
			return true;
		}

		if ( block && block.tetrimino && this.grid[x][y].tetrimino ) {
			return this.grid[x][y].tetrimino === block.tetrimino;
		}

		return false;
	};

	/**
	 *
	 */
	Field.prototype.place = function(block) {
		if ( this.available(block.pos.x, block.pos.y, block) ) {
			this.grid[block.pos.x][block.pos.y] = block;
		} else {
			block.tetrimino.collision();
		}

		//
		if ( this.id === 'main' ) {
			var grid = '';

			$.each(this.grid, function(x) {
				$.each(this, function(y) {
					grid += this instanceof Block ? 'X' : '.';
				});

				grid += "\n";
			});

			$('#debug').text(grid);
		}
		//

		return this;
	};

	/**
	 *
	 */
	Field.prototype.clear = function(x, y, block) {
		if ( this.valid(x, y) && !this.available(x, y) ) {
			this.grid[x][y].el.remove();

			this.grid[x][y] = null;
		}

		return this;
	};

	/**
	 *
	 */
	Field.prototype.each = function(callback) {
		$.each(this.grid, function(x) {
			$.each(this, function(y) {
				callback(x, y, this);
			});
		});

		return this;
	};
})(jQuery);
