(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var GLBase = (function () {
  function GLBase(id) {
    _classCallCheck(this, GLBase);

    this._canvas = null;
    this._gl = null;
    this._program = null;
    this._glConst = null;

    this._canvas = document.getElementById(id);
    this._gl = this._canvas.getContext('webgl');
    this._glConst = this._gl;
  }

  _createClass(GLBase, [{
    key: 'init',
    value: function init(v, f) {
      this._program = this._createProgram();

      var vertex = this._shader(this._glConst.VERTEX_SHADER, v);
      var fragment = this._shader(this._glConst.FRAGMENT_SHADER, f);

      this._gl.attachShader(this._program, vertex);
      this._gl.attachShader(this._program, fragment);
      this._gl.linkProgram(this._program);

      var linked = this._gl.getProgramParameter(this._program, this._glConst.LINK_STATUS);
      if (!linked) {
        var error = this._gl.getProgramInfoLog(this._program);
        var err = 'Failed to link program: ' + error;

        throw new ReferenceError(err);
      }

      this._gl.useProgram(this._program);
    }
  }, {
    key: '_shader',
    value: function _shader(type, source) {
      var shader = this._gl.createShader(type);
      if (shader == null) {
        var err = 'unable to create shader type ' + type;
        throw new ReferenceError(err);
      }

      this._gl.shaderSource(shader, source);
      this._gl.compileShader(shader);

      var compiled = this._gl.getShaderParameter(shader, this._glConst.COMPILE_STATUS);
      if (compiled == null) {
        var error = this._gl.getShaderInfoLog(shader);
        var err = 'Failed to compile shader type ' + type + ': ' + error;

        throw new ReferenceError(err);
      }

      return shader;
    }
  }, {
    key: '_createProgram',
    value: function _createProgram() {
      var program = this._gl.createProgram();

      if (!program) {
        var err = 'WebGLProgram is not created';
        throw new ReferenceError(err);
      }

      this._program = program;

      return program;
    }
  }, {
    key: 'attrib',
    value: function attrib(name) {
      var a = this._gl.getAttribLocation(this._program, name);

      if (a < 0) {
        throw new ReferenceError('Failed to get attrib ' + name);
      }

      return a;
    }
  }, {
    key: 'uniform',
    value: function uniform(name) {
      var u = this._gl.getUniformLocation(this._program, name);

      if (!u) {
        throw new ReferenceError('Failed to get uniform ' + name);
      }

      return u;
    }
  }]);

  return GLBase;
})();

module.exports = GLBase;

},{}],2:[function(require,module,exports){
(function (process){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
    var last = parts[i];
    if (last === '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Split a filename into [root, dir, basename, ext], unix version
// 'root' is just a slash, or nothing.
var splitPathRe =
    /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
var splitPath = function(filename) {
  return splitPathRe.exec(filename).slice(1);
};

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
  var resolvedPath = '',
      resolvedAbsolute = false;

  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    var path = (i >= 0) ? arguments[i] : process.cwd();

    // Skip empty and invalid entries
    if (typeof path !== 'string') {
      throw new TypeError('Arguments to path.resolve must be strings');
    } else if (!path) {
      continue;
    }

    resolvedPath = path + '/' + resolvedPath;
    resolvedAbsolute = path.charAt(0) === '/';
  }

  // At this point the path should be resolved to a full absolute path, but
  // handle relative paths to be safe (might happen when process.cwd() fails)

  // Normalize the path
  resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
  var isAbsolute = exports.isAbsolute(path),
      trailingSlash = substr(path, -1) === '/';

  // Normalize the path
  path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }

  return (isAbsolute ? '/' : '') + path;
};

// posix version
exports.isAbsolute = function(path) {
  return path.charAt(0) === '/';
};

// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    if (typeof p !== 'string') {
      throw new TypeError('Arguments to path.join must be strings');
    }
    return p;
  }).join('/'));
};


