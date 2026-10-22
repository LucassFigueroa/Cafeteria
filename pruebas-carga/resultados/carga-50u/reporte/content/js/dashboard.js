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
    createTable($("#statisticsTable"), {"supportsControllersDiscrimination": true, "overall": {"data": ["Total", 8639, 0, 0.0, 1.6637342284986631, 0, 66, 1.0, 3.0, 4.0, 5.0, 72.15823191867895, 518.4786901326395, 15.882829857775866], "isController": false}, "titles": ["Label", "#Samples", "FAIL", "Error %", "Average", "Min", "Max", "Median", "90th pct", "95th pct", "99th pct", "Transactions/s", "Received", "Sent"], "items": [{"data": ["GET /chunk-QBLPMLLI.js", 551, 0, 0.0, 0.9764065335753177, 0, 7, 1.0, 1.0, 2.0, 3.0, 4.605752593347989, 9.868184755669423, 1.021001795595697], "isController": false}, {"data": ["GET /chunk-AH2PXVYY.js", 551, 0, 0.0, 4.653357531760442, 3, 15, 5.0, 5.0, 6.0, 7.0, 4.605906594554832, 208.89855465909184, 1.0210359345351043], "isController": false}, {"data": ["04 Abrir Productos", 520, 0, 0.0, 1.4249999999999994, 0, 3, 1.0, 2.0, 2.0, 3.0, 4.599327790553688, 17.867310498850166, 1.019577547320007], "isController": true}, {"data": ["GET /styles-6JVHUYDI.css", 551, 0, 0.0, 1.393829401088929, 1, 8, 1.0, 2.0, 2.0, 3.0, 4.605521610845962, 4.708965943902072, 1.029945750863013], "isController": false}, {"data": ["GET /chunk-GPMW2WCX.js", 551, 0, 0.0, 0.9401088929219595, 0, 3, 1.0, 1.0, 2.0, 2.0, 4.606330150980622, 10.661135212718822, 1.021129828391212], "isController": false}, {"data": ["GET /chunk-UL63HHFV.js", 538, 0, 0.0, 1.3159851301115248, 0, 4, 1.0, 2.0, 2.0, 3.0, 4.597033290040331, 9.602591999410418, 1.0190689031632374], "isController": false}, {"data": ["GET /chunk-JUSSX37A.js", 538, 0, 0.0, 0.9516728624535316, 0, 4, 1.0, 1.0, 2.0, 2.6100000000000136, 4.597190415968828, 9.320085257374304, 1.0191037347899647], "isController": false}, {"data": ["05 Abrir Reportes", 510, 0, 0.0, 1.3333333333333335, 0, 3, 1.0, 2.0, 2.0, 2.0, 4.568459712455771, 12.888945419223361, 1.0127347214135352], "isController": true}, {"data": ["GET /chunk-MXXHAUU2.js", 520, 0, 0.0, 1.4249999999999994, 0, 3, 1.0, 2.0, 2.0, 3.0, 4.599327790553688, 17.867310498850166, 1.019577547320007], "isController": false}, {"data": ["01 Abrir login (/login)", 551, 0, 0.0, 17.53176043557169, 12, 98, 17.0, 20.0, 22.0, 28.480000000000018, 4.592968007602154, 431.5820065034051, 9.087258968165981], "isController": true}, {"data": ["GET /reportes", 501, 0, 0.0, 1.5888223552894216, 1, 5, 2.0, 2.0, 2.0, 3.0, 4.551938435259806, 13.5802460153503, 0.9690650184439821], "isController": false}, {"data": ["GET /main-RZRKNMXB.js", 551, 0, 0.0, 0.9528130671506359, 0, 3, 1.0, 1.0, 2.0, 2.0, 4.606137615675915, 4.286766745839011, 1.0165889659597234], "isController": false}, {"data": ["GET /chunk-RMULKFPD.js", 535, 0, 0.0, 1.4, 0, 4, 1.0, 2.0, 2.0, 3.0, 4.646113764654798, 16.715120223621362, 1.029949047438124], "isController": false}, {"data": ["GET /login", 551, 0, 0.0, 2.041742286751358, 1, 66, 2.0, 3.0, 3.0, 4.480000000000018, 4.602905427418613, 13.732300860120963, 0.9664303387646505], "isController": false}, {"data": ["02 Ingresar al Dashboard", 538, 0, 0.0, 3.247211895910781, 1, 9, 3.0, 4.0, 5.0, 7.0, 4.596994010236429, 29.225030279921047, 3.05718058688575], "isController": true}, {"data": ["GET /chunk-EFM5GERE.js", 538, 0, 0.0, 0.979553903345725, 0, 4, 1.0, 1.0, 2.0, 2.0, 4.597072570515504, 10.303009325520588, 1.0190776108466988], "isController": false}, {"data": ["GET /chunk-4TZ4RJQL.js", 510, 0, 0.0, 1.3333333333333335, 0, 3, 1.0, 2.0, 2.0, 2.0, 4.568418789637751, 12.888829964124476, 1.012725649656025], "isController": false}, {"data": ["06 Recargar /reportes (F5)", 501, 0, 0.0, 1.5888223552894216, 1, 5, 2.0, 2.0, 2.0, 3.0, 4.551938435259806, 13.5802460153503, 0.9690650184439821], "isController": true}, {"data": ["03 Abrir Nueva venta", 535, 0, 0.0, 1.4, 0, 4, 1.0, 2.0, 2.0, 3.0, 4.646154113366161, 16.715265384414977, 1.02995799192785], "isController": true}, {"data": ["GET /favicon.ico", 551, 0, 0.0, 1.8221415607985483, 1, 10, 2.0, 2.0, 3.0, 4.0, 4.606176121449232, 20.68730857670412, 0.9941063699612112], "isController": false}, {"data": ["GET /chunk-CLGPJTZV.js", 551, 0, 0.0, 1.7495462794918326, 1, 4, 2.0, 2.0, 2.0, 3.0, 4.606368659973081, 46.49103525470878, 1.0211383650526262], "isController": false}, {"data": ["GET /chunk-JROBTQRL.js", 551, 0, 0.0, 3.0018148820326678, 2, 11, 3.0, 4.0, 4.0, 5.480000000000018, 4.605521610845962, 113.45144788436464, 1.0209505914668293], "isController": false}]}, function(index, item){
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
    createTable($("#top5ErrorsBySamplerTable"), {"supportsControllersDiscrimination": false, "overall": {"data": ["Total", 8639, 0, "", "", "", "", "", "", "", "", "", ""], "isController": false}, "titles": ["Sample", "#Samples", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors"], "items": [{"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}]}, function(index, item){
        return item;
    }, [[0, 0]], 0);

});
