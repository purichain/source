//
const os = require("os");
const execSync = require('child_process').execSync;

//
const config = require('./../../config/config.js');
const define = require('./../../config/define.js');

//
module.exports.asyncForEach = async (array, callback) => {
    for(let index = 0; index < array.length; index++)
    {
        await callback(array[index], index, array);
    }
}

//
module.exports.checkIP = (ipAddr) => {
    if(define.REGEX.IP_ADDR_REGEX.test(ipAddr))
    {
        return true;
    }
    return false;
}

module.exports.getMyIPs = () => {
    const nets = os.networkInterfaces();
    let myIpArr = new Array();

    for (const name of Object.keys(nets))
    {
        for (const net of nets[name])
        {
            // skip over non-ipv4 and internal (i.e. 127.0.0.1) addresses
            if (net.family === 'IPv4' && !net.internal)
            {
                myIpArr.push(net.address);
                // logger.debug("Net Name : " + name + ", IP : " + net.address);
            }
        }
    }

    return myIpArr;
}

module.exports.getMyCtrlIP = () => {
    let localIPs = this.getMyIPs();
    localIP = localIPs[1];

    return (localIP);
}

module.exports.getMyDataIP = () => {
    let localIPs = this.getMyIPs();
    localIP = localIPs[2];

    return (localIP);
}

module.exports.getMyReplIP = () => {
    let localIPs = this.getMyIPs();
    localIP = localIPs[2];

    return (localIP);
}

module.exports.isMyIP = (ip) => {
    const nets = os.networkInterfaces();

    for (const name of Object.keys(nets))
    {
        for (const net of nets[name])
        {
            // skip over non-ipv4 and internal (i.e. 127.0.0.1) addresses
            if (net.family === 'IPv4' && !net.internal)
            {
                if (ip === net.address)
                {
                    return true;
                }
            }
        }
    }

    return false;
}

//
module.exports.padding = (data, len, separator) => {
    if(separator === define.COMMON_DEFINE.PADDING_DELIMITER.FRONT)
    {
        while(data.length < len)
        {
            data = "0" + data;

            if(data.length === len) break;
            else continue;
        }
    }
    else if(separator === define.COMMON_DEFINE.PADDING_DELIMITER.BACK)
    {
        while(data.length < len)
        {
            data = data + "0";

            if(data.length === len) break;
            else continue;
        }
    }
    return data;
}

module.exports.paddy = (num, padLen, padChar) => {
    let pad_char = typeof padChar !== 'undefined' ? padChar : '0';
    let pad = new Array(1 + padLen).join(pad_char);

    return (pad + num).slice(-pad.length);
}

// Left Padding with '0'
module.exports.leftPadding = (n, width)=>{
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join('0') + n;
}

// Right Padding with '0'
module.exports.rightPadding = (n, width) => {
    n = n + '';
    return n.length >= width ? n : n + new Array(width - n.length + 1).join('0');
}

//
module.exports.isIntegerValue = (strNum) => {
    return Number.isInteger(parseInt(strNum));
}

module.exports.isArray = (arr) => {
    // return (!!arr) && (arr.constructor === Array);
    return Array.isArray(arr);
}

module.exports.isObject = (obj) => {
    return (!!obj) && (obj.constructor === Object);
}

module.exports.isQueryResultObject = (variable) => {
    return variable === Object(variable);
}

module.exports.isJsonString = (str) =>{
    try
    {
        var isObj = JSON.parse(str);

        if (isObj && typeof isObj === "object")
        {
            return true;
        }
    }
    catch (e)
    {
        return false;
    }
    
    return false;
}

//
module.exports.bytesToBuffer = (bytes) => {
    var buff = Buffer.alloc(bytes.byteLength);
    var view = new Uint8Array(bytes);
    
    for(var i = 0; i < buff.length; i++)
    {
        buff[i] = view[i];
    }
    return buff;
}