// path.relative(from, to)
// posix version
exports.relative = function(from, to) {
  from = exports.resolve(from).substr(1);
  to = exports.resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

exports.sep = '/';
exports.delimiter = ':';

exports.dirname = function(path) {
  var result = splitPath(path),
      root = result[0],
      dir = result[1];

  if (!root && !dir) {
    // No dirname whatsoever
    return '.';
  }

  if (dir) {
    // It has a dirname, strip trailing slash
    dir = dir.substr(0, dir.length - 1);
  }

  return root + dir;
};


exports.basename = function(path, ext) {
  var f = splitPath(path)[2];
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPath(path)[3];
};

function filter (xs, f) {
    if (xs.filter) return xs.filter(f);
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (f(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// String.prototype.substr - negative index don't work in IE8
var substr = 'ab'.substr(-1) === 'b'
    ? function (str, start, len) { return str.substr(start, len) }
    : function (str, start, len) {
        if (start < 0) start = str.length + start;
        return str.substr(start, len);
    }
;

}).call(this,require('_process'))
},{"_process":3}],3:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = setTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    clearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        setTimeout(drainQueue, 0);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],4:[function(require,module,exports){
'use strict';


var path = require('path');

module.exports = {
  points: {
    v: "attribute vec4 a_Position;\nattribute float a_PointSize;\n\nvoid main () {\n    gl_Position = a_Position;\n    gl_PointSize = a_PointSize;\n}\n",
    f: "precision mediump float;\nuniform vec4 u_FragColor;\n\nvoid main () {\n    gl_FragColor = u_FragColor;\n}\n"
  },
  triangles: {
    v: "attribute vec4 a_Position;\nvoid main() {\n  gl_Position = a_Position;\n  gl_PointSize = 10.0;\n}",
    f: "void main() {\n  gl_FragColor = vec4(0.7, 0.0, 0.0, 1.0);\n}"
  },
  translated: {
    v: "attribute vec4 a_Position;\nuniform vec4 u_Translation;\n\nvoid main() {\n  gl_Position = a_Position + u_Translation;\n}",
    f: "void main() {\n  gl_FragColor = vec4(0.7, 0.0, 0.0, 1.0);\n}"
  },
  rotated: {
    v: "/*\ny' = x cos b - y sin b\nx' = y cos b + x sin b\nz' = z\n*/\n\nattribute vec4 a_Position;\nuniform float u_CosB, u_SinB;\n\nvoid main() {\n  gl_Position.x = a_Position.x * u_CosB - a_Position.y * u_SinB;\n  gl_Position.y = a_Position.y * u_CosB + a_Position.x * u_SinB;\n  gl_Position.z = a_Position.z;\n  gl_Position.w = a_Position.w;\n}",
    f: "void main() {\n  gl_FragColor = vec4(0.7, 0.0, 0.0, 1.0);\n}"
  },
  cell: {
    v: "attribute vec4 a_Position;\nattribute vec4 a_Color;\nvarying vec4 v_Color;\n\nvoid main () {\n    v_Color = a_Color;\n    gl_Position = a_Position;\n    gl_PointSize = 9.0;\n}\n",
    f: "precision mediump float;\nvarying vec4 v_Color;\n\nvoid main () {\n    gl_FragColor = v_Color;\n}"
  },
  moved: {
    v: "attribute vec4 a_Position;\nuniform mat4 u_xformMatrix;\n\nvoid main() {\n  gl_Position = u_xformMatrix * a_Position;\n}",
    f: "void main() {\n  gl_FragColor = vec4(0.7, 0.0, 0.0, 1.0);\n}"
  }
};

},{"path":2}],5:[function(require,module,exports){
'use strict';

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }; })();

var COLORS = {
  CLEAR: [1.0, 1.0, 1.0, 1.0],
  YOUNG: [0.4, 0.2, 0.1, 1.0],
  ELDER: [0.0, 0.0, 0.0, 0.2],
  8: '#fbeddb',
  7: '#fbdfbb',
  6: '#fcd29c',
  5: '#fabf73',
  4: '#fdaf41',
  3: '#f99412',
  2: '#e38204',
  1: '#cd7400',
  0: '#ffecb3'
};

function color(key) {
  var color = COLORS[key];

  if (typeof color == 'string') {
    var r = parseInt(color.slice(1, 3), 16);
    var g = parseInt(color.slice(3, 5), 16);
    var b = parseInt(color.slice(5, 7), 16);

    color = COLORS[key] = [r / 0xFF, g / 0xFF, b / 0xFF, 1.0];
  }

  return color;
}

var HEIGHT = 80;
var WIDTH = 80;

