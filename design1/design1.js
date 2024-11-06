function init() {
    var width = 800;
    var height = 540;

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
        .range(d3.schemeBlues[5]);  // Consistent blue color scheme

    // Load the initial data for the map
    loadMapData(2021); // Load initial data for 2021

    // Slider event listener
    d3.select("#year-slider").on("input", function() {
        var selectedYear = +this.value; // Get the selected year directly from the slider
        d3.select("#year-label").text(selectedYear); // Update label
        loadMapData(selectedYear); // Load the corresponding CSV for the selected year
    });

    // Function to load map data based on year
    function loadMapData(year) {
        var depressionRateMap = new Map(); // Reset the data map

        d3.csv("depression_rates_" + year + ".csv").then(function(data) {
            data.forEach(function(d) {
                var country = d.country.trim(); // Ensure no extra spaces
                var rate = parseFloat(d.percentage.replace('%', '')); // Convert percentage to number
                depressionRateMap.set(country, rate);
            });

            // Load the GeoJSON data (European Union countries)
            d3.json("https://raw.githubusercontent.com/etemkeskin/data_analyse/refs/heads/master/europe_union/european-union-countries.json").then(function(geoData) {
                svg.selectAll("path").remove(); // Clear previous paths

                // Bind the GeoJSON data to the SVG and create one path per country
                svg.selectAll("path")
                    .data(geoData.features)
                    .enter().append("path")
                    .attr("class", "country")
                    .attr("d", path)
                    .attr("fill", function(d) {
                        var country = d.properties.name;
                        var rate = depressionRateMap.get(country);
                        return rate ? colorScale(rate) : "#ccc"; // Grey for countries without data
                    })
                    .on("mouseover", function(event, d) {
                        var country = d.properties.name;
                        var rate = depressionRateMap.get(country) || "N/A"; // Get rate or show 'N/A'

                        // Display the country name and depression rate in the tooltip
                        tooltip.style("opacity", 1)
                            .html(country + ": " + rate + "%")
                            .style("left", (event.pageX + 10) + "px")
                            .style("top", (event.pageY - 28) + "px");
                    })
                    .on("mousemove", function(event) {
                        // Move the tooltip as the mouse moves
                        tooltip.style("left", (event.pageX + 10) + "px")
                            .style("top", (event.pageY - 28) + "px");
                    })
                    .on("mouseout", function() {
                        // Hide the tooltip on mouseout
                        tooltip.style("opacity", 0);
                    });

                // Add a legend
                var legend = svg.append("g")
                    .attr("class", "legend")
                    .attr("transform", "translate(20, 550)"); // Position legend below the map

                var legendScale = d3.scaleLinear()
                    .domain([2.7, 6.3])  // The range of depression percentages
                    .range([0, 100]);  // Adjust the range for the length of the legend

                var legendAxis = d3.axisBottom(legendScale)
                    .tickFormat(d => d + "%")  // Add percentage sign to ticks
                    .ticks(5);  // 5 ticks for the color scale

                legend.selectAll("rect")
                    .data(d3.range(5))
                    .enter().append("rect")
                    .attr("x", function(d) { return d * 20; })
                    .attr("y", 0)
                    .attr("width", 20)
                    .attr("height", 10)
                    .attr("fill", function(d) { return colorScale(2.7 + (d * 0.72)); }); // 0.72 is the step between min and max

                // Add the "No Data" indication
                legend.append("rect")
                    .attr("x", 120)  // Position to the right of the color rectangles
                    .attr("y", 0)
                    .attr("width", 20)
                    .attr("height", 10)
                    .attr("fill", "#ccc"); // Grey color for unavailable data

                // Add text for "No Data" indication
                legend.append("text")
                    .attr("x", 145)  // Positioning the text next to the rectangle
                    .attr("y", 10)
                    .text("No Data")  // Label for unavailable data
                    .attr("font-size", "12px");

                // Add the legend axis
                legend.append("g")
                    .attr("transform", "translate(0, 10)")
                    .call(legendAxis);
            }).catch(function(error) {
                console.error("Error loading GeoJSON data: " + error);
            });
        }).catch(function(error) {
            console.error("Error loading CSV data for year " + year + ": " + error);
        });
    }
}

// Call the init function when the window loads
window.onload = init;
