//
const dbUtil = require('./../db/dbUtil.js');
const logger = require('./../utils/winlog.js');

//
module.exports.querys = {
    // block database
    block : {
        "selectLastBlkNumBlkContents" : `SELECT MAX(blk_num) as max_blk_num FROM block.blk_contents`,
    }, 
}

//
module.exports.selectMaxBlkNumFromBlkContents = async () => {
    const conn = await dbUtil.getConn();
    // await exeQuery(conn, dbNN.querys.useBlock);

    [query_result] = await dbUtil.exeQuery(conn, this.querys.block.selectLastBlkNumBlkContents);

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
