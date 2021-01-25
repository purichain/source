//
const { del } = require("request");

//
const cryptoSsl = require("./../../../../addon/crypto-ssl");

//
const config = require("./../../config/config.js");
const define = require("./../../config/define.js");
const cryptoUtil = require("./../sec/cryptoUtil.js");
const dbUtil = require("./../db/dbUtil.js");
const dbNN = require("./../db/dbNN.js");
const dbAct = require("./../db/dbAct.js");
const redis = require("../net/redisUtil.js");
const util = require("./../utils/commonUtil.js");
const kafkaUtil = require("./../net/kafkaUtil.js");
const myCluster = require("./../cluster.js");
const account_module = require("./account.js");
const token = require("./../contract/token.js");
const contractChecker = require("./../contract/contractChecker.js");
const ledger = require("./../contract/ledger.js");
const cliTest = require("./../cli/cliTest.js");
const logger = require("./../utils/winlog.js");
const debug = require("./../utils/debug.js");

let contractArray = new Array();
let txArray = new Array();
let secLedgerArray = new Array();
let utiLedgerArray = new Array();
let tokenArray = new Array();
let userArray = new Array();

let myDbKeyIndex;
let mySubNetId;

let myCurBN = 0;
let myGapBN = 0;
let myClusterNum = 0;

let contract_map = new Map();

module.exports.contractArray = contractArray;

module.exports.myDbKeyIndex = myDbKeyIndex; 

module.exports.getMySubNetId = () => {
    return mySubNetId;
}

module.exports.setMySubNetId = (subNetId) => {
    mySubNetId = subNetId;

    logger.info("mySubNetId : " + mySubNetId);
}

module.exports.getMyClusterNum = () => {
    return myClusterNum;
}

module.exports.setMyClusterNum = (clusterNum) => {
    myClusterNum = clusterNum;

    myGapBN = BigInt(myClusterNum * define.ACCOUNT_DEFINE.CONFIRM_BN_GAP);

    logger.info("myClusterNum : " + myClusterNum + ", myGapBN : " + myGapBN);
}

module.exports.getContractArray = () => {
    let tempArray = [...contractArray];
    return tempArray;
}

const getContractArrayLen = () => {
    return contractArray.length;
}

module.exports.getContractArrayLen = getContractArrayLen;

const setContractArray = async (array) => {
    contractArray = await contractArray.concat(array);
}

module.exports.setContractArray = setContractArray;

const pushContractArray = (data) => {
    contractArray.push(data);
}

module.exports.pushContractArray = pushContractArray;

const reinitContractArray = async () => {
    contractArray = new Array();
}

module.exports.reinitContractArray = reinitContractArray;

//
const getContractElement = async (fromAccount, pubkey) => {
    let already_exist = true;

    let retVal = contract_map.get(pubkey);
    if (retVal === undefined)
    {
        already_exist = false;
    }

    return already_exist;
}
module.exports.getContractElement = getContractElement;

const hasContractElement = async (fromAccount, pubkey) => {
    let already_exist;

    already_exist = contract_map.has(pubkey);

    return already_exist;
}
module.exports.hasContractElement = hasContractElement;

const setContractElement = async (fromAccount, pubkey, contractJson) => {
    let logined = false;

    // From IS
    if (pubkey === cryptoUtil.getISPubkey())
    {
        return logined;
    }

    // From Others
    logined = contract_map.set(pubkey, contractJson);

    return logined;
}
module.exports.setContractElement = setContractElement;

const delContractElement = async (pubkey) => {
    contract_map.delete(pubkey);
}
module.exports.delContractElement = delContractElement;

module.exports.logoutProcess = async (pubkeyArr) => {
    await util.asyncForEach(pubkeyArr, async (element, index) => {
        logger.debug("logout Process signed_pubkey[" + index + "] : " + element.signed_pubkey);
        await delContractElement(element.signed_pubkey);
    });
}

//
module.exports.setDBKeyIndex = async () => {
    this.myDbKeyIndex = cryptoUtil.genKeyIndex();
    let subNetId = cryptoUtil.getParsedSubNetId(this.myDbKeyIndex);
    this.setMySubNetId(subNetId);

    logger.info("Set Contract myDbKeyIndex : " + this.myDbKeyIndex + " & subNetId : " + subNetId);
}

