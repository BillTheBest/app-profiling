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

		fs.readFile(join(tests_root,(req.params.file)?req.params.file:""), function (err, data) {
			if (err) {
				console.log(err,'Error reading file.');
				res.send({});
				return;
			}
			tcRunner.runTestCase(JSON.parse(data),req.params.case,{"path":tests_root,"suitefile":req.params.file},function(result){
				res.send(result);
			});
		});

		
	}catch(e){console.log(e,"Testsuite file might be corrupt or not present.");res.send({});}
  
});


//Reporting
//create report
var heap = [];
var functions = {};
var globals = {numFunctions:0, totTime:0};

app.get('/report/:file', function(req, res){
	try{



	var filePath = join(tests_root,req.params.file);

	fs.readFile(filePath, function(err,str) {
			if (err) {
				console.log(err,'Error reading file.');
				res.send({});
				return;
			}
	        var data = JSON.parse(str);

	        for(var i=1; i<data.length; i++){
	            // console.log("Start: %s , Stop: %s , Type: %s", 
	            //             data[i].startTime, data[i].endTime, data[i].type);
	            var children = data[i].children;
	            if (children) for(var j=0; j<children.length; j++){
	                //console.log("\tStart: %s , Stop: %s , Type: %s , UsedHeapSize: %s",
	                //            children[j].startTime, children[j].endTime, children[j].type, children[j].usedHeapSize);

	                if(!functions[children[j].type])
	                    functions[children[j].type] = {count:0, time:0};
	                
	                functions[children[j].type].count++;
	                globals.numFunctions++; 

	                if(children[j].startTime && children[j].endTime){
	                    var elapsedTime = children[j].endTime - children[j].startTime;
	                    functions[children[j].type].time += elapsedTime;
	                    globals.totTime += elapsedTime;
	                }
	                heap.push([children[j].startTime, children[j].usedHeapSize]);;
	            }
	        }

	        for(var i in functions){
	            console.log(i+ " :  #=%s, time[ms]=%s",
	                        functions[i].count, functions[i].time);
	        }

	        console.log("Total Number of functions : "+globals.numFunctions);
	        console.log("Total Time elapsed : "+globals.totTime);
	        res.send({"status":"ok"});
	});
		
	}catch(e){console.log(e,"Report file might be corrupt or not present.");res.send({});}
  
});

app.get('/heap/', function(req, res){
    console.log("Required Heap");
    var data = [];
    if(heap.length > 0){
        data.push([0, heap[0][1]]);
        for(var i=1; i<heap.length; i++){
            var tmp_time = data[i-1][0] + (heap[i][0]-heap[i-1][0]);
            data.push([tmp_time, heap[i][1]]); //byte
        }
    }

    var body = JSON.stringify(data);
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Length', body.length);
    res.end(body);
});

app.get('/functionstime/', function(req, res){
    console.log("Required Functions");
    var data = [];
    for(var i in functions)
        if(functions[i].time != 0)
            data.push([i, functions[i].time]);

    var body = JSON.stringify(data);
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Length', body.length);
    res.end(body);
});




app.listen(3000);