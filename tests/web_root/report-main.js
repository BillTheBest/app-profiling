function httpGet(theUrl){
    var xmlHttp = null;
    xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "GET", theUrl, false );
    xmlHttp.send( null );
    return xmlHttp.responseText;
}

function createHeapChart(devname){
    var heap_data = JSON.parse(httpGet("/heap/"+devname));
    var ts_data = JSON.parse(httpGet("/timestamps/"+devname));

    var options = {
        rangeSelector : {
            selected : 1
        },
        title : {
            text : 'Max Heap Usage during profiling'
        },
        legend:{
            enabled :true
        },
        xAxis:{
            dateTimeLabelFormats: {
                millisecond: '%S.%Ls'
                // ,
                // second: '%H:%M:%S',
                // minute: '%H:%M',
                // hour: '%H:%M',
                // day: '%e. %b',
                // week: '%e. %b',
                // month: '%b \'%y',
                // year: '%Y'
            }
        },
        series : []
    };

    //add heap
    var max = 0;
    var count = 0;
    for(var execution in heap_data.data){
        if(heap_data.max[execution] > max)
            max = heap_data.max[execution];

        var serie = {
            //name : execution,
            name: heap_data.executions[count++],
            data : heap_data.data[execution],
            type : 'area',
            threshold : null,
            tooltip : {
                valueDecimals : 2
            }
        };
            options.series.push(serie);
    };
        
    //check if something exists
    var index = Object.keys(ts_data.data)[0];
    var timestamps = ts_data.data[index];
    var legend = ts_data.legend[index];
    
    //add timestamps
    var lastTime = 0;
    for(var i=0; i<timestamps.length;i++){
        var serie = {
            name : legend[i],
            data: [[lastTime,max], [timestamps[i],max]],
            type : 'area',
            threshold : null,
            tooltip : {
                valueDecimals : 2
            },
            //fillColor: "green"
            fillOpacity: 0.2
        };

        options.series.push(serie);
        lastTime = timestamps[i];
    }

    $('#heap_chart').highcharts('StockChart', options);
}

function createFunctionTimeChart(devname){
    var functions_data = JSON.parse(httpGet("/functionstime/"+devname));

    var options = {
        chart: {
            type: 'area'
        },
        title: {
            text: '% of time spent by each javascript function'
        },
        xAxis: {
            //categories: ['1750', '1800', '1850', '1900', '1950', '1999', '2050'],
            categories:[],
            tickmarkPlacement: 'on',
            title: {
                enabled: false
            }
        },
        yAxis: {
            title: {
                text: 'Percent'
            }
        },
        tooltip: {
            pointFormat: '<span style="color:{series.color}">{series.name}</span>: <b>{point.percentage:.1f}%</b> ({point.y:.0f} ms)<br/>',
            shared: true
        },
        plotOptions: {
            area: {
                stacking: 'percent',
                lineColor: '#ffffff',
                lineWidth: 1,
                marker: {
                    lineWidth: 1,
                    lineColor: '#ffffff'
                }
            }
        },
        series: []
    };

    options.xAxis.categories = functions_data.executions;
    
    
    for(var f in functions_data.data){
        options.series.push({name:f,data:functions_data.data[f]});
    }
    $('#time_chart').highcharts(options);
}


function createRPCNumberChart(devname){
    var rpc_frequency = JSON.parse(httpGet("/rpcfrequency/"+devname));
    var options = {
        chart: {
            type: 'column'
        },
        title: {
            text: 'Number of exchanged RPCs'
        },
        xAxis: {
            categories: rpc_frequency.categories
        },
        yAxis: {
            min: 0,
            title: {
                text: 'RPC messages'
            }
        },
        tooltip: {
            headerFormat: '<span style="font-size:10px">{point.key}</span><table>',
            pointFormat: '<tr><td style="color:{series.color};padding:0">{series.name}: </td>' +
                '<td style="padding:0"><b>{point.y:.1f} RPCs</b></td></tr>',
            footerFormat: '</table>',
            shared: true,
            useHTML: true
        },
        plotOptions: {
            column: {
                pointPadding: 0.2,
                borderWidth: 0
            }
        },
        series: []
    };

    var count=0;
    for(var execution in rpc_frequency.data){
        var serie = {
            //name: '#RPCs',
            name: rpc_frequency.executions[count++],
            data: rpc_frequency.data[execution]
        };
        options.series.push(serie);
    }

    $('#rpc_frequency_chart').highcharts(options); 
}

function createRPCTrafficChart(devname){
    var rpc_traffic = JSON.parse(httpGet("/rpctraffic/"+devname));
    
    var options = {
        chart: {
            type: 'column'
        },
        title: {
            text: 'Network traffic generated by RPCs'
        },
        xAxis: {
            categories: rpc_traffic.categories
        },
        yAxis: {
            min: 0,
            title: {
                text: 'bytes'
            }
        },
        tooltip: {
            headerFormat: '<span style="font-size:10px">{point.key}</span><table>',
            pointFormat: '<tr><td style="color:{series.color};padding:0">{series.name}: </td>' +
                '<td style="padding:0"><b>{point.y:.1f} bytes</b></td></tr>',
            footerFormat: '</table>',
            shared: true,
            useHTML: true
        },
        plotOptions: {
            column: {
                pointPadding: 0.2,
                borderWidth: 0
            }
        },
        series: []
    };

    var count=0;
    for(var execution in rpc_traffic.data){
        var serie = {
            name: rpc_traffic.executions[count++],
            data: rpc_traffic.data[execution]
        };
        options.series.push(serie);
    }

    $('#rpc_traffic_chart').highcharts(options);
}

function startReport(devname){
    createHeapChart(devname);
    createFunctionTimeChart(devname);
    createRPCNumberChart(devname);
    createRPCTrafficChart(devname);
}