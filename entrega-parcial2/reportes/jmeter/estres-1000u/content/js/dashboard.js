/*
   Licensed to the Apache Software Foundation (ASF) under one or more
   contributor license agreements.  See the NOTICE file distributed with
   this work for additional information regarding copyright ownership.
   The ASF licenses this file to You under the Apache License, Version 2.0
   (the "License"); you may not use this file except in compliance with
   the License.  You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/
var showControllersOnly = false;
var seriesFilter = "";
var filtersOnlySampleSeries = true;

/*
 * Add header in statistics table to group metrics by category
 * format
 *
 */
function summaryTableHeader(header) {
    var newRow = header.insertRow(-1);
    newRow.className = "tablesorter-no-sort";
    var cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 1;
    cell.innerHTML = "Requests";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 3;
    cell.innerHTML = "Executions";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 7;
    cell.innerHTML = "Response Times (ms)";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 1;
    cell.innerHTML = "Throughput";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 2;
    cell.innerHTML = "Network (KB/sec)";
    newRow.appendChild(cell);
}

/*
 * Populates the table identified by id parameter with the specified data and
 * format
 *
 */
function createTable(table, info, formatter, defaultSorts, seriesIndex, headerCreator) {
    var tableRef = table[0];

    // Create header and populate it with data.titles array
    var header = tableRef.createTHead();

    // Call callback is available
    if(headerCreator) {
        headerCreator(header);
    }

    var newRow = header.insertRow(-1);
    for (var index = 0; index < info.titles.length; index++) {
        var cell = document.createElement('th');
        cell.innerHTML = info.titles[index];
        newRow.appendChild(cell);
    }

    var tBody;

    // Create overall body if defined
    if(info.overall){
        tBody = document.createElement('tbody');
        tBody.className = "tablesorter-no-sort";
        tableRef.appendChild(tBody);
        var newRow = tBody.insertRow(-1);
        var data = info.overall.data;
        for(var index=0;index < data.length; index++){
            var cell = newRow.insertCell(-1);
            cell.innerHTML = formatter ? formatter(index, data[index]): data[index];
        }
    }

    // Create regular body
    tBody = document.createElement('tbody');
    tableRef.appendChild(tBody);

    var regexp;
    if(seriesFilter) {
        regexp = new RegExp(seriesFilter, 'i');
    }
    // Populate body with data.items array
    for(var index=0; index < info.items.length; index++){
        var item = info.items[index];
        if((!regexp || filtersOnlySampleSeries && !info.supportsControllersDiscrimination || regexp.test(item.data[seriesIndex]))
                &&
                (!showControllersOnly || !info.supportsControllersDiscrimination || item.isController)){
            if(item.data.length > 0) {
                var newRow = tBody.insertRow(-1);
                for(var col=0; col < item.data.length; col++){
                    var cell = newRow.insertCell(-1);
                    cell.innerHTML = formatter ? formatter(col, item.data[col]) : item.data[col];
                }
            }
        }
    }

    // Add support of columns sort
    table.tablesorter({sortList : defaultSorts});
}

