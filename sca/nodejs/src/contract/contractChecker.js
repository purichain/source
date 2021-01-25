//
const { del } = require("request");

//
const config = require("./../../config/config.js");
const define = require("./../../config/define.js");
const dbUtil = require("./../db/dbUtil.js");
const dbAct = require("./../db/dbAct.js");
const redis = require("../net/redisUtil.js");
const util = require("./../utils/commonUtil.js");
const kafkaUtil = require("./../net/kafkaUtil.js");
const debug = require("./../utils/debug.js");
const myCluster = require("./../cluster.js");
const account_module = require("./../contract/account.js");
const contractUtil = require("./../contract/contractUtil.js");
const cliTest = require("./../cli/cliTest.js");
const logger = require("./../utils/winlog.js");
///////////////////////////////////////////////////////////////////////////////////////////
// 
const chkAccountDelimiter = (accountHexStr) => {
    logger.debug("chkAccountDelimiter");
    logger.debug("account : " + accountHexStr);

    let accountDeil = parseInt(accountHexStr.slice(0,1));
    logger.debug("accountDeil : " + accountDeil);

    return (accountDeil);
}
module.exports.chkAccountDelimiter = chkAccountDelimiter;

// 
const chkTxTokenContract = async(contractJson) => {
    let retVal = define.ERR_CODE.ERROR;

    // Check User Account
    let fromAccount = util.hexStrToBigInt(contractJson.from_account);
    let toAccount = util.hexStrToBigInt(contractJson.to_account);
    
    if (fromAccount === 0 || toAccount === 0)
    {
        logger.error("chkTxTokenContract - Account");
        return retVal;
    }

    // Check To Account whether it is token account or NOT
    if(chkAccountDelimiter(contractJson.to_account) === define.CONTRACT_DEFINE.ACCOUNT_TOKEN_DELI)
    {
        if (contractJson.to_account === define.CONTRACT_DEFINE.SEC_TOKEN_ACCOUNT)
        {
            logger.error("chkTxTokenContract - toAccount : ACCOUNT_TOKEN_DELI");
            return retVal;
        }
    }
    else if(fromAccount === toAccount) // Check To Account whether it is token account or NOT
    {
        logger.error("chkTxTokenContract - toAccount & fromAccount");
        return retVal;
    }

    // Check Token Account
    let tokenAccount = await dbAct.accountTokenCheck(contractJson.type);
    if (tokenAccount.length === 0)
    {
        logger.error("chkTxTokenContract - account_token type");
        return retVal;
    }

    //
    if (tokenAccount[0].blk_num === 0)
    {
        logger.error("chkTxTokenContract - account_token blk_num");
        return retVal;
    }

    // lock_transfer
    if (tokenAccount[0].lock_transfer === define.CONTRACT_DEFINE.LOCK_TOKEN_TX.LOCK_ALL)
    {
        logger.error("chkTxTokenContract - account_token lock_transfer ALL");
        return retVal;
    }
    else if (tokenAccount[0].lock_transfer === define.CONTRACT_DEFINE.LOCK_TOKEN_TX.LOCK_EXC_OWNER)
    {
        if (contractJson.signed_pubkey !== tokenAccount.owner_pk)
        {
            logger.error("chkTxTokenContract - account_token lock_transfer EXCLUDING OWNER");
            return retVal;
        }
    }

    // lock_time
    let curTime = util.getDateMS();
    if ((tokenAccount[0].lock_time_from !== define.CONTRACT_DEFINE.LOCK_TOKEN_TIME.UNLOCK)
        && (tokenAccount[0].lock_time_to !== define.CONTRACT_DEFINE.LOCK_TOKEN_TIME.UNLOCK))
    {
        if (tokenAccount[0].lock_time_from <= curTime && curTime <= tokenAccount[0].lock_time_to)
        {
            logger.error("chkTxTokenContract - account_token lock_time ALL");
            return retVal;
        }
    }
    else if (tokenAccount[0].lock_time_from !== define.CONTRACT_DEFINE.LOCK_TOKEN_TIME.UNLOCK)
    {
        if (tokenAccount[0].lock_time_from <= curTime)
        {
            logger.error("chkTxTokenContract - account_token lock_time FROM");
            return retVal;
        }
    }
    else if (tokenAccount[0].lock_time_to !== define.CONTRACT_DEFINE.LOCK_TOKEN_TIME.UNLOCK)
    {
        if (curTime <= tokenAccount[0].lock_time_to)
        {
            logger.error("chkTxTokenContract - account_token lock_time TO");
            return retVal;
        }
    }

    // black_list
    // TODO

    // Check Decimal Point
    let splitAmount = contractUtil.chkDecimalPoint(contractJson.contents.amount);
    if ((splitAmount.length !== 2) || (splitAmount[1].length !== tokenAccount[0].decimal_point))
    {is 
        logger.error("chkTxTokenContract - amount");
        return retVal;
    }

    // Check From Account
    let fAccount;
    let fAccountDeli = chkAccountDelimiter(contractJson.from_account);
    if(fAccountDeli === define.CONTRACT_DEFINE.ACCOUNT_TOKEN_DELI)
    {
        fAccount = await dbAct.accountTokenAccountCheck(fromAccount);
    }
    else if(fAccountDeli <= define.CONTRACT_DEFINE.ACCOUNT_USER_DELI_MAX)
    {
        fAccount = await dbAct.accountUserAccountCheck(fromAccount);
    }
    else
    {
        logger.error("chkTxTokenContract - fromAccount : No Account");
        return retVal;
    }

    if(fAccount.length)
    {
        let fa_owner_pk = fAccount[0].owner_pk;
        //
        if (contractJson.signed_pubkey !== fa_owner_pk)
        {
            logger.debug ("contractJson.signed_pubkey : " + contractJson.signed_pubkey);
            logger.debug ("fa_owner_pk : " + fa_owner_pk);
            logger.error("chkTxTokenContract - signed_pubkey");
            return retVal;
        }

        //
        logger.debug ("contractJson.from_account : " + contractJson.from_account + ", SEC_TOKEN_ACCOUNT : " + define.CONTRACT_DEFINE.SEC_TOKEN_ACCOUNT);
        if (contractJson.from_account === define.CONTRACT_DEFINE.SEC_TOKEN_ACCOUNT)
        {
            logger.debug ("SECURITY TOKEN DISTRIBUTTED");
        }
        else
        {
            let accountLeger = await dbAct.accountLegerCheck(fromAccount, contractJson.type);
            if (accountLeger.length === 0)
            {
                logger.error("chkTxTokenContract - account_ledger");
                return retVal;
            }
            else if (accountLeger[0].blk_num === 0)
            {
                logger.error("chkTxTokenContract - account_ledger blk_num");
                return retVal;
            }
    
            let balVal = contractUtil.balNum(accountLeger.balance, contractJson.contents.amount, tokenAccount[0].decimal_point);
            if (balVal === false)
            {
                logger.error("chkTxTokenContract - balance");
                return retVal;
            }
        }
    }
    else
    {
        logger.error("chkTxTokenContract - fromAccount");
        return retVal;
    }

    // Check To Account
    let tAccount;
    let tAccountDeli = chkAccountDelimiter(contractJson.to_account);
    if(tAccountDeli === define.CONTRACT_DEFINE.ACCOUNT_TOKEN_DELI)
    {
        tAccount = await dbAct.accountTokenAccountCheck(toAccount);
    }
    else if(tAccountDeli <= define.CONTRACT_DEFINE.ACCOUNT_USER_DELI_MAX)
    {
        if (contractJson.type !== define.CONTRACT_DEFINE.KIND.SECURITY_TOKEN)
        {
            logger.error("chkTxTokenContract - toAccount : type");
            return retVal;
        }

        tAccount = await dbAct.accountUserAccountCheck(toAccount);
    }
    else
    {
        logger.error("chkTxTokenContract - toAccount : No Account 1");
        return retVal;
    }

    if(tAccount.length === 0)
    {
        logger.error("chkTxTokenContract - toAccount : No Account 2");
        return define.ERR_CODE.ERROR;
    }

    retVal = define.ERR_CODE.SUCCESS;

    return retVal;
}

