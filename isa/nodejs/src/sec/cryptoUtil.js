//
const pemreader = require('crypto-key-composer');
const fs = require('fs');
const crypto = require('crypto');

//
const cryptoSsl = require("./../../../../addon/crypto-ssl");

//
const config = require('../../config/config.js');
const define = require('../../config/define.js');
const util = require('../utils/commonUtil.js');
const logger = require('../utils/winlog.js');

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
    let pubkey_path = typeof pubkeyPath !== 'undefined' ? pubkeyPath : config.myKeyPathConfig.pubkey;

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
module.exports.setMyKey = async (keyMePath) => {
    // for net
    keyMe.prikey = await this.PEMReadPrivateKey(keyMePath.prikey);
    keyMe.pubkey = await this.PEMReadPublicKey(keyMePath.pubkey);
}

module.exports.getMyPubkey = async() => {
    let pubkey = await this.getPubkey();
    return pubkey;
}

//////////////////////////////////////////////////
// Get sha256 Hash
module.exports.genSha256Str = (MessageBuffer) => {
    const sha256Result = crypto.createHash(define.CRYPTO_ARG.HASH);
    sha256Result.update(MessageBuffer);
    return sha256Result.digest(define.CRYPTO_ARG.HEX);
}