var CURRENT_RULE = 'Coagulations';
var RULES_RE = /^[Ss]?([1-8]+)\/[Bb]?([1-8]+)$/;
var RULES_CACHE = {};
var RULES = {
  '2x2': '23/3',
  '34Life': 'S34/B34',
  'Coral': '45678/3',
  'CoralModified': '1357/246',
  'Transers': '345/26',
  'Fireworks': '2/13',
  'Xtasy': '1456/2356',
  'Amoeba': '1358/357',
  'Flakes': '12345678/3',
  'Assimilation': '4567/345',
  'Coagulations': '235678/378',
  'HighLife': '23/36',
  'Long Life': '5/345',
  'Gnarl': '1/1',
  'Mazertic': '1234/3',
  'Move': '245/368',
  'WalledCities': '2345/45678',
  'Serviettes': '/234',
  'Replicator': '1357/1357',
  'Pseudo Life': '238/357',
  'Maze': '12345/3'
};
RULES_CACHE[CURRENT_RULE] = sb(CURRENT_RULE);

function sb(name) {
  if (RULES_CACHE[name]) {
    return RULES_CACHE[name];
  }

  var rule = RULES[name];

  if (!rule) {
    return RULES_CACHE[CURRENT_RULE];
  }

  if (RULES_RE.test(rule)) {
    var _RULES_RE$exec$slice = RULES_RE.exec(rule).slice(1, 3);

    var _RULES_RE$exec$slice2 = _slicedToArray(_RULES_RE$exec$slice, 2);

    var sStr = _RULES_RE$exec$slice2[0];
    var bStr = _RULES_RE$exec$slice2[1];
    var sArr = sStr.split('').map(Number);
    var bArr = bStr.split('').map(Number);

    RULES_CACHE[name] = [sArr, bArr];
    return RULES_CACHE[name];
  }

  return [[2, 3], [3]];
}

function limit(num, mod) {
  return num < 0 ? mod + num : num % mod;
}

function calcRule(cv, x, y, s, b) {
  var lu, mu, ru;
  var lm, rm;
  var ld, md, rd;

  lu = matrix[limit(y - 1, HEIGHT)][limit(x - 1, WIDTH)];
  mu = matrix[limit(y - 1, HEIGHT)][limit(x + 0, WIDTH)];
  ru = matrix[limit(y - 1, HEIGHT)][limit(x + 1, WIDTH)];

  lm = matrix[limit(y + 0, HEIGHT)][limit(x - 1, WIDTH)];
  rm = matrix[limit(y + 0, HEIGHT)][limit(x + 1, WIDTH)];

  ld = matrix[limit(y + 1, HEIGHT)][limit(x - 1, WIDTH)];
  md = matrix[limit(y + 1, HEIGHT)][limit(x + 0, WIDTH)];
  rd = matrix[limit(y + 1, HEIGHT)][limit(x + 1, WIDTH)];

  var values = [lu, mu, ru, lm, rm, ld, md, rd];
  var count = values.map(function (val) {
    return val ? 1 : 0;
  }).reduce(function (sum, val) {
    return sum + val;
  });

  if (cv) {
    return s.indexOf(count) !== -1 ? count : 0;
  }

  return b.indexOf(count) !== -1 ? count : 0;
}

var matrix = [];
var cache = [];
var INIT_STATE_RE = /(11|31|22)/;
for (var y = 0; y < HEIGHT; y++) {
  matrix.push([]);
  cache.push([]);
  for (var x = 0; x < WIDTH; x++) {
    matrix[y].push(INIT_STATE_RE.test(HEIGHT * y + x + '') ? 1 : 0);
    cache[y].push(0);
  }
}

function calc() {
  var _sb = sb(CURRENT_RULE);

  var _sb2 = _slicedToArray(_sb, 2);

  var s = _sb2[0];
  var b = _sb2[1];

  for (var y = 0; y < HEIGHT; y++) {
    for (var x = 0; x < WIDTH; x++) {
      cache[y][x] = calcRule(matrix[y][x], x, y, s, b);
    }
  }
  var _ref = [cache, matrix];
  matrix = _ref[0];
  cache = _ref[1];
}

function convert(x, y) {
  var xx = -1 + x / WIDTH * 2;
  var yy = 1 - y / HEIGHT * 2;

  return [xx, yy];
}

function data() {
  var coords = [];
  var colors = [];
  for (var y = 0; y < HEIGHT; y++) {
    for (var x = 0; x < WIDTH; x++) {
      if (matrix[y][x]) {
        convert(x, y).forEach(function (num) {
          return coords.push(num);
        });

        color(matrix[y][x]).forEach(function (val) {
          return colors.push(val);
        });
      }
    }
  }

  return { coords: coords, colors: colors };
}

function setRule(name) {
  CURRENT_RULE = name;
}