//
const chkTxSecTokenContract = async(contractJson) => {
    let retVal = define.ERR_CODE.ERROR;

    //
    if (!(contractJson.contents.hasOwnProperty(define.CONTRACT_DEFINE.CONTENTS_PROPERTY.TX_ST.AMOUNT)))
    {
        logger.error("chkTxSecTokenContract - Contents");
        return retVal;
    }

    retVal = await chkTxTokenContract(contractJson);
    if (retVal !== define.ERR_CODE.SUCCESS)
    {
        return retVal;
    }

    return define.ERR_CODE.SUCCESS;
}

const chkTxUtilTokenContract = async(contractJson) => {
    let retVal = define.ERR_CODE.ERROR;

    //
    if (!(contractJson.contents.hasOwnProperty(define.CONTRACT_DEFINE.CONTENTS_PROPERTY.TX_UT.TO)
        && contractJson.contents.hasOwnProperty(define.CONTRACT_DEFINE.CONTENTS_PROPERTY.TX_UT.AMOUNT)))
    {
        logger.error("chkTxUtilTokenContract - Contents");
        return retVal;
    }

    retVal = await chkTxTokenContract(contractJson);
    if (retVal !== define.ERR_CODE.SUCCESS)
    {
        return retVal;
    }

    return define.ERR_CODE.SUCCESS;
}

