"use strict";

let modularDivision = require('./modularDivision.js')
let rand = require('./rand.js')

function encrypt(message, pubKey) {
    let ciphertext = message ** pubKey.e % pubKey.modulus;
    return ciphertext;
}

function decrypt(ciphertext, privKey) {
    let message = ciphertext ** privKey.d % privKey.modulus;
    return message;
}

function sign(message, privKey) {
    return decrypt(message, privKey);
}

function verify(message, sig, pubKey) {
    let m = encrypt(sig, pubKey);
    return m === message;
}

function blind(message, pubKey, b) {
    return message * b**pubKey.e % pubKey.modulus;
}

function unblind(secret, b, priv) {
    return modularDivision.modDivide(secret,b,priv.modulus);
}


// Setting up key pair
let mod = 33;
let pub = {modulus: mod, e: 3};
let priv = {modulus: mod, d: 7};

// Choose any message less than the modulus.
let m = 18;
let c = encrypt(m, pub);
console.log(`${m} encrypted returns ${c}`);
let m1 = decrypt(c, priv);
console.log(`${c} decrypted returns ${m1}`);
console.log();

// Signing now -- note that it is a bad idea to
// use the same key pair for signing and encrypting,
// but the math works out just fine.
m = 24;
let sig = sign(m, priv);
console.log(`${m} signed returns signature ${sig}`);
let b = verify(m, sig, pub);
console.log(`${sig} ${b ? "is" : "is not"} a valid signature for ${m}`);
console.log()

//blinded
m = 18;
b = rand.nextInt(100)
let m2=blind(m,pub,b)
console.log(`${m} signed blinded ${m2}`);
sig = sign(m2, priv);
console.log(`${m2} signed returns signature ${sig}`);

let s = unblind(sig,b,priv)
let verfy= verify(s, sig, pub);
console.log(`${sig} ${verfy ? "is" : "is not"} a valid signature for ${m}`);
console.log(s)