module.exports.setClusterNum = () => {
     let clusterNum = cryptoUtil.getNnaNum();

     this.setMyClusterNum(clusterNum);
}

// CreateTransaction from WalletContract
// Pass to NNA
module.exports.createTx = async (data) => {
    if(!util.isJsonString(data))
    {
        logger.error("createTx - CONTRACT_ERROR_JSON.JSON_FORMAT");
        return config.CONTRACT_ERROR_JSON.JSON_FORMAT;
    }

    var contractJson = JSON.parse(data);

    logger.debug("CREATE_TM : " + contractJson.hasOwnProperty(define.CONTRACT_DEFINE.CONTRACT_PROPERTY.CREATE_TM));
    logger.debug("FINTECH : " + contractJson.hasOwnProperty(define.CONTRACT_DEFINE.CONTRACT_PROPERTY.FINTECH));
    logger.debug("PRIVACY : " + contractJson.hasOwnProperty(define.CONTRACT_DEFINE.CONTRACT_PROPERTY.PRIVACY));
    logger.debug("FEE : " + contractJson.hasOwnProperty(define.CONTRACT_DEFINE.CONTRACT_PROPERTY.FEE));
    logger.debug("FROM_ACCOUNT : " + contractJson.hasOwnProperty(define.CONTRACT_DEFINE.CONTRACT_PROPERTY.FROM_ACCOUNT));
    logger.debug("TO_ACCOUNT : " + contractJson.hasOwnProperty(define.CONTRACT_DEFINE.CONTRACT_PROPERTY.TO_ACCOUNT));
    logger.debug("TYPE : " + contractJson.hasOwnProperty(define.CONTRACT_DEFINE.CONTRACT_PROPERTY.TYPE));
    logger.debug("CONTENTS : " + contractJson.hasOwnProperty(define.CONTRACT_DEFINE.CONTRACT_PROPERTY.CONTENTS));
    logger.debug("SIG : " + contractJson.hasOwnProperty(define.CONTRACT_DEFINE.CONTRACT_PROPERTY.SIG));
    logger.debug("SIGNED_PUPKEY : " + contractJson.hasOwnProperty(define.CONTRACT_DEFINE.CONTRACT_PROPERTY.SIGNED_PUPKEY));

    // check Contract Form
    if(!(contractJson.hasOwnProperty(define.CONTRACT_DEFINE.CONTRACT_PROPERTY.CREATE_TM)
        && contractJson.hasOwnProperty(define.CONTRACT_DEFINE.CONTRACT_PROPERTY.FINTECH)
        && contractJson.hasOwnProperty(define.CONTRACT_DEFINE.CONTRACT_PROPERTY.PRIVACY)
        && contractJson.hasOwnProperty(define.CONTRACT_DEFINE.CONTRACT_PROPERTY.FEE)
        && contractJson.hasOwnProperty(define.CONTRACT_DEFINE.CONTRACT_PROPERTY.FROM_ACCOUNT)
        && contractJson.hasOwnProperty(define.CONTRACT_DEFINE.CONTRACT_PROPERTY.TO_ACCOUNT)
        && contractJson.hasOwnProperty(define.CONTRACT_DEFINE.CONTRACT_PROPERTY.TYPE)
        && contractJson.hasOwnProperty(define.CONTRACT_DEFINE.CONTRACT_PROPERTY.CONTENTS)
        && contractJson.hasOwnProperty(define.CONTRACT_DEFINE.CONTRACT_PROPERTY.SIG)
        && contractJson.hasOwnProperty(define.CONTRACT_DEFINE.CONTRACT_PROPERTY.SIGNED_PUPKEY)))
    {
        logger.error("createTx - CONTRACT_ERROR_JSON.CONTRACT_FORM");
        return config.CONTRACT_ERROR_JSON.CONTRACT_FORM;
    }

    // let already_exist = await hasContractElement(contractJson.from_account, contractJson.signed_pubkey);
    // if (already_exist)
    // {
    //     logger.error("createTx - CONTRACT_ERROR_JSON.ALREADY_LOGIN");
    //     return config.CONTRACT_ERROR_JSON.ALREADY_LOGIN;    
    // }

    // await setContractElement(contractJson.from_account, contractJson.signed_pubkey, contractJson);

    let contract_error_code = config.CONTRACT_ERROR_JSON.VALID;
    
    do
    {
        // Signature Verify Valid
        if (config.CONTRACT_TEST_MODE === false)
        {
            var verifyResult = false;

            // Verifying Signature
            verifyResult = cryptoUtil.verifySign(contractJson.signed_pubkey, contractJson);
            logger.debug("createTx - verifyResult : " + verifyResult);

            if (verifyResult === false)
            {
                logger.error("Signature Is Invalid(Verify failed)");
                contract_error_code = config.CONTRACT_ERROR_JSON.SIGNATURE;

                break;
            } 
        }

        // Contract Checker
        let retVal = await contractChecker.chkContract(contractJson);
        if (retVal === define.ERR_CODE.ERROR)
        {
            logger.error("createTx - CONTRACT_ERROR_JSON.CONTENT_FORM");
            contract_error_code = config.CONTRACT_ERROR_JSON.CONTENT_FORM;

            break;
        }

        // check if from PublicKey is IndexServer's Public Key
        let is_Index_Server = false;
        if(contractJson.signed_pubkey === cryptoUtil.getISPubkey())
        {
            is_Index_Server = true;
            logger.debug("Signed Pubkey of Contract is the IS Public Key.");
        }
        
        // check contract create time
        if (Number(contractJson.create_tm) <= util.getDateMS())
        {
            logger.debug("contractArray.push : " + JSON.stringify(contractJson));
            contractArray.push({errCode : contract_error_code["ERROR_CODE"], jsonData : JSON.stringify(contractJson)});
        }
        else
        {
            logger.debug("contractArray.push : " + JSON.stringify(contractJson));
            await dbAct.insertScDelayedTxsV(contractJson);
        }
    } while(0);

    // if(contract_error_code !== config.CONTRACT_ERROR_JSON.VALID)
    // {
    //     await delContractElement(contractJson.signed_pubkey);
    // }

    return contract_error_code;
}

