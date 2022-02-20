"use strict";

let blindSignatures = require('blind-signatures');

let SpyAgency = require('./spyAgency.js').SpyAgency;

function makeDocument(coverName) {
  return `The bearer of this signed document, ${coverName}, has full diplomatic immunity.`;
}

function blind(msg, n, e) {
  return blindSignatures.blind({
      message: msg,
      N: agency.n,
      E: agency.e,
  });
}

function unblind(blindingFactor, sig, n) {
  return blindSignatures.unblind({
      signed: sig,
      N: n,
      r: blindingFactor,
  });
}


let agency = new SpyAgency();

//
// ***YOUR CODE HERE***
//
// Prepare 10 documents with 10 different cover identities (using the makeDocument function).
// Blind each of the 10 documents, and remember to store their blinding factors.
//
let docs = []
let blindDocuments = []
let blindFactors = []
let names = ['Peter','Luc','Casper','Elias','Patrick','Rachel','Nora','Carla','Sara','Carmen']

names.forEach(spyName => {
    //create and save documents
    let document = makeDocument(spyName);
    docs.push(document);

    let { blindDocument, b } = blind(document, agency.n, agency.e)
    //save docs and factors
    blindDocuments.push(blindDocument);
    blindFactors.push(b);
});


agency.signDocument(blindDocuments, (selected, verifyAndSign) => {
  // ***YOUR CODE HERE***
    let blindFactorsCopy = blindFactors.slice();
    let docsCopy = docs.slice();

    //remove selected
    delete blindFactorsCopy[selected];
    delete docsCopy[selected];

    let blindedSignature = verifyAndSign(blindFactorsCopy,docsCopy);
    let unblindedSignature = unblind(blindFactors[selected], blindedSignature, agency.n);

    let valid = blindSignatures.verify({
        unblinded: unblindedSignature,
        N: agency.n,
        E: agency.e,
        message: docs[selected],
    });

    console.log(`signature ${valid ? "is" : "is not"} valid`);

  // The 'signDocument' function takes a callback function, which
  // specifies which of the 10 documents the spy agency will sign.
  //
  // You must call the 'verifyAndSign' function, specifying arrays with:
  // 1) the blinding factors
  // 2) the original documents
  //
  // Note that you should specify this information for all documents
  // EXCEPT the specified document.  (In the selected position, set
  // these positions to 'undefined'.)
  //
  // The verifyAndSign function will return the blinded signature.
  // Unblind it, and make sure that the signature is valid for
  // the selected document.

});



