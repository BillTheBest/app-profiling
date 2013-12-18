
var linkTestsuites = function(){
	$(".tab").hide();
	$(".tab.testsuites").show();
};

var linkReports = function(){
	$(".tab").hide();
	$(".tab.reports").show();
};

var linkListTestsuites = function(){
	$(".tab.testsuites .view").hide();
	$(".tab.testsuites .view.list").show();
	$(".tab.testsuites ul").empty();
	$(".tab.testsuites ul").append("<li>loading testsuites...");
	$.getJSON( "/testsuites/", function( data ) {
	  var items = [];
	  $.each( data, function( key, val ) {
	  	if(val&&val.name&&val.title)
	    items.push( "<li data-file='" + val.name + "'>" + val.title + " <input type='button' value='edit "+val.name+"' />" );
			if (val.testCases){
				items.push( "<ul>");
				$.each( val.testCases, function( tcx, tcd ) {
					items.push( "<li data-file='" + val.name + "' data-tc='" + tcx + "'>"+(tcx+1)+ ". " + tcd + " <input type='text' class='longwidth' placeholder='specify a description for this execution' /><input type='button' value='execute' />" );
				});
				items.push( "</ul>");
			}
			items.push( "</li>");
	  });
	 
	  $(".tab.testsuites ul").empty();
	  $(".tab.testsuites ul").append(items.join( "" ));
	});
	_viewModel = {visible:{}};
};

var linkListReports = function(){
	$(".tab.reports .view").hide();
	$(".tab.reports .view.list").show();
	$(".tab.reports ul").empty();
	$(".tab.reports ul").append("<li>loading reports...");
	$.getJSON( "/profiles/", function( data ) {
	  var items = [];
	  $.each( data, function( key, val ) {
	    items.push( "<li>" + key + ".json" );
				items.push( "<ul>");
				$.each( val, function( tcx, tcd ) {
					items.push( "<li data-file='" + key + "' data-tc='" + tcx + "'>"+(parseInt(tcx)+1)+ ". Testcase ("+tcd[0].testCaseName+") with "+tcd.length+" executions <input type='button' value='visualise' />" );
				});
				items.push( "</ul>");
			items.push( "</li>");
	  });
	 
	  $(".tab.reports ul").empty();
	  $(".tab.reports ul").append(items.join( "" ));
	});
};

var linkReport = function(e){
	if(e.target.nodeName!="INPUT" || e.target.type!='button') return;
	var li = $(e.target).closest('li');
	if(typeof li.data("tc") === "number" && li.data("file")){
		$(".viewReportListLog").text("starting conversion of raw data...");
		$.getJSON( "/report/"+li.data("file")+"/testcase/"+li.data("tc"), function( data ) {
			if(data&&data.status==="ok"){
				$(".viewReportListLog").text("conversion ok.");

			}else{
				$(".viewReportListLog").text("conversion failed.");
			}

		});
		//displayReport(li.data("file"),li.data("tc"));
	}
};

var executeTestcase = function(suite,tc,desc){
		$.getJSON( "/testsuite/"+suite+"/testcase/"+tc+"?desc="+encodeURIComponent(desc), function( data ) {
		  if(!data || data.error){
		  	$(".viewListLog").text(JSON.stringify(data.error));
		  }else{
		  	$(".viewListLog").text((tc+1)+". Testcase started of "+suite);
		  }
		});
};

var loadTestsuite = function(file){
	$(".tab.testsuites .view").hide();
	$(".tab.testsuites .view.testcase").show();
	if(file){
		//load existant
		$(".tab.testsuites .view.testcase").empty();
		$(".tab.testsuites .view.testcase").append("loading a testsuite...");
		$.getJSON( "/testsuite/"+file, function( data ) {
		  if(data && data.testsuiteTitle){
		  	setTestsuiteModel(file, data);
		  	showTestsuite();
		  }else{
		  	$(".tab.testsuites .view.testcase").append("failed loading: "+file);
		  }
		});
	}else{
		//new testsuite
		setTestsuiteModel();
		showTestsuite();
	}
};