//
module.exports.sendTxArrToDB = async () => {
    try {
        // logger.debug("contractArray : " + util.isArray(contractArray) + ", len : " +  contractArray.length);
        if(util.isArray(contractArray) && contractArray.length)
        {
            // 
            let transferArray;
            if(parseInt(contractArray.length) >= define.CONTRACT_DEFINE.MAX_TX_CNT)
            {
                // TxCnt >= Maximum Tx Cnt per communication
                transferArray = contractArray.slice(0, define.CONTRACT_DEFINE.MAX_TX_CNT);
                contractArray = contractArray.slice(define.CONTRACT_DEFINE.MAX_TX_CNT, contractArray.length);
            }
            else
            {
                // TxCnt < Maximum Tx Cnt per communication 
                transferArray = [...contractArray];
                await reinitContractArray();
            }

            // logger.debug("sendTxArrToDB getConn STT " + util.getDateMS());

            // insert sc.sc_contents
            let scArray = new Array();
            let insertScContentsQuery = dbNN.querys.sc.insertScContents;

            await util.asyncForEach(transferArray, async (element, index) => {
                let contractJson = JSON.parse(element['jsonData']);
                let from_account = contractJson.from_account;

                // let already_exist = await hasContractElement(contractJson.from_account, contractJson.signed_pubkey);
                // logger.debug ("getVal mid : " + already_exist);
                //
                scArray.push(element);

                //insertScContentsQuery += `(${mySubNetId}, '${JSON.stringify(element['jsonData'])}'),`;
                insertScContentsQuery += `(${mySubNetId}, `; // subnet_id
                insertScContentsQuery += `${BigInt(util.hexStrToBigInt(contractJson.create_tm))}, `; // create_tm
                insertScContentsQuery += `0, `; // confirmed
                insertScContentsQuery += `${BigInt(util.hexStrToBigInt(from_account))}, `; // from_account
                insertScContentsQuery += `${BigInt(util.hexStrToBigInt(contractJson.to_account))}, `; // to_account
                // insertScContentsQuery += `'${from_account}', `; // from_account
                // insertScContentsQuery += `'${contractJson.to_account}', `; // to_account
                insertScContentsQuery += `${contractJson.type}, `; // type
                insertScContentsQuery += `'0', `; // amount
                insertScContentsQuery += `'${contractJson.signed_pubkey}', `; // signed_pubkey
                insertScContentsQuery += ` ${element['errCode']}, `; // err_code
                insertScContentsQuery += `'${JSON.stringify(element['jsonData'])}'),`;
            });

            // Error Case
            if(!scArray.length)
            {
                logger.err("Error - No Contract");
                txArray = new Array();
                return;
            }

            const connSC = await dbUtil.getConn();
            // await dbUtil.exeQuery(connSC, dbNN.querys.sc.useSC);

            insertScContentsQuery = insertScContentsQuery.substr(0, insertScContentsQuery.length - 1);
            // logger.debug("insertScContentsQuery : " + insertScContentsQuery);

            [query_result] = await dbUtil.exeQuery(connSC, insertScContentsQuery);
            await dbUtil.releaseConn(connSC);

            // insert block.blk_txs
            // logger.debug("sendTxArrToDB affectedRows : " + query_result.affectedRows);
            for(var i = 0; i < query_result.affectedRows; i++)
            {
                let contractJson = JSON.parse(scArray[i]['jsonData']);

                if (scArray[i]['errCode'] === config.CONTRACT_ERROR_JSON.VALID['ERROR_CODE']) // Remove?
                {
                    await setContractElement(contractJson.from_account, contractJson.signed_pubkey, contractJson);
                    
                    var db_key = (BigInt(query_result.insertId) + BigInt(i)).toString();
                    // logger.debug(db_key);
                    // block.blk_txs
                    // logger.debug(scArray[i]['jsonData']);
                    txArray.push({ db_key : db_key, sc_hash : cryptoSsl.genSha256Str(db_key + scArray[i]['jsonData']) });

                    // account.account_ledegers
                    if (contractJson.type <= define.CONTRACT_DEFINE.KIND.SECURITY_TOKEN)
                    {
                        // secLedgerArray
                        secLedgerArray.push({ db_key : db_key, contractJson : contractJson });
                    }
                    else if (contractJson.type <= define.CONTRACT_DEFINE.KIND.UTILITY_TOKEN)
                    {
                        //  utiLedgerArray
                        utiLedgerArray.push({ db_key : db_key, contractJson : contractJson });
                    }
                    // account.account_tokens
                    if (contractJson.type === define.CONTRACT_DEFINE.KIND.TOKEN_CREATION)
                    {
                        // tokenArray
                        tokenArray.push({ db_key : db_key, contractJson : contractJson });
                    }
                    else if (contractJson.type === define.CONTRACT_DEFINE.KIND.EXE_FUNC)
                    {
                        // 
                    }
                    else if (contractJson.type === define.CONTRACT_DEFINE.KIND.CHANG_TOKEN_OWNER)
                    {
                        // 
                    }
                    else if (contractJson.type === define.CONTRACT_DEFINE.KIND.LOCK_TOKEN_TX)
                    {
                        // 
                        let tokenAccont = await dbAct.accountTokenCheck(contractJson.contents.type);

                        let newContractJson = JSON.parse(token.updateLockTokenTxContract(contractJson, tokenAccont[0]));

                        // tokenArray
                        tokenArray.push({ db_key : db_key, contractJson : newContractJson });
                    }
                    else if (contractJson.type === define.CONTRACT_DEFINE.KIND.LOCK_TOKEN_TIME)
                    {
                        // 
                        let tokenAccont = await dbAct.accountTokenCheck(contractJson.contents.type);

                        let newContractJson = JSON.parse(token.updateLockTokenTimeContract(contractJson, tokenAccont[0]));

                        // tokenArray
                        tokenArray.push({ db_key : db_key, contractJson : newContractJson });
                    }
                    else if (contractJson.type === define.CONTRACT_DEFINE.KIND.LOCK_TOKEN_WALLET)
                    {
                        // 
                        let tokenAccont = await dbAct.accountTokenCheck(contractJson.contents.type);

                        let newContractJson = JSON.parse(token.updateLockTokenWalletContract(contractJson, tokenAccont[0]));

                        // tokenArray
                        tokenArray.push({ db_key : db_key, contractJson : newContractJson });
                    }
                    
                    // account.account_users
                    if (contractJson.type === define.CONTRACT_DEFINE.KIND.ADD_USER)
                    {
                        // userArray
                        userArray.push({ db_key : db_key, contractJson : contractJson });
                    }
                }
                // else
                // {
                //     await delContractElement(contractJson.signed_pubkey);
                // }
            }

            // Insert into block.blk_txs;
            if (txArray.length)
            {
                await dbAct.insertBlkTxsV(txArray);

                txArray = new Array();
            }

            if (secLedgerArray.length)
            {
                await dbAct.insertAccountSecLedger(secLedgerArray);

                secLedgerArray = new Array();
            }

            if (utiLedgerArray.length)
            {
                await dbAct.insertAccountUtilLedger(utiLedgerArray);

                utiLedgerArray = new Array();
            }

            if (tokenArray.length)
            {
                await dbAct.insertAccountTokensV(tokenArray);

                tokenArray = new Array();
            }

            if (userArray.length)
            {
                await dbAct.insertAccountUsersV(userArray);

                userArray = new Array();
            }

            if (contractArray.length)
            {
                myCluster.sendNullTxsToMaster();
            }
            // logger.debug("sendTxArrToDB getConn END " + util.getDateMS());
        } 
    } catch (err) {
        debug.error(err);
        logger.error("Contract.js sendTxArrToDB Func");
    }
}

