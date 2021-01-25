//
const config = require('./../config/config.js');

//
module.exports.ERR_CODE ={
    ERROR : -1,
    SUCCESS : 1
}

module.exports.PRE_CMD = {
    NODE_PS_CKH_CMD : `ps aux | awk '/node/' | awk '!/isa/' | awk '!/awk/' | awk '{print $2}'`
}

//HW Info
module.exports.HW_INFO = {
    //
    HYPERVISOR: "lscpu  | awk '{print $1}'",
    VIRTUALIZATION: "hostnamectl | awk '{print $1}'",
    MEM_SIZE: "sudo dmidecode -t 17 | grep Size | awk '{print $2}' | awk '!/No/'",
    MEM_SPEED: "sudo dmidecode -t 17 | grep 'Configured Clock Speed' | awk '{print $4}' | awk '!/Unknown/'",
    STORAGE_INFO: "sudo lsblk -P -o rm,rota,name,size,type | grep -E 'disk|raid'",
    CPU_MODEL: "sudo dmidecode -t 4 | grep 'Version:' | awk '{ print substr($0,index($0,$2)) }'",
    BOARD_SN: "sudo dmidecode -s system-serial-number",
    SYSTEM_UUID: "sudo dmidecode -s system-uuid",
    GET_ID: "hostname",
};

module.exports.HW_INFO_KIND = {
    VIRTUAL_CHK_1: 'Hypervisor',
    VIRTUAL_CHK_2: 'Virtualization:',
    LOCATE_ROTA: 3,
    LOCATE_ROTA_KIND : {
        HDD_ROTA: '1',
        SDD_ROTA: '0'
    },
    LOCATE_NVME: 5,
    LOCATE_NVME_KIND : {
        NVME_ROTA: 'nvme'
    },
    LOCATE_SIZE: 7,
    LOCATE_SIZE_KIND : {
        GIGA: 'G',
        TERA: 'T',
        UNIT_CHANGE: 1024
    },
    LOCATE_TYPE: 9,
    LOCATE_TYPE_KIND : {
        RAID_ROTA: 'raid'
    },
    RAID_NONE: 'none'
}

//APP Info
module.exports.APP_INFO = {
    //
    PS_NODE: "ps aux | awk '/node/' | awk '!/isa/' | awk '!/awk/' | awk '{print $2}'", 
    KILL_NODE: "kill -9 $(ps aux | awk '/node/' | awk '!/isa/' | awk '!/awk/' | awk '{print $2}')",
    
    APP_STATUS_1: "ps -ef |grep node | awk '{print $8}'",
    APP_STATUS_2: "ps -ef |grep node | awk '{print $9}'"
};

module.exports.APP_NAME = {
    CPP: './bin/node',
    NODE: 'main.js'
}

module.exports.NODE_ROLE = {
    STR : {
        NN : 'NN',
        DN : 'DN',
        DBN : 'DBN',
        SCA : 'SCA',
        ISAG: 'ISAg',
        RN : 'RN',
        BN : 'BN'
    },
    NUM : {
        NN: 0,
        // DN: 1,
        DBN: 2,
        ISAG: 4
    },
}

module.exports.SOCKET_ARG = {
    SEPARATOR: "\r"
}

module.exports.CRYPTO_ARG = {
    //
    HASH: 'sha256',
    // digest
    HEX: 'hex',
    BASE64: 'base64',
    //
    EDDSA: 'ed25519'
}

module.exports.CMD = {
    encoding: 'utf8'
}

module.exports.CMD_CTRL_NOTI = {
    req_reset: '00',
    res_reset: 'leave all', // SCA NNA
    req_rerun: '01',
    res_rerun: 're run', // SCA NNA
    req_rrUpdate: '02',
    res_rrUpdate: 'rr update', // NNA
    req_nodeStart: '03',
    res_nodeStart: ' application start', // ?
    req_blkgenStart: '04',
    res_blkgenStart: 'rr start', // NNA
    req_blkgenStop: '05',
    res_blkgenStop: 'rr stop', // NNA
    req_getLastBN: '06',
    res_getLastBN: 'lastBN get', // SCA
    req_rrNext: '07',
    res_rrNext: 'rr next', // NNA
    req_nodeKill: '08',
    res_nodeKill: 'All App Killed', // ISA itself
    req_netInit: '09',
    res_netInit: 're init', // NNA
    req_netSave: '10',
    res_netSave: 'net save', // ISA itself
    req_contract: '11',
    res_contract: 'contract',
    req_db_truncate: '20',
    res_db_truncate: 'db truncate', // SCA NNA
    req_db_repl_set: '21',
    res_db_repl_set: 'repl set',
    req_db_repl_get: '22',
    res_db_repl_get: 'repl get',
    req_db_repl_stop: '23',
    res_db_repl_stop: 'repl stop',
    req_db_repl_reset: '24',
    res_db_repl_reset: 'repl reset',
    req_db_repl_start: '25',
    res_db_repl_start: 'repl start',
    req_db_repl_dataReq: '26',
    res_db_repl_dataReq: 'repl dataReq',
    req_db_repl_dataRsp: '27',
    res_db_repl_dataRsp: 'repl dataRsp',
    req_prr_error: '98',
    req_prr_passed: '99',
    redis_ctrl_noti: config.REDIS_CH.CTRL_NOTI, // NNA
    redis_cmd_noti: config.REDIS_CH.CMD_NOTI, // SCA
    res_reward_complete: 'reward complete spread',
    req_reward_spread: 'reward spread'
}

module.exports.CMD_REDIS = {
    kind: 0,
    status: 1,
    detail_kind: 1,
    detail_kind_status: 2,
    req_start: 'start',
    // res_start: 'start',
    req_complete: 'complete',
    req_contract: 'contract',
    req_contract_cmd : {
        recv : 'recv',
    },
    req_node: 'node', // From SCA
    req_repl: 'repl', // From SCA
    req_repl_cmd : {
        get : 'get',
        set : 'set',
        reset : 'reset',
        start : 'start',
        stop : 'stop',
        dataReq: 'dataReq',
        dataRsp : 'dataRsp',
    },
    res_replGet: 'repl get', // To IS
    req_lastBN: 'lastBN',
    req_lastBN_cmd : {
        get : 'get',
    },
    res_lastBNGet: 'lastBN get',
    req_sca: 'SCA',
    req_dn: 'DN',
    req_dbn: 'DBN',
    req_reward: 'reward',
    req_reward_spread: 'spread'
}

module.exports.START_MSG = "=================================================="
    + "\n= PURI Block Chain                               ="
    + "\n= [ ISA Ver : " + config.VERSION_INFO + "]                              ="
    + "\n==================================================";

module.exports.REGEX = {
    'NEW_LINE_REGEX' : /\n+/,
    'WHITE_SPACE_REGEX' : /\s/,
    'IP_ADDR_REGEX' : /^(?!0)(?!.*\.$)((1?\d?\d|25[0-5]|2[0-4]\d)(\.|$)){4}$/,
    'HEX_STR_REGEX': /^[a-z0-9+]{5,65}$/
}