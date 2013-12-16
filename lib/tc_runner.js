var Chrome = require('chrome-remote-interface');


var deviceHandles = {};

var runTestCase = function(suite,caseNo,options,statusCb){

    tearDown();

    for(var device in suite.devices){
        if(suite.devices.hasOwnProperty(device)){
            deviceHandles[device]={};
            connectToChrome(device, suite.devices[device]["host"], suite.devices[device]["port"], function(name, chrome){
                deviceHandles[device].chrome = chrome;
                statusCb({"status":'connected to '+name});
                runner(suite,caseNo,chrome);
            },statusCb );
        }
    }
};

var runner = function(suite,caseNo,chrome){
console.log(caseNo);
    with(chrome){
        Network.enable();
        Page.enable();
        Timeline.enable();
        Timeline.start();
        Page.navigate({'url': 'http://localhost:8080/wtv/index.html'});
        var step = 0;
        var executeStep = function(){
            console.log(suite.testCases[caseNo-1].steps[step].do);
            Runtime.evaluate({'expression':suite.testCases[caseNo-1].steps[step].js});
            step++;
            if(step>=suite.testCases[caseNo-1].steps.length){
                return;
            }
            setTimeout(executeStep,suite.testCases[caseNo-1].steps[step].dms)
        }
        setTimeout(executeStep,suite.testCases[caseNo-1].steps[0].dms+1000);
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
        if(deviceHandles.hasOwnProperty(device)){
            deviceHandles[device].chrome.close();
        }
    }
    deviceHandles = {};
}


module.exports = {
    "runTestCase":runTestCase,
    "tearDown":tearDown
}