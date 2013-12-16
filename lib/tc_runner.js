var Chrome = require('chrome-remote-interface');
var fs = require('fs');
var join = require('path').join || fs.join ;


var deviceHandles = {};

var runTestCase = function(suite,caseNo,options,statusCb){

    tearDown();

    for(var device in suite.devices){
        if(suite.devices.hasOwnProperty(device)){
            deviceHandles[device]={};
            connectToChrome(device, suite.devices[device]["host"], suite.devices[device]["port"], (function(appUrl){ return function(name, chrome){
                deviceHandles[device].chrome = chrome;
                deviceHandles[device].appUrl = appUrl;
                deviceHandles[device].options = options;
                statusCb({"status":'connected to '+name});
                runner(suite,caseNo);
            }})(suite.devices[device]["url"]),statusCb );
        }
    }
};

var runner = function(suite,caseNo){


    var device = (function(){for(var device in deviceHandles) return deviceHandles[device];})();

    var outFile = join(device.options.path,device.options.suitefile.replace("json","")+caseNo+"."+Date.now()+".raw"),fileLocked=false;

    fs.appendFileSync(outFile, '[{},');

    with(device.chrome){
        on("event",function(e){
            if(!fileLocked && e){
                fs.appendFileSync(outFile, JSON.stringify(e));
                fs.appendFileSync(outFile, ",");
            }
        });
        Network.enable();
        Page.enable();
        Timeline.enable();
        Timeline.start();
        Page.navigate({'url': device.appUrl});


        var step = 0;
        var executeStep = function(){
            console.log({'expression':'console.timeStamp("'+suite.testCases[caseNo].steps[step].do+'")'});
            Runtime.evaluate({'expression':'console.timeStamp("'+suite.testCases[caseNo].steps[step].do+'")'});
            console.log({'expression':suite.testCases[caseNo].steps[step].js});
            Runtime.evaluate({'expression':suite.testCases[caseNo].steps[step].js});
            step++;
            if(step>=suite.testCases[caseNo].steps.length){
                //close the test run
                Timeline.stop();
                setTimeout(function(){
                    fileLocked=true;
                    fs.appendFileSync(outFile, '{"children":[]}]');
                    console.log("Test end.");
                },1000);
                return;
            }
            setTimeout(executeStep,parseInt(suite.testCases[caseNo].steps[step].dms));
        }
        setTimeout(executeStep,parseInt(suite.testCases[caseNo].steps[0].dms)+1000);
    }

}

var connectToChrome = function(name, host, port, connectCb,statusCb){
    Chrome({'host': host||'localhost', 'port': port||9222}, function (chrome) {
        connectCb(name, chrome);
    }).on('error', function () {
         statusCb({"error":'Cannot connect to Chrome'});
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