const chkCreateTokenContract = async(contractJson) => {
    let fromAccount = util.hexStrToBigInt(contractJson.from_account);
    let toAccount = util.hexStrToBigInt(contractJson.to_account);

    //
    if (fromAccount || toAccount)
    {
        logger.error("chkCreateTokenContract - Account");
        return define.ERR_CODE.ERROR;
    }

    //
    if (!(contractJson.contents.hasOwnProperty(define.CONTRACT_DEFINE.CONTENTS_PROPERTY.CREATE_TOKEN.OWNER_PK)
        && contractJson.contents.hasOwnProperty(define.CONTRACT_DEFINE.CONTENTS_PROPERTY.CREATE_TOKEN.SUPER_PK)
        && contractJson.contents.hasOwnProperty(define.CONTRACT_DEFINE.CONTENTS_PROPERTY.CREATE_TOKEN.TYPE)
        && contractJson.contents.hasOwnProperty(define.CONTRACT_DEFINE.CONTENTS_PROPERTY.CREATE_TOKEN.NAME)
        && contractJson.contents.hasOwnProperty(define.CONTRACT_DEFINE.CONTENTS_PROPERTY.CREATE_TOKEN.SYMBOL)
        && contractJson.contents.hasOwnProperty(define.CONTRACT_DEFINE.CONTENTS_PROPERTY.CREATE_TOKEN.TOTAL_SUPPLY)
        && contractJson.contents.hasOwnProperty(define.CONTRACT_DEFINE.CONTENTS_PROPERTY.CREATE_TOKEN.DECIMAL_POINT)
        && contractJson.contents.hasOwnProperty(define.CONTRACT_DEFINE.CONTENTS_PROPERTY.CREATE_TOKEN.LOCK_TIME_FROM)
        && contractJson.contents.hasOwnProperty(define.CONTRACT_DEFINE.CONTENTS_PROPERTY.CREATE_TOKEN.LOCK_TIME_TO)
        && contractJson.contents.hasOwnProperty(define.CONTRACT_DEFINE.CONTENTS_PROPERTY.CREATE_TOKEN.LOCK_TRANSFER)
        && contractJson.contents.hasOwnProperty(define.CONTRACT_DEFINE.CONTENTS_PROPERTY.CREATE_TOKEN.BLACK_LIST)
        && contractJson.contents.hasOwnProperty(define.CONTRACT_DEFINE.CONTENTS_PROPERTY.CREATE_TOKEN.FUNC)))
    {
        logger.error("chkAddUserContract - Contents");
        return define.ERR_CODE.ERROR;
    }

    //
    let totalSupply = contractJson.contents.total_supply;
    let decimalPoint = contractJson.contents.decimal_point;

    //
    if ((decimalPoint <= 0) || (decimalPoint > define.CONTRACT_DEFINE.MAX_DECIMAL_POINT))
    {
        logger.error("chkAddUserContract - decimalPoint");
        return define.ERR_CODE.ERROR;
    }
    
    //
    let splitTotalSupply = contractUtil.chkDecimalPoint(totalSupply);
    if ((splitTotalSupply.length !== 2) || (splitTotalSupply[1].length !== decimalPoint))
    {
        logger.error("chkAddUserContract - totalSupply");
        return define.ERR_CODE.ERROR;
    }

    //
    let ownerPk = contractJson.contents.owner_pk;
    let superPk = contractJson.contents.super_pk;

    // Check token account
    let tokenAccount = await dbAct.accountTokenCheck(contractJson.contents.type, contractJson.contents.name, contractJson.contents.symbol);
    let tokenAccountKey =await dbAct.accountTokenKeyCheck(ownerPk, superPk);

    if (tokenAccount.length || tokenAccountKey.length)
    {
        logger.error("chkCreateTokenContract - Already Existed");
        return define.ERR_CODE.ERROR;
    }

    return define.ERR_CODE.SUCCESS;
}

