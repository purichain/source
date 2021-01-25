//
const redis = require('redis');
const ip = require("ip");

//
const config = require('./../../config/config.js');
const define = require('./../../config/define.js')
const netUtil = require('./../net/netUtil.js');
const redisHandler = require('./../net/redisHandler.js');
const util = require('./../utils/commonUtil.js');
const logger = require('./../utils/winlog.js');

//
let publisher;
let ctrlNotiSubscriber;
let cmdNotiSubscriber;

//
module.exports.setRedis = async (socket) => {
    publisher = redis.createClient(config.REDIS_CONFIG);
    ctrlNotiSubscriber = redis.createClient(config.REDIS_CONFIG); // between ISA and NNA
    cmdNotiSubscriber = redis.createClient(config.REDIS_CONFIG); // between ISA and SCA

    //subscribe -> waitting response FROM NNA
    ctrlNotiSubscriber.on("message", async function (ch, respMsg) {
        await redisHandler.subNnaCtrlNotiCB(socket, ch, respMsg);
    });
    ctrlNotiSubscriber.subscribe(config.REDIS_CH.CTRL_NOTI_ACKS);

    //subscribe -> waitting response FROM SCA
    cmdNotiSubscriber.on("message", async function (ch, respMsg) {
        await redisHandler.subScaCmdNotiCB(socket, ch, respMsg);
    });
    cmdNotiSubscriber.subscribe(config.REDIS_CH.CMD_NOTI_ACKS);
}

//
module.exports.write = async (ch, data) => {
    //publish -> send to data
    if (ch === config.REDIS_CH.CTRL_NOTI) {
        logger.debug(" [PUB] [" + ch + "] " + data);
        await publisher.publish(ch, data);
    }
    else if (ch === config.REDIS_CH.CMD_NOTI) {
        logger.debug(" [PUB] [" + ch + "] " + data);
        await publisher.publish(ch, data);
    }
}