//
module.exports.getBNFromRcvdBlkNoti = (blkNoti) => {
    let pos = 0;

    let BN = blkNoti.toString().substr(pos, define.REDIS_DEFINE.BLK_NOTI_LEN.HEX_STR_BN_LEN);
    BN = BigInt("0x" + BN).toString();
    pos += define.REDIS_DEFINE.BLK_NOTI_LEN.HEX_STR_BN_LEN;
    // logger.debug("BN : " + BN);

    myCurBN = BN;

    return BN;
}

module.exports.updateAccountBalanceSubNet = async () => {
    let maxBN = BigInt(myCurBN) - BigInt(myGapBN);

    // logger.debug("func - updateAccountBalanceSubNet");
    // logger.debug("myCurBN : " + myCurBN + ", myGapBN : " + myGapBN + ", maxBN : " + maxBN);

    if (maxBN > 0)
    {
        await ledger.updateAccountBalanceSubNetIdV(maxBN, mySubNetId);
    }
}

//
module.exports.rcvdBlkNotiFromNNA = async (blkNoti) => {
    logger.info("[rcvdBlkNotiFromNNA] -> (" + blkNoti.toString() + ")");

    let BN = this.getBNFromRcvdBlkNoti(blkNoti);

    //
    // logger.debug("rcvdBlkNotiFromNNA getConn STT " + util.getDateMS());
    let dbKey = await dbAct.selectDbKeyFromBlkTxs(BN);
    // logger.debug("rcvdBlkNotiFromNNA getConn END " + util.getDateMS());

    if (dbKey.length)
    {
        let minDbKey = dbKey[0];
        let maxDbKey = dbKey[1];
        logger.info("minDbKey : " + minDbKey + ", maxDbKey : " + maxDbKey);

        //
        await dbAct.updateScContentsWhereDbKey(minDbKey, maxDbKey, BN);
        await dbAct.updateAccountsBlkNumWhereDbKey(minDbKey, maxDbKey, BN);

        //


        //
        let query_result = await dbAct.selectFromScContentsWithDbKey(minDbKey, maxDbKey);

        let pubkeyArr = new Array();
        for(var idx =0 ; idx < query_result.length ; idx++)
        {
            let signed_pubkey = query_result[idx].signed_pubkey;
            logger.debug("query_result[" + idx + "].signed_pubkey :" + signed_pubkey);

            if (signed_pubkey !== cryptoUtil.getISPubkey())
            {
                pubkeyArr.push({signed_pubkey : signed_pubkey});
            }
        }

        if (pubkeyArr.length)
        {
            myCluster.sendContractElementToMaster(pubkeyArr);
        }
    }

    //
    await this.updateAccountBalanceSubNet();
}