exports.setRule = setRule;
exports.calc = calc;
exports.data = data;
exports.WIDTH = WIDTH;
exports.HEIGHT = HEIGHT;

},{}],6:[function(require,module,exports){
// cellular automaton

'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x5, _x6, _x7) { var _again = true; _function: while (_again) { var object = _x5, property = _x6, receiver = _x7; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x5 = parent; _x6 = property; _x7 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var cells = require('./cell.bl');
var shaders = require('../shaders');
var GLBase = require('../lib/GLBase');

var V_SHADER_SOURCE = shaders.cell.v;
var F_SHADER_SOURCE = shaders.cell.f;

var Canvas = (function (_GLBase) {
  _inherits(Canvas, _GLBase);

  function Canvas(id) {
    _classCallCheck(this, Canvas);

    _get(Object.getPrototypeOf(Canvas.prototype), 'constructor', this).call(this, id);
    this._width = 1;
    this._height = 1;
  }

  _createClass(Canvas, [{
    key: 'clear',
    value: function clear() {
      var r = arguments.length <= 0 || arguments[0] === undefined ? 1.0 : arguments[0];
      var g = arguments.length <= 1 || arguments[1] === undefined ? 1.0 : arguments[1];
      var b = arguments.length <= 2 || arguments[2] === undefined ? 1.0 : arguments[2];
      var a = arguments.length <= 3 || arguments[3] === undefined ? 1.0 : arguments[3];

      this._gl.clearColor(r, g, b, a);
      this._gl.clear(this._glConst.COLOR_BUFFER_BIT);
    }
  }, {
    key: 'setSize',
    value: function setSize(x, y) {
      this._width = x;
      this._height = y;
    }
  }, {
    key: 'initVertexBuffers',
    value: function initVertexBuffers(vertices) {
      //console.log(vertices.length, vertices);

      var vertexBuffer = this._gl.createBuffer();

      if (vertexBuffer == null) {
        throw new ReferenceError('Failed to create vertex buffer');
      }

      this._gl.bindBuffer(this._glConst.ARRAY_BUFFER, vertexBuffer);
      this._gl.bufferData(this._glConst.ARRAY_BUFFER, vertices, this._glConst.STATIC_DRAW);

      var a_Position = this.attrib('a_Position');

      this._gl.vertexAttribPointer(a_Position, 2, this._glConst.FLOAT, false, 0, 0);

      this._gl.enableVertexAttribArray(a_Position);
    }
  }, {
    key: 'initColorBuffer',
    value: function initColorBuffer(colors) {
      //console.log(colors.length, colors);

      var colorBuffer = this._gl.createBuffer();

      if (colorBuffer == null) {
        throw new ReferenceError('Failed to create color buffer');
      }

      this._gl.bindBuffer(this._glConst.ARRAY_BUFFER, colorBuffer);
      this._gl.bufferData(this._glConst.ARRAY_BUFFER, colors, this._glConst.STATIC_DRAW);

      var a_Color = this.attrib('a_Color');

      this._gl.vertexAttribPointer(a_Color, 4, this._glConst.FLOAT, false, 0, 0);

      this._gl.enableVertexAttribArray(a_Color);
    }
  }, {
    key: 'draw',
    value: function draw(count) {
      this._gl.drawArrays(this._glConst.POINTS, 0, count);
    }
  }]);

  return Canvas;
})(GLBase);

var canvas = new Canvas('example');

canvas.setSize(cells.WIDTH, cells.HEIGHT);
canvas.init(V_SHADER_SOURCE, F_SHADER_SOURCE);
canvas.clear();

var _cells$data = cells.data();

var coords = _cells$data.coords;
var colors = _cells$data.colors;

var count = coords.length / 2;
canvas.initVertexBuffers(new Float32Array(coords));
canvas.initColorBuffer(new Float32Array(colors));

canvas.draw(count);

function calc() {
  cells.calc();

  canvas.clear();

  var _cells$data2 = cells.data();

  var coords = _cells$data2.coords;
  var colors = _cells$data2.colors;

  canvas.initVertexBuffers(new Float32Array(coords));
  canvas.initColorBuffer(new Float32Array(colors));

  var count = coords.length / 2;

  canvas.draw(count);
}

var timer = null;

function play() {
  calc();
  timer = setTimeout(play, 50);
}

function stop() {
  clearTimeout(timer);
}

document.querySelector('.play').addEventListener('click', play);
document.querySelector('.stop').addEventListener('click', stop);

},{"../lib/GLBase":1,"../shaders":4,"./cell.bl":5}]},{},[6]);
