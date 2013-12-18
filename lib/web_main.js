var express = require('express');
var app = express();
var fs = require('fs');
var join = require('path').join || fs.join ;
var tcRunner = require('./tc_runner.js');

var web_root = join(__dirname,'..','tests','web_root');
var tests_root = join(__dirname,'..','tests');

app.use('/', express.static(web_root));
app.use(express.bodyParser());

//get all available testsuites
app.get('/testsuites/', function(req, res){
	var testSuites = [];
	var fileCbCountdown = 0;
	fs.readdir(tests_root, function(err, files){
		for (var i = files.length - 1; i >= 0; i--) {
			if(files[i].indexOf(".json")!= -1){
				fileCbCountdown++;
				try{
					fs.readFile(join(tests_root,files[i]), 'utf8', (function(fileName){ return function (err, data) {
						data = JSON.parse(data);
					  if (err) {
					    console.log(err,'Error reading file: '+fileName);
					  }else{
					  	var testCases = [];
					  	for (var j = 0; data.testCases.length>j; j++) {
					  		testCases.push(data.testCases[j].testcaseTitle);
					  	};
					  	testSuites.push({"name":fileName,"title":data.testsuiteTitle,"testCases":testCases});
					  }
					  fileCbCountdown--;
					  if(fileCbCountdown<=0)
					  	res.send(testSuites);
					}  })(files[i]));
					
				}catch(e){console.log(e,"Testsuite file might be corrupt.");}
			}
		};
	});
});

//get all available testsuites
app.get('/profiles/', function(req, res){
	var profiles = {};
	fs.readdir(tests_root, function(err, files){
		for (var i = files.length - 1; i >= 0; i--) {
			if(files[i].indexOf(".raw")!= -1){
				var parts = files[i].split(".");
				if(parts.length>=4){
					if(!profiles[parts[0]]){
						profiles[parts[0]]={};
					}
					if(!profiles[parts[0]][parts[1]]){
						profiles[parts[0]][parts[1]]=[];
					}
					var result = {"timestamp":parts[2]};
					try{
						var contents = fs.readFileSync(join(tests_root,files[i]), 'utf8');
						contents = JSON.parse(contents);
						if(contents.length){
							result.description=contents[0].description;
							result.testCaseName=contents[0].suite.testCases[parts[1]].testcaseTitle;							
						}
					}catch(e){console.log(e)}

					profiles[parts[0]][parts[1]].push(result);
				}
			}
		};
		res.send(profiles);
	});
});

//read a testsuite from file
app.get('/testsuite/:file', function(req, res){
	try{
		fs.readFile(join(tests_root,(req.params.file)?req.params.file:""), function (err, data) {
		  if (err) {
		    console.log(err,'Error reading file.');
		    res.send({});
		    return;
		  }
		  res.send(JSON.parse(data));
		});
		
	}catch(e){console.log(e,"Testsuite file might be corrupt or not present.");res.send({});}
  
});

//save a testsuite back to file
app.post('/testsuite/:file', function(req, res){
	try{
		//posting an empty testsuite we interpret as deletion
		if(!req.body || JSON.stringify(req.body)=="{}"){
			if(typeof req.params.file === "string" && req.params.file.indexOf("..")==-1){
				fs.exists(join(tests_root,req.params.file), function (exists) {
	  				if(exists){
						fs.unlink(join(tests_root,req.params.file), function (err) {
				  			if (err) return res.send({"error":"deleting failed."});
				  			res.send({});
						});
	  				}
				});
			}else{
				res.send({"error":"deleting failed."});
			}
		} else {
			fs.writeFile(join(tests_root,req.params.file), JSON.stringify(req.body), function (err) {
	  			if (err) return res.send({"error":"saving failed."});
	  			res.send({});
			});
		}
	}catch(e){console.log(e,"");res.send({"error":"saving/deleting failed."});}
  
});

//start testcase
app.get('/testsuite/:file/testcase/:case', function(req, res){
	try{
console.log(req);
		fs.readFile(join(tests_root,(req.params.file)?req.params.file:""), function (err, data) {
			if (err) {
				console.log(err,'Error reading file.');
				res.send({});
				return;
			}
			tcRunner.runTestCase(JSON.parse(data),req.params.case,{"path":tests_root,"suitefile":req.params.file, "desc":req.query.desc},function(result){
				res.send(result);
			});
		});

		
	}catch(e){console.log(e,"Testsuite file might be corrupt or not present.");res.send({});}
  
});


//Reporting
//create report

