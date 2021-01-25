//
const fs = require('fs');
const eddsa = require('elliptic').eddsa;
const ecdsa = require('elliptic').ec;
const crypto = require('crypto');
const { createECDH, ECDH } = require("crypto");
const pemreader = require('crypto-key-composer');

//
const cryptoSsl = require("./../../../../addon/crypto-ssl");
const verifier = require("./../../../../addon/crypto-ssl");

//
const config = require("./../../config/config.js");
const define = require("./../../config/define.js");
const contractUtil = require("./../contract/contractUtil.js");
const util = require("./../utils/commonUtil.js");
const logger = require("../utils/winlog.js");

//
let keyMe = new Object();
let pubkeyIS;

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

    let pemRead = await pemreader.decomposePublicKey(decPubKey);
    return pemRead;
}

module.exports.PEMReadPrivateKey = async (path) => {
    let decPrivKey = await this.decKey(path, config.KEY_PATH.KEY_SEED);

    let pemRead = await pemreader.decomposePrivateKey(decPrivKey);
    return pemRead;
}

module.exports.ConvertPubKey = async (PublicKey, CurveName, delimiter) => {
    try {
        return await ECDH.convertKey(PublicKey, CurveName, "hex", "hex", delimiter);
    } catch (err) {
        console.log(err);
        return false;
    }
}

//////////////////////////////////////////////////
// Get sha256 Hash
module.exports.genSha256Str = (MessageBuffer) => {
    const sha256Result = crypto.createHash(define.SEC_DEFINE.HASH_ALGO);
    sha256Result.update(MessageBuffer);
    return sha256Result.digest("hex");
}

/////////////////////////////////////////////////////
// IS public key
module.exports.getISPubkey = () => {
    return pubkeyIS;
}

module.exports.setISPubkey = async (keyISPathConfig) => {
    let pemRead = await this.PEMReadPublicKey(keyISPathConfig);

    if(keyISPathConfig.includes("ed"))
    {
        const publickey = util.bytesToBuffer(pemRead.keyData.bytes);
        pubkeyIS = define.SEC_DEFINE.KEY_DELIMITER.ED25519_DELIMITER + publickey.toString('hex');
    }
    else 
    {
        const ec_point_x = util.bytesToBuffer(pemRead.keyData.x).toString('hex');
        const ec_point_y = util.bytesToBuffer(pemRead.keyData.y).toString('hex');

        const uncompressedpubkey = define.SEC_DEFINE.KEY_DELIMITER.SECP256_UNCOMPRESSED_DELIMITER + ec_point_x + ec_point_y;
        const publicKey = await ECDH.convertKey(uncompressedpubkey,
                                                define.SEC_DEFINE.CURVE_NAMES.ECDH_SECP256R1_CURVE_NAME,
                                                "hex",
                                                "hex",
                                                define.SEC_DEFINE.CONVERT_KEY.COMPRESSED);
        pubkeyIS = publicKey;
    }
}

/////////////////////////////////////////////////////
// My Key
module.exports.setMyKey = async (myKeyPath) => {
    // for net
    keyMe.prikey = await this.PEMReadPrivateKey(myKeyPath.prikey);
    keyMe.pubkey = await this.PEMReadPublicKey(myKeyPath.pubkey);
}

module.exports.getMyPubkey = () => {
    if(config.SIG_TYPE === define.SEC_DEFINE.SIG_KIND.EDDSA) 
    {
        let pubkey;

        pubkey = util.bytesToBuffer(keyMe.pubkey.keyData.bytes);

        return pubkey.toString('hex');
    }
    else if (config.SIG_TYPE === define.SEC_DEFINE.SIG_KIND.ECDSA)
    {
        let ec_point_x;
        let ec_point_y;

        ec_point_x = util.bytesToBuffer(keyMe.pubkey.keyData.x).toString('hex');
        ec_point_y = util.bytesToBuffer(keyMe.pubkey.keyData.y).toString('hex');
        
        const uncompressedpubkey = define.SEC_DEFINE.KEY_DELIMITER.SECP256_UNCOMPRESSED_DELIMITER + ec_point_x + ec_point_y;
        const pubkey = ECDH.convertKey(uncompressedpubkey,
                                                define.SEC_DEFINE.CURVE_NAMES.ECDH_SECP256R1_CURVE_NAME,
                                                "hex",
                                                "hex",
                                                define.SEC_DEFINE.CONVERT_KEY.COMPRESSED);

        return pubkey;
    }
}

/////////////////////////////////////////
//

