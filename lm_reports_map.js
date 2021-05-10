d3.csv("oakland_311_clipped_cleaned.csv").then(function(data) {
    let yearFormat = d3.timeFormat("%Y");
    let monthFormat = d3.timeFormat("%m");
    let dayFormat = d3.timeFormat("%d");
    let dayOfWeekFormat = d3.timeFormat("%a");
    let hourFormat = d3.timeFormat("%H");
    let minuteFormat = d3.timeFormat("%M");

    let flattened = [];

    data.forEach(function(d) {
        let initDate = d3.isoParse(d.datetimeinit);
        let closeDate = (d.hasOwnProperty("datetimeclosed") ? d3.isoParse(d.datetimeclosed) : null);
        let delta = (closeDate != null ? d3.timeDay.count(initDate, closeDate) : null);

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
    let year = [2020];
    /*let month = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    let issue = 'graffiti';
    let issues = ['dumping', 'graffiti', 'streets', 'litter', 
                'parking', 'parks', 'vegetation', 'encampment', 'utility'];*/


    let map = L.map("reportsmap", {
        scrollWheelZoom:false, 
        center: [37.8050, -122.2570],
        zoom: 15
        });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        minZoom: 12,
        maxZoom: 17,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);


    // same polygon used to clip 311 reports used as data
    let polyjoints =[[37.80319597217295, -122.24855440120581],
        [37.79824519341764, -122.25070016841772],
        [37.795803591313415, -122.25825326900366],
        [37.79695658014098, -122.26314561824682],
        [37.79871994001112, -122.2646905706394],
        [37.80353505446568, -122.26477640132788],
        [37.807468295291656, -122.26786630611304],
        [37.81377460626092, -122.26511972408179],
        [37.8149273145547, -122.26160066585425],
        [37.81296091898216, -122.2573949621189],
        [37.812350647638, -122.2482110784519],
        [37.809299215253034, -122.24597948055151],
        [37.80319597217295, -122.24855440120581]];

    // add shaded polygon with no interaction, and then polyline with hover to display name
    let polygon = L.polygon(polyjoints).addTo(map);
    let polyline = L.polyline(polyjoints)
        .bindTooltip("area of interest", {"sticky":"true"})
        .addTo(map);

    // create layers of markers for each report category
    let dumpingMarkers = [];
    let graffitiMarkers = [];
    let streetsMarkers = [];
    let parkingMarkers = [];
    let litterMarkers = [];

    let markersByIssue = {
        'dumping':[],
        'graffiti':[],
        'streets':[],
        'litter':[],
        'parking':[]
    }

    data.forEach(function(d) {
        if (Object.keys(markersByIssue).includes(d.category) && year.includes(d.year)) {
            markersByIssue[d.category].push(L.marker([d.lat, d.long]));
        }
    });

    // https://subscription.packtpub.com/book/application_development/9781782165200/1/ch01lvl1sec12/using-leaflet-map-controls-intermediate
    let dumpingGroup = L.layerGroup(markersByIssue["dumping"]);
    let graffitiGroup = L.layerGroup(markersByIssue["graffiti"]);
    let litterGroup = L.layerGroup(markersByIssue["litter"]);
    let parkingGroup = L.layerGroup(markersByIssue["parking"]);
    let streetsGroup = L.layerGroup(markersByIssue["streets"]);


    // create heatmap layers for each report category
    // heatmap from https://github.com/Leaflet/Leaflet.heat
    let countedByIssue = {
        'dumping':{},
        'graffiti':{},
        'streets':{},
        'litter':{},
        'parking':{}
    }

    data.forEach(function(d) {
        if (Object.keys(countedByIssue).includes(d.category) && year.includes(d.year)) {
            if (! Object.keys(countedByIssue[d.category]).includes(d.lat)) {
                countedByIssue[d.category][d.lat] = {};
            }

            if (! Object.keys(countedByIssue[d.category][d.lat]).includes(d.long)) {
                countedByIssue[d.category][d.lat][d.long] = 0;
            }

            countedByIssue[d.category][d.lat][d.long]++;
        }
    });

    let flattenedByIssue = {
        'dumping':[],
        'graffiti':[],
        'streets':[],
        'litter':[],
        'parking':[]
    };

    Object.keys(countedByIssue).forEach(function(cat) {
        Object.keys(countedByIssue[cat]).forEach(function(lat) {
            Object.keys(countedByIssue[cat][lat]).forEach(function(long) { 
                flattenedByIssue[cat].push([+lat, +long, countedByIssue[cat][lat][long]])
            });
        });
    });

    let rad = 12;
    
    let dumpingHeat = L.heatLayer(flattenedByIssue["dumping"], {radius: rad});
    let litterHeat = L.heatLayer(flattenedByIssue["litter"], {radius:rad});
    let parkingHeat = L.heatLayer(flattenedByIssue["parking"], {radius: rad});
    let graffitiHeat = L.heatLayer(flattenedByIssue["graffiti"], {radius: rad});
    let streetHeat = L.heatLayer(flattenedByIssue["streets"], {radius: rad});

    L.control.layers({
        'Dumping': dumpingGroup,
        'Dumping Heatmap':dumpingHeat,
        'Litter': litterGroup,
        'Litter Heatmap':litterHeat,
        'Illegal Parking': parkingGroup,
        'Illegal Parking Heatmap': parkingHeat,
        'Graffiti': graffitiGroup,
        'Graffiti Heatmap': graffitiHeat,
        'Street Maintenance': streetsGroup,
        'Street Maintenance Heatmap': streetHeat 
    }).addTo(map);

    let title = d3.select(".maptitle");

    map.on('baselayerchange', function(e) { 
        title.text(e.name.replace(" Heatmap", "") + " Requests (" + year + ")");
    });
});