var saveTestsuite = function(){
	var data = getTestsuiteModel();
	
	if(data.fileName==="new_testsuite.json") { 
		var result=data.fileName;
		while(result===data.fileName || result===""){
			result=prompt("Enter file name to save testsuite.",data.fileName );
			if(result==null) {
				//canceled save.
				return;
			}
		}
		data.fileName=result;
	} 
	console.log("saving",data.testSuite);
	$.post( "/testsuite/"+data.fileName, data.testSuite, function( result ) {
  		loadTestsuite(data.fileName);
	});
};

var removeTestsuite = function(){
	var data = getTestsuiteModel();
	
	if(data.fileName!="new_testsuite.json") { 
		$.post( "/testsuite/"+data.fileName, {}, function( result ) {
	  		linkListTestsuites();
		});
	} 
};

var linkTestsuite = function(e){
	if(e.target.nodeName!="INPUT" || e.target.type!='button') return;
	var li = $(e.target).closest('li');
	if(typeof li.data("tc") === "number"){
		var text = e.target.previousSibling;
		text = text?text.value:"";
		executeTestcase(li.data("file"),li.data("tc"),text);
	} else {
		loadTestsuite(li.data("file"));
	}
};

var showTestsuite = function(){
	var data = getTestsuiteModel().testSuite;
	var file = getTestsuiteModel().fileName;
	console.log(data);

	$(".tab.testsuites .view.testcase").empty();

	var items = [];
	items.push("<b>Testsuite:</b> <input type=text class='bold longwidth' value='"+data.testsuiteTitle+"' onblur='blrnpt(this)' data-type='title' />("+file+")<br/>");
	items.push("<input type=button value='add device' /> <input type=button value='add testcase' /> | <input type=button value='save' /> <input type=button value='reset' data-file='"+file+"'/> <input type=button value='delete' /> <br/>");
	items.push("<span id='log'></span><br/>");

	if (typeof data.devices === "object") $.each( data.devices, function( key, val ) {
		items.push("<b>Device:</b> <input type=text value='"+key+"' onblur='blrnpt(this)' data-device='"+key+"' data-type='key'/> <input type=button value='>' data-device='"+key+"' /> <span class='"+cdr(key)+"_pane invisible'><input type=button value='remove this device' data-device='"+key+"' /><br/>");
		items.push("&nbsp;&nbsp;&nbsp;&nbsp;hostname: <input type=text placeholder='localhost' onblur='blrnpt(this)' value='"+val.host+"' data-device='"+key+"' data-type='host'/> port: <input type=text placeholder='9222' onblur='blrnpt(this)' maxlength=5 size=5 value='"+val.port+"' data-device='"+key+"' data-type='port'/> app url: <input type=text class='longwidth' placeholder='http://localhost:8080/' onblur='blrnpt(this)' value='"+val.url+"' data-device='"+key+"' data-type='url'/><br/></span><br/>");
	});

	if (typeof data.testCases === "object") $.each( data.testCases, function( key, val ) {
		items.push("<br/><b>Testcase:</b> <input type=text placeholder='an interaction flow' class='bold longwidth' onblur='blrnpt(this)' data-tc='"+key+"' data-type='tctitle' value='"+val.testcaseTitle+"'/> <input type=button value='>' data-tc='"+key+"' /> <span class='tc_"+cdr(key)+"_pane "+(_viewModel.visible[val.testcaseTitle]?'':'invisible')+"'><input type=button value='remove this testcase' data-tcno='"+key+"' /><br/>");
			$.each( val.steps, function( stepNo, step ) {
				items.push("Step "+(stepNo+1)+": <input type=text placeholder='print to the console' class='longwidth' onblur='blrnpt(this)' data-tc='"+key+"' data-step='"+stepNo+"' data-type='steptitle' value='"+step.do+"'/> <br/> ");
				items.push("&nbsp;&nbsp;&nbsp;&nbsp;on device: <input type=text onblur='blrnpt(this)' data-tc='"+key+"' data-step='"+stepNo+"' data-type='ondevice' value='"+step.on+"'/> if: <input type=text onblur='blrnpt(this)' data-tc='"+key+"' data-step='"+stepNo+"' data-type='cond' value='"+(step["if"]?step["if"]:'')+"'/> after delta (ms): <input type=text placeholder='0' onblur='blrnpt(this)' data-tc='"+key+"' data-step='"+stepNo+"' data-type='delay' value='"+(step.dms)+"'/> <br/>");
				items.push("&nbsp;&nbsp;&nbsp;&nbsp;execute: <input type=text placeholder='console.log(\"javascript call\")' onblur='blrnpt(this)' data-tc='"+key+"' data-step='"+stepNo+"' data-type='js' value='"+(step.js)+"' style='width: 80%;' /> <br/>");
				items.push("&nbsp;&nbsp;&nbsp;&nbsp;<input type=button value='remove this step' data-tcno='"+key+"' data-stno='"+stepNo+"' /> <input type=button value='add step before' data-tcno='"+key+"' data-stno='"+stepNo+"'/> <input type=button value='add step after' data-tcno='"+key+"' data-stno='"+stepNo+"'/><br/>");
			});
		items.push("<br/></span>");

	});



	$(".tab.testsuites .view.testcase").append(items.join( "" ));
};

