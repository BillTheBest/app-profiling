

exports.checkPrerequisites = function(sCb, eCb, wCb, iCb){

	var checks = [checkHeadlessApi,checkUserProfileFolder];
	var s=[], e=[], w=[], checkCount=0;

	var res = function(checkIndex, type){
		return function(res){
			switch(type){
				case "s":
					checkCount++;
					s.push(res);
					break;
				case "e":
					console.error("# ERROR:", res);
					checkCount++;
					e.push(res);
					break;
				break;
				case "w":
					console.log("# Warning:", res);
					w.push(res);
					if (typeof wCb === "function") wCb(JSON.stringify(res));
					break;
				break;
				case "i":
					if (typeof iCb === "function") iCb(JSON.stringify(res));
					break;
				break;
				default: 
			}

			if(checkCount==checks.length){
				//call success handler if all prerequisites are met
				if (typeof sCb === "function" && e.length == 0) sCb(JSON.stringify(s));
				//call error handler if something went wrong
				if (typeof eCb === "function" && e.length != 0) eCb(JSON.stringify(e));
			}
		};
	};
	
	for (var i = checks.length - 1; i >= 0; i--) {
		var f = checks[i];
		if (typeof f != "function") continue;
		f(res(i,"s"),res(i,"e"),res(i,"w"),res(i,"i"));
	};

	return;
};

// depends on checkTracerAvailability
// "web_accessible_resources": ["headless_api.js"]
var checkHeadlessApi = function(sCb, eCb, wCb, iCb){
	checkTracerAvailability(function(res){
		try{
			var headlessApiManifest = require("../speedtracer/src/Release/speedtracerheadless/manifest.json");
			if(headlessApiManifest && headlessApiManifest.web_accessible_resources){
				sCb("{res:'web_accessible_resources ok'}");
			}else{
				iCb("# INFO: adding web_accessible_resources.");
				var fs = require('fs');
				headlessApiManifest.web_accessible_resources = ['headless_api.js'];
				fs.writeFile('./speedtracer/src/Release/speedtracerheadless/manifest.json', JSON.stringify(headlessApiManifest), function (err) {
				  (err) ? eCb(err) : sCb("{res:'adding web_accessible_resources ok'}");
				});
			}
		}catch(e){
			eCb((e)?e.toString():"checkHeadlessApi error.");
		} 
	}, eCb, wCb, iCb);

}

var checkTracerAvailability = function(sCb, eCb, wCb, iCb){
	try{
	require('fs').exists('./speedtracer/src/Release/speedtracerheadless/manifest.json', function (exists) {
  		if(exists){
  			sCb("{res:'speedtracerheadless ok'}");
  		}else{
  			eCb("{res:'speedtracerheadless not available. run: npm install'}");
  		}
	}); 
	}catch(e){
		eCb((e)?e.toString():"checkHeadlessApi_checkTracerAvailability error.");
	}
}

var checkUserProfileFolder = function(sCb, eCb, wCb, iCb){
	var fs = require('fs');
	fs.exists('./userProfile', function (exists) {
  		if(exists){
  			sCb("{res:'userProfile folder ok'}");
  		}else{
  			iCb("# INFO: creating userProfile folder.");
  			fs.mkdir('../userProfile', function (err, data) {
			  err?eCb(err):sCb("{res:'userProfile folder ok'}");
			});
  		}
	});
} 