var Chrome = require('chrome-remote-interface');
var count=0;
Chrome(function (chrome) {
    with (chrome) {
        on('Network.requestWillBeSent', function (message) {
            //console.log(message.request.url);
        });
        Network.enable();
        Page.enable();
	on('Page.loadEventFired',function(){
		Runtime.evaluate({'expression':'document.getElementById("toadvancedbrowserbutton").click()'});
		setTimeout(function(){
Runtime.evaluate({'expression':'document.getElementsByClassName("textContent")[0].click()'});	
		setTimeout(function(){
Runtime.evaluate({'expression':'document.getElementsByClassName("nav_tl")[0].click()'});
		setTimeout(function(){
Runtime.evaluate({'expression':'document.getElementById("prepend").click()'});
		},1000);
		},1000);
		},1000);
//close();
	});
        Timeline.enable();
        on('Timeline.eventRecorded', function (event) {
            if(event.record.children.length){
//	console.log(count++,event);
}
//console.log(JSON.stringify(event.record.children));
        });
        on('Timeline.started', function (event) {
         //console.log("ststarted!");
        });
        on('Timeline.stopped', function (event) {
           // console.log("stopped!");
        });
        Timeline.start();
Page.navigate({'url': 'http://localhost:8080/wtv/index.html'});
      //  Page.navigate({'url': 'http://jsfiddle.net/HB22R/2/show/'});
setTimeout(function(){close();console.log("end")},1000*60);
    }
}).on('error', function () {
    console.error('Cannot connect to Chrome');
});
