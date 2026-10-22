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
    createTable($("#apdexTable"), {"supportsControllersDiscrimination": true, "overall": {"data": [0.5620571056856558, 500, 1500, "Total"], "isController": false}, "titles": ["Apdex", "T (Toleration threshold)", "F (Frustration threshold)", "Label"], "items": [{"data": [0.6167435823478512, 500, 1500, "GET /chunk-QBLPMLLI.js"], "isController": false}, {"data": [0.539529138206656, 500, 1500, "GET /chunk-AH2PXVYY.js"], "isController": false}, {"data": [0.5967153284671532, 500, 1500, "04 Abrir Productos"], "isController": true}, {"data": [1.0, 500, 1500, "GET /styles-6JVHUYDI.css"], "isController": false}, {"data": [0.6019761653341379, 500, 1500, "GET /chunk-GPMW2WCX.js"], "isController": false}, {"data": [0.594973343488195, 500, 1500, "GET /chunk-UL63HHFV.js"], "isController": false}, {"data": [0.599075500770416, 500, 1500, "GET /chunk-JUSSX37A.js"], "isController": false}, {"data": [0.5887161404071165, 500, 1500, "05 Abrir Reportes"], "isController": true}, {"data": [0.5967153284671532, 500, 1500, "GET /chunk-MXXHAUU2.js"], "isController": false}, {"data": [0.015383449530160655, 500, 1500, "01 Abrir login (/login)"], "isController": true}, {"data": [0.5752147835953964, 500, 1500, "GET /reportes"], "isController": false}, {"data": [0.5994401885680612, 500, 1500, "GET /main-RZRKNMXB.js"], "isController": false}, {"data": [0.591229444009397, 500, 1500, "GET /chunk-RMULKFPD.js"], "isController": false}, {"data": [0.5988183992122661, 500, 1500, "GET /login"], "isController": false}, {"data": [0.087673343605547, 500, 1500, "02 Ingresar al Dashboard"], "isController": true}, {"data": [0.601010101010101, 500, 1500, "GET /chunk-EFM5GERE.js"], "isController": false}, {"data": [0.5887161404071165, 500, 1500, "GET /chunk-4TZ4RJQL.js"], "isController": false}, {"data": [0.5734162710754624, 500, 1500, "06 Recargar /reportes (F5)"], "isController": true}, {"data": [0.591229444009397, 500, 1500, "03 Abrir Nueva venta"], "isController": true}, {"data": [0.6006415995225306, 500, 1500, "GET /favicon.ico"], "isController": false}, {"data": [0.5972264322521976, 500, 1500, "GET /chunk-CLGPJTZV.js"], "isController": false}, {"data": [0.5763631173280046, 500, 1500, "GET /chunk-JROBTQRL.js"], "isController": false}]}, function(index, item){
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
    createTable($("#statisticsTable"), {"supportsControllersDiscrimination": true, "overall": {"data": ["Total", 106381, 0, 0.0, 522.4673390925128, 7, 1002, 553.0, 693.0, 884.0, 926.0, 1756.7085555757385, 12736.248606039557, 386.62499148529486], "isController": false}, "titles": ["Label", "#Samples", "FAIL", "Error %", "Average", "Min", "Max", "Median", "90th pct", "95th pct", "99th pct", "Transactions/s", "Received", "Sent"], "items": [{"data": ["GET /chunk-QBLPMLLI.js", 6934, 0, 0.0, 490.4094317854062, 54, 626, 528.0, 564.0, 571.0, 596.0, 115.45313774788126, 247.36736740122214, 25.59361549684477], "isController": false}, {"data": ["GET /chunk-AH2PXVYY.js", 6881, 0, 0.0, 810.1447464031388, 98, 1002, 869.0, 922.0, 938.0, 958.0, 114.51728327258807, 5193.87322952032, 25.386155569216303], "isController": false}, {"data": ["04 Abrir Productos", 6302, 0, 0.0, 508.6712154871474, 87, 625, 529.0, 561.0, 572.0, 590.0, 106.16576819407008, 412.4291268320418, 23.534794316458896], "isController": true}, {"data": ["GET /styles-6JVHUYDI.css", 7050, 0, 0.0, 342.6834042553191, 32, 498, 371.0, 403.0, 411.0, 432.0, 117.20308551669105, 119.8355766952886, 26.210455647775635], "isController": false}, {"data": ["GET /chunk-GPMW2WCX.js", 6629, 0, 0.0, 499.9008900286605, 58, 626, 528.0, 563.0, 573.0, 602.0, 110.96975074074695, 256.8342863823928, 24.599739666161675], "isController": false}, {"data": ["GET /chunk-UL63HHFV.js", 6565, 0, 0.0, 503.31683168316755, 71, 631, 529.0, 559.0, 571.0, 596.0, 110.154703177959, 230.09854501724053, 24.419060177145205], "isController": false}, {"data": ["GET /chunk-JUSSX37A.js", 6490, 0, 0.0, 504.3265023112488, 77, 625, 529.0, 561.0, 575.0, 599.0, 108.92551441710583, 220.8294608690544, 24.146573996760765], "isController": false}, {"data": ["05 Abrir Reportes", 6239, 0, 0.0, 510.58278570283665, 98, 626, 529.0, 561.0, 574.0, 603.6000000000004, 105.2249881940228, 296.87010829348816, 23.326242500042163], "isController": true}, {"data": ["GET /chunk-MXXHAUU2.js", 6302, 0, 0.0, 508.67105680736313, 87, 625, 529.0, 561.0, 572.0, 590.0, 106.16576819407008, 412.4291268320418, 23.534794316458896], "isController": false}, {"data": ["01 Abrir login (/login)", 6598, 0, 0.0, 4782.7832676568905, 541, 5557, 5170.0, 5377.0, 5410.0, 5467.0, 108.72001054574216, 10215.964975314313, 215.10423961491563], "isController": true}, {"data": ["GET /reportes", 6169, 0, 0.0, 513.7865132112188, 106, 627, 531.0, 563.0, 573.0, 603.0, 104.25539106334077, 311.0353707993223, 22.194995363094034], "isController": false}, {"data": ["GET /main-RZRKNMXB.js", 6788, 0, 0.0, 497.99705362404165, 52, 626, 531.0, 567.0, 576.0, 605.0, 113.32787952652053, 105.47018475466217, 25.0118171611266], "isController": false}, {"data": ["GET /chunk-RMULKFPD.js", 6385, 0, 0.0, 506.8992952231772, 77, 621, 529.0, 560.0, 573.0, 596.0, 107.32896285089932, 386.1327140065557, 23.792650944486468], "isController": false}, {"data": ["GET /login", 7109, 0, 0.0, 535.3743142495446, 7, 728, 593.0, 640.0, 653.0, 686.0, 117.5002479256884, 350.55005606736137, 24.67046221095997], "isController": false}, {"data": ["02 Ingresar al Dashboard", 6490, 0, 0.0, 1512.5613251155644, 229, 1731, 1589.0, 1664.0, 1687.4499999999998, 1712.0, 108.64106598814826, 690.6770894363722, 72.25055267375875], "isController": true}, {"data": ["GET /chunk-EFM5GERE.js", 6534, 0, 0.0, 504.83608815426953, 71, 627, 529.0, 559.0, 572.0, 600.0, 109.5665297224784, 245.56170479793747, 24.288674069338477], "isController": false}, {"data": ["GET /chunk-4TZ4RJQL.js", 6239, 0, 0.0, 510.5827857028366, 98, 626, 529.0, 561.0, 574.0, 603.6000000000004, 105.2249881940228, 296.87010829348816, 23.326242500042163], "isController": false}, {"data": ["06 Recargar /reportes (F5)", 6109, 0, 0.0, 514.3090522180402, 106, 627, 531.0, 564.0, 573.0, 603.0, 103.85923155389324, 309.85346913783576, 22.11065671752805], "isController": true}, {"data": ["03 Abrir Nueva venta", 6385, 0, 0.0, 506.8992952231774, 77, 621, 529.0, 560.0, 573.0, 596.0, 107.32896285089932, 386.1327140065557, 23.792650944486468], "isController": true}, {"data": ["GET /favicon.ico", 6702, 0, 0.0, 499.0431214562821, 58, 631, 529.0, 564.0, 573.0, 603.0, 111.98930570640822, 502.9675946716518, 24.169566954215057], "isController": false}, {"data": ["GET /chunk-CLGPJTZV.js", 6598, 0, 0.0, 502.47211276144174, 68, 628, 529.0, 563.0, 573.0, 602.0, 110.58965505682009, 1116.1563330197614, 24.515480173728672], "isController": false}, {"data": ["GET /chunk-JROBTQRL.js", 7006, 0, 0.0, 621.7854695974906, 70, 878, 668.0, 723.0, 751.0, 791.0, 116.34781453434303, 2866.0875211218777, 25.79194716728112], "isController": false}]}, function(index, item){
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
    createTable($("#top5ErrorsBySamplerTable"), {"supportsControllersDiscrimination": false, "overall": {"data": ["Total", 106381, 0, "", "", "", "", "", "", "", "", "", ""], "isController": false}, "titles": ["Sample", "#Samples", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors"], "items": [{"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}]}, function(index, item){
        return item;
    }, [[0, 0]], 0);

});
