var Chrome = require('chrome-remote-interface');
var fs = require('fs');
var join = require('path').join || fs.join ;


var deviceHandles = {};

var runTestCase = function(suite,caseNo,options,statusCb){
    console.log("OPTION: ",options)

    tearDown();
    var noDevicesToCheck = 0;

    for(var device in suite.devices){
        if(suite.devices.hasOwnProperty(device)){
            noDevicesToCheck++;
        }
    }

    for(var device in suite.devices){
        if(suite.devices.hasOwnProperty(device)){
            deviceHandles[device]={};
             console.log(device);
            connectToChrome(device, suite.devices[device]["host"], suite.devices[device]["port"], (function(device, options){ return function(err, name, chrome){
                console.log(device,111);
                if(err) {
                    statusCb(err);
                    return;
                }
                deviceHandles[device].chrome = chrome;
                deviceHandles[device].device = device;
                deviceHandles[device].appUrl = suite.devices[device]["url"];
                deviceHandles[device].options = options;
                noDevicesToCheck--;
                if(noDevicesToCheck <= 0) {
                    statusCb({"status":'connected to all devices'});
                    runner(suite,caseNo);
                }
            }})(device, options)  );
            console.log(device);
        }
    }
};

var runner = function(suite,caseNo){


//console.log(1234,JSON.stringify(deviceHandles));
    for(var device in deviceHandles) { 
        console.log(1234,deviceHandles[device].options);
       // console.log(typeof deviceHandles[device],4444);
        deviceHandles[device].outFile=join(deviceHandles[device].options.path,deviceHandles[device].options.suitefile.replace("json","")+caseNo+"."+btoa(deviceHandles[device].device)+"."+Date.now()+".raw");
        deviceHandles[device].fileLocked=false;
        fs.appendFileSync( deviceHandles[device].outFile, '[');
        fs.appendFileSync( deviceHandles[device].outFile, JSON.stringify({"suite":suite,"description":deviceHandles[device].options.desc})+",");    
        with(deviceHandles[device].chrome){
            on("event",(function(device){ return function(e){
                if(!device.fileLocked && e){
                    fs.appendFileSync(device.outFile, JSON.stringify(e));
                    fs.appendFileSync(device.outFile, ",");
                }
            }})( deviceHandles[device]));
            Network.enable();
            Page.enable();
            Timeline.enable();
            Timeline.start();
            Page.navigate({'url': deviceHandles[device].appUrl});   
        }
    };

    var step = 0;
    var executeStep = function(){
        var device = suite.testCases[caseNo].steps[step].on;
        if(deviceHandles[device] && deviceHandles[device].chrome) with(deviceHandles[device].chrome){
            console.log({'expression':'console.timeStamp("'+suite.testCases[caseNo].steps[step].do+'")'});
            Runtime.evaluate({'expression':'console.timeStamp("'+suite.testCases[caseNo].steps[step].do+'")'});
            console.log({'expression':suite.testCases[caseNo].steps[step].js});
            Runtime.evaluate({'expression':suite.testCases[caseNo].steps[step].js});
        }
        step++;
        if(step>=suite.testCases[caseNo].steps.length){
            //close the test run
            if(deviceHandles[device] && deviceHandles[device].chrome) with(deviceHandles[device].chrome){
                Timeline.stop();
            }
            setTimeout(function(){
                deviceHandles[device].fileLocked=true;
                fs.appendFileSync(deviceHandles[device].outFile, '{"children":[]}]');
                console.log("Test end.");
            },1000);
            return;
        }
        setTimeout(executeStep,parseInt(suite.testCases[caseNo].steps[step].dms));
    }
    setTimeout(executeStep,parseInt(suite.testCases[caseNo].steps[0].dms)+1000);
    

}

var connectToChrome = function(name, host, port, statusCb){
    console.log("Trying to connect to "+host+":"+port);
    Chrome({'host': host||'localhost', 'port': port||9222}, function (chrome) {
        statusCb(null, name, chrome);
    }).on('error', function () {
         statusCb({"error":'Cannot connect to Chrome on '+name});
    });
};

var tearDown = function(){
    for(var device in deviceHandles){
        if(deviceHandles.hasOwnProperty(device) && deviceHandles[device].chrome){
            deviceHandles[device].chrome.close();
        }
    }
    deviceHandles = {};
}


module.exports = {
    "runTestCase":runTestCase,
    "tearDown":tearDown
}

//node btoa shim
function btoa(str) {
var buffer;

if (str instanceof Buffer) {
  buffer = str;
} else {
  buffer = new Buffer(str.toString(), 'binary');
}

return buffer.toString('base64');
}