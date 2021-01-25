//

//
const config = require("./../../config/config.js");
const define = require("./../../config/define.js");
const util = require('./../utils/commonUtil.js');
const dbUtil = require('./../db/dbUtil.js');
const dbNN = require('./../db/dbNN.js');
const contract_module = require("./../contract/contract.js");
const contractChecker = require("./../contract/contractChecker.js");
const account_module = require("./../contract/account.js");
const ledger = require("./../contract/ledger.js");
const token = require("./../contract/token.js");
const logger = require('./../utils/winlog.js');
const debug = require("./../utils/debug.js");

//
module.exports.setDbKey = async (db_key, subnet_id) => {
    //let ret;
    const conn = await dbUtil.getConn();

    try {
        //
        let sql = dbNN.querys.sc.useSC;
        await conn.query(sql);

        //
        await conn.query(dbNN.querys.sc.DBKeySet, [db_key]);

    } catch (err) {
        debug.error(err);
    }
    
    await dbUtil.releaseConn(conn);
}

//
module.exports.selectDbKeyFromBlkTxs = async (BN) => {
    const conn = await dbUtil.getConn();
    // await exeQuery(conn, dbNN.querys.block.useBlock);

    [query_result] = await dbUtil.exeQueryParam(conn, dbNN.querys.block.selectDbKeyBlkTxs, [BN]);

    let dbKey = new Array();

    for(var i = 0; i < query_result.length; i++)
    {
        for ( var keyNm in query_result[i])
        {
            if (query_result[i][keyNm])
            {
                dbKey.push(query_result[i][keyNm]);
            }
        }
    }

    // logger.debug("dbKey : " + dbKey);

    await dbUtil.releaseConn(conn);

    return dbKey;
}

//
module.exports.selectMaxBlkNumFromBlkContents = async () => {
    const conn = await dbUtil.getConn();
    // await exeQuery(conn, dbNN.querys.block.useBlock);

    [query_result] = await dbUtil.exeQuery(conn, dbNN.querys.block.selectLastBlkNumBlkContents);

    let lastBN = '0';

    if (query_result.length)
    {
        if (query_result[0].max_blk_num !== null)
        {
            lastBN = query_result[0].max_blk_num;
        }
    }

    // for(var i = 0; i < query_result.length; i++)
    // {
    //     for ( var keyNm in query_result[i])
    //     {
    //         logger.debug("query_result[i][keyNm] : [" + i +"] " + keyNm + " - " + query_result[i][keyNm]);
    //         if (query_result[i][keyNm])
    //         {
    //             lastBN = query_result[i][keyNm];
    //         }
    //     }
    // }

    logger.debug("lastBN : " + lastBN);

    await dbUtil.releaseConn(conn);

    return lastBN;
}

//
module.exports.selectAccountFromScContents = async (fromAccount) => {
    const conn = await dbUtil.getConn();
    // await dbUtil.exeQuery(conn, dbNN.querys.sc.useSC);

    let selectLastAccount = `SELECT create_tm, confirmed, db_key FROM sc.sc_contents as a `;
    selectLastAccount += `WHERE from_account = ? and `;
    selectLastAccount += `a.create_tm = (select MAX(create_tm) from sc.sc_contents) `;
    selectLastAccount += `ORDER BY db_key DESC LIMIT 1`;

    // logger.debug("selectLastAccount : " + selectLastAccount);

    [query_result] = await dbUtil.exeQueryParam(conn, selectLastAccount, [fromAccount]);
    // for(var i = 0; i < query_result.length; i++)
    // {
    //     for ( var keyNm in query_result[i])
    //     {
    //         //if (query_result[i][keyNm])
    //         {
    //             logger.debug("keyNm : " + keyNm + ", value : " + query_result[i][keyNm]);
    //         }
    //     }
    // }

    await dbUtil.releaseConn(conn);

    return query_result;
}