var reports = {};
var executions_description = {};

app.get('/report/:tsprefix/testcase/:tcnumber', function(req, res){
	reports = {};
    executions_description = {};
	fs.readdir(tests_root, function(err, files){
		var validFiles = 0;
		for (var x = files.length - 1; x >= 0; x--) {
			if(files[x].indexOf(".raw")!= -1){
				var parts = files[x].split('.');
				if(parts[0] === req.params.tsprefix && parts[1] === req.params.tcnumber){
					validFiles++;
					console.log("Add to parse list : " + files[x]);
					var report_id = parts[2];
					reports[report_id] = {
						heap : [],
						functions : {},
						globals : {numFunctions:0, totTime:0},
						maxHeap : 0,
						timestamps : [],
						websocketframe_received_count : 0,
						websocketframe_sent_count : 0,
						websocketframe_received_bytes : 0,
						websocketframe_sent_bytes : 0,
						fileName : files[x]
					};

					try{
						var filePath = join(tests_root,reports[report_id].fileName);
						fs.readFile(filePath, 'utf8', (function(report_id){ return function (err, str) {
							if (err) {
					    		console.log(err,'Error reading file.');
					    		res.send({});
					    		return;
					  		}
							var data = JSON.parse(str);
							var previousFunctionTime = 0;
							var startTimestamp = 0;
							if(data.length){
                                console.log("Add "+report_id);
								executions_description[report_id] = data[0].description;
							}

							for(var i=1; i<data.length; i++){
								;
					        	if(data[i].method == "Network.webSocketFrameReceived"){
					        		reports[report_id].websocketframe_received_count++;
					        		reports[report_id].websocketframe_received_bytes += JSON.stringify(data[i].params.response.payloadData).length;
					        		//console.log("received: %s, payload: %s", received_count++, JSON.stringify(data[i].params.response.payloadData).length);
					        	}
					        	if(data[i].method == "Network.webSocketFrameSent"){
					        		reports[report_id].websocketframe_sent_count++;
					        		reports[report_id].websocketframe_sent_bytes += JSON.stringify(data[i].params.response.payloadData).length;
					        	}
					            // console.log("Start: %s , Stop: %s , Type: %s", 
					            //             data[i].startTime, data[i].endTime, data[i].type);
					            var children = (data[i] && data[i].params && data[i].params.record)?data[i].params.record.children:false;
					            if (children) for(var j=0; j<children.length; j++){
					                //console.log("\tStart: %s , Stop: %s , Type: %s , UsedHeapSize: %s",
					                //            children[j].startTime, children[j].endTime, children[j].type, children[j].usedHeapSize);
					                if(!reports[report_id].functions[children[j].type])
					                    reports[report_id].functions[children[j].type] = {count:0, time:0};
					                
					                reports[report_id].functions[children[j].type].count++;
					                reports[report_id].globals.numFunctions++; 

					                if(startTimestamp == 0){
					                	startTimestamp = children[j].startTime;

					                }

					                if(children[j].startTime && children[j].endTime){
					                    var elapsedTime = children[j].startTime -startTimestamp - previousFunctionTime;
					                    reports[report_id].functions[children[j].type].time += elapsedTime;
					                    reports[report_id].globals.totTime += elapsedTime;
					                    previousFunctionTime = children[j].startTime -startTimestamp;
					                }
					                reports[report_id].heap.push([children[j].startTime, children[j].usedHeapSize]);

					                if(children[j].usedHeapSize > reports[report_id].maxHeap)
					                	reports[report_id].maxHeap = children[j].usedHeapSize;

					                //check for timeStamps
					                if(children[j].type = "FunctionCall"){
					                	if(children[j].children){
					                		var children2 = children[j].children;
					                		for(var z=0; z<children2.length; z++){
					                			if(children2[z].type == "TimeStamp"){
					                				var time = reports[report_id].functions[children[j].type].time;
					                				reports[report_id].timestamps.push({timestamp: (children[j].startTime - startTimestamp), description: children2[z].data.message});
					                			}
					                		}
					                	}
					                }
					            }
					        }
					        console.log("\n\nReport for " + report_id);
						    for(var i in reports[report_id].functions){
						        console.log(i+ " :  #=%s, time[ms]=%s",
						                    reports[report_id].functions[i].count, reports[report_id].functions[i].time);
						    }

						    console.log("webSocketFrameSent : #%s, bytes: %s" , reports[report_id].websocketframe_sent_count, reports[report_id].websocketframe_sent_bytes);
						    console.log("webSocketFrameReceived : #%s, bytes: %s" , reports[report_id].websocketframe_received_count, reports[report_id].websocketframe_received_bytes);
						    console.log("Total Number of functions : "+reports[report_id].globals.numFunctions);
						    console.log("Total Time elapsed : "+reports[report_id].globals.totTime);

						    validFiles--;
							if(validFiles<=0){
								res.send({"status":"ok"});
                            }
				        }})(report_id));
					}
					catch(e){console.log(e,"Report file might be corrupt or not present.");return false;}			
				}
			}
		}
	});
});

