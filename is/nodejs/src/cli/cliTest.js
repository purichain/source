//
const Nodegeocoder = require('node-geocoder');
const geocoder = Nodegeocoder({provider: 'openstreetmap', language:'en'});
const fs = require('fs');

//
const cryptoUtil = require('./../sec/cryptoUtil.js');

//
const define = require('./../../config/define.js');
const config = require('./../../config/config.js');
//
const dbUtil = require('./../db/dbUtil.js');
const dbIS = require('./../db/dbIS.js');
const ctx = require('./../net/ctx.js');
const netUtil = require('./../net/netUtil.js');
const netConf = require('./../net/netConf.js');
const netSend = require('./../net/netSend.js');
const contract = require('./../contract/contract.js');
const kafkaUtil = require('./../net/kafkaUtil.js');
const util = require('./../utils/commonUtil.js');
const reg = require('./../reg/registration.js');
const repl = require('./../reg/replication.js');
const socket = require('./../net/socket.js');
const cliHandler = require('./../cli/cliHandler.js');
const logger = require('./../utils/winlog.js');

//
const C_DEFINE = define.CONTRACT_DEFINE;

//
module.exports.cliTestHandler = async (cmd, map) =>{
    let retVal = true;
    logger.debug("cmd : " + cmd);

    let cmdSplit = cmd.split(" ");

    if ((cmdSplit[0] === TEST_CMD.CONTRACT_01) || (cmdSplit[0] === TEST_CMD.CONTRACT_02))
    {
        let cmdStartLen = cmdSplit[0].length + 1;

        retVal = await this.cliTestContract(cmd.slice(cmdStartLen), map);
    }
    else
    {
        logger.error("Error - cliTestHandler cmd : " + cmd);
        retVal = false;
    }

    return retVal;
}