//
module.exports.stringSplit = (text, separator, limit) => {
    let splitArray;

    if(limit !== null)
    {
        text = text.split(separator, limit);     
    }
    else
    {
        text = text.split(separator);
    }
    splitArray = [...text];
    return splitArray;
}

module.exports.stringReplace = (str, searchStr, replaceStr) => {
    return str.split(searchStr).join(replaceStr);
}

// module.exports.hexStr2u64 = (hexStr) => {
//     let num = BigInt('0x' + hexStr);
//     return num;
// }

module.exports.appendHexPrefix = function(data){
    return '0x'+data;
}

module.exports.hexStrToBigInt = (hexStr) => { // Big Number
    // https://coolaj86.com/articles/convert-hex-to-decimal-with-js-bigints/
    // let num = parseInt(hexStr, 16);
    let num = BigInt('0x' + hexStr);
    return num;
}

// module.exports.intToHexStr = (num) => { // Not Big Number
//     // logger.debug("100000000000000B : " + BigInt('1152921504606846987').toString(16));
//     let hexStr = Number(num).toString(16);
//     return hexStr;
// }

module.exports.intArrToChar = (arr) => {
    var i, str = '';

    for (i = 0; i < arr.length; i++)
    {
        str += '%' + ('0' + arr[i].toString(16)).slice(-2);
    }
    str = decodeURIComponent(str);

    return str;
}

module.exports.intToStr = (num) => {
    let hexStr = Number(num).toString();
    return hexStr;
}

module.exports.strToInt = (str) => {
    let num = parseInt(str);
    return num;
}

module.exports.copyObj = (obj) => {
    var clone = {};
    for (var i in obj)
    {
        if(typeof(obj[i]) === "object" && obj[i] != null)
        {
            clone[i] = this.copyObj(obj[i]);
        }
        else
        {
            clone[i] = obj[i];
        }

    }

    return clone;
}

/**
 * Returns a random number between min (inclusive) and max (exclusive)
 */
module.exports.getRandomInt_ = (min, max) => {  
    return (Math.floor(
        Math.random() * (max - min) + min
    ));
}

/**
 * Returns a random number between min (inclusive) and max (inclusive)
 */
module.exports.getRandomInt = (min, max) => {  
    const num = Math.floor(Math.random() * (max - min + 1) + min);
    //console.log(num);

    return (num);
}

module.exports.getRandomNumBuf = (len) => {
    var buff = Buffer.alloc(len);

    for(var i = 0; i < buff.length; i++)
    {
        buff[i] = this.getRandomInt(0, 255);
    }

    return buff;
}

module.exports.sleep = (ms) => {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
}

module.exports.chkDelayTimeInMS = (prvTime, nowTime) => {
    let delayTime = delayTime - prvTime;

    return (delayTime);
}

module.exports.timeStampMS = async() => {
    return String(Math.floor(+ new Date()));
}

module.exports.timeStampSEC = async() => {
    return String(Math.floor(+new Date()/1000));
}

module.exports.getDateMS = () => {
    let msec = Date.now();

    return msec;
}

//////////////////////////////////////
// ExecSync
// 
module.exports.getCmdStr = (cmd) => {
    return cmd.split(os.EOL)[0];
}

module.exports.getCmdStrArr = (cmd) => {
    let arr = cmd.split(os.EOL);
    arr.pop();

    return arr;
}

module.exports.getResult = async (cmd) => {
    let cmdResult = execSync(cmd, config.CMD_ENCODING);

    return this.getCmdStr(cmdResult);
}

module.exports.getResultArr = async(cmd) => {
    let cmdResult = execSync(cmd, config.CMD_ENCODING);
    
    return this.getCmdStrArr(cmdResult);
}

module.exports.parseIntArrSum = (arr) => {
    let result = 0;
    for(var i = 0; i < arr.length; i++)
    {
        result += parseInt(arr[i]);
    }

    return result;
}

module.exports.parseIntArr = (arr) => {
    let retArr = new Array();
    for(var i = 0; i<arr.length; i++)
    {
        retArr[i] = parseInt(arr[i]);
    }

    return retArr;
}

//
