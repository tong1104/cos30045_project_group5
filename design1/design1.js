function init() {
    var width = 800;
    var height = 540;

    var allowedYears = [1990, 1995, 2000, 2005, 2010, 2015, 2020];

    var svg = d3.select("#map").append("svg")
        .attr("width", width)
        .attr("height", height + 70) // Increased height to make room for the legend
        .style("margin-top", "0px");

    var tooltip = d3.select("#tooltip");

    var projection = d3.geoMercator()
        .center([13, 52])
        .scale(400)
        .translate([width / 2, height / 2]);

    var path = d3.geoPath().projection(projection);

    var colorScale = d3.scaleQuantize()
        .domain([2.7, 6.3])
        .range(d3.schemeBlues[5]);

    addLegend(svg, colorScale);

    loadMapData(2020);

    d3.select("#year-slider")
        .attr("step", 5)
        .on("input", function() {
            var selectedYear = +this.value;

            // Snap to nearest allowed year
            var nearestYear = allowedYears.reduce((prev, curr) =>
                Math.abs(curr - selectedYear) < Math.abs(prev - selectedYear) ? curr : prev
            );

            this.value = nearestYear;

            loadMapData(nearestYear);
        });

    function loadMapData(year) {
        var depressionRateMap = new Map();

        // Mapping for country name differences
        const countryNameMap = {
            "Czechia": "Czech Republic"
            // Add more mappings if needed
        };

        d3.csv("depression_rates_" + year + ".csv").then(function(data) {
            data.forEach(function(d) {
                var country = d.country.trim();
                var rate = parseFloat(d.percentage.replace('%', ''));
                
                // Adjust the country name if needed
                if (countryNameMap[country]) {
                    country = countryNameMap[country];
                }
                
                depressionRateMap.set(country, rate);
            });

            d3.json("https://raw.githubusercontent.com/etemkeskin/data_analyse/refs/heads/master/europe_union/european-union-countries.json").then(function(geoData) {
                svg.selectAll("path").remove();

                svg.selectAll("path")
                    .data(geoData.features)
                    .enter().append("path")
                    .attr("class", "country")
                    .attr("d", path)
                    .attr("fill", function(d) {
                        var country = d.properties.name;
                        var rate = depressionRateMap.get(country);
                        return rate ? colorScale(rate) : "#ccc";
                    })
                    .on("mouseover", function(event, d) {
                        var country = d.properties.name;
                        var rate = depressionRateMap.get(country) || "N/A";

                        tooltip.style("opacity", 1)
                            .html(country + ": " + rate + "%")
                            .style("left", (event.pageX + 10) + "px")
                            .style("top", (event.pageY - 28) + "px");
                    })
                    .on("mousemove", function(event) {
                        tooltip.style("left", (event.pageX + 10) + "px")
                            .style("top", (event.pageY - 28) + "px");
                    })
                    .on("mouseout", function() {
                        tooltip.style("opacity", 0);
                    });
            });
        });
    }

    function addLegend(svg, colorScale) {
        const legendWidth = 10;  // Width of the legend (smaller for vertical display)
        const legendHeight = 120;  // Height of the color band (larger for vertical display)
        const legendMarginTop = 80;  // Position from the top
        const legendMarginLeft = 30;  // Position from the left
    
        // Create a scale for the legend based on the color scale
        const legendScale = d3.scaleLinear()
            .domain([6.3, 2.7])  // Reverse the order: highest values at the bottom, lowest at the top
            .range([legendHeight, 0]);  // Reverse the range for vertical axis
    
        // Create the legend group and position it near the black circle area
        const legend = svg.append("g")
            .attr("class", "legend")
            .attr("transform", `translate(${legendMarginLeft}, ${legendMarginTop})`);  // Adjusted position
    
        console.log("Legend group added");
    
        // Get the color range from the color scale
        const legendColors = colorScale.range();
        console.log("Legend colors:", legendColors);
    
        // Bind the data for color rectangles (making them vertical)
        legend.selectAll("rect")
            .data(legendColors)  // Using the color scale range for the rectangles
            .enter().append("rect")
            .attr("x", 0)  // Set x to 0 to stack rectangles vertically
            .attr("y", (d, i) => i * (legendHeight / legendColors.length))  // Space out the rectangles vertically
            .attr("width", legendWidth)  // Width of each rectangle
            .attr("height", legendHeight / legendColors.length)  // Height of each rectangle
            .attr("fill", d => d)  // Fill each rectangle with the respective color
            .on("mouseover", function(event, d) {
                d3.select(this).attr("opacity", 0.7);  // Highlight on hover
            })
            .on("mouseout", function() {
                d3.select(this).attr("opacity", 1);  // Reset opacity on mouse out
            });
    
        // Add a 'No Data' label with a grey rectangle at the end of the legend
        legend.append("rect")
            .attr("x", 0)
            .attr("y", legendHeight)
            .attr("width", legendWidth)
            .attr("height", 20)  // Set a height for the 'No Data' box
            .attr("fill", "#ccc");
    
        legend.append("text")
            .attr("x", legendWidth + 5)
            .attr("y", legendHeight + 10)
            .text("No Data")
            .attr("font-size", "12px")
            .attr("alignment-baseline", "middle");
    
        // Add the legend axis on the right side
        const legendAxis = d3.axisRight(legendScale)
            .tickFormat(d => d + "%")
            .ticks(5);
    
        legend.append("g")
            .attr("transform", `translate(${legendWidth}, 0)`)  // Shift axis to the right side of the rectangles
            .call(legendAxis);
    
        console.log("Legend axis added");
    }   
    
}
window.onload = init;