//
const chkLockTokenContract = async(contractJson) => {
    // Check user and token account
    let tokenAccount = await dbAct.accountTokenCheck(contractJson.contents.type);
    if (tokenAccount.length === 0)
    {
        logger.error("chkLockTokenContract - No Token Account");
        return define.ERR_CODE.ERROR;
    }

    //
    let signedPubkey = contractJson.signed_pubkey;

    if (signedPubkey !== tokenAccount[0].owner_pk)
    {
        logger.error("chkLockTokenContract - Signed Pubkey");
        return define.ERR_CODE.ERROR;
    }

    //
    let fromAccount = BigInt(util.hexStrToBigInt(contractJson.from_account));
    let toAccount = BigInt(util.hexStrToBigInt(contractJson.to_account));
    let tokenAccountNum = BigInt(tokenAccount[0].account_num);

    if ((fromAccount !== tokenAccountNum) || (toAccount !== tokenAccountNum))
    {
        logger.error("chkLockTokenContract - fromAccount || toAccount");
        logger.error("fromAccount : " + fromAccount + ", toAccount : " + toAccount + ", account_num : " + tokenAccountNum);
        return define.ERR_CODE.ERROR;
    }

    return define.ERR_CODE.SUCCESS;
}

//
const chkLockTokenTxContract = async(contractJson) => {
    let retVal;
    
    if (!(contractJson.contents.hasOwnProperty(define.CONTRACT_DEFINE.CONTENTS_PROPERTY.LOCK_TOKEN_TX.TYPE)
        && contractJson.contents.hasOwnProperty(define.CONTRACT_DEFINE.CONTENTS_PROPERTY.LOCK_TOKEN_TX.LOCK)))
    {
        logger.error("chkLockTokenTxContract - Contents");
        return define.ERR_CODE.ERROR;
    }

    //
    if ((contractJson.contents.lock < define.CONTRACT_DEFINE.LOCK_TOKEN_TX.UNLOCK) 
        || (contractJson.contents.lock > define.CONTRACT_DEFINE.LOCK_TOKEN_TX.LOCK_EXC_OWNER))
    {
        logger.error("chkLockTokenTxContract - lock");
        return define.ERR_CODE.ERROR;
    }

    retVal = await chkLockTokenContract(contractJson);

    return retVal;
}

//
const chkLockTokenTimeContract = async(contractJson) => {
    let retVal;
    
    if (!(contractJson.contents.hasOwnProperty(define.CONTRACT_DEFINE.CONTENTS_PROPERTY.LOCK_TOKEN_TIME.TYPE)
        && contractJson.contents.hasOwnProperty(define.CONTRACT_DEFINE.CONTENTS_PROPERTY.LOCK_TOKEN_TIME.LOCK_TIME_FROM)
        && contractJson.contents.hasOwnProperty(define.CONTRACT_DEFINE.CONTENTS_PROPERTY.LOCK_TOKEN_TIME.LOCK_TIME_TO)))
    {
        logger.error("chkLockTokenTimeContract - Contents");
        return define.ERR_CODE.ERROR;
    }

    //
    let curTm = new util.getDateMS();
    if (contractJson.contents.lock_time_from !== define.CONTRACT_DEFINE.LOCK_TOKEN_TIME.UNLOCK)
    {
        if (contractJson.contents.lock_time_from <= curTm)
        {
            logger.error("chkLockTokenTxContract - lock_time_from");
            return define.ERR_CODE.ERROR;
        }

        if (contractJson.contents.lock_time_to !== define.CONTRACT_DEFINE.LOCK_TOKEN_TIME.UNLOCK)
        {
            if (contractJson.contents.lock_time_from >= contractJson.contents.lock_time_to)
            {
                logger.error("chkLockTokenTxContract - lock_time_from >= lock_time_to");
                return define.ERR_CODE.ERROR;
            }
        }
    }

    if (contractJson.contents.lock_time_to !== define.CONTRACT_DEFINE.LOCK_TOKEN_TIME.UNLOCK)
    {
        if (contractJson.contents.lock_time_to <= curTm)
        {
            logger.error("chkLockTokenTxContract - lock_time_to");
            return define.ERR_CODE.ERROR;
        }
    }

    retVal = await chkLockTokenContract(contractJson);

    return retVal;
}