//
module.exports.cliTestContract = async (cmd, map) =>{
    let retVal = true;
    logger.debug("cmd : " + cmd);

    let cmdSplit = cmd.split(" ");

    if (cmd.slice(0, 8) === TEST_CMD.CONTRACT.ADD_USER)
    {
        let keyIdx = cmdSplit[2];

        let keyPath = getKeyPath(keyIdx);
        if (keyPath.pubkeyPath === undefined || keyPath.prikeyPath === undefined)
        {
            logger.error("Error - No Key Index");
            retVal = false;
            return retVal;
        }

        let tcAddUser = await cAddUser(keyIdx, keyPath.pubkeyPath, keyPath.prikeyPath);
        // let contractJson = JSON.stringify(tcAddUser);
        let contractJson = tcAddUser;

        await netSend.writeSome(map, define.CMD.contract_res, contractJson, dbIS.querys.node_cons_info.sca0_ip_info);
    }
    else if (cmd.slice(0, 12) === TEST_CMD.CONTRACT.CREATE_TOKEN)
    {
        if (cmdSplit.length !== 4)
        {
            logger.error("Error - CREATE_TOKEN cmdSplit.length : " + cmdSplit.length);
            retVal = false;
            return retVal;
        }

        let tokenNum = parseInt(cmdSplit[2]);
        let keyIdx = cmdSplit[3];

        let keyPath = getKeyPath(keyIdx);

        let tcCreateT = await cCreateToken(tokenNum, keyPath.pubkeyPath, keyPath.prikeyPath);
        // let contractJson = JSON.stringify(tcCreateT);
        let contractJson = tcCreateT;

        await netSend.writeSome(map, define.CMD.contract_res, contractJson, dbIS.querys.node_cons_info.sca0_ip_info);
    }
    else if (cmd.slice(0, 10) === TEST_CMD.CONTRACT.LOCK_TOKEN)
    {
        if (cmdSplit.length < 5)
        {
            logger.error("Error - LOCK_TOKEN cmdSplit.length : " + cmdSplit.length);
            retVal = false;
            return retVal;
        }

        let contractKind = cmdSplit[2];
        let tokenNum = parseInt(cmdSplit[3]);
        let keyIdx = cmdSplit[4];

        let keyPath = getKeyPath(keyIdx);

        let tcLockT;

        if (contractKind === 'tx')
        {
            if (cmdSplit.length !== 6)
            {
                logger.error("Error - LOCK_TOKEN TX cmdSplit.length : " + cmdSplit.length);
                retVal = false;
                return retVal;
            }

            let lockNum = parseInt(cmdSplit[5]);

            tcLockT = await cLockTokenTx(tokenNum, lockNum, keyPath.pubkeyPath, keyPath.prikeyPath);
        }
        else if (contractKind === 'time')
        {
            if (cmdSplit.length !== 7)
            {
                logger.error("Error - LOCK_TOKEN TIME cmdSplit.length : " + cmdSplit.length);
                retVal = false;
                return retVal;
            }

            let lockTimeFrom = cmdSplit[5];
            let lockTimeTo = cmdSplit[6];

            // 
            lockTimeFrom = util.getDateMS().toString();
            lockTimeTo = '0';

            tcLockT = await cLockTokenTime(tokenNum, lockTimeFrom, lockTimeTo, keyPath.pubkeyPath, keyPath.prikeyPath);
        }
        else if (contractKind === 'wallet')
        {
            if (cmdSplit.length !== 6)
            {
                logger.error("Error - LOCK_TOKEN TIME cmdSplit.length : " + cmdSplit.length);
                retVal = false;
                return retVal;
            }

            let pkList = cmdSplit[5];

            tcLockT = await cLockTokenWallet(tokenNum, pkList, keyPath.pubkeyPath, keyPath.prikeyPath);
        }
        else
        {
            logger.error("Error - No LOCK_TOKEN contractKind");
            retVal = false;
            return retVal;
        }

        let contractJson = tcLockT;
        logger.debug("contractJson : " + JSON.stringify(contractJson));

        await netSend.writeSome(map, define.CMD.contract_res, contractJson, dbIS.querys.node_cons_info.sca0_ip_info);
    }
    else if (cmd.slice(0, 8) === TEST_CMD.CONTRACT.TX_TOKEN)
    {
        if (cmdSplit.length !== 7)
        {
            logger.error("Error - TX_TOKEN cmdSplit.length : " + cmdSplit.length);
            retVal = false;
            return retVal;
        }

        let fromAccount = cmdSplit[2];
        let toAccount = cmdSplit[3];
        let tokenNum = parseInt(cmdSplit[4]);
        let keyIdx = cmdSplit[5];
        let amount = cmdSplit[6];
        // logger.debug("fromAccount : " + fromAccount + ", toAccount : " + toAccount);

        let fromAccountHexStr = BigInt(fromAccount).toString(16);
        let toAccountHexStr = BigInt(toAccount).toString(16);
        // logger.debug("fromAccountHexStr : " + fromAccountHexStr + ", toAccountHexStr : " + toAccountHexStr);

        let tcCreateT;

        let keyPath = getKeyPath(keyIdx);
        // if (keyPath.pubkeyPath === undefined || keyPath.prikeyPath === undefined)
        // {
        //     logger.error("Error - No Key Index");
        //     retVal = false;
        //     return retVal;
        // }

        tcCreateT = await cTxToken(fromAccountHexStr, toAccountHexStr, tokenNum, amount, keyPath.pubkeyPath, keyPath.prikeyPath);

        let contractJson = tcCreateT;
        logger.debug("contractJson : " + JSON.stringify(contractJson));

        await netSend.writeSome(map, define.CMD.contract_res, contractJson, dbIS.querys.node_cons_info.sca0_ip_info);
    }
    else
    {
        logger.error("Error - cliTestHandler cmd : " + cmd);
        retVal = false;
    }

    return retVal;
}

////////////////////////////////////////////////////////////////////////////////////////
// 
const TEST_CMD = {
    CONTRACT_01 : 'contract', 
    CONTRACT_02 : '-tc', 
    CONTRACT : {
        ADD_USER : 'add user',
        CREATE_TOKEN : 'create token',
        TX_TOKEN : 'tx token',
        LOCK_TOKEN : 'lock token',
    },
}

//
const getKeyPath = (idx) => {

    let pubkeyPath;
    let prikeyPath;

    if (idx === '01')
    {
        pubkeyPath = config.TEST_PATH.ED_01 + config.TEST_PATH.PUBKEY_NAME;
        prikeyPath = config.TEST_PATH.ED_01 + config.TEST_PATH.PRIKEY_NAME;
    }
    else if (idx === '02')
    {
        pubkeyPath = config.TEST_PATH.ED_02 + config.TEST_PATH.PUBKEY_NAME;
        prikeyPath = config.TEST_PATH.ED_02 + config.TEST_PATH.PRIKEY_NAME;
    }
    else if (idx === '03')
    {
        pubkeyPath = config.TEST_PATH.ED_03 + config.TEST_PATH.PUBKEY_NAME;
        prikeyPath = config.TEST_PATH.ED_03 + config.TEST_PATH.PRIKEY_NAME;
    }
    else if (idx === '04')
    {
        pubkeyPath = config.TEST_PATH.ED_04 + config.TEST_PATH.PUBKEY_NAME;
        prikeyPath = config.TEST_PATH.ED_04 + config.TEST_PATH.PRIKEY_NAME;
    }
    else
    {
        logger.debug ("Secury Token Key Path");
    }

    return {pubkeyPath : pubkeyPath, prikeyPath : prikeyPath};
}

