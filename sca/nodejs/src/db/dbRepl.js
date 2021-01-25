//
const util = require('./../utils/commonUtil.js');
const dbUtil = require('./../db/dbUtil.js');
const config = require("./../../config/config.js");
const define = require("./../../config/define.js");
const contract_module = require("./../contract/contract.js");
const logger = require('./../utils/winlog.js');

//
const replUserQuerys = {
    querys: [
        "DROP USER IF EXISTS ",
        "CREATE USER ",
        "GRANT REPLICATION SLAVE ON *.* TO ",
        "flush privileges",
    ]
}

const replMasterQuerys = {
    querys: [
        "SET GLOBAL server_id = ?",
        "SHOW VARIABLES LIKE 'server_id'",
        "SHOW MASTER STATUS"
    ]
}

//
const getReplInfo = async () => {
    let fileName = "";
    let filePosition = "";

    const conn = await dbUtil.getConn();

    [query_result] = await dbUtil.exeQuery(conn, replMasterQuerys.querys[2]);
    if(util.isQueryResultObject(query_result[0]))
    {
        if(query_result[0].hasOwnProperty('File'))
        {
            fileName = query_result[0].File;
            filePosition = query_result[0].Position;
        }
    }

    await dbUtil.releaseConn(conn);

    return { fileName : fileName, filePosition : filePosition };
}
module.exports.getReplInfo = getReplInfo;

const setReplMaster = async () => {
    // let fileName = "";
    // let filePosition = "";

    const conn = await dbUtil.getConn();

    [query_result] = await dbUtil.exeQueryParam(conn, replMasterQuerys.querys[0], contract_module.getMySubNetId());

    [query_result] = await dbUtil.exeQuery(conn, replMasterQuerys.querys[1]);

    await dbUtil.releaseConn(conn);

    let replInfo = await getReplInfo();

    return (replInfo);

    // [query_result] = await dbUtil.exeQuery(conn, replMasterQuerys.querys[2]);
    // if(util.isQueryResultObject(query_result[0]))
    // {
    //     if(query_result[0].hasOwnProperty('File'))
    //     {
    //         fileName = query_result[0].File;
    //         filePosition = query_result[0].Position;
    //     }
    // }

    // await dbUtil.releaseConn(conn);

    // return { fileName : fileName, filePosition : filePosition };
}
module.exports.setReplMaster = setReplMaster;

const startReplSlaves = async () => {
    let queryV = `START ALL SLAVES`;
    // logger.debug("STOP ALL SLAVES queries : " + queryV);
    await dbUtil.query(queryV);
}
module.exports.startReplSlaves = startReplSlaves;

const stopReplSlaves = async () => {
    let queryV = `STOP ALL SLAVES`;
    // logger.debug("STOP ALL SLAVES queries : " + queryV);
    await dbUtil.query(queryV);
}
module.exports.stopReplSlaves = stopReplSlaves;

const resetReplSlaves = async () => {
    await stopReplSlaves();

    const conn = await dbUtil.getConn();

    [query_result] = await conn.query(`SHOW ALL SLAVES STATUS`);
    // logger.debug("dropReplSlaves length : " + query_result.length);
    for(var i = 0; i < query_result.length; i++)
    {
        // for ( var keyNm in query_result[i]) {
        //     logger.debug("key : " + keyNm + ", value : " + query_result[i][keyNm]);
        // }

        let queries = `RESET SLAVE '${query_result[i]['Connection_name']}' ALL`;
        // logger.debug("RESET SLAVE queries : " + queries);
        await conn.query(queries);
    }
    
    await dbUtil.releaseConn(conn);
}
module.exports.resetReplSlaves = resetReplSlaves;

const setReplSlaveNN = async (subNetId, ip, logFile, logPos) => {
    let user;
    let pwd;
    let port;

    const conn = await dbUtil.getConn();

    // REPL_USER_NN
    user = define.DB_DEFINE.REPL_USERS[0] 
    pwd = config.MARIA_PATH_CONFIG.REPL_USERS[0];
    port = dbUtil.dbConfig.port;

    if (util.isMyIP(ip) === false)
    {
        let queries = `CHANGE MASTER 'repl_db_${subNetId}' TO `
                + `MASTER_HOST='${ip}', `
                + `MASTER_USER='${user}',`
                + `MASTER_PASSWORD='${pwd}',`
                + `MASTER_PORT=${port}, ` 
                + `MASTER_LOG_FILE='${logFile}', ` 
                + `MASTER_LOG_POS=${logPos}`;
        
        logger.debug("setReplSlaveNN query : " + queries);
        await conn.query(queries);
    }

    // let nnaIpArr = await cryptoUtil.getNnaIPs();
    // let subNetIdArr = await cryptoUtil.getNnaSubNetIds();

    // logger.debug("subNetIdArr.length : " + subNetIdArr.length);

    // await util.asyncForEach(subNetIdArr, async (nnaSubNetId, index) => {
    //     if ((util.isMyIP(ip) === false) && (ip === nnaIpArr[index]))
    //     {
    //         let queries = `CHANGE MASTER 'repl_db_${nnaSubNetId}' TO `
    //                 + `MASTER_HOST='${ip}', `
    //                 + `MASTER_USER='${user}',`
    //                 + `MASTER_PASSWORD='${pwd}',`
    //                 + `MASTER_PORT=${port}, ` 
    //                 + `MASTER_LOG_FILE='${logFile}', ` 
    //                 + `MASTER_LOG_POS=${logPos}`;
            
    //         logger.debug("setReplSlaveNN query : " + queries);
    //         await conn.query(queries);
    //     }
    // });

    await dbUtil.releaseConn(conn);
}
module.exports.setReplSlaveNN = setReplSlaveNN;

const dropReplUsers = async () => {
    let user;

    const conn = await dbUtil.getConn();

    await util.asyncForEach(define.DB_DEFINE.REPL_USERS, async (element, index) => {
        user = element;
        logger.debug("Replication Drop User : " + user);
    
        await util.asyncForEach(replUserQuerys.querys, async (element, index) => {
            if(index === define.DB_DEFINE.REPL_QUERY_INDEX.DROP_USER_INDEX)
            {
                element += `'${user}'@'%'`;
    
                [query_result] = await conn.query(element);
            }
        });
    });

    await dbUtil.releaseConn(conn);
}
module.exports.dropReplUsers = dropReplUsers;

const createReplUsers = async () => {
    let user;
    let pwd;

    const conn = await dbUtil.getConn();

    await util.asyncForEach(define.DB_DEFINE.REPL_USERS, async (element, index) => {
        user = element;
        pwd = config.MARIA_PATH_CONFIG.REPL_USERS[index];
        logger.debug("Replication user : " + user + ", pw : " + pwd);
    
        await util.asyncForEach(replUserQuerys.querys, async (element, index) => {
            if(index === define.DB_DEFINE.REPL_QUERY_INDEX.DROP_USER_INDEX)
            {
                element += `'${user}'@'%'`;
            }
            else if(index === define.DB_DEFINE.REPL_QUERY_INDEX.CREATE_USER_INDEX)
            {
                element += `'${user}'@'%' IDENTIFIED BY '${pwd}'`;
            }
            else if(index === define.DB_DEFINE.REPL_QUERY_INDEX.GRANT_REPL_INDEX)
            {
                element += user;
            }
            
            [query_result] = await conn.query(element);
        });
    });

    await dbUtil.releaseConn(conn);
}
module.exports.createReplUsers = createReplUsers;

module.exports.initReplication = async () => {
    // await dropReplUsers();
    await createReplUsers();
}
