//
const os = require('os');

//
const cryptoSsl = require("./../../../../addon/crypto-ssl");

//
const config = require('./../../config/config.js');
const define = require('./../../config/define.js');
const cryptoUtil = require('./../sec/cryptoUtil.js');
const util = require('./../utils/commonUtil.js');
const sock = require('./../net/socket.js');
const logger = require('./../utils/winlog.js');

//
module.exports.getHwInfo = async(my_role) => {
	// Get IP
    let ipArr = util.getMyIPs();
	
    // Get Lan Speed
    let lanSpeedArr = new Array();
    for(var i = 0; i<ipArr.length; i++)
    {
        lanSpeedArr[i] = 1000;
    }
    
	
	// Get CPU Name
    let cpuArr;
	
	// Get memory Size
    let memSizeArr;
	
	// Get memory Speed
    let memSpeed;
	
    // for VM Ware
    if (config.IS_VM === 1){
        cpuArr = [config.TEST_HW_INO.CPU];
        memSizeArr = [config.TEST_HW_INO.MEMSIZE];
        memSpeed = [config.TEST_HW_INO.MEMSPEED];
    }
    else{
        cpuArr = await util.getResultArr(define.HW_INFO.CPU_MODEL);
        memSizeArr = await util.parseIntArr(await util.getResultArr(define.HW_INFO.MEM_SIZE));
        memSpeed = await util.parseIntArrSum(await util.getResultArr(define.HW_INFO.MEM_SPEED));
    }

	// Get Storage Info
    let storageObject = await getStorageInfo();

	// Check Virtual Machine
    let virtualChecking1 = await getVirtualChecking(define.HW_INFO.HYPERVISOR, define.HW_INFO_KIND.VIRTUAL_CHK_1);
    let virtualChecking2 = await getVirtualChecking(define.HW_INFO.VIRTUALIZATION, define.HW_INFO_KIND.VIRTUAL_CHK_2);
	
    let pubKey = await cryptoUtil.getMyPubkey();
    let w_pubkey = '0';
    let sn = await getSN();
    let id = await util.getResult(define.HW_INFO.GET_ID);

    let myInfo = {
        myHwInfo:{
            network:{
                ip:ipArr,
                lanSpeed:lanSpeedArr
            },
            cpu:cpuArr,
            storage:storageObject,
            mem:{
                size:memSizeArr,
                speed:memSpeed
            },
            virtualChecking1:virtualChecking1,
            virtualChecking2:virtualChecking2,
            id:id,
            pubkey:pubKey,
            w_pubkey:w_pubkey,
            snHash:sn
        },
        myRole:my_role
    }
    logger.debug(JSON.stringify(myInfo));
    return JSON.stringify(myInfo);
}

const pushGbTb = (value, arr) => {
    if (value.slice(-1) === define.HW_INFO_KIND.LOCATE_SIZE_KIND.GIGA) {
        arr.push(parseInt(value.slice(0, -1)));
    }
    else if (value.slice(-1) === define.HW_INFO_KIND.LOCATE_SIZE_KIND.TERA) {
        arr.push((parseInt(value.slice(0, -1) * define.HW_INFO_KIND.LOCATE_SIZE_KIND.UNIT_CHANGE)));
    }
}

