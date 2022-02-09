"use strict";

let crypto = require('crypto');


// WARNING!  There are much better hash functions to use
// for storing passwords.
const HASH_ALG = 'sha256';

function hash(s) {
  return crypto.createHash(HASH_ALG).update(s).digest('hex');
}


class PasswordManager {
  constructor() {
    this.passwords = {};
    this.salts = {};
  }
  storePassword(username, pwd) {
    //
    // ***YOUR CODE HERE***
    //
    // 1) Choose a unique salt value for the user
    // 2) Store the salt value in 'this.salts'
    // 3) Concatenate the salt value with the password
    // 4) Hash salt+password and store the result in this.passwords
    let size = 6
    let salt = crypto.randomBytes(size).toString('base64').slice(0, size)
    this.salts[username]=salt
    let concated = pwd + salt
    this.passwords[username]=hash(concated)
  }
  verifyPassword(username, pwd) {
    //
    // ***YOUR CODE HERE***
    //
    // Look up the user's salt and hash values,
    // and make sure they match the password entered.
    let salt = this.salts[username] 
    let concated = pwd + salt
    if (hash(concated)===this.passwords[username]){
      return true;
    }else{
      return false;
    }
  }
}

let pm = new PasswordManager();

function test(u, p) {
  if (pm.verifyPassword(u, p)) {
    console.log(`"${p}" is the correct password for ${u}.`);
  } else {
    console.log(`Sorry, "${p}" is not ${u}'s password.`);
  }
}

pm.storePassword('Alice', 'secret');
pm.storePassword('Bob', 'banana');
pm.storePassword('Charlie', 'E"_K!sHcA8S&-S2N');
pm.storePassword('Dave', 'secret');

test('Alice', 'secret');
test('Alice', 'notThePassword');
test('Dave', 'secret');

console.log(pm.passwords)
