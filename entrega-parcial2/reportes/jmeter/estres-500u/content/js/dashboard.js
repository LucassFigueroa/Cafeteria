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
    createTable($("#statisticsTable"), {"supportsControllersDiscrimination": true, "overall": {"data": ["Total", 42460, 0, 0.0, 1.868134715025899, 0, 192, 1.0, 4.0, 5.0, 7.0, 706.8773203256363, 5138.96900414329, 155.60480575336706], "isController": false}, "titles": ["Label", "#Samples", "FAIL", "Error %", "Average", "Min", "Max", "Median", "90th pct", "95th pct", "99th pct", "Transactions/s", "Received", "Sent"], "items": [{"data": ["GET /chunk-QBLPMLLI.js", 2764, 0, 0.0, 1.2149059334298136, 0, 17, 1.0, 2.0, 3.0, 5.0, 46.22923949221429, 99.04975727140443, 10.248083363996722], "isController": false}, {"data": ["GET /chunk-AH2PXVYY.js", 2764, 0, 0.0, 5.043415340086823, 3, 38, 5.0, 6.0, 7.0, 11.0, 46.233105847718456, 2096.879037974207, 10.24894045647665], "isController": false}, {"data": ["04 Abrir Productos", 2449, 0, 0.0, 1.4177215189873433, 0, 19, 1.0, 2.0, 3.0, 5.0, 43.846456833888354, 170.3332082863358, 9.71986884891861], "isController": true}, {"data": ["GET /styles-6JVHUYDI.css", 2764, 0, 0.0, 1.5473950795947906, 0, 18, 1.0, 2.0, 3.0, 5.0, 46.212235207570515, 47.250205334303054, 10.334572131380515], "isController": false}, {"data": ["GET /chunk-GPMW2WCX.js", 2764, 0, 0.0, 1.150144717800292, 0, 11, 1.0, 2.0, 2.0, 5.0, 46.268706685861595, 107.08675277880076, 10.256832439150958], "isController": false}, {"data": ["GET /chunk-UL63HHFV.js", 2656, 0, 0.0, 1.2725903614457799, 0, 19, 1.0, 2.0, 3.0, 5.0, 45.37766311868924, 94.78791153405888, 10.059306179631307], "isController": false}, {"data": ["GET /chunk-JUSSX37A.js", 2656, 0, 0.0, 1.1347891566265065, 0, 24, 1.0, 2.0, 2.0, 4.0, 45.37766311868924, 91.99612171328015, 10.059306179631307], "isController": false}, {"data": ["05 Abrir Reportes", 2358, 0, 0.0, 1.3189143341815128, 0, 13, 1.0, 2.0, 3.0, 4.0, 43.43741365017961, 122.54950003453993, 9.62919228378005], "isController": true}, {"data": ["GET /chunk-MXXHAUU2.js", 2449, 0, 0.0, 1.4177215189873433, 0, 19, 1.0, 2.0, 3.0, 5.0, 43.846456833888354, 170.3332082863358, 9.71986884891861], "isController": false}, {"data": ["01 Abrir login (/login)", 2764, 0, 0.0, 20.32308248914614, 12, 306, 18.0, 25.0, 28.0, 37.34999999999991, 45.82456024006499, 4305.942393417278, 90.66460844372233], "isController": true}, {"data": ["GET /reportes", 2265, 0, 0.0, 1.5448123620309069, 0, 16, 1.0, 2.0, 3.0, 4.0, 42.82311124555698, 127.75840317888338, 9.116638917511155], "isController": false}, {"data": ["GET /main-RZRKNMXB.js", 2764, 0, 0.0, 1.1447178002894358, 0, 15, 1.0, 2.0, 2.0, 5.0, 46.2516733601071, 43.0447702267403, 10.207888847054887], "isController": false}, {"data": ["GET /chunk-RMULKFPD.js", 2543, 0, 0.0, 1.4034604797483314, 0, 18, 1.0, 2.0, 3.0, 5.0, 44.485261960990115, 160.04268072684334, 9.861478969867926], "isController": false}, {"data": ["GET /login", 2765, 0, 0.0, 3.0408679927667217, 1, 192, 2.0, 3.0, 4.0, 6.0, 46.03193101037175, 137.33159105145089, 9.664907389872974], "isController": false}, {"data": ["02 Ingresar al Dashboard", 2656, 0, 0.0, 3.5760542168674707, 0, 44, 3.0, 6.0, 7.0, 11.0, 45.37611262023132, 288.47509097432214, 30.176887396853058], "isController": true}, {"data": ["GET /chunk-EFM5GERE.js", 2656, 0, 0.0, 1.1679216867469915, 0, 24, 1.0, 2.0, 2.0, 4.0, 45.37766311868924, 101.70091489979669, 10.059306179631307], "isController": false}, {"data": ["GET /chunk-4TZ4RJQL.js", 2358, 0, 0.0, 1.3189143341815128, 0, 13, 1.0, 2.0, 3.0, 4.0, 43.43741365017961, 122.54950003453993, 9.62919228378005], "isController": false}, {"data": ["06 Recargar /reportes (F5)", 2265, 0, 0.0, 1.5448123620309069, 0, 16, 1.0, 2.0, 3.0, 4.0, 42.82392089391389, 127.76081868252633, 9.116811284055888], "isController": true}, {"data": ["03 Abrir Nueva venta", 2543, 0, 0.0, 1.4034604797483314, 0, 18, 1.0, 2.0, 3.0, 5.0, 44.485261960990115, 160.04268072684334, 9.861478969867926], "isController": true}, {"data": ["GET /favicon.ico", 2764, 0, 0.0, 2.019898697539797, 1, 14, 2.0, 3.0, 3.0, 5.0, 46.25786584549471, 207.75383303069353, 9.983387062357744], "isController": false}, {"data": ["GET /chunk-CLGPJTZV.js", 2764, 0, 0.0, 1.9120839363241664, 1, 17, 2.0, 3.0, 3.0, 5.0, 46.27490373346727, 467.04211922400805, 10.258206198727608], "isController": false}, {"data": ["GET /chunk-JROBTQRL.js", 2764, 0, 0.0, 3.2492764109985606, 2, 20, 3.0, 4.0, 5.0, 8.0, 46.21687149903854, 1138.4966636359836, 10.24534163113452], "isController": false}]}, function(index, item){
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
    createTable($("#top5ErrorsBySamplerTable"), {"supportsControllersDiscrimination": false, "overall": {"data": ["Total", 42460, 0, "", "", "", "", "", "", "", "", "", ""], "isController": false}, "titles": ["Sample", "#Samples", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors"], "items": [{"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}]}, function(index, item){
        return item;
    }, [[0, 0]], 0);

});
