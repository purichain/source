//
const config = require('./../../config/config.js');
const define = require('./../../config/define.js');
const cliHandler = require('./../cli/cliHandler.js');
const dbUtil = require('./../db/dbUtil.js');
const dbIS = require('./../db/dbIS.js');
const netUtil = require('./../net/netUtil.js');
const netConf = require('./../net/netConf.js');
const netSend = require('./../net/netSend.js');
const util = require('./../utils/commonUtil.js');
const logger = require('./../utils/winlog.js');

// Replication Reset
module.exports.resetReplData = async () => {
    logger.debug("func : resetReplData");

    await dbUtil.query(dbIS.querys.truncateIsReplInfo);
}

// Replication Get
module.exports.getReplData = async (blkNum, role, clusterP2pAddr) => {
    logger.debug("func : getReplData");

    let query_result;
    if (typeof blkNum === 'undefined')
    {
        query_result = await dbUtil.query(dbIS.querys.repl_info.select_repl_info);
    }
    else if (typeof role === 'undefined')
    {
        query_result = await dbUtil.queryPre(dbIS.querys.repl_info.select_repl_info_bn, [blkNum]);
    }
    else if (typeof clusterP2pAddr === 'undefined')
    {
        query_result = await dbUtil.queryPre(dbIS.querys.repl_info.select_repl_info_role, [blkNum, role]);
    }
    else
    {
        query_result = await dbUtil.queryPre(dbIS.querys.repl_info.select_repl_info_role_p2p, [blkNum, role, clusterP2pAddr]);
    }
    

    if (query_result.length === 0)
    {
        logger.error("Error - getReplData");
    }

    return query_result;
}

// Replication Set 1
module.exports.saveReplData = async(socket, jsonData) => {
    logger.debug("func : saveReplData");

    let remoteIpStr = ((socket.remoteAddress).slice(7)).toString();

    // let replData = jsonData.ip + " " + define.NODE_ROLE.STR.NN + " " + jsonData.data;
    // logger.debug("replData : " + replData);

    let clusterInfo = await dbUtil.queryPre(dbIS.querys.cluster_info.cluster_get, [remoteIpStr]);

    if (clusterInfo.length && (clusterInfo[0].role !== null))
    {
        let splitData = jsonData.data.split(" ");
        let logFile = splitData[0];
        let logPos = splitData[1];
        // INSERT INTO is.repl_info(subnet_id, blk_num, ip, role, log_file, log_pos, cluster_p2p_addr) values(?, ?, ?, ?, ?, ?)
        await dbUtil.queryPre(dbIS.querys.repl_info.insert_repl_info, [define.P2P_DEFINE.P2P_SUBNET_ID_IS, netConf.getLastBlkNum(), jsonData.ip, clusterInfo[0].role, logFile, logPos, clusterInfo[0].cluster_p2p_addr]);
    }
}

module.exports.getReplDataArr = async (blkNum, role, clusterP2pAddr) => {
    let replDataArr = new Array();

    let replData = await this.getReplData(blkNum, role, clusterP2pAddr);

    if (replData.length)
    {
        for(var i = 0; i < replData.length; i++)
        {
            // 
            // replDataArr.push({data : replData[i].repl_data});
            // blk_num, ip, role, log_file, log_pos, cluster_p2p_addr
            replDataArr.push({blk_num : replData[i].blk_num, ip : replData[i].ip, role : replData[i].role, 
                    log_file : replData[i].log_file, log_pos : replData[i].log_pos, cluster_p2p_addr : replData[i].cluster_p2p_addr});
        }
    }
    else
    {
        logger.error("Error - getReplDataArr : No replDataArr");
    }

    return replDataArr;
}

// Replication Set 1
module.exports.setReplNN = async (map, blkNum) => {
    logger.debug("func : setReplNN");

    let replDataArr = await this.getReplDataArr(blkNum, define.NODE_ROLE.NUM.NN);
    if (replDataArr.length !== 0)
    {
        netSend.writeSome(map, define.CMD.db_repl_set_res, replDataArr, dbIS.querys.node_cons_info.get_ip_info, define.NODE_ROLE.NUM.NN);
    }
}

module.exports.setReplISAg = async (map, blkNum) => {
    logger.debug("func : setReplISAg");

    let isgNodeInfoList = await dbUtil.queryPre(dbIS.querys.node_cons_info.get_ip_p2p_info, [define.NODE_ROLE.NUM.ISAG]);

    if (isgNodeInfoList.length && isgNodeInfoList[0].p2p_addr !== null)
    {
        for (let idx=0; idx<isgNodeInfoList.length; idx++)
        {
            let isgNodeInfo = isgNodeInfoList[idx];

            logger.debug("isgNodeInfo.ip : " + isgNodeInfo.ip + "isgNodeInfo.p2p_addr : " + isgNodeInfo.p2p_addr);

            let replDataArr = await this.getReplDataArr(blkNum, define.NODE_ROLE.NUM.NN, isgNodeInfo.p2p_addr.slice(0, 14));

            if (replDataArr.length !== 0)
            {
                netUtil.sendNetCmd(map.get(netUtil.inet_ntoa(isgNodeInfo.ip)), define.CMD.db_repl_set_res, replDataArr);
            }
        }
    }
}