module.exports.verifySign = (pubKeyHex, contractJson) => {
    //
    const mergedBuffer = contractUtil.signBufferGenerator(contractJson);

    let inputData = cryptoSsl.genSha256Str(mergedBuffer);
    logger.debug("verifySign - inputData : " + inputData);

    //
    var verifyRet;

    if (pubKeyHex.slice(define.SEC_DEFINE.KEY_DELIMITER.START_INDEX, define.SEC_DEFINE.KEY_DELIMITER.DELIMITER_LEN) 
                        === define.SEC_DEFINE.KEY_DELIMITER.ED25519_DELIMITER)
    {
        let realPubkeyHex = pubKeyHex.slice(define.SEC_DEFINE.KEY_DELIMITER.DELIMITER_LEN);
        logger.debug("verifySign - realPubkeyHex : " + realPubkeyHex);
        logger.debug("verifySign - signature : " + contractJson.sig);
        verifyRet = verifier.eddsaVerifyHex(inputData, contractJson.sig, realPubkeyHex);
    }
    else
    {
        var sigR = contractJson.sig.slice(define.SEC_DEFINE.SIG.R_START_INDEX, define.SEC_DEFINE.SIG.R_LEN);
        var sigS = contractJson.sig.slice(define.SEC_DEFINE.SIG.S_START_INDEX, define.SEC_DEFINE.SIG.S_LEN);

        verifyRet = verifier.ecdsaR1VerifyHex(inputData, sigR, sigS, pubKeyHex);
        if (verifyRet === false)
        {
            verifyRet = verifier.EcdsaK1Verify(inputData, sigR, sigS, pubKeyHex);
        }
    }

    return verifyRet;
}

//////////////////////////////////////////////////////////
//
module.exports.getNnaNum = () => {
    // NN's rr_net.json
    const rrNetJson = JSON.parse(fs.readFileSync(process.env.F_NNA_RRNET_JSON_PATH));

    //let p2pAddr = rrNetJson.NET.TIER[0].NN_LIST[0].P2P;
    //logger.debug("getNnaNum p2pAddr : " + p2pAddr);

    logger.debug("NN_LIST.length : " + rrNetJson.NET.TIER[0].NN_LIST.length);

    return (rrNetJson.NET.TIER[0].NN_LIST.length);
}

// From RRNET
module.exports.getNnaIPs = () => {
    // NN's rr_net.json
    const rrNetJson = JSON.parse(fs.readFileSync(process.env.F_NNA_RRNET_JSON_PATH));
    let nnList = rrNetJson.NET.TIER[0].NN_LIST;

    let ipArr = new Array();

    for (var i=0; i<nnList.length; i++)
    {
        //logger.debug("ip : " + nnList[i].SOCK.IP);
        ipArr.push(nnList[i].SOCK.IP);
    }

    logger.debug("ipArr.length : " + ipArr.length);

    return ipArr;
}

// From RRNET
module.exports.getNnaSubNetIds = () => {
    // NN's rr_net.json
    const rrNetJson = JSON.parse(fs.readFileSync(process.env.F_NNA_RRNET_JSON_PATH));
    let nnList = rrNetJson.NET.TIER[0].NN_LIST;

    let subNetIdArr = new Array();

    for (var i=0; i<nnList.length; i++)
    {
        let subNetId = nnList[i].P2P.slice(
                define.P2P_DEFINE.P2P_ROOT_SPLIT_INDEX.START, 
                define.P2P_DEFINE.P2P_ROOT_SPLIT_INDEX.END);
        
        //logger.debug("subNetId : " + subNetId);
        subNetIdArr.push(subNetId);
    }

    logger.debug("subNetIdArr.length : " + subNetIdArr.length);

    return subNetIdArr;
}

module.exports.genKeyIndex = () => {
    let nnaConf = config.NN_NODE_JSON;
    let p2pRoot = nnaConf.NODE.P2P.CLUSTER.ROOT;

    let p2pAddr = p2pRoot.slice(
        define.P2P_DEFINE.P2P_ROOT_SPLIT_INDEX.START, 
        define.P2P_DEFINE.P2P_ROOT_SPLIT_INDEX.END);

    const keyIndex = p2pAddr;
    let dbKeyIndex = keyIndex.toString(16);
    
    dbKeyIndex = util.padding(
        dbKeyIndex, 
        define.DB_DEFINE.HEX_DB_KEY_LEN.KEY_INDEX_LEN,
        define.COMMON_DEFINE.PADDING_DELIMITER.FRONT);

        dbKeyIndex = util.padding(
            dbKeyIndex,
        define.DB_DEFINE.HEX_DB_KEY_LEN.DB_KEY_LEN,
        define.COMMON_DEFINE.PADDING_DELIMITER.BACK);
 
    let KeyID_big = BigInt("0x" + dbKeyIndex);

    return KeyID_big.toString();
}

module.exports.getParsedSubNetId = (dbKeyIndex) => {
    let subNetId = parseInt(dbKeyIndex).toString(16);
    subNetId = util.padding(
        subNetId,
        define.DB_DEFINE.HEX_DB_KEY_LEN.DB_KEY_LEN,
        define.COMMON_DEFINE.PADDING_DELIMITER.FRONT);

    subNetId = subNetId.substr(0, define.DB_DEFINE.HEX_DB_KEY_LEN.KEY_INDEX_LEN);
    subNetId = parseInt(subNetId, 16);

    return subNetId;
}