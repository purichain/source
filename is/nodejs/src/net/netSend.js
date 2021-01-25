//
const fs = require('fs');
const iplocation = require('iplocation').default;
const distance = require('gps-distance');

//
const config = require('./../../config/config.js');
const define = require('./../../config/define.js');
const dbUtil = require('./../db/dbUtil.js');
const dbIS = require('./../db/dbIS.js');
const netUtil = require('./../net/netUtil.js');
const netConf = require('./../net/netConf.js');

const logger = require('./../utils/winlog.js');

// 
module.exports.writeSome = async(map, netCmd, netData, queryV, arg) => {
    logger.debug("queryV : " + queryV);

    let ipInfo;

    if (typeof arg !== 'undefined')
    {
        ipInfo = await dbUtil.queryPre(queryV, [arg]);
    }
    else
    {
        ipInfo = await dbUtil.query(queryV);
    }
    
    if (ipInfo.length)
    {
        for (var i = 0; i < ipInfo.length; i++)
        {
            netUtil.sendNetCmd(map.get(netUtil.inet_ntoa(ipInfo[i].ip)), netCmd, netData);
        }
    }
    else
    {
        logger.error("Error - No Data from XXX table");
        return false;
    }

    return true;
}

module.exports.writeSomeNoData = async(map, netCmd, queryV, arg) => {
    let retVal;
    let netData;

    retVal = await this.writeSome(map, netCmd, netData, queryV, arg);

    return retVal;
}

// Forward the netCfg you created to the role.
module.exports.sendNetConf = async (map) => {
    let nodeList = await dbUtil.query(dbIS.querys.node_cons_info.node_list);

    if (!nodeList.length)
    {
        return false;
    }

    let rrnetData = fs.readFileSync(netUtil.makeFileName(config.NET_CONF_PATH.RR_NET, null)).toString();

    for(var j = 0; j < nodeList.length; j++)
    {
        let idx = (nodeList[j].idx).toString();
        let sendData;

        // NN
        if (nodeList[j].role == define.NODE_ROLE.NUM.NN)
        {
            let nodeData = fs.readFileSync(netUtil.makeFileName(config.NET_CONF_PATH.NODE_NN, idx)).toString();

            sendData = {
                data1:rrnetData,
                data3:nodeData,
                data4:define.NODE_ROLE.STR.NN
            }
        }
        // ISAg
        else if (nodeList[j].role === define.NODE_ROLE.NUM.ISAG)
        {
            sendData = {
                data4: define.NODE_ROLE.STR.ISAG
            }
        }
        // // DN
        // else if (nodeList[j].role === define.NODE_ROLE.NUM.DN)
        // {
        //     sendData = {
        //         data4:define.NODE_ROLE.STR.DN
        //     }
        // }
        // DBN
        else if (nodeList[j].role === define.NODE_ROLE.NUM.DBN)
        {
            sendData = {
                data4: define.NODE_ROLE.STR.DBN
            }
        }

        // netUtil.sendNetCmd(map.get(netUtil.inet_ntoa(nodeList[j].ip)), define.CMD.net_save_res, JSON.stringify(sendData));
        netUtil.sendNetCmd(map.get(netUtil.inet_ntoa(nodeList[j].ip)), define.CMD.net_save_res, sendData);
    }

    return true;
}

// 
module.exports.sendNetUpdate = async (map) => {
    let nodeList = await dbUtil.query(dbIS.querys.node_cons_info.node_list);

    if (!nodeList.length)
    {
        return false;
    }

    for(var j = 0; j < nodeList.length; j++)
    {
        let sendData = {
            data1:nodeList[j].p2p_addr,
        }

        // netUtil.sendNetCmd(map.get(netUtil.inet_ntoa(nodeList[j].ip)), define.CMD.net_update_res, JSON.stringify(sendData));
        netUtil.sendNetCmd(map.get(netUtil.inet_ntoa(nodeList[j].ip)), define.CMD.net_update_res, sendData);
    }

    return true;
}