var clickTestsuite = function(e){
	var inputItem = $(e.target).closest('input');
	if(!inputItem.length) return;
	
	console.log(inputItem);
	var data = getTestsuiteModel();
	if(inputItem.attr("type")==="button"){
		switch(inputItem.attr("value")){
			case "reset":
				loadTestsuite(data.fileName);
				break;
			case "save":
				saveTestsuite();
				break;
			case "delete":
				if(!confirm("Do you really want to delete this complete testsuite?")) return;
				removeTestsuite();
				break;
			case "add device":
				var newDeviceKey = "new device", count = 0;
				while (data.testSuite.devices[newDeviceKey+count]) count++;
				data.testSuite.devices[newDeviceKey+count]={host:"",port:"",url:""};
				showTestsuite();
				break;
			case "add testcase":
				data.testSuite.testCases.push({"testcaseTitle":"","steps":[{"on":"","if":"","dms":"","do":"","js":""}]});
				showTestsuite();
				break;
			case "remove this device":
				delete data.testSuite.devices[inputItem.data("device")];
				showTestsuite();
				break;
			case "remove this testcase":
				var testCaseNo = parseInt(inputItem.data("tcno"));
				if(typeof testCaseNo==="number"&&testCaseNo>=0&&testCaseNo<data.testSuite.testCases.length){
					if(data.testSuite.testCases[testCaseNo].steps.length>1&&!confirm("Do you really want to remove this testcase?")) return;
					data.testSuite.testCases.splice(testCaseNo,1);
					showTestsuite();
				}
				break;
			case "remove this step":
				var testCaseNo = parseInt(inputItem.data("tcno"));
				var stepNo = parseInt(inputItem.data("stno"));
				if(typeof testCaseNo==="number"&&testCaseNo>=0&&testCaseNo<data.testSuite.testCases.length){
					if(typeof stepNo==="number"&&stepNo>=0&&stepNo<data.testSuite.testCases[testCaseNo].steps.length){
						if(data.testSuite.testCases[testCaseNo].steps.length===1){
							data.testSuite.testCases[testCaseNo].steps=[{"on":"","if":"","dms":"","do":"","js":""}];
						}else{
							data.testSuite.testCases[testCaseNo].steps.splice(stepNo,1);
						}
						showTestsuite();
					}
				}
				break;
			case "add step before":
			case "add step after":
				var testCaseNo = parseInt(inputItem.data("tcno"));
				var stepNo = parseInt(inputItem.data("stno"));
				if(typeof testCaseNo==="number"&&testCaseNo>=0&&testCaseNo<data.testSuite.testCases.length){
					if(typeof stepNo==="number"&&stepNo>=0&&stepNo<data.testSuite.testCases[testCaseNo].steps.length){
						data.testSuite.testCases[testCaseNo].steps.splice((inputItem.attr("value")==="add step after")?stepNo+1:stepNo,0,{"on":"","if":"","dms":"","do":"","js":""});
						showTestsuite();
					}
				}
				break;
			case ">":
				if(inputItem.data("device")) $("."+cdr(inputItem.data("device"))+"_pane").toggleClass("invisible");
				if(typeof inputItem.data("tc") === "number") {
					_viewModel.visible[data.testSuite.testCases[inputItem.data("tc")].testcaseTitle+""] = !($(".tc_"+cdr(inputItem.data("tc"))+"_pane").toggleClass("invisible").hasClass("invisible"));
				}
				break;
		}
	}
};

