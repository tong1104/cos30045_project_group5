// Select the chart container and create the SVG canvas
const svg = d3.select("#chart")
    .append("svg")
    .attr("width", 960)
    .attr("height", 960)
    .attr("font-family", "sans-serif")
    .attr("font-size", 10);

const width = +svg.attr("width");
const height = +svg.attr("height");
const innerRadius = 200;
const outerRadius = Math.min(width, height) / 2 - 20;

// Create the main group element
const g = svg.append("g")
    .attr("transform", `translate(${width / 2},${height / 2})`);

// Define scales for the chart
const x = d3.scaleBand().range([0, 2 * Math.PI]).align(0);
const y = d3.scaleRadial().range([innerRadius, outerRadius]);
const z = d3.scaleOrdinal()
    .range(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00", "#8dd3c7", "#ffffb3", "#bebada", "#fb8072", "#80b1d3", "#fdb462"]);

// Load data from the CSV file
d3.csv("age_2021.csv").then(data => {
    // Extract age groups, excluding "All ages" and "Age-standardized"
    const ageGroups = Object.keys(data[0]).filter(key => key !== "Country/area" && key !== "All ages" && key !== "Age-standardized");

    // Process data, removing '%' and converting to numbers
    data.forEach(d => {
        ageGroups.forEach(group => d[group] = +d[group].replace('%', ''));
        d.total = d3.sum(ageGroups, group => d[group]);
    });

    // Set domains
    x.domain(data.map(d => d["Country/area"]));
    y.domain([0, d3.max(data, d => d.total)]);
    z.domain(ageGroups);

    // Stack data for each age group
    const stack = d3.stack().keys(ageGroups);
    const series = stack(data);

    // Draw the stacked bars
    g.append("g")
        .selectAll("g")
        .data(series)
        .enter().append("g")
        .attr("fill", d => z(d.key))
        .selectAll("path")
        .data(d => d)
        .enter().append("path")
        .attr("d", d3.arc()
            .innerRadius(d => y(d[0]))
            .outerRadius(d => y(d[1]))
            .startAngle(d => x(d.data["Country/area"]))
            .endAngle(d => x(d.data["Country/area"]) + x.bandwidth())
            .padAngle(0.01)
            .padRadius(innerRadius))
        .on("mouseover", function(event, d) {
            d3.select(this).style("stroke", "black").style("opacity", 0.8); // Highlight
            tooltip.transition().duration(200).style("opacity", 0.9);
            const formattedPercentage = (d[1] - d[0]).toFixed(2);
            tooltip.html(
                `<strong>Country:</strong> ${d.data["Country/area"]}<br>
                <strong>Age Group:</strong> ${d3.select(this.parentNode).datum().key}<br>
                <strong>Percentage:</strong> ${formattedPercentage}%`
            )
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 28) + "px");
        })
        .on("mousemove", function(event) {
            tooltip.style("left", (event.pageX + 10) + "px").style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function() {
            d3.select(this).style("stroke", null).style("opacity", 1); // Reset
            tooltip.transition().duration(500).style("opacity", 0);
        });

    // Add country labels
    const label = g.append("g")
        .selectAll("g")
        .data(data)
        .enter().append("g")
        .attr("text-anchor", "middle")
        .attr("transform", d => `rotate(${(x(d["Country/area"]) + x.bandwidth() / 2) * 180 / Math.PI - 90})translate(${innerRadius},0)`);

    label.append("line")
        .attr("x2", -5)
        .attr("stroke", "#000");

    label.append("text")
        .attr("transform", d => (x(d["Country/area"]) + x.bandwidth() / 2 + Math.PI / 2) % (2 * Math.PI) < Math.PI ? "rotate(90)translate(0,16)" : "rotate(-90)translate(0,-9)")
        .text(d => d["Country/area"]);

    // Radial ticks
    const yAxis = g.append("g").attr("text-anchor", "middle");
    const yTick = yAxis.selectAll("g")
        .data(y.ticks(5).slice(1))
        .enter().append("g");

    yTick.append("circle").attr("fill", "none").attr("stroke", "#000").attr("r", y);

    // Add legend for age groups
    const legend = g.append("g")
        .selectAll("g")
        .data(ageGroups.reverse())
        .enter().append("g")
        .attr("transform", (d, i) => `translate(-40,${(i - ageGroups.length / 2) * 20})`);

    legend.append("rect").attr("width", 18).attr("height", 18).attr("fill", z);
    legend.append("text").attr("x", 24).attr("y", 9).attr("dy", "0.35em").text(d => d);

    // Tooltip for displaying details on hover
    const tooltip = d3.select("#tooltip");
});
