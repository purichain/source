//
const fs = require('fs');

//
const cryptoSsl = require("./../../../../addon/crypto-ssl");

//
const config = require('./../../config/config.js');
const define = require('./../../config/define.js');
const util = require('./../utils/commonUtil.js');
const dbUtil = require('./../db/dbUtil.js');
const logger = require('./../utils/winlog.js');

//
module.exports.handler = async (cmd) => {
    let retVal = true;

    logger.info('ISA CLI Received Data : ' + cmd);

    let cmdSplit = cmd.split(' ');

    if(cmdSplit[0] === 'key') 
    {
        let orgFilePath = cmdSplit[2];
        let orgFile = fs.readFileSync(orgFilePath);

        if (cmdSplit[1] === 'enc')
        {
            if (orgFilePath.includes('pem'))
            {
                //
                let dstFilePath = util.stringReplace(orgFilePath, 'pem', 'fin');

                //
                let keySeed = config.KEY_PATH.KEY_SEED;

                logger.debug("[CLI] orgFilePath : " + orgFilePath + ", dstFilePath : " + dstFilePath + ", keySeed : " + keySeed);

                //
                let result = cryptoSsl.aesEncFile(orgFilePath, dstFilePath, keySeed, keySeed.length);
            
                if (result = true)
                {
                    logger.info("[CLI] " + "SUCCSS");
                }
                else
                {
                    logger.error("[CLI] " + "ERROR 1");
                }
            }
            else
            {
                logger.error("[CLI] " + "ERROR 2");
            }
        }
        else // dec
        {
            //
            if (orgFilePath.includes('fin'))
            {
                //
                let keySeed = config.KEY_PATH.KEY_SEED;

                logger.debug("[CLI] orgFilePath : " + orgFilePath + ", keySeed : " + keySeed);

                let decFile = cryptoSsl.aesDecFile(orgFilePath, keySeed, keySeed.length);
                logger.info(decFile);
            }
            else
            {
                logger.error("[CLI] " + "ERROR 3");
            }
        }
    }
    else if(cmd.slice(0,9) === "act query"){
        await dbUtil.actQuery(cmd.slice(10));
    }
    else
    {
        retVal = false;
        logger.error("[CLI] " + cmd + ' is an incorrect command. See is --help');
    }

    return retVal;
}
