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
    createTable($("#statisticsTable"), {"supportsControllersDiscrimination": true, "overall": {"data": ["Total", 21275, 0, 0.0, 1.6599764982373582, 0, 146, 1.0, 3.0, 4.0, 5.0, 355.24646005877634, 2583.4656658575173, 78.1999935034982], "isController": false}, "titles": ["Label", "#Samples", "FAIL", "Error %", "Average", "Min", "Max", "Median", "90th pct", "95th pct", "99th pct", "Transactions/s", "Received", "Sent"], "items": [{"data": ["GET /chunk-QBLPMLLI.js", 1386, 0, 0.0, 0.9761904761904752, 0, 8, 1.0, 2.0, 2.0, 3.0, 23.23476161738081, 49.78229198098974, 5.150674694477972], "isController": false}, {"data": ["GET /chunk-AH2PXVYY.js", 1386, 0, 0.0, 4.5865800865800885, 3, 17, 4.0, 6.0, 6.0, 8.0, 23.23476161738081, 1053.8008142539227, 5.150674694477972], "isController": false}, {"data": ["04 Abrir Productos", 1218, 0, 0.0, 1.2651888341543498, 0, 7, 1.0, 2.0, 2.0, 3.0, 21.995882544154295, 85.44884839906815, 4.876040368674829], "isController": true}, {"data": ["GET /styles-6JVHUYDI.css", 1386, 0, 0.0, 1.4249639249639252, 0, 12, 1.0, 2.0, 2.0, 4.0, 23.231256599788807, 23.753052402323124, 5.195271251319958], "isController": false}, {"data": ["GET /chunk-GPMW2WCX.js", 1386, 0, 0.0, 0.9761904761904766, 0, 7, 1.0, 2.0, 2.0, 3.0, 23.241385092646937, 53.79109635700512, 5.152142984405131], "isController": false}, {"data": ["GET /chunk-UL63HHFV.js", 1335, 0, 0.0, 1.1752808988764025, 0, 10, 1.0, 2.0, 2.0, 3.0, 22.877217033673208, 47.78746800295605, 5.071414322894354], "isController": false}, {"data": ["GET /chunk-JUSSX37A.js", 1335, 0, 0.0, 0.9707865168539327, 0, 11, 1.0, 1.0, 2.0, 3.0, 22.87800113104725, 46.38157260552157, 5.0715881413552], "isController": false}, {"data": ["05 Abrir Reportes", 1174, 0, 0.0, 1.1925042589437824, 0, 6, 1.0, 2.0, 2.0, 3.0, 21.575726388914415, 60.87136087653686, 4.782900283480051], "isController": true}, {"data": ["GET /chunk-MXXHAUU2.js", 1218, 0, 0.0, 1.2651888341543498, 0, 7, 1.0, 2.0, 2.0, 3.0, 21.995882544154295, 85.44884839906815, 4.876040368674829], "isController": false}, {"data": ["01 Abrir login (/login)", 1386, 0, 0.0, 18.004329004329012, 12, 190, 17.0, 21.0, 24.0, 34.12999999999988, 23.071929152864016, 2167.9727490407504, 45.648172327834466], "isController": true}, {"data": ["GET /reportes", 1136, 0, 0.0, 1.4075704225352106, 0, 7, 1.0, 2.0, 2.0, 3.0, 21.699680999407843, 64.7387943878818, 4.619658650264561], "isController": false}, {"data": ["GET /main-RZRKNMXB.js", 1386, 0, 0.0, 0.9891774891774902, 0, 12, 1.0, 2.0, 2.0, 3.0, 23.238657322021396, 21.6273832303578, 5.128844291774253], "isController": false}, {"data": ["GET /chunk-RMULKFPD.js", 1268, 0, 0.0, 1.2988958990536272, 0, 9, 1.0, 2.0, 2.0, 3.0, 22.24912705514906, 80.04471100700111, 4.9321795327332385], "isController": false}, {"data": ["GET /login", 1386, 0, 0.0, 2.5252525252525237, 1, 146, 2.0, 3.0, 3.0, 6.129999999999882, 23.170670545162746, 69.12734230026581, 4.864935710166006], "isController": false}, {"data": ["02 Ingresar al Dashboard", 1335, 0, 0.0, 3.1280898876404497, 0, 37, 3.0, 4.0, 5.0, 8.0, 22.87682500514086, 145.4376277182295, 15.213982254395434], "isController": true}, {"data": ["GET /chunk-EFM5GERE.js", 1335, 0, 0.0, 0.9812734082397008, 0, 16, 1.0, 1.0, 2.0, 3.0, 22.877609075641775, 51.27354768417761, 5.071501230635432], "isController": false}, {"data": ["GET /chunk-4TZ4RJQL.js", 1174, 0, 0.0, 1.1925042589437824, 0, 6, 1.0, 2.0, 2.0, 3.0, 21.575726388914415, 60.87136087653686, 4.782900283480051], "isController": false}, {"data": ["06 Recargar /reportes (F5)", 1136, 0, 0.0, 1.4075704225352106, 0, 7, 1.0, 2.0, 2.0, 3.0, 21.699680999407843, 64.7387943878818, 4.619658650264561], "isController": true}, {"data": ["03 Abrir Nueva venta", 1268, 0, 0.0, 1.2988958990536272, 0, 9, 1.0, 2.0, 2.0, 3.0, 22.24912705514906, 80.04471100700111, 4.9321795327332385], "isController": true}, {"data": ["GET /favicon.ico", 1386, 0, 0.0, 1.8658008658008673, 1, 11, 2.0, 3.0, 3.0, 5.0, 23.239826288167137, 104.37496201101628, 5.015626571957947], "isController": false}, {"data": ["GET /chunk-CLGPJTZV.js", 1386, 0, 0.0, 1.704906204906205, 1, 10, 2.0, 2.0, 3.0, 4.0, 23.244113503723085, 234.59757134861138, 5.152747817719863], "isController": false}, {"data": ["GET /chunk-JROBTQRL.js", 1386, 0, 0.0, 2.955266955266955, 2, 11, 3.0, 4.0, 4.0, 6.0, 23.23242482148245, 572.3026524627879, 5.150156674293473], "isController": false}]}, function(index, item){
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
    createTable($("#top5ErrorsBySamplerTable"), {"supportsControllersDiscrimination": false, "overall": {"data": ["Total", 21275, 0, "", "", "", "", "", "", "", "", "", ""], "isController": false}, "titles": ["Sample", "#Samples", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors"], "items": [{"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}]}, function(index, item){
        return item;
    }, [[0, 0]], 0);

});