//
module.exports.selectFromScContentsWithDbKey = async (minDbKey, maxDbKey) => {
    const conn = await dbUtil.getConn();
    // await dbUtil.exeQuery(conn, dbNN.querys.sc.useSC);

    let selectScContents = `SELECT signed_pubkey, confirmed, from_account, to_account, type, amount, err_code `
    selectScContents += ` FROM sc.sc_contents WHERE ${minDbKey} <= db_key and db_key <= ${maxDbKey}`;

    // logger.debug("selecScContents : " + selectScContents);

    [query_result] = await dbUtil.exeQuery(conn, selectScContents);
    // for(var i = 0; i < query_result.length; i++)
    // {
    //     for ( var keyNm in query_result[i])
    //     {
    //         //if (query_result[i][keyNm])
    //         {
    //             logger.debug("keyNm : " + keyNm + ", value : " + query_result[i][keyNm]);
    //         }
    //     }
    // }

    await dbUtil.releaseConn(conn);

    return query_result;
}

//
module.exports.updateScContentsWhereDbKey = async (minDbKey, maxDbKey, BN) => {
    const conn = await dbUtil.getConn();
    // await exeQuery(conn, dbNN.querys.sc.useSC);

    let updateScContents = `UPDATE sc.sc_contents SET confirmed = ${true} WHERE ${minDbKey} <= db_key and db_key <= ${maxDbKey}`;
    // logger.debug("updateScContents : " + updateScContents);

    [query_result] = await dbUtil.exeQuery(conn, updateScContents);

    // let updateScContents = `UPDATE sc_contents SET blk_num = ${BN} WHERE ${minDbKey} <= db_key and db_key <= ${maxDbKey}`;
    // logger.debug("updateScContents : " + updateScContents);

    // [query_result] = await dbUtil.exeQuery(conn, updateScContents);

    await dbUtil.releaseConn(conn);
}

//
module.exports.updateAccountsBlkNumWhereDbKey = async (minDbKey, maxDbKey, BN) => {
    const conn = await dbUtil.getConn();
    // await exeQuery(conn, dbNN.querys.account.useAccount);

    // account_tokens
    let updateBlkNum = `UPDATE  account.${dbNN.createTableNames.accountQuerys[0]} SET blk_num = ${BN} WHERE ${minDbKey} <= db_key and db_key <= ${maxDbKey}`;
    // logger.debug("updateBlkNum : " + updateBlkNum);
    [query_result] = await dbUtil.exeQuery(conn, updateBlkNum);

    // account_users
    updateBlkNum = `UPDATE  account.${dbNN.createTableNames.accountQuerys[1]} SET blk_num = ${BN} WHERE ${minDbKey} <= db_key and db_key <= ${maxDbKey}`;
    // logger.debug("updateBlkNum : " + updateBlkNum);
    [query_result] = await dbUtil.exeQuery(conn, updateBlkNum);

    // account_ledgers
    updateBlkNum = `UPDATE  account.${dbNN.createTableNames.accountQuerys[2]} SET blk_num = ${BN} WHERE ${minDbKey} <= db_key and db_key <= ${maxDbKey}`;
    // logger.debug("updateBlkNum : " + updateBlkNum);
    [query_result] = await dbUtil.exeQuery(conn, updateBlkNum);

    // account_balance
    updateBlkNum = `UPDATE  account.${dbNN.createTableNames.accountQuerys[3]} SET cfmd_blk_num = ${BN}, blk_num = ${BN} WHERE ${minDbKey} <= db_key and db_key <= ${maxDbKey}`;
    // logger.debug("updateBlkNum : " + updateBlkNum);
    [query_result] = await dbUtil.exeQuery(conn, updateBlkNum);

    await dbUtil.releaseConn(conn);
}

