//
const fs = require("fs");

//
const cryptoSsl = require("./../../../addon/crypto-ssl");

//
const logger = require("./../src/utils/winlog.js");

//
module.exports.KEY_PATH = {
    'PW_SEED': process.env.F_PW_SEED_PATH,
    'PW_MARIA' : process.env.F_PW_MARIA_PATH,
    'IS_PUBKEY': process.env.F_KEY_IS_PUBKEY_PATH,
    'KEY_SEED' : cryptoSsl.aesDecPw(process.env.F_PW_SEED_PATH, process.env.F_PW_MARIA_PATH),
}

// Version info
module.exports.paddy = (num, padLen, padChar) => {
    var pad_char = typeof padChar !== 'undefined' ? padChar : '0';
    var pad = new Array(1 + padLen).join(pad_char);

    return (pad + num).slice(-pad.length);
}

const getVerInfo = () => {
    //
    let mainVerInfo = '0';
    let subVerInfo = '0';

    //
    let lineArr = fs.readFileSync(process.env.F_NODE_CFG_PATH).toString().split('\n');

    for (idx in lineArr)
    {
        if (lineArr[idx].includes('VER_INFO_MAIN'))
        {
            mainVerInfo = lineArr[idx].split(' ')[2];
        }
        else if (lineArr[idx].includes('VER_INFO_SUB'))
        {
            subVerInfo = lineArr[idx].split(' ')[2];
        }
    }

    let verInfo = mainVerInfo + '.' + this.paddy(subVerInfo, 4);

    return verInfo;
}

//
module.exports.VERSION_INFO = getVerInfo();

// NN's node.json
module.exports.NN_NODE_JSON = JSON.parse(fs.readFileSync(process.env.F_NNA_NODE_JSON_PATH));

// NN's path.json
const NN_PATH_JSON = JSON.parse(fs.readFileSync(process.env.F_NNA_PATH_JSON_PATH));
module.exports.NN_PATH_JSON = NN_PATH_JSON;

// Contract Error Code
module.exports.CONTRACT_ERROR_JSON = JSON.parse(fs.readFileSync((process.env.F_SCA_CONTRACT_ERROR)));

// Contract Kind
module.exports.CONTRACT_KIND_JSON = JSON.parse(fs.readFileSync((process.env.F_SCA_CONTRACT_KIND)));

// Location
module.exports.LOCATION_JSON = JSON.parse(fs.readFileSync((process.env.F_SCA_LOCATION)));

// IS Public Key path
module.exports.IS_PUBKEY_PATH = process.env.F_KEY_IS_PUBKEY_PATH;

// my key signature type "ECDSA" or "EDDSA"
module.exports.SIG_TYPE = NN_PATH_JSON.PATH.KEY.CONS.PRIKEY_NAME.includes("ed") ? "EDDSA" : "ECDSA";

//
module.exports.IS_ENC_PRIKEY = NN_PATH_JSON.PATH.KEY.CONS.PRIKEY_NAME.includes("fin") ? true : false;

// Redis
module.exports.REDIS_CONFIG = {
    host : process.env.F_REDIS_HOST,
    port : parseInt(process.env.F_REDIS_PORT),
    password : cryptoSsl.aesDecPw(process.env.F_PW_SEED_PATH, process.env.F_PW_REDIS_PATH)
}

// Maria DB
module.exports.MARIA_PATH_CONFIG = {
    PW_MARIA : cryptoSsl.aesDecPw(process.env.F_PW_SEED_PATH, process.env.F_PW_MARIA_PATH),
    REPL_USERS : [
        cryptoSsl.aesDecPw(process.env.F_PW_SEED_PATH, process.env.F_PW_NN_PATH),
        cryptoSsl.aesDecPw(process.env.F_PW_SEED_PATH, process.env.F_PW_DN_PATH),
        cryptoSsl.aesDecPw(process.env.F_PW_SEED_PATH, process.env.F_PW_DBN_PATH),
    ],
    SHARD_USERS : [
        cryptoSsl.aesDecPw(process.env.F_PW_SEED_PATH, process.env.F_PW_SHARD_PATH),
    ]
}

module.exports.MARIA_CONFIG = {
    host: process.env.F_DB_HOST,
    port: process.env.F_DB_PORT,
    user: process.env.F_DB_USER,
    password: this.MARIA_PATH_CONFIG.PW_MARIA,
    supportBigNumbers : true,
    bigNumberStrings : true,
    connectionLimit : 10
};

// network key
module.exports.MY_KEY_PATH_CONFIG = {
    prikey : NN_PATH_JSON.PATH.KEY.CONS.MY_KEY + NN_PATH_JSON.PATH.KEY.CONS.PRIKEY_NAME,
    pubkey : NN_PATH_JSON.PATH.KEY.CONS.MY_KEY + NN_PATH_JSON.PATH.KEY.CONS.PUBKEY_NAME
}

// check redis subscribe true or false
module.exports.REDIS_PUBSUB_CHECK = false;
//
module.exports.DB_TEST_MODE = true;
module.exports.CONTRACT_TEST_MODE = false;

//
module.exports.KAFKA_CONFIG = {
    'group.id': process.env.F_KAFKA_GROUP_ID,
    'metadata.broker.list': process.argv[2] === undefined ? process.env.F_KAFKA_BROKER_LIST : process.argv[2],
    'session.timeout.ms': 10000,
    'heartbeat.interval.ms': 3000,
    'max.poll.interval.ms': 500000,
    'auto.offset.reset': 'smallest',
    'offset_commit_cb': function (err, topicPartitions) {
        if (err) {
            logger.error(err);
        } else {
            logger.debug(topicPartitions);
        }
    }
}