const getTokenAccountNum = (tokenNum) => {
    let acc_1 = parseInt(define.CONTRACT_DEFINE.ACCOUNT_TOKEN_DELI).toString(16);
    let acc_2 = util.paddy(parseInt(tokenNum).toString(16), 15);

    account = acc_1 + acc_2;

    logger.debug("tokenNum : " + tokenNum + ", acc_1 : " + acc_1 + ",  acc_2 : " + acc_2 + ", account : " + account);

    return account;
}

////////////////////////////////////////////////////////////////////////////////////////
// 
const cAddUser = async (keyIdx, pubkeyPath, prikeyPath) => {
    logger.debug("func - cAddUser");

    //
    let netPubkey = C_DEFINE.ED_PUB_IDX + await cryptoUtil.getPubkey(pubkeyPath);
    logger.debug(netPubkey);

    //
    let contractJson = {
        create_tm : util.getDateMS().toString(),
        fintech : C_DEFINE.FINTECH.NON_FINANCIAL_TX,
        privacy : C_DEFINE.PRIVACY.PUBLIC,
        fee : C_DEFINE.FEE_DEFAULT,
        from_account : C_DEFINE.FROM_DEFAULT,
        to_account : C_DEFINE.TO_DEFAULT,
        type : C_DEFINE.KIND.ADD_USER,
        contents : {
            owner_pk : netPubkey,
            super_pk : netPubkey,
            account_id : keyIdx // + util.getRandomNumBuf(6).toString('hex')
        },
        memo : ""
    };

    //
    let sig = await cryptoUtil.genSign(JSON.parse(JSON.stringify(contractJson)), prikeyPath);
    contractJson.sig = sig;

    contractJson.signed_pubkey = netPubkey;

    return contractJson;
}

// 
const cCreateToken = async (tokenNum, pubkeyPath, prikeyPath) => {
    logger.debug("func - cCreateToken");

    //
    let netPubkey = C_DEFINE.ED_PUB_IDX + await cryptoUtil.getPubkey(pubkeyPath);
    logger.debug(netPubkey);

    //
    let contractJson = {
        create_tm : util.getDateMS().toString(),
        fintech : C_DEFINE.FINTECH.NON_FINANCIAL_TX,
        privacy : C_DEFINE.PRIVACY.PUBLIC,
        fee : C_DEFINE.FEE_DEFAULT,
        from_account : C_DEFINE.FROM_DEFAULT,
        to_account : C_DEFINE.TO_DEFAULT,
        type : C_DEFINE.KIND.TOKEN_CREATION,
        contents : {
            owner_pk : netPubkey,
            super_pk : netPubkey,
            type : tokenNum,
            name : "UTIL" + tokenNum.toString(),
            symbol : "f" + tokenNum.toString(),
            total_supply : "1000000000.0000",
            decimal_point : C_DEFINE.MAX_DECIMAL_POINT,
            lock_time_from : "0",
            lock_time_to : "0",
            lock_transfer : 0,
            black_list : "",
            functions : ""
        },
        memo : ""
    };

    //
    let sig = await cryptoUtil.genSign(JSON.parse(JSON.stringify(contractJson)), prikeyPath);
    contractJson.sig = sig;

    contractJson.signed_pubkey = netPubkey;

    return contractJson;
}

// 
const cLockTokenTx = async (tokenNum, lockNum, pubkeyPath, prikeyPath) => {
    logger.debug("func - cLockTokenTx");

    let tokenAccount = getTokenAccountNum(tokenNum);

    //
    let netPubkey = C_DEFINE.ED_PUB_IDX + await cryptoUtil.getPubkey(pubkeyPath);
    logger.debug(netPubkey);

    //
    let contractJson = {
        create_tm : util.getDateMS().toString(),
        fintech : C_DEFINE.FINTECH.NON_FINANCIAL_TX,
        privacy : C_DEFINE.PRIVACY.PUBLIC,
        fee : C_DEFINE.FEE_DEFAULT,
        from_account : tokenAccount,
        to_account : tokenAccount,
        type : C_DEFINE.KIND.LOCK_TOKEN_TX,
        contents : {
            type : tokenNum,
            lock : lockNum
        },
        memo : ""
    };

    //
    let sig = await cryptoUtil.genSign(JSON.parse(JSON.stringify(contractJson)), prikeyPath);
    contractJson.sig = sig;

    contractJson.signed_pubkey = netPubkey;

    return contractJson;
}