//
module.exports.insertBlkTxsV = async (txArray) => {
    const conn = await dbUtil.getConn();
    // await dbUtil.exeQuery(conn, dbNN.querys.block.useBlock);

    let insertBlkTxsQuery = dbNN.querys.block.insertBlkTxs;
    //
    await util.asyncForEach(txArray, async(element, index) => {
        insertBlkTxsQuery += `(${contract_module.getMySubNetId()}, ${BigInt(0)}, ${BigInt(element.db_key)}, "${element.sc_hash}"),`;
    });

    insertBlkTxsQuery = insertBlkTxsQuery.substr(0, insertBlkTxsQuery.length - 1);

    [query_result] = await dbUtil.exeQuery(conn, insertBlkTxsQuery);

    await dbUtil.releaseConn(conn);
}

//
module.exports.accountLegerCheck = async (account_num, type) => {
    const conn = await dbUtil.getConn();

    logger.debugvv("accountLegerCheck - account_num : " + account_num + ", type : " + type);
    [query_result] = await dbUtil.exeQueryParam(conn, dbNN.querys.account.selectAccountLeger, [account_num, type]);

    await dbUtil.releaseConn(conn);

    return query_result;
}

//
module.exports.insertAccountLedgerTokenInit = async (create_tm, db_key, my_account_num, type, amount) => {
    //
    // `INSERT INTO account_ledgers(subnet_id, create_tm, blk_num, db_key, my_account_num, account_num, type, amount, balance) VALUES `,
    const conn = await dbUtil.getConn();

    let insertAccountLedgerQuery = dbNN.querys.account.insertAccountLedgers;

    insertAccountLedgerQuery += `(${contract_module.getMySubNetId()}, `;
    insertAccountLedgerQuery += `${BigInt(create_tm)}, `; // create_tm
    insertAccountLedgerQuery += `${BigInt(0)}, `; // blk_num
    insertAccountLedgerQuery += `${BigInt(db_key)}, `;
    insertAccountLedgerQuery += `${BigInt(my_account_num)}, `;
    insertAccountLedgerQuery += `${BigInt(0)}, `; // account_num
    insertAccountLedgerQuery += `${type}, `;
    insertAccountLedgerQuery += `'${amount}', `;
    insertAccountLedgerQuery += `'0')`;

    // logger.debug("insertAccountLedgerQuery : " + insertAccountLedgerQuery);

    [query_result] = await dbUtil.exeQuery(conn, insertAccountLedgerQuery);

    await dbUtil.releaseConn(conn);
}

