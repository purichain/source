//
const dbUtil = require("./../db/dbUtil.js");
const dbNN = require("./../db/dbNN.js");
const config = require("./../../config/config.js");
const define = require("./../../config/define.js");
const contract_module = require("./../contract/contract.js");
const account = require("./../contract/account.js");
const contractUtil = require("./../contract/contractUtil.js");
const kafkaUtil = require("./../net/kafkaUtil.js");
const util = require("./../utils/commonUtil.js");

//
const logger = require("./../utils/winlog.js");

// Balance
//
module.exports.insertAccountBalanceV = async (blk_num, db_key, my_account_num, type, balance) => {
    logger.debug("func - insertAccountBalanceV");

    //
    // `INSERT INTO account.account_balance(subnet_id, create_tm, blk_num, my_account_num, type, balance) VALUES `,
    const conn = await dbUtil.getConn();

    let insertAccountBalanceQuery = dbNN.querys.account.insertAccountBalance;

    insertAccountBalanceQuery += `(${contract_module.getMySubNetId()}, `;
    insertAccountBalanceQuery += `${BigInt(util.getDateMS().toString())}, `; // cfmd_tm
    insertAccountBalanceQuery += `${BigInt(blk_num)}, `; // cfmd_blk_num
    insertAccountBalanceQuery += `${BigInt(blk_num)}, `; // blk_num
    insertAccountBalanceQuery += `${BigInt(db_key)}, `;
    insertAccountBalanceQuery += `${BigInt(my_account_num)}, `;
    insertAccountBalanceQuery += `${type}, `;
    insertAccountBalanceQuery += `'${balance}')`;

    // logger.debug("insertAccountBalanceQuery : " + insertAccountBalanceQuery);

    [query_result] = await dbUtil.exeQuery(conn, insertAccountBalanceQuery);

    await dbUtil.releaseConn(conn);
}

//
module.exports.selectAccountBalanceTypeV = async (account, type) => {
    logger.debug("func - selectAccountBalanceTypeV");

    const conn = await dbUtil.getConn();

    [query_result] = await dbUtil.exeQueryParam(conn, dbNN.querys.account.selectAccountBalanceType, [account, type]);
    // for(var i = 0; i < query_result.length; i++)
    // {
    //     for ( var keyNm in query_result[i])
    //     {
    //         if (query_result[i][keyNm])
    //         {
    //             logger.debug("keyNm : " + keyNm + ", value : " + query_result[i][keyNm]);
    //         }
    //     }
    // }

    await dbUtil.releaseConn(conn);

    return query_result;
}

//
module.exports.selectAccountBalanceSubNetIdV = async (subNetId) => {
    logger.debug("func - selectAccountBalanceVAll");

    const conn = await dbUtil.getConn();

    [query_result] = await dbUtil.exeQueryParam(conn, dbNN.querys.account.selectAccountBalanceSubNetId, [subNetId]);
    // logger.debug("query_result.length : " + query_result.length)
    // for(var i = 0; i < query_result.length; i++)
    // {
    //     for ( var keyNm in query_result[i])
    //     {
    //         if (query_result[i][keyNm])
    //         {
    //             logger.debug("keyNm : " + keyNm + ", value : " + query_result[i][keyNm]);
    //         }
    //     }
    // }

    await dbUtil.releaseConn(conn);

    return query_result;
}

//
module.exports.getAccountBalance = async(maxBN, accountNum, type) => {
    logger.debug("func - getAccountBalanceSubNetIdType");

    // Update Balance
    query_result = await this.selectAccountBalanceTypeV(accountNum, type);
    logger.debug("query_result.length : " + query_result.length);
    if (query_result.length)
    {
        aBal = query_result[0];

        let minBN = BigInt(aBal.cfmd_blk_num);
        let myBal = aBal.balance;

        if (minBN > 0)
        {
            query_result = await this.selectAccountLedgerAmountList(aBal.my_account_num, aBal.type, minBN, maxBN);

            await util.asyncForEach(query_result, async(aLedger, index) => {
    
                myBal = contractUtil.calNum(myBal, '+', aLedger.amount, 4);
            });
    
            // logger.debug("get accountNum : " + accountNum + ", type : " + type + ", myBal : " + myBal);
    
            return myBal;
        }
        else
        {
            logger.error("Error - minBN");
        }
    }
    else
    {
        logger.error("Error - Balance Type");
    }

    return define.ERR_CODE.ERROR;
}

//
module.exports.updateAccountBalanceV = async (cfmd_tm, cfmd_blk_num, blk_num, db_key, balance, account, type) => {
    logger.debug("func - updateAccountBalanceV");

    //
    const conn = await dbUtil.getConn();

    let updateAccountBalanceQuery = dbNN.querys.account.updateAccountBalance;

    // logger.debug("updateAccountBalanceQuery : " + updateAccountBalanceQuery);

    [query_result] = await dbUtil.exeQueryParam(conn, updateAccountBalanceQuery, [cfmd_tm, cfmd_blk_num, blk_num, db_key, balance, account, type]);

    await dbUtil.releaseConn(conn);
}