const getStorageInfo = async() => {
    let arr = util.getResultArr(define.HW_INFO.STORAGE_INFO);
    let hddRaidSize = new Array();
    let ssdRaidSize = new Array();
    let nvmeRaidSize = new Array();
    let hddRaidKind = "";
    let ssdRaidKind = "";
    let nvmeRaidKind = "";
    let hddSize = new Array();
    let ssdSize = new Array();
    let nvmeSize = new Array();
    let hddInfo;
    let ssdInfo;
    let nvmeInfo;

    for(var i = 0; i<arr.length; i++){
        var diskArg = arr[i].split("\"");
        // raid
        if(diskArg[define.HW_INFO_KIND.LOCATE_TYPE].slice(0,4) === define.HW_INFO_KIND.LOCATE_TYPE_KIND.RAID_ROTA){
            let masterRaid = arr[i-1].split("\"");
            if (masterRaid[define.HW_INFO_KIND.LOCATE_ROTA] === define.HW_INFO_KIND.LOCATE_ROTA_KIND.HDD_ROTA) {
                hddRaidKind = diskArg[define.HW_INFO_KIND.LOCATE_TYPE];
                await pushGbTb(masterRaid[define.HW_INFO_KIND.LOCATE_SIZE], hddRaidSize);
            }
            else if (masterRaid[define.HW_INFO_KIND.LOCATE_ROTA] === define.HW_INFO_KIND.LOCATE_ROTA_KIND.SDD_ROTA) {
                if (masterRaid[define.HW_INFO_KIND.LOCATE_NVME].slice(0, 4) === define.HW_INFO_KIND.LOCATE_NVME_KIND.NVME_ROTA) {
                    nvmeRaidKind = diskArg[define.HW_INFO_KIND.LOCATE_TYPE];
                    await pushGbTb(masterRaid[define.HW_INFO_KIND.LOCATE_SIZE], nvmeRaidSize);
                }
                else {
                    ssdRaidKind = diskArg[define.HW_INFO_KIND.LOCATE_TYPE];
                    await pushGbTb(masterRaid[define.HW_INFO_KIND.LOCATE_SIZE], ssdRaidSize);
                }
            }
        }
        else{
            // hdd
            if(diskArg[define.HW_INFO_KIND.LOCATE_ROTA] === define.HW_INFO_KIND.LOCATE_ROTA_KIND.HDD_ROTA){
                await pushGbTb(diskArg[define.HW_INFO_KIND.LOCATE_SIZE], hddSize);
            }
            else if(diskArg[define.HW_INFO_KIND.LOCATE_ROTA] === define.HW_INFO_KIND.LOCATE_ROTA_KIND.SDD_ROTA){
                // nvme
                if(diskArg[define.HW_INFO_KIND.LOCATE_NVME].slice(0,4) === define.HW_INFO_KIND.LOCATE_NVME_KIND.NVME_ROTA){
                    await pushGbTb(diskArg[define.HW_INFO_KIND.LOCATE_SIZE], nvmeSize);
                }
                // ssd
                else{
                    await pushGbTb(diskArg[define.HW_INFO_KIND.LOCATE_SIZE], ssdSize);
                }
            }
        }
    }

    if(hddSize.length === 0)
        hddSize.push(0);
    else if (ssdSize.length === 0)
        ssdSize.push(0);
    else if (nvmeSize.length === 0)
        nvmeSize.push(0);

    if(hddRaidKind){
        hddInfo = {
            size:hddSize,
            raid:{
                type:hddRaidKind,
                size:hddRaidSize
            }
        }
    }
    else{
        hddInfo = {
            size: hddSize,
            raid: {
                type: define.HW_INFO_KIND.RAID_NONE
            }
        }
    }
    if(ssdRaidKind){
        ssdInfo = {
            size: ssdSize,
            raid: {
                type: ssdRaidKind,
                size: ssdRaidSize
            }
        }
    }
    else{
        ssdInfo = {
            size: ssdSize,
            raid: {
                type: define.HW_INFO_KIND.RAID_NONE
            }
        }
    }
    if(nvmeRaidKind){
        nvmeInfo = {
            size: nvmeSize,
            raid: {
                type: nvmeRaidKind,
                size: nvmeRaidSize
            }
        }
    }
    else{
        nvmeInfo = {
            size: nvmeSize,
            raid: {
                type: define.HW_INFO_KIND.RAID_NONE
            }
        }
    }

    let storageInfo = {
        hdd:hddInfo,
        ssd:ssdInfo,
        nvme:nvmeInfo
    }

    return storageInfo;
}

const getVirtualChecking = async (cmd, check) => {
    let cmdResult = await util.getResultArr(cmd);
    if (cmdResult.indexOf(check) !== -1)
        return true;
    else
        return false;
}

const getSN = async () => {
    let boardSN = await util.getResult(define.HW_INFO.BOARD_SN);
    let systemUUID = await util.getResult(define.HW_INFO.SYSTEM_UUID);
    logger.debug("boardSN : " + boardSN);
    logger.debug("systemUUID : " + systemUUID);

    let buffer = Buffer.from(boardSN + systemUUID, config.CMD_ENCODING.encoding);
    let hash = await cryptoSsl.genSha256Str(buffer);

    return(hash);
}