//
module.exports.insertAccountSecLedger = async (secLedgerArray) => {
    let blk_num = 0;
    let fromAccountInt;
    let toAccountInt;

    // `INSERT INTO account_ledgers(subnet_id, create_tm, blk_num, db_key, my_account_num, account_num, type, amount, balance) VALUES `,
    const conn = await dbUtil.getConn();
    // await dbUtil.exeQuery(conn, dbNN.querys.account.useAccount);
    
    let insertAccountLedgerQuery = dbNN.querys.account.insertAccountLedgers;
    //
    await util.asyncForEach(secLedgerArray, async(element, index) => {
        contractJson = element['contractJson'];

        fromAccountInt = util.hexStrToBigInt(contractJson.from_account);
        toAccountInt = util.hexStrToBigInt(contractJson.to_account);

        // Account Ledger
        if (contractJson.from_account === define.CONTRACT_DEFINE.SEC_TOKEN_ACCOUNT)
        { // Distributted by Security Token Account
            //
            await token.updateAccountTokenMS('+', contractJson.contents.amount, contractJson.type);

            //
            insertAccountLedgerQuery += `(${contract_module.getMySubNetId()}, `;
            insertAccountLedgerQuery += `${BigInt(contractJson.create_tm)}, `; // create_tm
            insertAccountLedgerQuery += `${BigInt(blk_num)}, `; // blk_num
            insertAccountLedgerQuery += `${BigInt(element.db_key)}, `;
            insertAccountLedgerQuery += `${BigInt(toAccountInt)}, `;
            insertAccountLedgerQuery += `${BigInt(fromAccountInt)}, `;
            insertAccountLedgerQuery += `${contractJson.type}, `;
            insertAccountLedgerQuery += `'${contractJson.contents.amount}', `;
            insertAccountLedgerQuery += `'0'),`;
        }
        else
        {
            // From Account
            insertAccountLedgerQuery += `(${contract_module.getMySubNetId()}, `;
            insertAccountLedgerQuery += `${BigInt(contractJson.create_tm)}, `; // create_tm
            insertAccountLedgerQuery += `${BigInt(blk_num)}, `; // blk_num
            insertAccountLedgerQuery += `${BigInt(element.db_key)}, `;
            insertAccountLedgerQuery += `${BigInt(fromAccountInt)}, `;
            insertAccountLedgerQuery += `${BigInt(toAccountInt)}, `;
            insertAccountLedgerQuery += `${contractJson.type}, `;
            insertAccountLedgerQuery += `'-${contractJson.contents.amount}', `;
            insertAccountLedgerQuery += `'0'),`;

            // To Account
            insertAccountLedgerQuery += `(${contract_module.getMySubNetId()}, `;
            insertAccountLedgerQuery += `${BigInt(contractJson.create_tm)}, `; // create_tm
            insertAccountLedgerQuery += `${BigInt(blk_num)}, `; // blk_num
            insertAccountLedgerQuery += `${BigInt(element.db_key)}, `;
            insertAccountLedgerQuery += `${BigInt(toAccountInt)}, `;
            insertAccountLedgerQuery += `${BigInt(fromAccountInt)}, `;
            insertAccountLedgerQuery += `${contractJson.type}, `;
            insertAccountLedgerQuery += `'${contractJson.contents.amount}', `;
            insertAccountLedgerQuery += `'0'),`;
        }

        // Account Balance Init
        let query_result = await ledger.selectAccountBalanceTypeV(toAccountInt, contractJson.type);
        if (query_result.length === 0)
        {
            await ledger.insertAccountBalanceV(blk_num, element.db_key, toAccountInt, contractJson.type, contractJson.contents.amount);
        }
    });

    insertAccountLedgerQuery = insertAccountLedgerQuery.substr(0, insertAccountLedgerQuery.length - 1);
    // logger.debug("insertAccountLedgerQuery : " + insertAccountLedgerQuery);

    [query_result] = await dbUtil.exeQuery(conn, insertAccountLedgerQuery);

    await dbUtil.releaseConn(conn);
}