//
module.exports.updateAccountBalanceSubNetIdV = async(maxBN, subNetId) => {
    logger.debug("func - updateAccountBalanceSubNetIdV");

    let cfmd_tm = BigInt(util.getDateMS().toString());

    // Update Balance
    let query_result = await this.selectAccountBalanceSubNetIdV(subNetId);

    await util.asyncForEach(query_result, async (aBal, index) => {
        let lastBlkNum = aBal.blk_num;
        let lastDbKey = aBal.db_key;
        // let lastCreateTm = aBal.create_tm;
    
        let minBN = BigInt(aBal.cfmd_blk_num);
        let myBal = aBal.balance;

        logger.debug("1 update accountNum : " + aBal.my_account_num + ", type : " + aBal.type + ", minBN : " + minBN + ", maxBN : " + maxBN);

        if ((minBN > 0) && (minBN < maxBN))
        {
            let query_result_2 = await this.selectAccountLedgerAmountList(aBal.my_account_num, aBal.type, minBN, maxBN);

            await util.asyncForEach(query_result_2, async(aLedger, index) => {
                lastBlkNum = aLedger.blk_num;
                lastDbKey = aLedger.db_key;
                // lastCreateTm = aLedger.create_tm;
                logger.debug("2 update accountNum : " + aBal.my_account_num + ", type : " + aBal.type + ", index : " + index + ", amount : " + aLedger.amount);
                myBal = contractUtil.calNum(myBal, '+', aLedger.amount, 4);
            });
    
            logger.debug("3 update accountNum : " + aBal.my_account_num + ", type : " + aBal.type + ", afterBal : " + myBal);
    
            await this.updateAccountBalanceV(cfmd_tm, maxBN, lastBlkNum, lastDbKey, myBal, aBal.my_account_num, aBal.type);
        }
    });
}

// Ledger
//
module.exports.insertAccountLedger = async (blk_num, db_key, my_account_num, account_num, type, amount) => {
    logger.debug("func - insertAccountLedger");

    //
    // `INSERT INTO account_ledgers(subnet_id, create_tm, blk_num, db_key, my_account_num, account_num, type, amount, balance) VALUES `,
    const conn = await dbUtil.getConn();

    let insertAccountLedgerQuery = dbNN.querys.account.insertAccountLedgers;

    insertAccountLedgerQuery += `(${contract_module.getMySubNetId()}, `;
    insertAccountLedgerQuery += `${BigInt(util.getDateMS().toString())}, `; // create_tm
    insertAccountLedgerQuery += `${BigInt(blk_num)}, `; // blk_num
    insertAccountLedgerQuery += `${BigInt(db_key)}, `;
    insertAccountLedgerQuery += `${BigInt(my_account_num)}, `;
    insertAccountLedgerQuery += `${BigInt(account_num)}, `; // account_num
    insertAccountLedgerQuery += `${type}, `;
    insertAccountLedgerQuery += `'${amount}', `;
    insertAccountLedgerQuery += `'0')`;

    // logger.debug("insertAccountLedgerQuery : " + insertAccountLedgerQuery);

    [query_result] = await dbUtil.exeQuery(conn, insertAccountLedgerQuery);

    await dbUtil.releaseConn(conn);
}

module.exports.selectAccountLedgerAmountList = async (account, type, minBN, maxBN) => {
    logger.debug("func - selectAccountLedgerAmountList");

    let query_result = new Array();

    if (minBN >= maxBN)
    {
        logger.debug("minBN > maxBN / minBN : " + minBN + ", maxBN : " + maxBN);

        return query_result;
    }

    const conn = await dbUtil.getConn();

    let selectAccountLedger = `SELECT * FROM account.account_ledgers as a `;
    selectAccountLedger += `WHERE my_account_num = ? and type = ? and blk_num > ? and blk_num <= ? `;
    // selectAccountLedger += `ORDER BY blk_num DESC, create_tm DESC`;
    selectAccountLedger += `ORDER BY blk_num ASC, create_tm ASC`;

    // logger.debug("selectAccountLedger : " + selectAccountLedger);

    [query_result] = await dbUtil.exeQueryParam(conn, selectAccountLedger, [account, type, minBN, maxBN]);
    // for(var i = 0; i < query_result.length; i++)
    // {
    //     for ( var keyNm in query_result[i])
    //     {
    //         if (query_result[i][keyNm])
    //         {
    //             logger.debug("keyNm : " + keyNm + ", value : " + query_result[i][keyNm]);
    //         }
    //     }
    // }

    await dbUtil.releaseConn(conn);

    return query_result;
}
