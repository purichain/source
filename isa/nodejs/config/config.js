//
const fs = require('fs');

//
const cryptoSsl = require("./../../../addon/crypto-ssl");

//
module.exports.KEY_PATH = {
    // 'ED_PRIKEY_NAME' : process.env.F_KEY_ED_PRIKEY_NAME,
    // 'ED_PUBKEY_NAME' : process.env.F_KEY_ED_PUBKEY_NAME,
    // 'NN_PRIKEY_NAME' : process.env.F_KEY_ED_PRIKEY_NAME,
    // 'NN_PUBKEY_NAME' : process.env.F_KEY_ED_PUBKEY_NAME,
    // 'KEY_ROOT' : process.env.F_KEY_ROOT_PATH + '/',
    'MY_KEY' : process.env.F_KEY_ME_PATH + '/',
    'PW_SEED': process.env.F_PW_SEED_PATH,
    'PW_MARIA' : process.env.F_PW_MARIA_PATH,
    'PW_REDIS' : process.env.F_PW_REDIS_PATH,
    // 'IS_PUBKEY': process.env.F_KEY_IS_PUBKEY_PATH,
    'KEY_SEED' : cryptoSsl.aesDecPw(process.env.F_PW_SEED_PATH, process.env.F_PW_MARIA_PATH),
}

module.exports.SOCKET_INFO = {
    BIND_IS_PORT: parseInt(process.env.F_IS_BIND_ISA_PORT),
    BIND_IS_HOST: process.env.F_IS_BIND_ISA_HOST,
    BIND_IS_LOCAL_PORT: parseInt(process.env.F_IS_BIND_ISA_LOCAL_PORT)
}

module.exports.NODE_PATH = {
    // nn_cwd: '../nna',
    // sca_cwd: '../sca',
    // dn_cwd: '../dn',
    // dbn_cwd: '../dbn',
    
    cpp_start: './bin/node',
    node_start1: 'node',
    node_start2: 'main.js',
    stdio: ['pipe', 'pipe', 'pipe'],
    shell: 'bash',
    scriptNodeStart: './node_start.sh',
    scriptWhere: './bin'
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

module.exports.CMD_ENCODING = {
    encoding: 'utf8'
}

// APP Log
module.exports.APP_LOG_KIND = {
    NONE : 0,
    CPP_LOG : 1,
    SCA_LOG : 2,
    DN_LOG :4,
    DBN_LOG : 8
};

module.exports.APP_LOG = this.APP_LOG_KIND.CPP_LOG | this.APP_LOG_KIND.SCA_LOG;

// NN's path.json
const NN_NODE_JSON = JSON.parse(fs.readFileSync(process.env.F_NNA_PATH_JSON_PATH));
module.exports.NN_NODE_JSON = NN_NODE_JSON;

// network key
module.exports.myKeyPathConfig = {
    prikey : NN_NODE_JSON.PATH.KEY.CONS.MY_KEY + NN_NODE_JSON.PATH.KEY.CONS.PRIKEY_NAME,
    pubkey : NN_NODE_JSON.PATH.KEY.CONS.MY_KEY + NN_NODE_JSON.PATH.KEY.CONS.PUBKEY_NAME
}

module.exports.NET_CONF_PATH = {
    NN_RR_NET: process.env.F_NNA_RRNET_JSON_PATH,
    NN_NODE: process.env.F_NNA_NODE_JSON_PATH,
}

// Redis
module.exports.REDIS_CONFIG = {
    host : process.env.F_REDIS_HOST,
    port : parseInt(process.env.F_REDIS_PORT),
    password : cryptoSsl.aesDecPw(this.KEY_PATH.PW_SEED, this.KEY_PATH.PW_REDIS)
}

module.exports.REDIS_CH = {
    CTRL_NOTI: 'ctrlNoti', // to NNA
    CMD_NOTI: 'cmdNoti', // to SCA
    CTRL_NOTI_ACKS: 'ctrlNotiAcks', // from NNA
    CMD_NOTI_ACKS: 'cmdNotiAcks' // From SCA
}

// Maria DB
module.exports.MARIA_PATH_CONFIG = {
    PW_MARIA : cryptoSsl.aesDecPw(this.KEY_PATH.PW_SEED, this.KEY_PATH.PW_MARIA),
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

//
// VM true? 1, false? 0
module.exports.IS_VM = 1;
module.exports.TEST_HW_INO = {
    CPU : "Test CPU",
    MEMSIZE : 8,
    MEMSPEED : 1200
};