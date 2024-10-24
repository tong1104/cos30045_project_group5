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

    // Define a color scale
    var colorScale = d3.scaleQuantize()
        .domain([2.7, 6.3])  // Based on the data range in your CSV
        .range(d3.schemeBlues[5]);  // You can choose a different color scheme if you prefer

    // Create a map for country name normalization
    var countryNameMap = {
        "United Kingdom": "UK",
        "Czech Republic": "Czechia",
        "Germany": "Germany",
        "France": "France",
        // Add more mappings here if needed
    };

    // Function to update the map based on the selected year
    function updateMap(year) {
        d3.csv(`depression_rates_${year}.csv`).then(function (data) {
            // Create a map for the depression rates
            var depressionRateMap = new Map();
            data.forEach(function (d) {
                var country = d.country.trim();  // Ensure no extra spaces
                var rate = parseFloat(d.percentage.replace('%', ''));  // Convert percentage to number
                depressionRateMap.set(country, rate);
            });

            // Load the GeoJSON data (European Union countries)
            d3.json("https://raw.githubusercontent.com/etemkeskin/data_analyse/refs/heads/master/europe_union/european-union-countries.json").then(function (geoData) {
                // Bind the GeoJSON data to the SVG and create one path per country
                svg.selectAll("path").remove(); // Clear previous paths

                svg.selectAll("path")
                    .data(geoData.features)
                    .enter().append("path")
                    .attr("class", "country")
                    .attr("d", path)
                    .attr("fill", function (d) {
                        var country = countryNameMap[d.properties.name] || d.properties.name;
                        var rate = depressionRateMap.get(country);
                        return rate ? colorScale(rate) : "#ccc";  // Grey for countries without data
                    })
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

                // Add the legend here if you want it to be redrawn or updated
            }).catch(function (error) {
                console.error("Error loading GeoJSON data: " + error);
            });
        }).catch(function (error) {
            console.error("Error loading CSV data: " + error);
        });
    }

    // Initialize the map with the default year (2021)
    updateMap(2021);

    // Event listener for the slider
    d3.select("#yearSlider").on("input", function() {
        var selectedYear = +this.value;  // Get the selected year
        d3.select("#selectedYear").text(selectedYear);  // Update displayed year
        updateMap(selectedYear);  // Update the map with the selected year
    });
}

// Call the init function when the window loads
window.onload = init;