var cdr = function(s) {return btoa(s).replace(/=/g,"_")};

var blrnpt = function(e){
	var invalidated = false;
	var inputItem = $(e).closest('input');
	if(!inputItem.length) return;
	
	inputItem=inputItem[0];
	var data = getTestsuiteModel();
	if(inputItem.type==="text"){
		switch($(inputItem).data("type")){
			case "title":
				data.testSuite.testsuiteTitle = inputItem.value;
				break;
			case "key":
				var device = $(inputItem).data("device");
				if(device===inputItem.value) break;
				data.testSuite.devices[inputItem.value]=data.testSuite.devices[device];
				delete data.testSuite.devices[device];
				invalidated=true;
				break;
			case "host":
				var device = $(inputItem).data("device");
				data.testSuite.devices[device].host=inputItem.value;
				break;
			case "port":
				var device = $(inputItem).data("device");
				data.testSuite.devices[device].port=inputItem.value;
				break;
			case "url":
				var device = $(inputItem).data("device");
				data.testSuite.devices[device].url=inputItem.value;
				break;
			case "tctitle":
				var tc = $(inputItem).data("tc");
				var v = _viewModel.visible[data.testSuite.testCases[tc].testcaseTitle];
				delete _viewModel.visible[data.testSuite.testCases[tc].testcaseTitle];
				data.testSuite.testCases[tc].testcaseTitle=inputItem.value;
				if (v) _viewModel.visible[inputItem.value]=v;
				break;
			case "steptitle":
				var tc = $(inputItem).data("tc");
				var step = $(inputItem).data("step");
				data.testSuite.testCases[tc].steps[step].do=inputItem.value;
				break;
			case "ondevice":
				var tc = $(inputItem).data("tc");
				var step = $(inputItem).data("step");
				data.testSuite.testCases[tc].steps[step].on=inputItem.value;
				break;
			case "cond":
				var tc = $(inputItem).data("tc");
				var step = $(inputItem).data("step");
				data.testSuite.testCases[tc].steps[step].if=inputItem.value;
				break;
			case "delay":
				var tc = $(inputItem).data("tc");
				var step = $(inputItem).data("step");
				data.testSuite.testCases[tc].steps[step].dms=inputItem.value;
				break;
			case "js":
				var tc = $(inputItem).data("tc");
				var step = $(inputItem).data("step");
				data.testSuite.testCases[tc].steps[step].js=inputItem.value;
				break;
		}
	}

	if(invalidated){
		showTestsuite();
	}
};




//Model
var _dataModel = { fileName: "", testSuite : {} };

var setTestsuiteModel = function(file,data){
	if(!data || !file){
		_dataModel.testSuite.testsuiteTitle="New Testsuite";
		_dataModel.testSuite.devices={};
		_dataModel.testSuite.testCases=[];
	}else{
		_dataModel.testSuite=data;
		if(!_dataModel.testSuite.devices) _dataModel.testSuite.devices={};
		if(!_dataModel.testSuite.testCases) _dataModel.testSuite.testCases=[];
	}
	_dataModel.fileName = (file)?file:"new_testsuite.json";
	return _dataModel;
}

var getTestsuiteModel = function(){
	if(_dataModel.testSuite.testsuiteTitle!=""){
		return _dataModel;
	}
	return setTestsuiteModel();
}

//ViewModel
var _viewModel = {visible:{}};


$(function(){
	$(".link.testsuites").click(linkTestsuites);
	$(".link.reports").click(linkReports);
	$(".link.listtestsuites").click(linkListTestsuites);

	$(".link.testsuite").click(linkTestsuite);
	$(".tab.testsuites ul").click(linkTestsuite);
	$(".tab.testsuites .view.testcase").click(clickTestsuite);

	$(".link.listreports").click(linkListReports);
	$(".tab.reports ul").click(linkReport);
})