"use strict";

let crypto = require('crypto');

function encryptString(s, key) {
  let cipher = crypto.createCipher('aes-256-cbc', key);
  let ctext = cipher.update(s, 'utf8', 'hex');
  ctext += cipher.final('hex');
  return ctext;
}

function decryptString(ctext, key) {
  let decipher = crypto.createDecipher('aes-256-cbc', key);
  let ptext = decipher.update(ctext, 'hex', 'utf8');
  ptext += decipher.final('utf8');
  return ptext;
}

let ptext = 'hello world';
let ctext = encryptString(ptext, 'secret');

console.log(ctext);

let p2 = decryptString(ctext, 'secret');

console.log(p2);