//
module.exports.insertAccountUtilLedger = async (utiLedgerArray) => {
    let blk_num = 0;
    // let createTmInt;
    let fromAccountInt;
    let toAccountInt;

    // `INSERT INTO account_ledgers(subnet_id, create_tm, blk_num, db_key, my_account_num, account_num, type, amount, balance) VALUES `,
    const conn = await dbUtil.getConn();
    // await exeQuery(conn, dbNN.querys.account.useAccount);
    
    let insertAccountLedgerQuery = dbNN.querys.account.insertAccountLedgers;
    //
    await util.asyncForEach(utiLedgerArray, async(element, index) => {
        contractJson = element['contractJson'];

        fromAccountInt = util.hexStrToBigInt(contractJson.from_account);
        toAccountInt = util.hexStrToBigInt(contractJson.contents.to);

        //
        if(contractChecker.chkAccountDelimiter(contractJson.from_account) === define.CONTRACT_DEFINE.ACCOUNT_TOKEN_DELI)
        {
            await token.updateAccountTokenMS('+', contractJson.contents.amount, contractJson.type);
        }

        // Account Ledger
        // From Account
        insertAccountLedgerQuery += `(${contract_module.getMySubNetId()}, `;
        insertAccountLedgerQuery += `${BigInt(contractJson.create_tm)}, `; // create_tm
        insertAccountLedgerQuery += `${BigInt(blk_num)}, `; // blk_num
        insertAccountLedgerQuery += `${BigInt(element.db_key)}, `;
        insertAccountLedgerQuery += `${BigInt(fromAccountInt)}, `;
        insertAccountLedgerQuery += `${BigInt(toAccountInt)}, `;
        insertAccountLedgerQuery += `${contractJson.type}, `;
        insertAccountLedgerQuery += `'-${contractJson.contents.amount}', `;
        insertAccountLedgerQuery += `'0'),`;

        // To Account
        insertAccountLedgerQuery += `(${contract_module.getMySubNetId()}, `;
        insertAccountLedgerQuery += `${BigInt(contractJson.create_tm)}, `; // create_tm
        insertAccountLedgerQuery += `${BigInt(blk_num)}, `; // blk_num
        insertAccountLedgerQuery += `${BigInt(element.db_key)}, `;
        insertAccountLedgerQuery += `${BigInt(toAccountInt)}, `;
        insertAccountLedgerQuery += `${BigInt(fromAccountInt)}, `;
        insertAccountLedgerQuery += `${contractJson.type}, `;
        insertAccountLedgerQuery += `'${contractJson.contents.amount}', `;
        insertAccountLedgerQuery += `'0'),`;

        // Account Balance Init
        let query_result = await ledger.selectAccountBalanceTypeV(toAccountInt, contractJson.type);
        if (query_result.length === 0)
        {
            await ledger.insertAccountBalanceV(blk_num, element.db_key, toAccountInt, contractJson.type, contractJson.contents.amount);
        }
    });

    insertAccountLedgerQuery = insertAccountLedgerQuery.substr(0, insertAccountLedgerQuery.length - 1);
    // logger.debug("insertAccountLedgerQuery : " + insertAccountLedgerQuery);

    [query_result] = await dbUtil.exeQuery(conn, insertAccountLedgerQuery);

    await dbUtil.releaseConn(conn);
}

//
module.exports.accountTokenCheck = async (tType, tName, tSymbol) => {

    if ((typeof tType !== 'undefined') && (typeof tName !== 'undefined') && (typeof tName !== 'undefined'))
    {
        const conn = await dbUtil.getConn();
        [query_result] = await dbUtil.exeQueryParam(conn, dbNN.querys.account.selectAccountTokenTNS, [tType, tName, tSymbol]);
        await dbUtil.releaseConn(conn);

        logger.debug("1 query_result.length : " + query_result.length);

        return query_result;
    }
    else if (typeof tType !== 'undefined')
    {
        const conn = await dbUtil.getConn();
        [query_result] = await dbUtil.exeQueryParam(conn, dbNN.querys.account.selectAccountTokenT, [tType]);
        await dbUtil.releaseConn(conn);

        logger.debug("2 query_result.length : " + query_result.length);

        return query_result;
    }

    logger.error("Error - accountTokenCheck");

    return query_result;
}

module.exports.accountTokenKeyCheck = async (owner_pk, super_pk) => {
    const conn = await dbUtil.getConn();

    [query_result] = await dbUtil.exeQueryParam(conn, dbNN.querys.account.selectAccountTokenKey, [owner_pk, owner_pk, super_pk, super_pk]);
    await dbUtil.releaseConn(conn);

    return query_result;
}

module.exports.accountTokenAccountCheck = async (account) => {
    const conn = await dbUtil.getConn();

    [query_result] = await dbUtil.exeQueryParam(conn, dbNN.querys.account.selectAccountTokenAccount, [account]);
    await dbUtil.releaseConn(conn);

    return query_result;
}