// 
const cLockTokenTime = async (tokenNum, lockTimeFrom, lockTimeTo, pubkeyPath, prikeyPath) => {
    logger.debug("func - cLockTokenTime");

    let tokenAccount = getTokenAccountNum(tokenNum);

    //
    let netPubkey = C_DEFINE.ED_PUB_IDX + await cryptoUtil.getPubkey(pubkeyPath);
    logger.debug(netPubkey);

    //
    let contractJson = {
        create_tm : util.getDateMS().toString(),
        fintech : C_DEFINE.FINTECH.NON_FINANCIAL_TX,
        privacy : C_DEFINE.PRIVACY.PUBLIC,
        fee : C_DEFINE.FEE_DEFAULT,
        from_account : tokenAccount,
        to_account : tokenAccount,
        type : C_DEFINE.KIND.LOCK_TOKEN_TIME,
        contents : {
            type : tokenNum,
            lock_time_from : lockTimeFrom,
            lock_time_to : lockTimeTo
        },
        memo : ""
    };

    //
    let sig = await cryptoUtil.genSign(JSON.parse(JSON.stringify(contractJson)), prikeyPath);
    contractJson.sig = sig;

    contractJson.signed_pubkey = netPubkey;

    return contractJson;
}

// 
const cLockTokenWallet = async (tokenNum, pkList, pubkeyPath, prikeyPath) => {
    logger.debug("func - cLockTokenWallet");

    let tokenAccount = getTokenAccountNum(tokenNum);

    //
    let netPubkey = C_DEFINE.ED_PUB_IDX + await cryptoUtil.getPubkey(pubkeyPath);
    logger.debug(netPubkey);

    //
    let contractJson = {
        create_tm : util.getDateMS().toString(),
        fintech : C_DEFINE.FINTECH.NON_FINANCIAL_TX,
        privacy : C_DEFINE.PRIVACY.PUBLIC,
        fee : C_DEFINE.FEE_DEFAULT,
        from_account : tokenAccount,
        to_account : tokenAccount,
        type : C_DEFINE.KIND.LOCK_TOKEN_TX,
        contents : {
            type : tokenNum,
            pk_list : pkList
        },
        memo : ""
    };

    //
    let sig = await cryptoUtil.genSign(JSON.parse(JSON.stringify(contractJson)), prikeyPath);
    contractJson.sig = sig;

    contractJson.signed_pubkey = netPubkey;

    return contractJson;
}

// 
const cTxToken = async (fromAccount, toAccount, tokenNum, amount, pubkeyPath, prikeyPath) => {
    logger.debug("func - cTxToken");
    
    //
    let netPubkey = C_DEFINE.ED_PUB_IDX + await cryptoUtil.getPubkey(pubkeyPath);
    logger.debug(netPubkey);

    //
    let contractJson;

    if (tokenNum === define.CONTRACT_KIND_JSON.SECURITY_TOKEN)
    {
        logger.debug("SECURITY_TOKEN");

        contractJson = {
            create_tm : util.getDateMS().toString(),
            fintech : C_DEFINE.FINTECH.FINANCIAL_TX,
            privacy : C_DEFINE.PRIVACY.PUBLIC,
            fee : C_DEFINE.FEE_DEFAULT,
            from_account : fromAccount,
            to_account : toAccount,
            type : tokenNum,
            contents : {
                amount : Number(amount).toString()
            },
            memo : ""
        };
    }
    else
    {
        logger.debug("UTILITY_TOKEN");

        let acc_1 = parseInt(C_DEFINE.ACCOUNT_TOKEN_DELI).toString(16);
        let acc_2 = util.paddy(parseInt(tokenNum).toString(16), 15);

        tokenAccount = acc_1 + acc_2;

        logger.debug("tokenNum : " + tokenNum + ", tokenAccount : " + tokenAccount);

        contractJson = {
            create_tm : util.getDateMS().toString(),
            fintech : C_DEFINE.FINTECH.FINANCIAL_TX,
            privacy : C_DEFINE.PRIVACY.PUBLIC,
            fee : C_DEFINE.FEE_DEFAULT,
            from_account : fromAccount,
            to_account : tokenAccount,
            type : tokenNum,
            contents : {
                to : toAccount,
                amount : Number(amount).toString()
            },
            memo : ""
        };
    }


    //
    let sig = await cryptoUtil.genSign(JSON.parse(JSON.stringify(contractJson)), prikeyPath);
    contractJson.sig = sig;

    contractJson.signed_pubkey = netPubkey;

    return contractJson;
}
