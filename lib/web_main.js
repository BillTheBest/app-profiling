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
					  	testSuites.push({"name":fileName,"title":data.testsuiteTitle});
					  }
					  fileCbCountdown--;
					  console.log(fileCbCountdown);
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
			tcRunner.runTestCase(JSON.parse(data),req.params.case,{},function(result){
				res.send(result);
			});
		});

		
	}catch(e){console.log(e,"Testsuite file might be corrupt or not present.");res.send({});}
  
});




app.listen(3000);