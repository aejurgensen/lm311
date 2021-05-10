/* 
    leaflet map based on:
    https://www.d3-graph-gallery.com/graph/bubblemap_leaflet_basic.html
    https://joshuafrazier.info/leaflet-basics/
    https://leafletjs.com/examples/quick-start/
    http://duspviz.mit.edu/web-map-workshop/leaflet-javascript-interactions/
    https://maptimeboston.github.io/leaflet-intro/
    https://geobgu.xyz/web-mapping/leaflet.html
*/
d3.json("lm_features.json").then(function(data) {
    let infotext = d3.select("#featuresmaptext");
    let infotitle = infotext.select("h3");
    let infosource = infotext.select(".infosource").select("ul");

    let infomap = {};
    data.forEach(function(d) {
        infomap[d.name] = {"description":d.description, "sources":d.desc_src}
    });

    let map = L.map("featuresmap", {scrollWheelZoom:false}).setView([37.8050, -122.2570], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        minZoom: 12,
        maxZoom: 17,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    // same polygon used to clip 311 reports used as data
    let polyjoints = [[37.80319597217295, -122.24855440120581],
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

    data.forEach(d =>{
        let options = {'maxWidth': '350', 'class':'popup', 'keepInView':'true',}
        let popupcontents = "<b>" + d.name+ "</b>" + "<br/><img src='" + d.image + "' width='350px' max-height='100px'/><br/>Photo by <a href='" + d.image_src + "' target='_blank'>"+ d.image_src_name + "</a>";
        let popup = L.popup(options).setContent(popupcontents);
        popup.markerId = d.name;

        let marker = L.marker([d.lat,d.long]).bindPopup(popup).addTo(map);
        if (d.name == "Lake Merritt") {
            marker.openPopup();
            addFeatureInfo("Lake Merritt");
        }
    });

    // based on https://stackoverflow.com/questions/41109053/trigger-an-event-on-single-markers-in-leaflet-layergroup
    map.on('popupopen', function (e) {
        infotext.select("p#info").text(infomap[e.popup.markerId].description);
        infotitle.text(e.popup.markerId);
        addFeatureInfo(e.popup.markerId);
    });

    function addFeatureInfo(featureName) {
        infotext.select("p#info").text(infomap[featureName]["description"]);
        infotitle.text(featureName)

        infosource.selectAll("li").remove();
        let info = infomap[featureName].sources;
        Object.keys(info).forEach(function(d) {
            infosource.append("li").append("a")
                .attr("href", info[d])
                .attr("target", "_blank")
                .text(d);
        });
    }
});