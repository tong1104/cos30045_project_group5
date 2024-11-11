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
        const legendWidth = 200;
        const legendHeight = 10;

        const legendScale = d3.scaleLinear()
            .domain([2.7, 6.3])
            .range([0, legendWidth]);

        const legend = svg.append("g")
            .attr("class", "legend")
            .attr("transform", `translate(50, ${height + 20})`);

        const legendColors = colorScale.range();
        legend.selectAll("rect")
            .data(legendColors)
            .enter().append("rect")
            .attr("x", (d, i) => i * (legendWidth / legendColors.length))
            .attr("y", 0)
            .attr("width", legendWidth / legendColors.length)
            .attr("height", legendHeight)
            .attr("fill", d => d);

        legend.append("rect")
            .attr("x", legendWidth + 10)
            .attr("y", 0)
            .attr("width", 20)
            .attr("height", legendHeight)
            .attr("fill", "#ccc");

        legend.append("text")
            .attr("x", legendWidth + 35)
            .attr("y", legendHeight / 2 + 4)
            .text("No Data")
            .attr("font-size", "12px")
            .attr("alignment-baseline", "middle");

        const legendAxis = d3.axisBottom(legendScale)
            .tickFormat(d => d + "%")
            .ticks(5);

        legend.append("g")
            .attr("transform", `translate(0, ${legendHeight})`)
            .call(legendAxis);
    }
}

window.onload = init;