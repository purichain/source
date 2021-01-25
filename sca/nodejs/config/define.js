const config = require("./config.js");

// Define

const ENABLED = true;
const DISABLED = false;

module.exports.ERR_CODE ={
    ERROR : -1,
    SUCCESS : 1
}

module.exports.BIT_FLAG ={
    FLAG_0 : 1,
    FLAG_1 : 2,
    FLAG_2 : 4,
    FLAG_3 : 8
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

module.exports.CLUSTER_DEFINE = {
    MAX_CLUSTER_WORKER_NUM : 4,
    NNA_CLUSTER_WORKER_ID : 1,
    NNA_CLUSTER_WORKER_ID_STR : "1",
    DB_CLUSTER_WORKER_ID : 2,
    DB_CLUSTER_WORKER_ID_STR : "2",
    ISA_CLUSTER_WORKER_ID : 3,
    ISA_CLUSTER_WORKER_ID_STR : "3",
    KFK_CLUSTER_WORKER_ID : 4,
    KFK_CLUSTER_WORKER_ID_STR : "4",
    SEND_TXS_TO_NNA_INTERVAL : 10,
    REDIS_CHANNEL_ERROR : -1,
    EXIT_CODE : {
        NORMAL : 0,
        SOME_ERROR : 1
    }
}
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
    REPL_USERS : [
        process.env.F_REPL_USER_NN,
        process.env.F_REPL_USER_DN,
        process.env.F_REPL_USER_DBN,
    ],
    SHARD_USERS_QUERY_INDEX : {
        DROP_USER_INDEX : 0,
        CREATE_USER_INDEX : 1,
        GRANT_ALL_INDEX : 2
    },
    SHARD_USERS : [
        process.env.F_SHARD_USER_NN,
    ]
}

module.exports.CMD_DEFINE = {
    RCV_TXS_IND : "rcvTxsInd",
    NULL_TXS_IND : "nullTxsInd",
    BLK_NOTI_IND : "blkNotiInd",
    REDIS_CHK_CFM : "redisChkCfm",
    LOGIN_REQ : "loginReq",
    LOGOUT_REQ : "logoutReq",
}

module.exports.COMMON_DEFINE = {
    PADDING_DELIMITER : {
        FRONT : 0,
        BACK : 1
    },
    ENABLED : ENABLED,
    DISABLED : DISABLED
}

module.exports.P2P_DEFINE = {
    P2P_ROOT_SPLIT_INDEX : {
        START : 10,
        END : 14
    },
    P2P_TOPIC_NAME_SPLIT_INDEX : {
        START : 2,
        END : 14
    }
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
    // KEY_PURPOSE : {
    //     NET : "net",
    //     WALLET : "wallet"
    // }
}

module.exports.REDIS_DEFINE = {
    TX_ACK_LEN : {
        HEX_STR_BN_LEN : 16,
        HEX_STR_DB_KEY_LEN : 16
    },
    BLK_NOTI_LEN : {
        HEX_STR_BN_LEN : 16,
        HEX_STR_BGT_LEN : 16,
        HEX_STR_TXC_LEN : 2,
        HEX_STR_HASH_LEN : 64,
        TOTAL_LEN : 98
    },
    CHANNEL : {
        TXS : "txs",
        TX_ACKS : "txAcks",
        BLK_NOTI : "blkNoti",
        CMD_NOTI : "cmdNoti",
        CMD_NOTI_ACKS : "cmdNotiAcks"
    },
    LOCAL_CHANNEL : {
        TX_CONTRACT : "txContract",
        TX_CONTRACT_ACK : "txContractAck",
    },
    REDIS_PUBSUB_CHECK : config.REDIS_PUBSUB_CHECK === ENABLED ? ENABLED : DISABLED
}

module.exports.ISA_DEFINE = {
    CMD : {
        DB_TRUNCATE : "db truncate",
        NET_RESET : "leave all",
        NET_UPDATE : "re run",
        HEART_BEAT : "node start",
        CONTRACT : "contract",
        LAST_BN_REQ : "lastBN get", 
        REPL : "repl",
        REPL_CMD : {
            SET : "set",
            GET : "get",
            STOP : "stop",
            RESET : "reset",
            START : "start",
        },
        REWARD : "reward spread",
    },
    CMD_ACKS : {
        DB_TRUNCATE_ACK : "db truncate complete",
        NET_RESET_ACK : "leave all complete",
        NET_UPDATE_ACK : "SCA start",
        // HEART_BEAT_ACK : "node start complete",
        CONTRACT_ACK : "contract recv complete",
        LAST_BN_ACK : "lastBN get complete",
        REPL : {
            SET_ACK : "repl set complete",
            GET_ACK : "repl get complete",
            STOP_ACK : "repl stop complete",
            RESET_ACK : "repl reset complete",
            START_ACK : "repl start complete",
        },
        REWARD_ACK : "reward complete",
        REWARD_SPREAD_ACK : "reward spread complete",
        UNKNOWN_CMD : "unknown cmd"
    },
    CONTRACT_CMD_LEN : 8
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

module.exports.ACCOUNT_DEFINE = {
    ID : {
        USER : 0,
        TOKEN : 1
    },
    STATUS : {
        LOGOUT : 0,
        LOGIN : 1
    },
    CONFIRM_BN_GAP : 3, 
    TO_PK_ALL_ZERO : "000000000000000000000000000000000000000000000000000000000000000000",
}

module.exports.FB_API_DEFINE = {
    NOT_FOUND : "Not Found",
    RESULT_CODE : {
        SUCCESS : 0,
        NOT_REGIST : 1001
    },
    HTTP_STATUS_CODE : {
        OK : 200,
        MULTIPLE_CHOICES : 300
    },
    RETRY : {
        THRESHOLD : 3,
        INTERVAL : 1000
    }
}

module.exports.CMD = {
    encoding: 'utf8'
}

module.exports.REGEX = {
    'NEW_LINE_REGEX': /\n+/,
    'WHITE_SPACE_REGEX': /\s/,
    'IP_ADDR_REGEX': /^(?!0)(?!.*\.$)((1?\d?\d|25[0-5]|2[0-4]\d)(\.|$)){4}$/,
    'HEX_STR_REGEX': /^[a-z0-9+]{5,65}$/
}