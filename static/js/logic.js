// create the tile layers for the backgrounds of maps
var defaultMap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
	maxZoom: 19,
	attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
});

// grayscale layer
var grayscale = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/toner-lite/{z}/{x}/{y}{r}.{ext}', {
	attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
	subdomains: 'abcd',
	minZoom: 0,
	maxZoom: 20,
	ext: 'png'
});

//water color layer
var waterColor = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/watercolor/{z}/{x}/{y}.{ext}', {
	attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
	subdomains: 'abcd',
	minZoom: 1,
	maxZoom: 16,
	ext: 'jpg'
}); 

var topoMap = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
	maxZoom: 17,
	attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
});

// make a basemaps object
let basemaps = {
    GrayScale: grayscale,
    WaterColor: waterColor,
    Topography: topoMap,
    Default: defaultMap
};

// make map 
var myMap = L.map("map", {
    center: [36.7783, -119.4179],
    zoom: 5,
    layers: [defaultMap, grayscale, waterColor, topoMap]
});

// add the default map to the map
defaultMap.addTo(myMap);



// get the data for tectonicv plates and draw on map
//varible to hold the tect plates layers
let tectonicplates = new L.layerGroup();

// call the api to get the info for the tectonic plates
d3.json("https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json")
.then(function(plateData){
    //console log to make sure data loads
    //console.log(plateData);

    //load data using geoJson and add to the tectonic plate layer group
    L.geoJson(plateData,{
        // add styling to make the lines 
        color: "yellow",
        weight: 1
    }).addTo(tectonicplates);
});

//add the tectonic plates to the map
tectonicplates.addTo(myMap);

//varible to hold the earthquakes layers
let earthquakes = new L.layerGroup();

// get the data and populate the earthquake layergroup
// call the usgs geojson api
d3.json("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson")
.then(
    function(earthquakeData){
        //console log to see if data is there
        //console.log(earthquakeData)
        //plot circles, where the radius is dependent on the mag
        //the color is dependent on the depth

        // make a functon that chooses color 
        function dataColor(depth){
            if (depth > 90)
                return "red";
            else if (depth > 70)
                return "#fc4903";
            else if (depth > 50)
                return "#fc8403";
            else if (depth > 30)
                return "#fcad03";
            else if(depth >10)
                return "#cafc03";
            else
                return "green";
        }

        // function to determin the size of radius
        function radiusSize(mag){
            if (mag==0)
                return 1; //makes sure we plot a mag 0 quake
            else
                return mag * 5; // makes sure that the circles are pronounced on the map
        }

        // add on the style for each data point
        function dataStyle(feature)
        {
            return{
                opacity: .5,
                fillOpacity: .5,
                fillColor: dataColor(feature.geometry.coordinates[2]),
                color: "000000",
                radius: radiusSize(feature.properties.mag),
                weight: 0.5, 
                stroke: true
            }
        }

        // add the geojson data to the earthquake layer group
        L.geoJson(earthquakeData, {
            // make each feature a marker that is on the map
            pointToLayer: function(feature, latLng) {
                return L.circleMarker(latLng);
            },
            // set the style for each marker
            style: dataStyle, // calls the data style function and passes in the quake data
            // add popups
            onEachFeature: function(feature, layer){
                layer.bindPopup(`Magnitude: <b>${feature.properties.mag}</b><br>
                                Depth:<b>${feature.geometry.coordinates[2]}</b><br>
                                Location: <b>${feature.properties.place}</b>`);
            }
        }).addTo(earthquakes);
    }
);

// add the quake layer to the map
earthquakes.addTo(myMap);

// add the overlay for the tectonic plates and for the earthquakes
let overlays = {
    "Tectonic Plates": tectonicplates,
    "Earthquake Data": earthquakes
};

// layer control
L.control
    .layers(basemaps, overlays)
    .addTo(myMap);

// add the legend to the map
let legend = L.control({
    position: "bottomright"
});

// add the properties for the legand
legend.onAdd = function() {
    //div for the legend to appear in the page
    let div = L.DomUtil.create("div", "info legend");

    //set up the intervals
    let intervals = [-10, 10, 30, 50, 70, 90];
    // set the colors for the intervals
    let colors = [
        "green",
        "#cafc03",
        "#fcad03",
        "#fc8403",
        "#fc4903",
        "red"
    ];

    // loop through the interavls and the colors and generate a lable 
    // with a colored square for each interval
    for(var i = 0; i < intervals.length; i++)
    {
        // inner html that sets the square for each interval and label
        div.innerHTML += "<i style='background: "
            + colors[i]
            + "'></i> "
            + intervals[i]
            + (intervals[i + 1] ? "km - " + intervals[i + 1] + "km<br>" : "+");
    }

    return div;
};

// add the legand to the map
legend.addTo(myMap);