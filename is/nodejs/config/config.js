//
const fs = require('fs');
const { loggers } = require('winston');

//
const cryptoSsl = require("./../../../addon/crypto-ssl");

module.exports.TEST_PATH = {
    'TEST_SEED' : process.env.F_TEST_SEED_PATH,
    'TEST_KEY' : process.env.F_TEST_KEY_PATH,
    'ED_01' : process.env.F_TEST_KEY_PATH + '/ed_01/',
    'ED_02' : process.env.F_TEST_KEY_PATH + '/ed_02/',
    'ED_03' : process.env.F_TEST_KEY_PATH + '/ed_03/',
    'ED_04' : process.env.F_TEST_KEY_PATH + '/ed_04/',
    'PRIKEY_NAME' : process.env.F_TEST_KEY_PRIKEY_NAME,
    'PUBKEY_NAME' : process.env.F_TEST_KEY_PUBKEY_NAME,
}

module.exports.KEY_PATH = {
    'ED_PRIKEY_NAME' : process.env.F_KEY_ED_PRIKEY_NAME,
    'ED_PUBKEY_NAME' : process.env.F_KEY_ED_PUBKEY_NAME,
    'MY_KEY' : process.env.F_KEY_ME_PATH + '/',
    'PW_SEED': process.env.F_PW_SEED_PATH,
    'PW_MARIA' : process.env.F_PW_MARIA_PATH,
    'PW_SHARD' : process.env.F_PW_SHARD_PATH,
    'KEY_SEED' : cryptoSsl.aesDecPw(process.env.F_PW_SEED_PATH, process.env.F_PW_MARIA_PATH),
}

module.exports.SOCKET_INFO = {
    'BIND_ISA_PORT' : parseInt(process.env.F_IS_BIND_ISA_PORT),
    'BIND_ISAG_PORT' : parseInt(process.env.F_IS_BIND_ISAG_PORT),
    'RR_NET_PORT' : parseInt(process.env.F_IS_RRNET_PORT),
    'RR_NET_SRC_PORT' : parseInt(process.env.F_IS_RRNET_SRC_PORT)
}

module.exports.NET_CONF_PATH = {
    RR_NET : 'netconfig/rr_net',
    NODE_NN : 'netconfig/node_nn',
    JSON : '.json'
}

module.exports.CONTRACT_KIND_JSON = JSON.parse(fs.readFileSync(process.env.F_IS_CONTRACT_KIND));

// Maria DB Config
module.exports.MARIA_PATH_CONFIG = {
    PW_MARIA : cryptoSsl.aesDecPw(this.KEY_PATH.PW_SEED, this.KEY_PATH.PW_MARIA),
    SHARD_USERS : [
        cryptoSsl.aesDecPw(this.KEY_PATH.PW_SEED, this.KEY_PATH.PW_SHARD),
    ]
}

module.exports.MARIA_CONFIG = {
    host: process.env.F_DB_HOST,
    port: process.env.F_DB_PORT,
    user: process.env.F_DB_USER,
    password: this.MARIA_PATH_CONFIG.PW_MARIA,
    // database: process.env.F_DB_IS,
    supportBigNumbers: true,
    bigNumberStrings: true,
    connectionLimit : 10
};

// network key
module.exports.MY_KEY_PATH_CONFIG = {
    prikey : this.KEY_PATH.MY_KEY + this.KEY_PATH.ED_PRIKEY_NAME,
    pubkey : this.KEY_PATH.MY_KEY + this.KEY_PATH.ED_PUBKEY_NAME
}

// Kafka
// module.exports.kafkaConfig = {
//     'group.id' : process.env.F_KAFKA_GROUP_ID,
//     // 'metadata.broker.list': process.env.F_KAFKA_BROKER_LIST,
//     'session.timeout.ms' : 10000,
//     'heartbeat.interval.ms' : 3000,
//     'max.poll.interval.ms' : 500000,
//     'auto.offset.reset' : 'smallest',
//     'offset_commit_cb' : function (err, topicPartitions) {
//         if (err) {
//             logger.error(err);
//         } else {
//             logger.debug(topicPartitions);
//         }
//     }
// }

// 
module.exports.netConfSet = {
    'tierNum' : 1,
    'genInterval' : 5000,
    'genRountCnt' : 1,
    // need patch : startBlock API from fullblock
    'startBlock' : "1",
    'proto' : 1,
    'max' : 21,
    'udpSvr' : 0,
    'udpCli' : 0,
    'nn_tcpSvr' : 1,
    'cn_tcpSvr' : 0,
    'tcpCli_0': 0,
    'tcpCli' : 1,
    'nn_autoJoin' : 0,
    'cn_autoJoin': 1,
    'nn_p2pJoin' : 1,
    'cn_p2pJoin' : 1,
    'p2pJoin' : 1,
    'maxCluster' : 3,
    'maxGroup' : 3,
    'root_addr' : '0000'
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

//
module.exports.CMD_ENCODING = {
    encoding: 'utf8'
}

// testmode=false : disable, testmode=true : enable
module.exports.DB_TEST_MODE = true;
module.exports.DB_TEST_MODE_DROP = false;