module.exports.insertAccountTokensV = async (tokenArray) => {
    logger.debug("func - insertAccountTokensV");

    let cnt = 0;

    let blk_num = 0;
    let insertAccountTokenQuery = dbNN.querys.account.insertAccountTokens;

    //
    await util.asyncForEach(tokenArray, async(element, index) => {
        contractJson = element['contractJson'];

        // let already_existed = await accountTokenCheck(contractJson.contents.type, contractJson.contents.name, contractJson.contents.symbol);
        already_existed = false;

        if (!already_existed)
        {
            let my_account_num = util.hexStrToBigInt(account_module.createAccountCode(contractJson.contents.type));
            // logger.debug("my_account_num : " + my_account_num + ", Bigint1 : " + BigInt(util.hexStrToBigInt(my_account_num)) + ", Bigint2 : " + BigInt(util.hexStrToBigInt(my_account_num)));
            
            insertAccountTokenQuery += `(${contract_module.getMySubNetId()}, `;
            insertAccountTokenQuery += `${BigInt(contractJson.create_tm)}, `; // create_tm
            insertAccountTokenQuery += `${BigInt(blk_num)}, `; // blk_num
            insertAccountTokenQuery += `${BigInt(element.db_key)}, `;
            insertAccountTokenQuery += `'${contractJson.contents.owner_pk}', `;
            insertAccountTokenQuery += `'${contractJson.contents.super_pk}', `;
            insertAccountTokenQuery += `${BigInt(my_account_num)}, `; // TODO : account_num
            insertAccountTokenQuery += `${contractJson.contents.type}, `;
            insertAccountTokenQuery += `'${contractJson.contents.name}', `;
            insertAccountTokenQuery += `'${contractJson.contents.symbol}', `;
            insertAccountTokenQuery += `'${contractJson.contents.total_supply}', `;
            insertAccountTokenQuery += `'0', `;
            insertAccountTokenQuery += `${contractJson.contents.decimal_point}, `;
            insertAccountTokenQuery += `${BigInt(contractJson.contents.lock_time_from)}, `;
            insertAccountTokenQuery += `${BigInt(contractJson.contents.lock_time_to)}, `;
            insertAccountTokenQuery += `${contractJson.contents.lock_transfer}, `;
            insertAccountTokenQuery += `'${contractJson.contents.black_list}', `;
            insertAccountTokenQuery += `'${contractJson.contents.functions}'),`;

            if (contractJson.contents.type !== define.CONTRACT_DEFINE.KIND.SECURITY_TOKEN)
            {
                // Account Balance Init
                let query_result = await ledger.selectAccountBalanceTypeV(my_account_num, contractJson.contents.type);
                if (query_result.length === 0)
                {
                    await ledger.insertAccountBalanceV(blk_num, element.db_key, my_account_num, contractJson.contents.type, contractJson.contents.total_supply);
                    await this.insertAccountLedgerTokenInit(contractJson.create_tm, element.db_key, my_account_num, contractJson.contents.type, contractJson.contents.total_supply);
                }
                else
                {
                    logger.error("Error - insertAccountTokensV : Duplicated");
                }
            }

            cnt++;
        }
    });

    if (cnt)
    {
        const conn = await dbUtil.getConn();

        insertAccountTokenQuery = insertAccountTokenQuery.substr(0, insertAccountTokenQuery.length - 1);
        // logger.debug("insertAccountTokenQuery : " + insertAccountTokenQuery);
    
        [query_result] = await dbUtil.exeQuery(conn, insertAccountTokenQuery);
    
        await dbUtil.releaseConn(conn);
    }
}

//
module.exports.accountUserAccountCheck = async (account_num) => {
    const conn = await dbUtil.getConn();

    [query_result] = await dbUtil.exeQueryParam(conn, dbNN.querys.account.selectAccountUserAccount, [account_num]);

    await dbUtil.releaseConn(conn);

    return query_result;
}

//
module.exports.accountUserCheck = async (owner_pk, super_pk, account_id) => {
    const conn = await dbUtil.getConn();

    [query_result] = await dbUtil.exeQueryParam(conn, dbNN.querys.account.selectAccountUser, [owner_pk, owner_pk, super_pk, super_pk, account_id]);

    await dbUtil.releaseConn(conn);

    return query_result;
}

