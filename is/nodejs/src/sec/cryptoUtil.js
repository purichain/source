//
const crypto = require('crypto');
const { createECDH, ECDH } = require("crypto");
const fs = require('fs');
const Eddsa = require('elliptic').eddsa;
const pemreader = require('crypto-key-composer');

//
const cryptoSsl = require("./../../../../addon/crypto-ssl");

//
const config = require('./../../config/config.js');
const define = require('./../../config/define.js');
const util = require('./../utils/commonUtil.js');
const contractUtil = require('./../contract/contractUtil.js');
const logger = require('./../utils/winlog.js');

//
let keyMe = new Object();

//////////////////////////////////////////////////
//
module.exports.decKey = async (keyPath, keySeed) => {
    let dec;

    if (keyPath.includes("fin"))
    {
        logger.debug("It is an encrypted file");

        dec = await cryptoSsl.aesDecFile(keyPath, keySeed, keySeed.length);
    }
    else
    {
        logger.debug("It is an decrypted file");

        dec = fs.readFileSync(keyPath);
    }

    return dec;
}

module.exports.PEMReadPublicKey = async (path) => {
    let decPubKey = await this.decKey(path, config.KEY_PATH.KEY_SEED);

    let pemRead = pemreader.decomposePublicKey(decPubKey);
    return pemRead;
}

module.exports.PEMReadPrivateKey = async (path) => {
    let decPriKey = await this.decKey(path, config.KEY_PATH.KEY_SEED);

    let pemRead = pemreader.decomposePrivateKey(decPriKey);
    return pemRead;
}

module.exports.getPubkey = async(pubkeyPath) => {
    //
    let pubkey_path = typeof pubkeyPath !== 'undefined' ? pubkeyPath : config.MY_KEY_PATH_CONFIG.pubkey;

    //
    let pemRead = await this.PEMReadPublicKey(pubkey_path);

    //
    // let publicKey = util.bytesToBuffer(pemRead.keyData.bytes).toString('hex');

    // return publicKey;

    if(pubkey_path.includes("ed")) 
    {
        let pubkey;

        pubkey = util.bytesToBuffer(pemRead.keyData.bytes);

        return pubkey.toString('hex');
    }
    else
    {
        let ec_point_x;
        let ec_point_y;

        ec_point_x = util.bytesToBuffer(pemRead.keyData.x).toString('hex');
        ec_point_y = util.bytesToBuffer(pemRead.keyData.y).toString('hex');
        
        const uncompressedpubkey = define.SEC_DEFINE.KEY_DELIMITER.SECP256_UNCOMPRESSED_DELIMITER + ec_point_x + ec_point_y;
        const pubkey = ECDH.convertKey(uncompressedpubkey,
                                                define.SEC_DEFINE.CURVE_NAMES.ECDH_SECP256R1_CURVE_NAME,
                                                "hex",
                                                "hex",
                                                define.SEC_DEFINE.CONVERT_KEY.COMPRESSED);

        return pubkey;
    }
}

/////////////////////////////////////////////////////
// My Key
module.exports.setMyKey = async (myKeyPath) => {
    // for net
    keyMe.prikey = await this.PEMReadPrivateKey(myKeyPath.prikey);
    keyMe.pubkey = await this.PEMReadPublicKey(myKeyPath.pubkey);
}

module.exports.getMyPubkey = async() => {
    let pubkey = await this.getPubkey();
    return pubkey;
}

//////////////////////////////////////////////////
// Get sha256 Hash
module.exports.genSha256Str = (msgBuf) => {
    const sha256Result = crypto.createHash(define.SEC_DEFINE.HASH_ALGO);
    sha256Result.update(msgBuf);
    return sha256Result.digest(define.SEC_DEFINE.DIGEST.HEX);
}

//////////////////////////////////////////////////
//
module.exports.eddsaVerifyHex = async(inputData, signature, pubkeyHex) => {
    //
    let transferHash = cryptoSsl.genSha256Hex(inputData);
    logger.debug("transferHash : " + transferHash);

    //
    let ed = new Eddsa(define.SEC_DEFINE.CURVE_NAMES.EDDSA_CURVE_NAME);
    let pubKey = ed.keyFromPublic(pubkeyHex, "hex");

    let verifyRet = pubKey.verify(transferHash, signature);
    logger.debug("verifyRet : " + verifyRet);

    return verifyRet;
}

module.exports.eddsaSignHex = async(inputData, prikeyHex) => {
    //
    let transferHash = cryptoSsl.genSha256Hex(inputData);
    logger.debug("transferHash : " + transferHash);

    //
    let ed = new Eddsa(define.SEC_DEFINE.CURVE_NAMES.EDDSA_CURVE_NAME);
    let priKey = ed.keyFromSecret(prikeyHex);

    //
    let signature = priKey.sign(transferHash).toHex();

    return signature;
}

module.exports.genSign = async(contractJson, prikeyPath) => {
    //
    const mergedBuffer = contractUtil.signBufferGenerator(contractJson);

    let inputData = cryptoSsl.genSha256Str(mergedBuffer);
    logger.debug("inputData : " + inputData);

    //
    let prikey_path = typeof prikeyPath !== 'undefined' ? prikeyPath : config.MY_KEY_PATH_CONFIG.prikey;
    let decPrikey = await this.decKey(prikey_path, config.KEY_PATH.KEY_SEED);
    let pemRead = await pemreader.decomposePrivateKey(decPrikey);

    //
    let prikeyBuf = util.bytesToBuffer(pemRead.keyData.seed);
    let prikeyHex = prikeyBuf.toString('hex');

    //
    let signature = await this.eddsaSignHex(inputData, prikeyHex);

    //
    ///////////////////////////////////////////////////////////
    let pubkeyHex = await this.getMyPubkey();

    let verRet = await cryptoSsl.eddsaVerifyHex(inputData, signature, pubkeyHex);
    logger.debug("verRet : " + verRet);

    // let verRet2 = await this.eddsaVerifyHex(inputData, signature, pubkeyHex);
    // logger.debug("verRet2 : " + verRet2);
    ///////////////////////////////////////////////////////////

    return signature;
}
