//
const config = require('./../config/config.js');

//
module.exports.ERR_CODE ={
    ERROR : -1,
    SUCCESS : 1
}

module.exports.IP ={
    LOCALHOST : '127.0.0.1',
    EMPTY : '0.0.0.0'
}

module.exports.STR_RTN = {
    TRUE: 'true',
    FALSE: 'false',
    ERROR: 'error'
}

module.exports.DIVISION = {
    LOCALHOST: 'localhost',
    REMOTE_IP: 'remoteIp',
    REMOTE_PORT: 'remotePort',
    LOCAL_IP: 'localIp',
    LOCAL_PORT: 'localPort',
    EMPTY_IP: 'emptyIp',
    EMPTY_PORT: 'emptyPort'
}

module.exports.DB = {
    IDX : 'idx',
    TOTAL_PRR : 'total_prr',
    IP : 'ip'
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

module.exports.STATE = {
    ON : 1,
    OFF : 0
}

module.exports.DEFAULT_NET_CONF = {
    TCP_SVR_1_TOTAL_PEERS : 1,
    TCP_SVR_1_TOTAL_PEERS_CONS_1 : 0
}

module.exports.PRR = {
    capacityUnit : {
        GIGA: 1000
    },
    cpuWeight : {
        BASE: 15031,
        RATIO: 1000
    },
    memWeight : {
        BASE: 3999,
        RATIO1: 25,
        RATIO2: 50,
        LOG: 2
    },
    diskWeight : {
        NVME: 6,
        SSD: 3,
        HDD: 1,
        RATIO: 25
    }
}

module.exports.DATA_HANDLER = {
    status_cmd : {
        start : 'start',
        stop : 'stop',
        res_success : 'complete',
        request : 'request',
    }, 
    kind_cmd : {
        status_stop : 'leave all',
        blk_start : 'rr start',
        blk_stop : 'rr stop',
        last_bn_get : 'lastBN get',
        contract_recv : 'contract recv',
        // add_user : Number((0x10000000).toString(10)),
        // change_id : Number((0x10000001).toString(10)),
        // change_pubkey : Number((0x10000002).toString(10)),
        // login : Number((0x10000005).toString(10)),
        // logout : Number((0x10000006).toString(10)),
    }, 
    repl : 'repl',
    repl_cmd : {
        set : 'set',
        get : 'get',
        reset : 'reset',
        start: 'start',
        stop : 'stop',
        dataReq: 'dataReq',
        dataRsp : 'dataRsp',
    },
    // repl_arg_start : 0,
    // repl_arg_end : 4, // sizeof(repl_set)

    // brc_start : '{',
    // brc_end : '}'
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

module.exports.SEC_DEFINE = {
    HASH_ALGO : "sha256",
    DIGEST : {
        HEX : 'hex',
        BASE64 : 'base64',
    },
    PUBLIC_KEY_LEN : 66,
    CURVE_NAMES : {
        ECDH_SECP256R1_CURVE_NAME : "prime256v1",
        ECDH_SECP256K1_CURVE_NAME : "secp256k1",
        EDDSA_CURVE_NAME : "ed25519",
        ECDSA_SECP256K1_CURVE_NAME : "secp256k1",
        ECDSA_SECP256R1_CURVE_NAME : "p256"
    },
    KEY_DELIMITER : {
        START_INDEX : 0,
        END_INDEX : 2,
        DELIMITER_LEN : 2,
        SECP256_COMPRESSED_EVEN_DELIMITER : "02",
        SECP256_COMPRESSED_ODD_DELIMITER : "03",
        SECP256_UNCOMPRESSED_DELIMITER : "04",
        ED25519_DELIMITER : "05",
    },
    SIGN : {
        R_START_INDEX : 0,
        R_LEN : 64,
        S_START_INDEX : 64,
        S_END_INDEX : 64
    },
    SIG_KIND : {
        ECDSA : "ECDSA",
        EDDSA : "EDDSA"
    },
    CONVERT_KEY : {
        COMPRESSED : "compressed",
        UNCOMPRESSED : "uncompressed"
    },
    KEY_PURPOSE : {
        NET : "net",
        WALLET : "wallet"
    }
}

module.exports.CMD = {
    encoding:           'utf8',
    success:            ' Command Success',
    error:              ' Command Error',
    help_req1:          'is --help',
    help_req2:          'is -h',
    version_req1:       'is --version',
    version_req2:       'is -v',
    net_reset_req1:     'is --net reset',
    net_reset_req2:     'is -nrs',
    net_save_req1:      'is --net save',
    net_save_req2:      'is -nsv',
    net_update_req1:    'is --net update',
    net_update_req2:    'is -nup',
    net_rerun_req1:     'is --net rerun',
    net_rerun_req2:     'is -nrr',
    net_init_req1:      'is --net init',
    net_init_req2:      'is -nini',
    node_start_req1:    'is --node start',
    node_start_req2:    'is -nstt',
    node_kill_req1:     'is --node kill',
    node_kill_req2:     'is -nkil',
    node_next_req1:     'is --node next',
    node_next_req2:     'is -nnxt',
    bg_start_req1:      'is --block gen start',
    bg_start_req2:      'is -bg start',
    bg_stop_req1:       'is --block gen stop',
    bg_stop_req2:       'is -bg stop',
    last_bn_req1:       'is --get last bn',
    last_bn_req2:       'is -lbn',
    db_act_query_req1:  'is --act query',
    db_truncate_req1:   'is --db truncate',
    db_repl_get1:       'is --db repl get',
    db_repl_set1:       'is --db repl set',
    db_repl_stop1:      'is --db repl stop',
    db_repl_reset1:     'is --db repl reset',
    db_repl_start1:     'is --db repl start',
    repl_data_get1:     'is --repl data get',
    repl_data_reset1:   'is --repl data reset',
    shard_user_add1:    'is --shard user add',
    shard_user_del1:    'is --shard user del',
    kafka_add_req1:     'is --kafka add',
    hub_add_req1:       'is --hub add',
    hub_add_option1:    '-hubcode',
    hub_add_option2:    '-name',
    hub_add_option3:    '-gps',
    hub_add_option4:    ',',
    cluster_add_req1:   'is --cluster add',
    cluster_del_req1:   'is --cluster del',
    cluster_add_option1:'-hubcode',
    cluster_add_option2:'-group',
    cluster_add_option3:'-ip',
    cluster_add_option4:'-role',
    cluster_add_option5:'-sn',
    // cluster_add_option6:'-pubkey',
    cluster_del_option1:'-p2p',
    cluster_rep1:       'success',
    cluster_rep2:       'fail',
    cpu_add_req1:       'is --cpu add',
    cpu_add_option1:    '-name',
    cpu_add_option2:    '-mark',
    db_passwd_req1:     'mysql passwd',
    key_crypt_req:      'key',
    genesis_req1:       'is --genesis contract',
    genesis_req2:       'is -g',
    gc_add_user_is1:    'is --gc add user is',
    gc_add_user_is2:    'is -gc aui',
    gc_crate_token1:    'is --gc create token',
    gc_crate_token2:    'is -gc ct',
    test1:              'is --test',
    test2:              'is -t',
    help_res:   '               *******************************************\n' +
                '               ****          **************         ******\n' +
                '               ******      *************              ****\n' +
                '               ******      ************     **************\n' +
                '               ******      ************     **************\n' +
                '               ******      *************             *****\n' +
                '               ******      *********************      ****\n' +
                '               ******      *********************      ****\n' +
                '               ******      ***********               *****\n' +
                '               ****          ***********          ********\n' +
                '               *******************************************\n' +
                '       Usage : is --<command> <option>\n' +
                '       \n' +
                '       a.  is --version / is -v : Show version of IS\n' +
                '       b.  is --kafka add <broker_list> : Add Kafka List\n' +
                '          > Example : is --kafka add 125.141.130.11:9092,125.141.130.12:9092,125.141.130.13:9092\n' +
                '       c.  is --hub add -hubcode < > -name < > -gps < , > : Add Hub List\n' +
                '          > Example : is --hub add -hubcode 1 -name Seoul_Dogok1_01 -gps 37.63,127.03\n' +
                '       d.  is --cluster add -hubcode < > -group < > -ip < > -pubkey < > -sn < > : Add Cluster List\n' +
                '          > Example : is --cluster add -hubcode 0 -group 0 -ip 203.238.181.172 -pubkey 6c51bdb36... -sn 74b5b608...\n' +
                '       e.  1) is --cluster del -p2p < > : Delete Cluster List (P2P_address)\n' +
                '           2) is --cluster del -ip < > : Delete Cluster List (IP)\n' +
                '          > Example(1) : is --cluster del -p2p 0x253f7f036004\n' +
                '          > Example(2) : is --cluster del -ip 192.168.0.11\n' +
                '       f.  mysql passwd < > : Encrypt Mysql Passwd by AES\n' +
                '          > Example : mysql passwd 123456\n' +
                '       g.  key enc/dec < > : Encrypt Eddsa Private Key by AES\n' +
                '          > Example : key enc ../conf/key/me/ed_privkey.pem\n' +
                '          > Example : key dec ../conf/key/me/ed_privkey.fin\n' +
                '       \n' +
                '       0.  is --net reset : Reset network\n' +
                '       1.  is --net rerun : Each node applies a new NODE.json\n' +
                '       2.  is --net update : Each node applies new rr_net.json, rr_subnet.json\n' +
                '       3.  is --node start : Start All nodes. (CN start after 3sec)\n' +
                '       4.  is --block gen start : Start Block gen\n' +
                '       5.  is --block gen stop : Stop Block gen\n' +
                '       6.  is --db truncate : Each node truncates DB\n' +
                '       7.  is --node next : The nodes in the Consensus group are trying to connect to each other.\n' +
                '       8.  is --node kill : Kill All nodes\n' +
                '       9.  is --net init : Each node closes TCP connection\n' +
                '       10. is --genesis contract / is -g : Send Genesis Contract to SCA0\n' +
                '\n',
    version_res:            '       ' + config.VERSION_INFO,
    error_res:              'Command not found. Please enter the [is -h] or [is --help]',
    net_reset_res:          '00',
    net_rerun_res:          '01',
    net_update_res:         '02',
    net_init_res:           '09',
    node_start_res:         '03',
    node_kill_res:          '08',
    node_next_res:          '07',
    bg_start_res:           '04',
    bg_stop_res:            '05',
    get_last_bn_res:        '06',
    net_save_res:           '10',
    contract_res:           '11',
    db_truncate_res:        '20',
    db_repl_set_res:        '21', //'repl set',
    db_repl_get_res:        '22',
    db_repl_stop_res:       '23',
    db_repl_reset_res:      '24',
    db_repl_start_res:      '25',
    db_repl_dataReq:        '26',
    db_repl_dataRsp:        '27',
    prr_error:              '98',
    prr_passed:             '99',
    db_passwd_res_success:  'Maria Passwd Encrypt Success',
    db_passwd_res_error:    'Maria Passwd Encrypt Error',
    ed_prv_res_success:     'Eddsa Private Key Encrypt Success',
    ed_prv_res_error:       'Eddsa Private Key Encrypt Error',
    genesis_res:            'contract',
    sliceIP: 7
}

module.exports.CONTRACT_DEFINE = {
    ED_PUB_IDX : '05',
    MAX_TX_CNT : 500,
    ACCOUNT_TOKEN_DELI : 1,
    ACCOUNT_USER_DELI_MIN : 2,
    ACCOUNT_USER_DELI_MAX : 7,
    MAX_DECIMAL_POINT : 4, 
    SEC_TOKEN_ACCOUNT : '1000000000000000',
    FROM_DEFAULT : '0000000000000000',
    TO_DEFAULT : '0000000000000000',
    FEE_DEFAULT : '0',
    KIND : {
        SECURITY_TOKEN : config.CONTRACT_KIND_JSON.SECURITY_TOKEN,
        UTILITY_TOKEN : config.CONTRACT_KIND_JSON.UTILITY_TOKEN,
        TOKEN_CREATION : config.CONTRACT_KIND_JSON.TOKEN_CREATION,
        EXE_FUNC : config.CONTRACT_KIND_JSON.EXE_FUNC,
        CHANG_TOKEN_OWNER : config.CONTRACT_KIND_JSON.CHANG_TOKEN_OWNER,
        LOCK_TOKEN_TX : config.CONTRACT_KIND_JSON.LOCK_TOKEN_TX,
        LOCK_TOKEN_TIME : config.CONTRACT_KIND_JSON.LOCK_TOKEN_TIME,
        LOCK_TOKEN_WALLET : config.CONTRACT_KIND_JSON.LOCK_TOKEN_WALLET,
        ADD_USER : config.CONTRACT_KIND_JSON.ADD_USER
    },
    FINTECH : {
        NON_FINANCIAL_TX : '0',
        FINANCIAL_TX : '1',
    },
    PRIVACY : {
        PUBLIC : '0',
        PRIVATE : '1'
    },
    CONTRACT_PROPERTY : {
        REVISION : "revision",
        PREV_KEY_ID : "prev_key_id",
        CREATE_TM : "create_tm",
        FINTECH : "fintech",
        PRIVACY : "privacy",
        FEE : "fee",
        FROM_ACCOUNT : "from_account",
        TO_ACCOUNT : "to_account",
        TYPE : "type",
        CONTENTS : "contents",
        MEMO : "memo",
        SIG : "sig",
        SIGNED_PUPKEY : "signed_pubkey"
    },
    CONTENTS_PROPERTY : {
        TX_ST : {
            AMOUNT : "amount"
        }, 
        TX_UT : {
            TO : "to", 
            AMOUNT : "amount"
        }, 
        LOCK_TOKEN_TX : {
            TYPE : "type", 
            LOCK : "lock"
        }, 
        LOCK_TOKEN_TIME : {
            TYPE : "type", 
            LOCK_TIME_FROM : "lock_time_from",
            LOCK_TIME_TO : "lock_time_to"
        }, 
        LOCK_TOKEN_WALLET : {
            TYPE : "type",  
            PK_LIST : "pk_list"
        }, 
        ADD_USER : {
            OWNER_PK : "owner_pk",
            SUPER_PK : "super_pk",
            ACCOUNT_ID : "account_id"
        }, 
        CREATE_TOKEN : {
            OWNER_PK : "owner_pk",
            SUPER_PK : "super_pk",
            TYPE : "type",
            NAME : "name", 
            SYMBOL : "symbol",
            TOTAL_SUPPLY : "total_supply",
            DECIMAL_POINT : "decimal_point",
            LOCK_TIME_FROM : "lock_time_from",
            LOCK_TIME_TO : "lock_time_to",
            LOCK_TRANSFER : "lock_transfer",
            BLACK_LIST : "decimal_point",
            FUNC : "functions"
        }
    },
    LOCK_TOKEN_TX : {
        UNLOCK : 0,
        LOCK_ALL : 1,
        LOCK_EXC_OWNER : 2
    },
    LOCK_TOKEN_TIME : {
        UNLOCK : "0"
    }
}

module.exports.startMsg = "=================================================="
    + "\n= Puri Block Chain                               ="
    + "\n= [ IS Ver : " + config.VERSION_INFO + "]                             ="
    + "\n==================================================";

module.exports.REGEX = {
    'NEW_LINE_REGEX': /\n+/,
    'WHITE_SPACE_REGEX': /\s/,
    'IP_ADDR_REGEX': /^(?!0)(?!.*\.$)((1?\d?\d|25[0-5]|2[0-4]\d)(\.|$)){4}$/,
    'HEX_STR_REGEX': /^[a-z0-9+]{5,65}$/
}

//
module.exports.DB_DEFINE = {
    HEX_DB_KEY_LEN : {
        KEY_NUM_LEN : 12,
        KEY_INDEX_LEN : 4,
        DB_KEY_LEN : 16
    },
    REPL_QUERY_INDEX : {
        DROP_USER_INDEX : 0,
        CREATE_USER_INDEX : 1,
        GRANT_REPL_INDEX : 2
    },
    SHARD_USERS_QUERY_INDEX : {
        DROP_USER_INDEX : 0,
        CREATE_USER_INDEX : 1,
        GRANT_ALL_INDEX : 2
    },
    SHARD_USERS : [
        process.env.F_SHARD_USER_IS,
    ]
}

module.exports.P2P_DEFINE = {
    P2P_SUBNET_ID_IS : '0001',
    P2P_ROOT_SPLIT_INDEX : {
        START : 10,
        END : 14
    },
    P2P_TOPIC_NAME_SPLIT_INDEX : {
        START : 2,
        END : 14
    }
}