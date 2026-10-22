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
    createTable($("#statisticsTable"), {"supportsControllersDiscrimination": true, "overall": {"data": ["Total", 8457, 0, 0.0, 1.61629419415868, 0, 117, 1.0, 3.0, 4.0, 5.0, 141.51369622328943, 1026.091986464835, 31.152590501121132], "isController": false}, "titles": ["Label", "#Samples", "FAIL", "Error %", "Average", "Min", "Max", "Median", "90th pct", "95th pct", "99th pct", "Transactions/s", "Received", "Sent"], "items": [{"data": ["GET /chunk-QBLPMLLI.js", 548, 0, 0.0, 0.947080291970803, 0, 6, 1.0, 1.0, 2.0, 2.0, 9.191083977659627, 19.692615475571507, 2.0374766239538435], "isController": false}, {"data": ["GET /chunk-AH2PXVYY.js", 548, 0, 0.0, 4.587591240875916, 3, 11, 5.0, 5.0, 6.0, 7.0, 9.19077568134172, 416.84296383647796, 2.0374082809224316], "isController": false}, {"data": ["04 Abrir Productos", 496, 0, 0.0, 1.3306451612903223, 0, 10, 1.0, 2.0, 2.0, 3.0, 9.026551893574041, 35.06603850843509, 2.001003202970027], "isController": true}, {"data": ["GET /styles-6JVHUYDI.css", 548, 0, 0.0, 1.4197080291970805, 0, 4, 1.0, 2.0, 2.0, 3.509999999999991, 9.190621540938517, 9.39705151695569, 2.0553245438231644], "isController": false}, {"data": ["GET /chunk-GPMW2WCX.js", 548, 0, 0.0, 0.9051094890510955, 0, 3, 1.0, 1.0, 2.0, 2.0, 9.192008990724123, 21.274473933609542, 2.037681680560914], "isController": false}, {"data": ["GET /chunk-UL63HHFV.js", 530, 0, 0.0, 1.1943396226415097, 0, 3, 1.0, 2.0, 2.0, 2.0, 9.143133161971466, 19.09879085298532, 2.0268469021167217], "isController": false}, {"data": ["GET /chunk-JUSSX37A.js", 530, 0, 0.0, 0.8509433962264148, 0, 4, 1.0, 1.0, 1.0, 2.0, 9.143448632795653, 18.53691343914431, 2.0269168355904426], "isController": false}, {"data": ["05 Abrir Reportes", 478, 0, 0.0, 1.2259414225941427, 0, 4, 1.0, 2.0, 2.0, 3.0, 8.902298208365925, 25.11595656637613, 1.973458684862368], "isController": true}, {"data": ["GET /chunk-MXXHAUU2.js", 496, 0, 0.0, 1.3306451612903223, 0, 10, 1.0, 2.0, 2.0, 3.0, 9.026716168013394, 35.06667667613016, 2.0010396192764066], "isController": false}, {"data": ["01 Abrir login (/login)", 548, 0, 0.0, 17.436131386861334, 13, 139, 17.0, 20.0, 21.0, 29.549999999999955, 9.136835787051703, 858.5502697909199, 18.077372367740967], "isController": true}, {"data": ["GET /reportes", 448, 0, 0.0, 1.477678571428572, 0, 3, 1.0, 2.0, 2.0, 3.0, 8.50805226374962, 25.382909829838955, 1.8112845639623216], "isController": false}, {"data": ["GET /main-RZRKNMXB.js", 548, 0, 0.0, 0.9343065693430664, 0, 3, 1.0, 1.0, 2.0, 2.0, 9.191546460919156, 8.554241969976518, 2.0286030275075477], "isController": false}, {"data": ["GET /chunk-RMULKFPD.js", 513, 0, 0.0, 1.269005847953216, 0, 3, 1.0, 2.0, 2.0, 3.0, 9.12713945130413, 32.836310291605876, 2.023301421334021], "isController": false}, {"data": ["GET /login", 548, 0, 0.0, 2.3576642335766422, 1, 117, 2.0, 3.0, 3.0, 5.0, 9.172162153114854, 27.364214236099485, 1.925795764570013], "isController": false}, {"data": ["02 Ingresar al Dashboard", 530, 0, 0.0, 2.9339622641509417, 1, 8, 3.0, 4.0, 4.0, 5.689999999999941, 9.142975434722606, 58.125752031293125, 6.080435811568451], "isController": true}, {"data": ["GET /chunk-EFM5GERE.js", 530, 0, 0.0, 0.8886792452830184, 0, 3, 1.0, 1.0, 1.0, 2.0, 9.143290894662387, 20.492043557861503, 2.0268818682503538], "isController": false}, {"data": ["GET /chunk-4TZ4RJQL.js", 478, 0, 0.0, 1.2259414225941427, 0, 4, 1.0, 2.0, 2.0, 3.0, 8.902298208365925, 25.11595656637613, 1.973458684862368], "isController": false}, {"data": ["06 Recargar /reportes (F5)", 448, 0, 0.0, 1.477678571428572, 0, 3, 1.0, 2.0, 2.0, 3.0, 8.50805226374962, 25.382909829838955, 1.8112845639623216], "isController": true}, {"data": ["03 Abrir Nueva venta", 513, 0, 0.0, 1.269005847953216, 0, 3, 1.0, 2.0, 2.0, 3.0, 9.12713945130413, 32.836310291605876, 2.023301421334021], "isController": true}, {"data": ["GET /favicon.ico", 548, 0, 0.0, 1.7226277372262782, 1, 7, 2.0, 2.0, 2.0, 4.0, 9.191700632348748, 41.281866414230365, 1.9837557028799544], "isController": false}, {"data": ["GET /chunk-CLGPJTZV.js", 548, 0, 0.0, 1.6770072992700729, 1, 5, 2.0, 2.0, 2.0, 3.509999999999991, 9.192163177670423, 92.77442035275764, 2.037715860674987], "isController": false}, {"data": ["GET /chunk-JROBTQRL.js", 548, 0, 0.0, 2.885036496350365, 2, 5, 3.0, 3.0, 4.0, 4.509999999999991, 9.190467405705467, 226.3960354579301, 2.037339942475724], "isController": false}]}, function(index, item){
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
    createTable($("#top5ErrorsBySamplerTable"), {"supportsControllersDiscrimination": false, "overall": {"data": ["Total", 8457, 0, "", "", "", "", "", "", "", "", "", ""], "isController": false}, "titles": ["Sample", "#Samples", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors"], "items": [{"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}]}, function(index, item){
        return item;
    }, [[0, 0]], 0);

});
