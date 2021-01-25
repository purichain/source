//
const { loggers } = require("winston");

//
const config = require("./../../config/config.js");
const define = require("./../../config/define.js");
const dbUtil = require("./../db/dbUtil.js");
const dbNN = require("./../db/dbNN.js");
const dbAct = require("./../db/dbAct.js");
const contract_module = require("./../contract/contract.js");
const account = require("./../contract/account.js");
const contractUtil = require("./../contract/contractUtil.js");
const kafkaUtil = require("./../net/kafkaUtil.js");
const util = require("./../utils/commonUtil.js");
const logger = require("./../utils/winlog.js");

//
module.exports.updateAccountTokenMS = async (operator, tSupply, tType) => {
    logger.debug("func - updateAccountTokenMS");
    logger.debug("operator : " + operator + ", tSupply : " + tSupply + ", tType : " + tType);

    //
    const conn = await dbUtil.getConn();

    query_result = await dbAct.accountTokenCheck(tType);
    logger.debug("query_result.length : " + query_result.length);
    if (query_result.length)
    {
        logger.debug("operator : " + query_result[0].market_supply + ", operator : " + operator + ", tSupply : " + tSupply + ", decimal_point : " + query_result[0].decimal_point);
        market_supply = contractUtil.calNum(query_result[0].market_supply, operator, tSupply, query_result[0].decimal_point);

        if (market_supply >= 0)
        {
            //
            let updateAccountTokenMrktSplyQuery = dbNN.querys.account.updateAccountTokenMrktSply;

            // logger.debug("updateAccountTokenMrktSplyQuery : " + updateAccountTokenMrktSplyQuery);
        
            [query_result] = await dbUtil.exeQueryParam(conn, updateAccountTokenMrktSplyQuery, [market_supply, tType]);
        }
    }

    await dbUtil.releaseConn(conn);
}

module.exports.updateLockTokenTxContract = (contractJson, tokenAccont) => {
    let contract = {
        create_tm : contractJson.create_tm,
        fintech : contractJson.fintech,
        privacy : contractJson.privacy,
        fee : contractJson.fee,
        from_account : contractJson.from_account,
        to_account : contractJson.to_account,
        type : contractJson.type,
        contents : {
            owner_pk : tokenAccont.owner_pk,
            super_pk : tokenAccont.super_pk,
            type : tokenAccont.type,
            name : tokenAccont.name,
            symbol : tokenAccont.symbol,
            total_supply : tokenAccont.total_supply,
            decimal_point : tokenAccont.decimal_point,
            lock_time_from : tokenAccont.lock_time_from,
            lock_time_to : tokenAccont.lock_time_to,
            lock_transfer : contractJson.contents.lock,
            black_list : tokenAccont.black_list,
            functions : tokenAccont.functions
        },
        memo : ""
    };

    logger.debug("updateLockTokenTxContract - newContractJson : " + JSON.stringify(contract));

    return JSON.stringify(contract);
}

module.exports.updateLockTokenTimeContract = (contractJson, tokenAccont) => {
    let contract = {
        create_tm : contractJson.create_tm,
        fintech : contractJson.fintech,
        privacy : contractJson.privacy,
        fee : contractJson.fee,
        from_account : contractJson.from_account,
        to_account : contractJson.to_account,
        type : contractJson.type,
        contents : {
            owner_pk : tokenAccont.owner_pk,
            super_pk : tokenAccont.super_pk,
            type : tokenAccont.type,
            name : tokenAccont.name,
            symbol : tokenAccont.symbol,
            total_supply : tokenAccont.total_supply,
            decimal_point : tokenAccont.decimal_point,
            lock_time_from : contractJson.contents.lock_time_from,
            lock_time_to : contractJson.contents.lock_time_to,
            lock_transfer : tokenAccont.lock_transfer,
            black_list : tokenAccont.black_list,
            functions : tokenAccont.functions
        },
        memo : ""
    };

    logger.debug("updateLockTokenTimeContract - newContractJson : " + JSON.stringify(contract));

    return JSON.stringify(contract);
}

module.exports.updateLockTokenWalletContract = (contractJson, tokenAccont) => {
    let contract = {
        create_tm : contractJson.create_tm,
        fintech : contractJson.fintech,
        privacy : contractJson.privacy,
        fee : contractJson.fee,
        from_account : contractJson.from_account,
        to_account : contractJson.to_account,
        type : contractJson.type,
        contents : {
            owner_pk : tokenAccont.owner_pk,
            super_pk : tokenAccont.super_pk,
            type : tokenAccont.type,
            name : tokenAccont.name,
            symbol : tokenAccont.symbol,
            total_supply : tokenAccont.total_supply,
            decimal_point : tokenAccont.decimal_point,
            lock_time_from : tokenAccont.lock_time_from,
            lock_time_to : tokenAccont.lock_time_to,
            lock_transfer : tokenAccont.lock_transfer,
            black_list : contractJson.contents.pk_list,
            functions : tokenAccont.functions
        },
        memo : ""
    };

    logger.debug("updateLockTokenWalletContract - newContractJson : " + JSON.stringify(contract));

    return JSON.stringify(contract);
}
