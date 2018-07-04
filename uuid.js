// 代码一：

/*!
Math.uuid.js (v1.4)
http://www.broofa.com
mailto:robert@broofa.com
 
Copyright (c) 2010 Robert Kieffer
Dual licensed under the MIT and GPL licenses.
*/

/*
 * Generate a random uuid.
 *
 * USAGE: Math.uuid(length, radix)
 *   length - the desired number of characters
 *   radix  - the number of allowable values for each character.
 *
 * EXAMPLES:
 *   // No arguments  - returns RFC4122, version 4 ID
 *   >>> Math.uuid()
 *   "92329D39-6F5C-4520-ABFC-AAB64544E172"
 *
 *   // One argument - returns ID of the specified length
 *   >>> Math.uuid(15)     // 15 character ID (default base=62)
 *   "VcydxgltxrVZSTV"
 *
 *   // Two arguments - returns ID of the specified length, and radix. (Radix must be <= 62)
 *   >>> Math.uuid(8, 2)  // 8 character ID (base=2)
 *   "01001010"
 *   >>> Math.uuid(8, 10) // 8 character ID (base=10)
 *   "47473046"
 *   >>> Math.uuid(8, 16) // 8 character ID (base=16)
 *   "098F4D35"
 */
(function () {
  // Private array of chars to use
  var CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');

  Math.uuid = function (len, radix) {
    var chars = CHARS, uuid = [], i;
    radix = radix || chars.length;

    if (len) {
      // Compact form
      for (i = 0; i < len; i++) uuid[i] = chars[0 | Math.random() * radix];
    } else {
      // rfc4122, version 4 form
      var r;

      // rfc4122 requires these characters
      uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
      uuid[14] = '4';

      // Fill in random data.  At i==19 set the high bits of clock sequence as
      // per rfc4122, sec. 4.1.5
      for (i = 0; i < 36; i++) {
        if (!uuid[i]) {
          r = 0 | Math.random() * 16;
          uuid[i] = chars[(i == 19) ? (r & 0x3) | 0x8 : r];
        }
      }
    }

    return uuid.join('');
  };

  // A more performant, but slightly bulkier, RFC4122v4 solution.  We boost performance
  // by minimizing calls to random()
  Math.uuidFast = function () {
    var chars = CHARS, uuid = new Array(36), rnd = 0, r;
    for (var i = 0; i < 36; i++) {
      if (i == 8 || i == 13 || i == 18 || i == 23) {
        uuid[i] = '-';
      } else if (i == 14) {
        uuid[i] = '4';
      } else {
        if (rnd <= 0x02) rnd = 0x2000000 + (Math.random() * 0x1000000) | 0;
        r = rnd & 0xf;
        rnd = rnd >> 4;
        uuid[i] = chars[(i == 19) ? (r & 0x3) | 0x8 : r];
      }
    }
    return uuid.join('');
  };

  // A more compact, but less performant, RFC4122v4 solution:
  Math.uuidCompact = function () {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };
})();

// 调用方法：Math.uuid()

// 代码二：

//On creation of a UUID object, set it's initial value
function UUID() {
  this.id = this.createUUID();
}

// When asked what this Object is, lie and return it's value
UUID.prototype.valueOf = function () { return this.id; };
UUID.prototype.toString = function () { return this.id; };

//
// INSTANCE SPECIFIC METHODS
//
UUID.prototype.createUUID = function () {
  //
  // Loose interpretation of the specification DCE 1.1: Remote Procedure Call
  // since JavaScript doesn't allow access to internal systems, the last 48 bits
  // of the node section is made up using a series of random numbers (6 octets long).
  // 
  var dg = new Date(1582, 10, 15, 0, 0, 0, 0);
  var dc = new Date();
  var t = dc.getTime() - dg.getTime();
  var tl = UUID.getIntegerBits(t, 0, 31);
  var tm = UUID.getIntegerBits(t, 32, 47);
  var thv = UUID.getIntegerBits(t, 48, 59) + '1'; // version 1, security version is 2
  var csar = UUID.getIntegerBits(UUID.rand(4095), 0, 7);
  var csl = UUID.getIntegerBits(UUID.rand(4095), 0, 7);

  // since detection of anything about the machine/browser is far to buggy,
  // include some more random numbers here
  // if NIC or an IP can be obtained reliably, that should be put in
  // here instead.
  var n = UUID.getIntegerBits(UUID.rand(8191), 0, 7) +
    UUID.getIntegerBits(UUID.rand(8191), 8, 15) +
    UUID.getIntegerBits(UUID.rand(8191), 0, 7) +
    UUID.getIntegerBits(UUID.rand(8191), 8, 15) +
    UUID.getIntegerBits(UUID.rand(8191), 0, 15); // this last number is two octets long
  return tl + tm + thv + csar + csl + n;
};

//Pull out only certain bits from a very large integer, used to get the time
//code information for the first part of a UUID. Will return zero's if there
//aren't enough bits to shift where it needs to.
UUID.getIntegerBits = function (val, start, end) {
  var base16 = UUID.returnBase(val, 16);
  var quadArray = new Array();
  var quadString = '';
  var i = 0;
  for (i = 0; i < base16.length; i++) {
    quadArray.push(base16.substring(i, i + 1));
  }
  for (i = Math.floor(start / 4); i <= Math.floor(end / 4); i++) {
    if (!quadArray[i] || quadArray[i] == '') quadString += '0';
    else quadString += quadArray[i];
  }
  return quadString;
};

//Replaced from the original function to leverage the built in methods in
//JavaScript. Thanks to Robert Kieffer for pointing this one out
UUID.returnBase = function (number, base) {
  return (number).toString(base).toUpperCase();
};

//pick a random number within a range of numbers
//int b rand(int a); where 0 <= b <= a
UUID.rand = function (max) {
  return Math.floor(Math.random() * (max + 1));
};

// 调用方法：UUID.prototype.createUUID()


// 代码三：

// Generate four random hex digits.
function S4() {
  return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
};
// Generate a pseudo-GUID by concatenating random hexadecimal.
function guid() {
  return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
};
var dd = guid();
alert(dd);