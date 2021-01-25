//
const define = require('./../../config/define.js');

//
let separator = define.SOCKET_ARG.SEPARATOR;

//
module.exports.writeData = (socket, data) =>{
    let msg = data + separator;
    let result = socket.write(msg);
}

// 
module.exports.sendNetCmd = (socket, netCmd, netData) => {
    let msg = {};
    msg.cmd = netCmd;
    if (typeof netData !== 'undefined')
    {
        msg.data = netData;
    }
    else
    {
        msg.data = '';
    }
    
    let msgJson = JSON.stringify(msg);

    this.socketWrite(socket, msgJson);
}

//
module.exports.inet_ntoa = function(num){
    let nbuffer = new ArrayBuffer(4);
    let ndv = new DataView(nbuffer);
    ndv.setUint32(0, num);

    let a = new Array();
    for (var i = 0; i < 4; i++) {
        a[i] = ndv.getUint8(i);
    }
    return a.join('.');
}

module.exports.inet_aton = async function(str) {
    let nip = 0;
    await str.split('.').forEach((octet) => {
        nip <<= 8;
        nip+=parseInt(octet);
    });
    return (nip >>> 0);
}