//
const chkLockTokenWalletContract = async(contractJson) => {
    let retVal;
    
    if (!(contractJson.contents.hasOwnProperty(define.CONTRACT_DEFINE.CONTENTS_PROPERTY.LOCK_TOKEN_WALLET.TYPE)
        && contractJson.contents.hasOwnProperty(define.CONTRACT_DEFINE.CONTENTS_PROPERTY.LOCK_TOKEN_WALLET.PK_LIST)))
    {
        logger.error("chkLockTokenWalletContract - Contents");
        return define.ERR_CODE.ERROR;
    }

    retVal = await chkLockTokenContract(contractJson);

    return retVal;
}

//
const chkAddUserContract = async(contractJson) => {
    let fromAccount = util.hexStrToBigInt(contractJson.from_account);
    let toAccount = util.hexStrToBigInt(contractJson.to_account);

    if (fromAccount || toAccount)
    {
        logger.error("chkAddUserContract - Account");
        return define.ERR_CODE.ERROR;
    }
    
    if (!(contractJson.contents.hasOwnProperty(define.CONTRACT_DEFINE.CONTENTS_PROPERTY.ADD_USER.OWNER_PK)
        && contractJson.contents.hasOwnProperty(define.CONTRACT_DEFINE.CONTENTS_PROPERTY.ADD_USER.SUPER_PK)
        && contractJson.contents.hasOwnProperty(define.CONTRACT_DEFINE.CONTENTS_PROPERTY.ADD_USER.ACCOUNT_ID)))
    {
        logger.error("chkAddUserContract - Contents");
        return define.ERR_CODE.ERROR;
    }

    let ownerPk = contractJson.contents.owner_pk;
    let superPk = contractJson.contents.super_pk;
    let accountId = contractJson.contents.account_id;

    // Check user and token account
    let userAccount = await dbAct.accountUserCheck(ownerPk, superPk, accountId);
    let tokenAccountKey =await dbAct.accountTokenKeyCheck(ownerPk, superPk);

    if (userAccount.length || tokenAccountKey.length)
    {
        logger.error("chkAddUserContract - Already Existed");
        return define.ERR_CODE.ERROR;
    }

    return define.ERR_CODE.SUCCESS;
}

// Check Account
const chkContract = async (contractJson) => {
    let retVal = define.ERR_CODE.ERROR;

    if (contractJson.type <= define.CONTRACT_DEFINE.KIND.SECURITY_TOKEN)
    {
        retVal = await chkTxSecTokenContract(contractJson);
    }
    else if (contractJson.type <= define.CONTRACT_DEFINE.KIND.UTILITY_TOKEN)
    {
        retVal = await chkTxUtilTokenContract(contractJson);
    }
    else if (contractJson.type === define.CONTRACT_DEFINE.KIND.TOKEN_CREATION)
    {
        retVal = await chkCreateTokenContract(contractJson);
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
        retVal = await chkLockTokenTxContract(contractJson);
    }
    else if (contractJson.type === define.CONTRACT_DEFINE.KIND.LOCK_TOKEN_TIME)
    {
        retVal = await chkLockTokenTimeContract(contractJson);
    }
    else if (contractJson.type === define.CONTRACT_DEFINE.KIND.LOCK_TOKEN_WALLET)
    {
        retVal = await chkLockTokenWalletContract(contractJson);
    }
    else if (contractJson.type === define.CONTRACT_DEFINE.KIND.ADD_USER)
    {
        retVal = await chkAddUserContract(contractJson);
    }
    else
    {
        // For test
        retVal = define.ERR_CODE.SUCCESS;
    }

    return retVal;
}
module.exports.chkContract = chkContract;
