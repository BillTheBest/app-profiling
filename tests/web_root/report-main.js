function httpGet(theUrl){
    var xmlHttp = null;
    xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "GET", theUrl, false );
    xmlHttp.send( null );
    return xmlHttp.responseText;
}

function createHeapChart(){
    var heap_data = JSON.parse(httpGet("/heap/"));
    // var heap = heap_data.data[round];
    // var max = heap_data.max[round];

    var ts_data = JSON.parse(httpGet("/timestamps/"));
    // var timestamps = ts_data.data[round];
    // var legend = ts_data.legend[round];

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
                millisecond: '%S.%L',
                second: '%H:%M:%S',
                minute: '%H:%M',
                hour: '%H:%M',
                day: '%e. %b',
                week: '%e. %b',
                month: '%b \'%y',
                year: '%Y'
            }
        },
        series : []
        // series : [{
        //     name : 'Heap Usage',
        //     data : heap,
        //     type : 'area',
        //     threshold : null,
        //     tooltip : {
        //         valueDecimals : 2
        //     },
        //     fillColor : {
        //         linearGradient : {
        //             x1: 0, 
        //             y1: 0, 
        //             x2: 0, 
        //             y2: 1
        //         },
        //         stops : [[0, Highcharts.getOptions().colors[0]], [1, 'rgba(0,0,0,0)']]
        //     }
        // }]
    };

    //add heap
    var max = 0;
    for(var execution in heap_data.data){
        if(heap_data.max[execution] > max)
            max = heap_data.max[execution];

        var serie = {
                name : execution,
                data : heap_data.data[execution],
                type : 'area',
                threshold : null,
                tooltip : {
                    valueDecimals : 2
                },
                //fillOpacity : 0.6
                // fillColor : {
                //     linearGradient : {
                //         x1: 0, 
                //         y1: 0, 
                //         x2: 0, 
                //         y2: 1
                //     },
                //     stops : [[0, Highcharts.getOptions().colors[0]], [1, 'rgba(0,0,0,0)']]
                // }
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
    // }

    $('#heap_chart').highcharts('StockChart', options);
}

function createFunctionTimeChart(){
    var functions_data = JSON.parse(httpGet("/functionstime/"));

    var options = {
        chart: {
            type: 'area'
        },
        title: {
            text: 'Historic and Estimated Worldwide Population Distribution by Region'
        },
        subtitle: {
            text: 'Source: Wikipedia.org'
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
            pointFormat: '<span style="color:{series.color}">{series.name}</span>: <b>{point.percentage:.1f}%</b> ({point.y:,.0f} millions)<br/>',
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
        series: [
        // {
        //     name: 'Asia',
        //     data: [502, 635, 809, 947, 1402, 3634, 5268]
        // }, {
        //     name: 'Africa',
        //     data: [106, 107, 111, 133, 221, 767, 1766]
        // }, {
        //     name: 'Europe',
        //     data: [163, 203, 276, 408, 547, 729, 628]
        // }, {
        //     name: 'America',
        //     data: [18, 31, 54, 156, 339, 818, 1201]
        // }, {
        //     name: 'Oceania',
        //     data: [2, 2, 2, 6, 13, 30, 46]
        // }
        ]
    };

    options.xAxis.categories = functions_data.executions;
    
    
    for(var f in functions_data.data){
        options.series.push({name:f,data:functions_data.data[f]});
    }
    $('#time_chart').highcharts(options);
}




// function createFunctionTimeChart(round){
//     var time = JSON.parse(httpGet("/functionstime/"))[round];

//     $('#time_chart_'+round).highcharts({
//         chart: {
//             plotBackgroundColor: null,
//             plotBorderWidth: null,
//             plotShadow: false
//         },
//         title: {
//             text: 'Time spent by javascript operations [%]'
//         },
//         tooltip: {
//             pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
//         },
//         plotOptions: {
//             pie: {
//                 allowPointSelect: true,
//                 cursor: 'pointer',
//                 dataLabels: {
//                     enabled: true,
//                     color: '#000000',
//                     connectorColor: '#000000',
//                     format: '<b>{point.name}</b>: {point.percentage:.1f} %'
//                 },
//                 showInLegend: true
//             }
//         },
//         series: [{
//             type: 'pie',
//             name: '% time',
//             data: time
//         }]
//     });
// }

function createRPCNumberChart(round){
    var rpc_frequency = JSON.parse(httpGet("/rpcfrequency/"));
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
                '<td style="padding:0"><b>{point.y:.1f} mm</b></td></tr>',
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

    for(var execution in rpc_frequency.data){
        var serie = {
            //name: '#RPCs',
            name: execution,
            data: rpc_frequency.data[execution]
        };
        options.series.push(serie);
    }

    $('#rpc_frequency_chart').highcharts(options);

    
}

function createRPCTrafficChart(round){
    var rpc_traffic = JSON.parse(httpGet("/rpctraffic/"));
    
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
                '<td style="padding:0"><b>{point.y:.1f} mm</b></td></tr>',
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

    for(var execution in rpc_traffic.data){
        var serie = {
            //name: '#RPCs',
            name: execution,
            data: rpc_traffic.data[execution]
        };
        options.series.push(serie);
    }

    $('#rpc_traffic_chart').highcharts(options);
}

function startReport(){
    createHeapChart();
    createFunctionTimeChart();
    createRPCNumberChart("1111");
    createRPCTrafficChart("1111");
}