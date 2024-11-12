let isHeatmap = true;

// Toggle function to switch between heatmap and bar chart
function toggleChartType() {
    isHeatmap = !isHeatmap;
    if (isHeatmap) {
        document.querySelector("#heatmap-chart").style.display = "block";
        document.querySelector("#bar-chart-container").style.display = "none";
        document.querySelector(".button-container button").innerText = "View in Bar Chart";
    } else {
        document.querySelector("#heatmap-chart").style.display = "none";
        document.querySelector("#bar-chart-container").style.display = "block";
        document.querySelector(".button-container button").innerText = "View in Heatmap";
    }
}

// Function to create the heatmap
function createHeatmap(data) {
    const columns = ["Extremely important", "Somewhat important", "Don't know/Refused", "Not too important", "Not important at all"];

    const margin = { top: 40, right: 60, bottom: 100, left: 180 };  // Adjusted margin for more spacing
    const width = 800 - margin.left - margin.right;  // Increased chart width
    const height = 600 - margin.top - margin.bottom; // Increased chart height

    const svg = d3.select("#heatmap-chart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const xScale = d3.scaleBand()
        .domain(columns)
        .range([0, width])
        .padding(0.1);  // Reduced padding for more spread

    const yScale = d3.scaleBand()
        .domain(data.map(d => d.Entity))
        .range([0, height])
        .padding(0.1); // Adjusted padding for better spacing

    const colorScale = d3.scaleSequential(d3.interpolateYlOrRd)
        .domain([0, 80]);

    svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(xScale).tickSize(0))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");

    svg.append("g")
        .call(d3.axisLeft(yScale).tickSize(0));

    const tooltip = d3.select("body").append("div")
        .attr("id", "tooltip")
        .style("position", "absolute")
        .style("visibility", "hidden");

    data.forEach(d => {
        columns.forEach(col => {
            const value = parseFloat(d[col]) || "N/A";
            svg.append("rect")
                .attr("x", xScale(col))
                .attr("y", yScale(d.Entity))
                .attr("width", xScale.bandwidth())
                .attr("height", yScale.bandwidth())
                .attr("fill", value === "N/A" ? "#D3D3D3" : colorScale(value))
                .on("mouseover", function(event) {
                    tooltip.html(`<strong>${d.Entity}</strong><br>${col}: <strong>${value}</strong>`)
                    .style("visibility", "visible");
                })
                .on("mousemove", function(event) {
                    tooltip.style("top", (event.pageY + 10) + "px")
                        .style("left", (event.pageX + 10) + "px");
                })
                .on("mouseout", function() {
                    tooltip.style("visibility", "hidden");
                });
        });
    });
}

// Function to create the stacked bar chart
function createStackedBarChart(data) {
    const margin = { top: 40, right: 60, bottom: 100, left: 180 };  // Adjusted margin for more spacing
    const width = 800 - margin.left - margin.right;  // Increased chart width
    const height = 600 - margin.top - margin.bottom; // Increased chart height
    const categories = ["Extremely important", "Somewhat important", "Don't know/Refused", "Not too important", "Not important at all"];

    const svg = d3.select("#bar-chart-container")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand().range([0, width]).padding(0.1);  // Adjusted padding for better spacing
    const y = d3.scaleLinear().range([height, 0]);
    const color = d3.scaleOrdinal(d3.schemeCategory10).domain(categories);

    const stack = d3.stack().keys(categories);
    const stackedData = stack(data.map(d => {
        const values = {};
        categories.forEach(cat => {
            values[cat] = +d[cat];
        });
        return { country: d.Entity, ...values };
    }));

    x.domain(data.map(d => d.Entity));
    y.domain([0, 100]);

    svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");

    svg.append("g")
        .call(d3.axisLeft(y).ticks(10));

    const tooltip = d3.select("body").append("div").attr("class", "tooltip");

    const bar = svg.selectAll(".country")
        .data(stackedData)
        .enter().append("g")
        .attr("fill", (d, i) => color(categories[i]));

    bar.selectAll("rect")
        .data(d => d)
        .enter().append("rect")
        .attr("x", d => x(d.data.country))
        .attr("y", d => y(d[1]))
        .attr("height", d => y(d[0]) - y(d[1]))
        .attr("width", x.bandwidth())
        .on("mouseover", function(event, d) {
            tooltip.html(`${d.data.country}<br>${d3.select(this.parentNode).datum().key}: ${d[1] - d[0]}%`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 25) + "px")
                .style("display", "block");
        })
        .on("mousemove", function(event) {
            tooltip.style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 25) + "px");
        })
        .on("mouseout", function() {
            tooltip.style("display", "none");
        });

   // Add legend for stacked bar chart at the bottom
const legend = svg.append("g")
.attr("transform", `translate(0, ${height + margin.bottom + 30})`); // Move legend below the chart

categories.forEach((cat, i) => {
const legendRow = legend.append("g")
    .attr("transform", `translate(${i * 110}, 0)`); // Space items horizontally (adjust '110' for more spacing)

legendRow.append("rect")
    .attr("width", 15)  // Adjust size of the color box
    .attr("height", 15)
    .attr("fill", color(cat));

legendRow.append("text")
    .attr("x", 18)  // Adjust the text spacing from the color box
    .attr("y", 13)  // Align text vertically with color box
    .text(cat)
    .style("font-size", "14px")
    .style("alignment-baseline", "middle");
});

}

// Load data from CSV and initialize both charts
d3.csv("design4.csv").then(data => {
    createHeatmap(data);         // Create the heatmap initially (visible by default)
    createStackedBarChart(data); // Create the stacked bar chart (initially hidden)

    // Show only the heatmap initially
    document.querySelector("#heatmap-chart").style.display = "block";
    document.querySelector("#bar-chart-container").style.display = "none";
});