$(document).ready(function() {

    // Customize table sorter default options
    $.extend( $.tablesorter.defaults, {
        theme: 'blue',
        cssInfoBlock: "tablesorter-no-sort",
        widthFixed: true,
        widgets: ['zebra']
    });

    var data = {"OkPercent": 100.0, "KoPercent": 0.0};
    var dataset = [
        {
            "label" : "FAIL",
            "data" : data.KoPercent,
            "color" : "#FF6347"
        },
        {
            "label" : "PASS",
            "data" : data.OkPercent,
            "color" : "#9ACD32"
        }];
    $.plot($("#flot-requests-summary"), dataset, {
        series : {
            pie : {
                show : true,
                radius : 1,
                label : {
                    show : true,
                    radius : 3 / 4,
                    formatter : function(label, series) {
                        return '<div style="font-size:8pt;text-align:center;padding:2px;color:white;">'
                            + label
                            + '<br/>'
                            + Math.round10(series.percent, -2)
                            + '%</div>';
                    },
                    background : {
                        opacity : 0.5,
                        color : '#000'
                    }
                }
            }
        },
        legend : {
            show : true
        }
    });

    // Creates APDEX table
    createTable($("#apdexTable"), {"supportsControllersDiscrimination": true, "overall": {"data": [1.0, 500, 1500, "Total"], "isController": false}, "titles": ["Apdex", "T (Toleration threshold)", "F (Frustration threshold)", "Label"], "items": [{"data": [1.0, 500, 1500, "GET /chunk-QBLPMLLI.js"], "isController": false}, {"data": [1.0, 500, 1500, "GET /chunk-AH2PXVYY.js"], "isController": false}, {"data": [1.0, 500, 1500, "04 Abrir Productos"], "isController": true}, {"data": [1.0, 500, 1500, "GET /styles-6JVHUYDI.css"], "isController": false}, {"data": [1.0, 500, 1500, "GET /chunk-GPMW2WCX.js"], "isController": false}, {"data": [1.0, 500, 1500, "GET /chunk-UL63HHFV.js"], "isController": false}, {"data": [1.0, 500, 1500, "GET /chunk-JUSSX37A.js"], "isController": false}, {"data": [1.0, 500, 1500, "05 Abrir Reportes"], "isController": true}, {"data": [1.0, 500, 1500, "GET /chunk-MXXHAUU2.js"], "isController": false}, {"data": [1.0, 500, 1500, "01 Abrir login (/login)"], "isController": true}, {"data": [1.0, 500, 1500, "GET /reportes"], "isController": false}, {"data": [1.0, 500, 1500, "GET /main-RZRKNMXB.js"], "isController": false}, {"data": [1.0, 500, 1500, "GET /chunk-RMULKFPD.js"], "isController": false}, {"data": [1.0, 500, 1500, "GET /login"], "isController": false}, {"data": [1.0, 500, 1500, "02 Ingresar al Dashboard"], "isController": true}, {"data": [1.0, 500, 1500, "GET /chunk-EFM5GERE.js"], "isController": false}, {"data": [1.0, 500, 1500, "GET /chunk-4TZ4RJQL.js"], "isController": false}, {"data": [1.0, 500, 1500, "06 Recargar /reportes (F5)"], "isController": true}, {"data": [1.0, 500, 1500, "03 Abrir Nueva venta"], "isController": true}, {"data": [1.0, 500, 1500, "GET /favicon.ico"], "isController": false}, {"data": [1.0, 500, 1500, "GET /chunk-CLGPJTZV.js"], "isController": false}, {"data": [1.0, 500, 1500, "GET /chunk-JROBTQRL.js"], "isController": false}]}, function(index, item){
        switch(index){
            case 0:
                item = item.toFixed(3);
                break;
            case 1:
            case 2:
                item = formatDuration(item);
                break;
        }
        return item;
    }, [[0, 0]], 3);

    // Create statistics table
    createTable($("#statisticsTable"), {"supportsControllersDiscrimination": true, "overall": {"data": ["Total", 84691, 0, 0.0, 5.580722863114182, 0, 215, 5.0, 12.0, 15.0, 21.0, 1402.28495736402, 10185.11351376873, 308.6891829311201], "isController": false}, "titles": ["Label", "#Samples", "FAIL", "Error %", "Average", "Min", "Max", "Median", "90th pct", "95th pct", "99th pct", "Transactions/s", "Received", "Sent"], "items": [{"data": ["GET /chunk-QBLPMLLI.js", 5504, 0, 0.0, 4.708575581395344, 0, 46, 3.0, 10.0, 13.0, 24.0, 91.58679446219382, 196.23186235356764, 20.30293197550586], "isController": false}, {"data": ["GET /chunk-AH2PXVYY.js", 5504, 0, 0.0, 10.918968023255843, 3, 78, 8.0, 19.0, 23.0, 49.0, 91.61880982105701, 4155.324594257178, 20.31002913025385], "isController": false}, {"data": ["04 Abrir Productos", 4918, 0, 0.0, 5.039853599023996, 0, 58, 4.0, 10.0, 13.0, 23.0, 88.11409323825563, 342.30260049002044, 19.533104653402372], "isController": true}, {"data": ["GET /styles-6JVHUYDI.css", 5506, 0, 0.0, 3.8821285869959996, 1, 44, 3.0, 7.0, 10.0, 21.0, 91.54999833726848, 93.60629712804695, 20.47358361253367], "isController": false}, {"data": ["GET /chunk-GPMW2WCX.js", 5503, 0, 0.0, 4.670543339996368, 0, 57, 3.0, 10.0, 13.0, 26.0, 91.73042623060125, 212.30577164699704, 20.33477222104149], "isController": false}, {"data": ["GET /chunk-UL63HHFV.js", 5308, 0, 0.0, 4.668236623963824, 0, 57, 3.0, 10.0, 12.550000000000182, 21.0, 90.33356024506467, 188.69480992597005, 20.02511540588836], "isController": false}, {"data": ["GET /chunk-JUSSX37A.js", 5308, 0, 0.0, 4.6218914845516155, 0, 53, 3.0, 10.0, 12.0, 22.0, 90.33356024506467, 183.13717877808034, 20.02511540588836], "isController": false}, {"data": ["05 Abrir Reportes", 4695, 0, 0.0, 4.958679446219373, 0, 53, 3.0, 10.0, 13.0, 25.039999999999964, 86.38931311755938, 243.72922421545806, 19.150755935240216], "isController": true}, {"data": ["GET /chunk-MXXHAUU2.js", 4918, 0, 0.0, 5.039446929646198, 0, 58, 4.0, 10.0, 13.0, 23.0, 88.11409323825563, 342.30260049002044, 19.533104653402372], "isController": false}, {"data": ["01 Abrir login (/login)", 5503, 0, 0.0, 54.89932763946935, 14, 465, 41.0, 99.0, 125.0, 299.0, 90.70081751054852, 8522.776720393056, 179.45298464489386], "isController": true}, {"data": ["GET /reportes", 4506, 0, 0.0, 5.233910341766551, 1, 45, 4.0, 10.0, 13.0, 21.93000000000029, 85.36354336377069, 254.67346189093698, 18.173098098927746], "isController": false}, {"data": ["GET /main-RZRKNMXB.js", 5503, 0, 0.0, 4.625658731600956, 0, 41, 3.0, 10.0, 13.0, 27.0, 91.65098346185233, 85.29627660072781, 20.22765845935413], "isController": false}, {"data": ["GET /chunk-RMULKFPD.js", 5111, 0, 0.0, 4.900215222070045, 0, 49, 3.0, 10.0, 13.0, 23.0, 88.6034255599473, 318.7646677371542, 19.64157968955863], "isController": false}, {"data": ["GET /login", 5506, 0, 0.0, 7.135306937885931, 1, 215, 5.0, 12.0, 15.0, 34.0, 91.19064575431855, 272.05803005805, 19.14647347380712], "isController": false}, {"data": ["02 Ingresar al Dashboard", 5308, 0, 0.0, 13.90486058779203, 0, 130, 10.0, 29.0, 36.0, 61.909999999999854, 90.33048568802968, 574.2690056924544, 60.073301517136926], "isController": true}, {"data": ["GET /chunk-EFM5GERE.js", 5308, 0, 0.0, 4.614167294649579, 0, 58, 3.0, 10.0, 12.0, 23.0, 90.33509760206947, 202.4600087858881, 20.02545620670876], "isController": false}, {"data": ["GET /chunk-4TZ4RJQL.js", 4695, 0, 0.0, 4.958679446219373, 0, 53, 3.0, 10.0, 13.0, 25.039999999999964, 86.38931311755938, 243.72922421545806, 19.150755935240216], "isController": false}, {"data": ["06 Recargar /reportes (F5)", 4506, 0, 0.0, 5.233910341766551, 1, 45, 4.0, 10.0, 13.0, 21.93000000000029, 85.36354336377069, 254.67346189093698, 18.173098098927746], "isController": true}, {"data": ["03 Abrir Nueva venta", 5111, 0, 0.0, 4.900215222070045, 0, 49, 3.0, 10.0, 13.0, 23.0, 88.6034255599473, 318.7646677371542, 19.64157968955863], "isController": true}, {"data": ["GET /favicon.ico", 5503, 0, 0.0, 5.531164819189519, 1, 57, 4.0, 11.0, 14.0, 30.0, 91.6922154092242, 411.8090807295138, 19.789042583436085], "isController": false}, {"data": ["GET /chunk-CLGPJTZV.js", 5503, 0, 0.0, 5.455933127385053, 1, 57, 4.0, 11.0, 13.0, 24.0, 91.77326017710921, 926.2467225883045, 20.344267636917767], "isController": false}, {"data": ["GET /chunk-JROBTQRL.js", 5505, 0, 0.0, 7.964396003633068, 2, 71, 6.0, 15.0, 19.0, 40.0, 91.55011558098153, 2255.2262358693933, 20.294801012580866], "isController": false}]}, function(index, item){
        switch(index){
            // Errors pct
            case 3:
                item = item.toFixed(2) + '%';
                break;
            // Mean
            case 4:
            // Mean
            case 7:
            // Median
            case 8:
            // Percentile 1
            case 9:
            // Percentile 2
            case 10:
            // Percentile 3
            case 11:
            // Throughput
            case 12:
            // Kbytes/s
            case 13:
            // Sent Kbytes/s
                item = item.toFixed(2);
                break;
        }
        return item;
    }, [[0, 0]], 0, summaryTableHeader);

    // Create error table
    createTable($("#errorsTable"), {"supportsControllersDiscrimination": false, "titles": ["Type of error", "Number of errors", "% in errors", "% in all samples"], "items": []}, function(index, item){
        switch(index){
            case 2:
            case 3:
                item = item.toFixed(2) + '%';
                break;
        }
        return item;
    }, [[1, 1]]);

        // Create top5 errors by sampler
    createTable($("#top5ErrorsBySamplerTable"), {"supportsControllersDiscrimination": false, "overall": {"data": ["Total", 84691, 0, "", "", "", "", "", "", "", "", "", ""], "isController": false}, "titles": ["Sample", "#Samples", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors"], "items": [{"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}]}, function(index, item){
        return item;
    }, [[0, 0]], 0);

});
