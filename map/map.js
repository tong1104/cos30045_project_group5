function init() {
    var width = 960;
    var height = 600;

    // Create an SVG element and append it to the body
    var svg = d3.select("body").append("svg")
        .attr("width", width)
        .attr("height", height);

    // Create a tooltip div
    var tooltip = d3.select("#tooltip");

    // Create a projection for the map (Mercator projection centered on Europe)
    var projection = d3.geoMercator()
        .center([13, 52])  // Center on Europe
        .scale(400)
        .translate([width / 2, height / 2]);

    // Create a path generator based on the projection
    var path = d3.geoPath().projection(projection);
    
    // Create a map for country name normalization if needed
    var countryNameMap = {
        "United Kingdom": "UK",
        "Czech Republic": "Czechia",
        "Germany": "Germany",
        "France": "France",
        // Add more mappings here if needed
    };

    // Load the CSV file with depression rates
    d3.csv("depression_rates.csv").then(function (data) {
        // Create a map for the depression rates
        var depressionRateMap = new Map();
        data.forEach(function (d) {
            depressionRateMap.set(d.country, +d["depression rates"]);
        });

        // Load the GeoJSON data (European Union countries)
        d3.json("european-union-countries.json").then(function (geoData) {
            // Bind the GeoJSON data to the SVG and create one path per country
            svg.selectAll("path")
                .data(geoData.features)
                .enter().append("path")
                .attr("class", "country")
                .attr("d", path)
                .on("mouseover", function (event, d) {
                    var country = countryNameMap[d.properties.name] || d.properties.name;
                    var rate = depressionRateMap.get(country) || "N/A";  // Get rate or show 'N/A'

                    // Display the country name and depression rate in the tooltip
                    tooltip.style("opacity", 1)
                        .html(country + ": " + rate + "%")
                        .style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY - 28) + "px");
                })
                .on("mousemove", function (event) {
                    // Move the tooltip as the mouse moves
                    tooltip.style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY - 28) + "px");
                })
                .on("mouseout", function () {
                    // Hide the tooltip on mouseout
                    tooltip.style("opacity", 0);
                });
        }).catch(function (error) {
            console.error("Error loading GeoJSON data: " + error);
        });
    }).catch(function (error) {
        console.error("Error loading CSV data: " + error);
    });
}

// Call the init function when the window loads
window.onload = init;