app.get('/heap/', function(req, res){
    console.log("Required Heap");
    var heap_data = {};
    var max_heap_data = {};
    var executions_data = [];

    var sorted_keys = Object.keys(reports).sort();
    for(var j=0; j<sorted_keys.length; j++){
        var report_id = sorted_keys[j];
    	heap_data[report_id] = [];
    	var heap = reports[report_id].heap;
	    if(heap.length > 0){
	        heap_data[report_id].push([0, heap[0][1]]);
	        for(var i=1; i<heap.length; i++){
	            var tmp_time = heap_data[report_id][i-1][0] + (heap[i][0]-heap[i-1][0]);
	            heap_data[report_id].push([tmp_time, heap[i][1]]); //byte
	            max_heap_data[report_id] = reports[report_id].maxHeap;
	        }
	    }
        executions_data.push(executions_description[report_id]);
    }
    
    var data = {data: heap_data, max:max_heap_data, executions:executions_data};
    var body = JSON.stringify(data);
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Length', body.length);
    res.end(body);
});


app.get('/functionstime/', function(req, res){
    console.log("Required Functions");
    var functions_data = {};
    var executions_data = [];
    
    var sorted_keys = Object.keys(reports).sort();
    for(var j=0; j<sorted_keys.length; j++){
        var report_id = sorted_keys[j];
    	for(var i in reports[report_id].functions){
    		if(!functions_data[i])
    			functions_data[i] = [];
    		functions_data[i].push(reports[report_id].functions[i].time);
    	}
        executions_data.push(executions_description[report_id]);
    }

    var data = {data:functions_data, executions:executions_data};
    var body = JSON.stringify(data);
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Length', body.length);
    res.end(body);
});

app.get('/timestamps/', function(req, res){
    console.log("Required Timestamps");
    var ts_data = {};
    var descr_data = {};
    for(var report_id in reports){
    	ts_data[report_id] = [];
    	descr_data[report_id] = [];
    
	    for(var i in reports[report_id].timestamps){
	    	ts_data[report_id].push(reports[report_id].timestamps[i].timestamp);
	    	if(i==0)
	    		descr_data[report_id].push("Start Simulation");
	    	else
	    		descr_data[report_id].push(reports[report_id].timestamps[i-1].description);
	    }
	    ts_data[report_id].push(reports[report_id].globals.totTime);
	    descr_data[report_id].push(reports[report_id].timestamps[reports[report_id].timestamps.length-1].description);
	}
    
    var data = {data:ts_data, legend:descr_data};
    var body = JSON.stringify(data);
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Length', body.length);
    res.end(body);
});

app.get('/rpcfrequency/', function(req, res){
    console.log("Required RPC frequency");
    var frequency_data = {};
    var executions_data = [];

    var sorted_keys = Object.keys(reports).sort();
    for(var j=0; j<sorted_keys.length; j++){
        var report_id = sorted_keys[j];
    	frequency_data[report_id] = [reports[report_id].websocketframe_sent_count, reports[report_id].websocketframe_received_count];
        executions_data.push(executions_description[report_id]);
    }
    
    var data = {categories:["Sent", "Received"], data:frequency_data, executions:executions_data};
    var body = JSON.stringify(data);
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Length', body.length);
    res.end(body);
});

app.get('/rpctraffic/', function(req, res){
    console.log("Required RPC traffic");
    var traffic_data = {};
    var executions_data = [];

    var sorted_keys = Object.keys(reports).sort();
    for(var j=0; j<sorted_keys.length; j++){
        var report_id = sorted_keys[j];
    	traffic_data[report_id] = [reports[report_id].websocketframe_sent_bytes, reports[report_id].websocketframe_received_bytes];
        executions_data.push(executions_description[report_id]);
    }
    
    var data = {categories:["Sent", "Received"], data:traffic_data, executions:executions_data};
    var body = JSON.stringify(data);
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Length', body.length);
    res.end(body);
});

app.listen(3000);