function httpGet(theUrl){
    var xmlHttp = null;
    xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "GET", theUrl, false );
    xmlHttp.send( null );
    return xmlHttp.responseText;
}

function createHeapChart(){
    var heap = JSON.parse(httpGet("/heap/"));
    var timestamps = JSON.parse(httpGet("/timestamps/"));

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
        series : [{
            name : 'Heap Usage',
            data : heap.data,
            type : 'area',
            threshold : null,
            tooltip : {
                valueDecimals : 2
            },
            fillColor : {
                linearGradient : {
                    x1: 0, 
                    y1: 0, 
                    x2: 0, 
                    y2: 1
                },
                stops : [[0, Highcharts.getOptions().colors[0]], [1, 'rgba(0,0,0,0)']]
            }
        }]
    };

    var lastTime = 0;
    for(var i=0; i<timestamps.data.length;i++){
        var serie = {
            name : timestamps.legend[i],
            data: [[lastTime,heap.max], [timestamps.data[i],heap.max]],
            type : 'area',
            threshold : null,
            tooltip : {
                valueDecimals : 2
            },
            //fillColor: "green"
            fillOpacity: 0.2
        };
        options.series.push(serie);
        //alert(JSON.stringify(serie.data));
        lastTime = timestamps.data[i] + 1 ;
    }
    $('#heap_chart').highcharts('StockChart', options);
}

function createFunctionTimeChart(){
    var time = JSON.parse(httpGet("/functionstime/"));
    $('#time_chart').highcharts({
        chart: {
            plotBackgroundColor: null,
            plotBorderWidth: null,
            plotShadow: false
        },
        title: {
            text: 'Time spent by javascript operations [%]'
        },
        tooltip: {
            pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
        },
        plotOptions: {
            pie: {
                allowPointSelect: true,
                cursor: 'pointer',
                dataLabels: {
                    enabled: true,
                    color: '#000000',
                    connectorColor: '#000000',
                    format: '<b>{point.name}</b>: {point.percentage:.1f} %'
                },
                showInLegend: true
            }
        },
        series: [{
            type: 'pie',
            name: '% time',
            data: time
        }]
    });
}

function startReport(){
    createHeapChart();
    createFunctionTimeChart();
}