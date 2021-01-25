//
const fs = require('fs');

//
const config = require('./../../config/config.js');
const define = require('./../../config/define.js');
const cryptoUtil = require('./../sec/cryptoUtil.js');
const util = require('./../utils/commonUtil.js');
const dbUtil = require('./../db/dbUtil.js');
const logger = require('./../utils/winlog.js');

const GC_DEFINE = define.CONTRACT_DEFINE;

// New
module.exports.gcAddUserIS = async function(){
    //
    let myNetPubkey = GC_DEFINE.ED_PUB_IDX + await cryptoUtil.getMyPubkey();
    logger.info(myNetPubkey);

    let contractJson = {
        create_tm : util.getDateMS().toString(),
        fintech : GC_DEFINE.FINTECH.NON_FINANCIAL_TX,
        privacy : GC_DEFINE.PRIVACY.PUBLIC,
        fee : GC_DEFINE.FEE_DEFAULT,
        from_account : GC_DEFINE.FROM_DEFAULT,
        to_account : GC_DEFINE.TO_DEFAULT,
        type : GC_DEFINE.KIND.ADD_USER,
        contents : {
            owner_pk : myNetPubkey,
            super_pk : myNetPubkey,
            account_id : 'IS'
        },
        memo : ""
    };

    //
    let sig = await cryptoUtil.genSign(JSON.parse(JSON.stringify(contractJson)));
    contractJson.sig = sig;

    contractJson.signed_pubkey = myNetPubkey;

    return contractJson;
}

module.exports.gcCreateSecToken = async function(){
    //
    let myNetPubkey = GC_DEFINE.ED_PUB_IDX + await cryptoUtil.getMyPubkey();
    logger.info(myNetPubkey);

    let contractJson = {
        create_tm : util.getDateMS().toString(),
        fintech : GC_DEFINE.FINTECH.NON_FINANCIAL_TX,
        privacy : GC_DEFINE.PRIVACY.PUBLIC,
        fee : GC_DEFINE.FEE_DEFAULT,
        from_account : GC_DEFINE.FROM_DEFAULT,
        to_account : GC_DEFINE.TO_DEFAULT,
        type : GC_DEFINE.KIND.TOKEN_CREATION,
        contents : {
            owner_pk : myNetPubkey, //'05' + util.getRandomNumBuf(32).toString('hex'),
            super_pk : myNetPubkey, //'05' + util.getRandomNumBuf(32).toString('hex'),
            type : GC_DEFINE.KIND.SECURITY_TOKEN,
            name : "PURI",
            symbol : "pur",
            total_supply : "100000000000.0000",
            decimal_point : GC_DEFINE.MAX_DECIMAL_POINT,
            lock_time_from : "0",
            lock_time_to : "0",
            lock_transfer : 0,
            black_list : "",
            functions : ""
        },
        memo : ""
    };

    //
    let sig = await cryptoUtil.genSign(JSON.parse(JSON.stringify(contractJson)));
    contractJson.sig = sig;

    contractJson.signed_pubkey = myNetPubkey;

    return contractJson;
}
