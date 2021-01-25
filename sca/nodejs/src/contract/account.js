//
const config = require("./../../config/config.js");
const define = require("./../../config/define.js");
const iso31661 = require("./../../config/iso_3166_1.js");
const dbUtil = require("./../db/dbUtil.js");
const util = require("./../utils/commonUtil.js");
const logger = require("./../utils/winlog.js");

//
module.exports.getAreaCode  = (country, region) => {
    let countryCode = iso31661.COUNTRIES.ROK.NUM;
    let regionCode = iso31661.COUNTRIES.ROK.ISO_3166_2.SEOUL.NUM;

    switch (country)
    {
    case iso31661.COUNTRIES.ROK.ALPHA2 :
    case iso31661.COUNTRIES.ROK.ALPHA3 :
    {
        countryCode = iso31661.COUNTRIES.ROK.NUM;

        switch (region)
        {
        case iso31661.COUNTRIES.ROK.ISO_3166_2.SEOUL.STR :
            regionCode = iso31661.COUNTRIES.ROK.ISO_3166_2.SEOUL.NUM;
            break;

        case iso31661.COUNTRIES.ROK.ISO_3166_2.GYEONGGI.STR :
            regionCode = iso31661.COUNTRIES.ROK.ISO_3166_2.GYEONGGI.NUM;
            break;
        
        default :
            break;
        }
        break;
    }
    default :
        break;
    }

    let areaCode = util.paddy(parseInt(countryCode).toString(16), 3) + util.paddy(parseInt(regionCode).toString(16), 2);
    return areaCode;
}

module.exports.createAccountCode = (arg1, arg2) => {
    let account = 0;

    logger.debug("typeof arg1 : " + typeof arg1);

    if ((typeof arg1 === 'number')) // 'boolean'
    {
        let tokenNum = arg1;

        let acc_1 = parseInt(define.CONTRACT_DEFINE.ACCOUNT_TOKEN_DELI).toString(16);
        let acc_2 = util.paddy(parseInt(tokenNum).toString(16), 15);

        account = acc_1 + acc_2;

        logger.debug("tokenNum : " + tokenNum + ", acc_1 : " + acc_1 + ",  acc_2 : " + acc_2 + ", account : " + account);
    }
    else
    {
        const currentMs = util.getDateMS();
        let currentSec = (currentMs / 1000).toFixed(0);
        let mySec = util.paddy(parseInt(currentSec).toString(16), 8);

        let countryCode = typeof arg1 !== 'undefined' ? arg1 : config.LOCATION_JSON.LOC.COUNTRY;
        let regionCode = typeof arg2 !== 'undefined' ? arg2 : config.LOCATION_JSON.LOC.REGION;

        let randNum1 = util.getRandomNumBuf(1, define.CONTRACT_DEFINE.ACCOUNT_USER_DELI_MIN, define.CONTRACT_DEFINE.ACCOUNT_USER_DELI_MAX).toString('hex');
        let randNum2 = util.getRandomNumBuf(1).toString('hex');

        let myAreaCode = this.getAreaCode(countryCode, regionCode);
    
        account = randNum1.slice(1) + myAreaCode + randNum2 + mySec;
    
        logger.debug("randNum1 : " + randNum1.slice(1) + ", myAreaCode : " + myAreaCode + ", randNum2 : " + randNum2 + ", mySec : " + mySec + ", account : " + account);
    }

    return account;
}