//
module.exports.accountUserKeyCheck = async (owner_pk, super_pk) => {
    const conn = await dbUtil.getConn();

    [query_result] = await dbUtil.exeQueryParam(conn, dbNN.querys.account.selectAccountUserKey, [owner_pk, owner_pk, super_pk, super_pk]);

    await dbUtil.releaseConn(conn);

    return query_result;
}

module.exports.insertAccountUsersV = async (userArray) => {
    logger.debug("func - insertAccountUsersV");
    let cnt = 0;

    let insertAccountUserQuery = dbNN.querys.account.insertAccountUsers;
    //
    await util.asyncForEach(userArray, async(element, index) => {
        contractJson = element['contractJson'];

        let userAccount = await this.accountUserCheck(contractJson.contents.owner_pk, contractJson.contents.super_pk, contractJson.contents.account_id);

        if (!userAccount.length)
        {
            let account_num = account_module.createAccountCode();
            // logger.debug("account_num : " + account_num+ ", Bigint1 : " + BigInt(util.hexStrToBigInt(account_num)) + ", Bigint2 : " + BigInt(util.hexStrToBigInt(account_num)));

            insertAccountUserQuery += `(${contract_module.getMySubNetId()}, `;
            insertAccountUserQuery += `${BigInt(contractJson.create_tm)}, `; // create_tm
            insertAccountUserQuery += `${BigInt(0)}, `; // blk_num
            insertAccountUserQuery += `${BigInt(element.db_key)}, `;
            insertAccountUserQuery += `'${contractJson.contents.owner_pk}', `;
            insertAccountUserQuery += `'${contractJson.contents.super_pk}', `;
            insertAccountUserQuery += `${BigInt(util.hexStrToBigInt(account_num))}, `; // TODO : account_num
            insertAccountUserQuery += `'${contractJson.contents.account_id}'),`;

            cnt ++;
        }
    });

    if (cnt)
    {
        const conn = await dbUtil.getConn();

        insertAccountUserQuery = insertAccountUserQuery.substr(0, insertAccountUserQuery.length - 1);
        // logger.debug("insertAccountUserQuery : " + insertAccountUserQuery);
    
        [query_result] = await dbUtil.exeQuery(conn, insertAccountUserQuery);
    
        await dbUtil.releaseConn(conn);
    }

}

///////////////////////////////////////////////////////
//
module.exports.insertScDelayedTxsV = async (contractJson) => {
    logger.debug("func - insertScDelayedTxsV");

    let insertScDelayedTxsQuery = dbNN.querys.sc.insertScDelayedTxs;

    insertScDelayedTxsQuery += `(${contract_module.getMySubNetId()}, `; // subnet_id
    insertScDelayedTxsQuery += `${BigInt(util.hexStrToBigInt(contractJson.create_tm))}, `; // create_tm
    insertScDelayedTxsQuery += `0, `; // excuted
    insertScDelayedTxsQuery += `${BigInt(util.hexStrToBigInt(contractJson.from_account))}, `; // from_account
    insertScDelayedTxsQuery += `${BigInt(util.hexStrToBigInt(contractJson.to_account))}, `; // to_account
    insertScDelayedTxsQuery += `${contractJson.type}, `; // type
    if (contractJson.type <= define.CONTRACT_DEFINE.KIND.SECURITY_TOKEN)
    {
        insertScDelayedTxsQuery += `${BigInt(util.hexStrToBigInt(contractJson.to_account))}, `; // dst_account
    }
    else if (contractJson.type <= define.CONTRACT_DEFINE.KIND.UTILITY_TOKEN)
    {
        insertScDelayedTxsQuery += `${BigInt(util.hexStrToBigInt(contractJson.contents.dst_account))}, `; // dst_account
    }
    insertScDelayedTxsQuery += `'${contractJson.contents.amount}', `; // amount
    insertScDelayedTxsQuery += `'${contractJson.signed_pubkey}', `; // signed_pubkey
    insertScDelayedTxsQuery += `'${JSON.stringify(contractJson)}')`;

    let query_result = await dbUtil.query(insertScDelayedTxsQuery);
}
