//
const config = require('./../../config/config.js');
const define = require('./../../config/define.js');
const util = require('./../utils/commonUtil.js');
const dbUtil = require("./../db/dbUtil.js");
const dbIS = require("./../db/dbIS.js");
const logger = require('./../utils/winlog.js');

/////////////////////////////////////////////////////////////
// Shard
const shardQuerys = {
    userQuerys: [
        "DROP USER IF EXISTS ",
        "CREATE USER ",
        "GRANT ALL ON *.* TO ",
        "flush privileges",
    ]
}

module.exports.dropShardUser = async () => {
    let user;

    const conn = await dbUtil.getConn();

    await util.asyncForEach(define.DB_DEFINE.SHARD_USERS, async (element, index) => {
        user = element;
        logger.debug("SHARD user : " + user);

        await util.asyncForEach(shardQuerys.userQuerys, async (element, index) => {
            if(index === define.DB_DEFINE.SHARD_USERS_QUERY_INDEX.DROP_USER_INDEX) {
                element += `'${user}'@'%'`;

                [query_result] = await conn.query(element);
            }
        });
    });

    await dbUtil.releaseConn(conn);
}

module.exports.createShardUser = async () => {
    let user;
    let pwd;

    const conn = await dbUtil.getConn();

    await util.asyncForEach(define.DB_DEFINE.SHARD_USERS, async (element, index) => {
        user = element;
        pwd = config.MARIA_PATH_CONFIG.SHARD_USERS[index];

        logger.debug("SHARD user : " + user + ", pw : " + pwd);

        await util.asyncForEach(shardQuerys.userQuerys, async (element, index) => {
            if(index === define.DB_DEFINE.SHARD_USERS_QUERY_INDEX.DROP_USER_INDEX) {
                element += `'${user}'@'%'`;
            } else if(index === define.DB_DEFINE.SHARD_USERS_QUERY_INDEX.CREATE_USER_INDEX) {
                element += `'${user}'@'%' IDENTIFIED BY '${pwd}'`;
            } else if(index === define.DB_DEFINE.SHARD_USERS_QUERY_INDEX.GRANT_ALL_INDEX) {
                element += `'${user}'@'%' WITH GRANT OPTION`;
            }
                            
            [query_result] = await conn.query(element);
        });
    });

    await dbUtil.releaseConn(conn);
}

module.exports.initShard = async () => {
    await this.dropShardUser();
    await this.createShardUser();
}