var webdriver = require('selenium-webdriver');
var chrome = webdriver.Capabilities.chrome();
var join = require('path').join || require('fs').join;
var driver;


var checkPrerequisitesCb = function(res){
	console.log(res);
	try{
		init();
	}catch(e){
		driver.quit();
		console.log(e);
	}
}

//Start setup/test runner page
var init = function(){
	chrome.set("chromeOptions",{
		'args':[
			//'--allow-legacy-extension-manifests',
			'--start-maximized',
			//'--no-first-run',
			//'--remote-debugging-port=9111',
			//'--enable-extension-timeline-api',
			'--user-data-dir='+join(__dirname,'userProfile'),
			//'--load-extension='+join(__dirname,'speedtracer/src/Release/speedtracerheadless')
			],
		'extensions':[]//[join(__dirname,'speedtracer/src/Release/speedtracer.crx')]
	});
	driver = new webdriver.Builder().
	   withCapabilities(chrome).
	   build();
	driver.manage().window().maximize();

	driver.get(join('file://',__dirname,'tests','index.html'));
	driver.executeScript("window.bla=42");
	driver.wait(function() {
	 return driver.getTitle().then(function(title) {
	   var res = title === 'Starting Application Profiling...';
	   if(res){
	   	//loadPageForProfiling();
	   }
		return res;
	 });
	}, 5000);
}

var loadPageForProfiling = function(){
	driver.get('http://localhost:8080/wtv/index.html');
	driver.wait(function() {
	 return driver.getTitle().then(function(title) {
	   var t =  title === 'Index';
	   console.log("OK:",t);
	return true;
	 });
	}, 5000);
}


require("./lib/check_prerequisites.js").checkPrerequisites(checkPrerequisitesCb,console.log,console.log,console.log);
