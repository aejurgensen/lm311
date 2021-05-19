d3.csv("oakland_311_clipped_cleaned.csv").then(function(data) {
    var yearFormat = d3.timeFormat("%Y");
    var monthFormat = d3.timeFormat("%m");
    var dayFormat = d3.timeFormat("%d");
    var dayOfWeekFormat = d3.timeFormat("%a");
    var hourFormat = d3.timeFormat("%H");
    var minuteFormat = d3.timeFormat("%M");

    let flattened = [];

    data.forEach(function(d) {
        var initDate = d3.isoParse(d.datetimeinit);
        var closeDate = (d.hasOwnProperty("datetimeclosed") ? d3.isoParse(d.datetimeclosed) : null);
        var delta = (closeDate != null ? d3.timeDay.count(initDate, closeDate) : null);
        /*delta = delta != null && delta == 0 ? 0.0000001 : delta;
        delta = delta != null ? Math.log(delta) : null;*/

        flattened.push(
            {district: d.councildistrict,
            datetimeinit:initDate,
            year:+yearFormat(initDate),
            month:+monthFormat(initDate),
            day:+dayFormat(initDate),
            dayOfWeek:dayOfWeekFormat(initDate),
            hour:+hourFormat(initDate),
            minute:+minuteFormat(initDate),
            description : d.description,
            beat : d.beat, 
            source : d.source,
            category : d.descriptcat,
            lat : +d.reqaddress_lat,
            long : +d.reqaddress_long,
            probaddress : d.probaddress,
            datetimeclosed : closeDate,
            closeYear: (closeDate != null ? yearFormat(closeDate) : null),
            closeMonth: (closeDate != null ? monthFormat(closeDate) : null),
            closeDay: (closeDate != null ? dayFormat(closeDate) : null),
            closeDayOfWeek: (closeDate != null ? dayOfWeekFormat(closeDate) : null),
            delta: delta,
            status : d.status}
         )
    })

    return flattened;   
}).then(function(data) {
    let haveDelta = [];
    let target_categories = ["dumping", "graffiti", "litter", "streets", "parking"];

    data.forEach(function(d) {
        if (d.delta != null && d.delta >= 0 && target_categories.includes(d.category) && d.year >= 2016) {
            haveDelta.push(d);
        }
        if (d.delta < 0 && d.category == "streets") {console.log(d);}
    });

    return haveDelta;
}).then(function(data) {
    // violin plot from https://plotly.com/javascript/violin/
    // https://plotly.github.io/plotly.py-docs/generated/plotly.graph_objects.Violin.html
    function unpack(rows, key) {
        return rows.map(function(row) { return row[key]; });
    }

    var formatted = [{
        type: 'violin',
        y: unpack(data, 'category'),
        x: unpack(data, 'delta'),
        legendgroup: "F",
        scalegroup: "T",
        orientation: "h",
        x0:0,
        showlegend: false,
        points: false, 
        box: { visible:false, },
        line: { color: 'green',},
        meanline: { visible: true },
        transforms: [{
            type: 'groupby',
            groups: unpack(data, 'category'),
            //styles: {}
        }]
    }]

    var layout = {
        autosize:true,
        title: "Days to Close Request (2016-2020)",
        xaxis: {
          zeroline: false,
          violingap: 0,
        }
      }


    Plotly.newPlot('violinplot', formatted, layout);
});

