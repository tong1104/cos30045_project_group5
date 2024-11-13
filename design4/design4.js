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
        
        // Clear existing bar chart to trigger animation on re-creation
        d3.select("#bar-chart-container").select("svg").remove();

        // Re-create the bar chart with transition
        d3.csv("design4.csv").then(data => {
            createStackedBarChart(data);
        });
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
        .style("visibility", "hidden")
        .style("background-color", "rgba(0, 0, 0, 0.7)")  // Set a semi-transparent dark background
        .style("color", "white")                         // Set text color to white for contrast
        .style("padding", "8px")                         // Add padding for readability
        .style("border-radius", "4px");                  // Add rounded corners
    

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
                        tooltip.html(`<strong>${d.Entity}</strong><br>${col}: <strong>${value !== "N/A" ? value.toFixed(1) + "%" : value}</strong>`)
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
    const margin = { top: 40, right: 60, bottom: 100, left: 180 };
    const width = 800 - margin.left - margin.right;
    const height = 600 - margin.top - margin.bottom;
    const categories = ["Extremely important", "Somewhat important", "Don't know/Refused", "Not too important", "Not important at all"];

    const svg = d3.select("#bar-chart-container")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand().range([0, width]).padding(0.1);
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

    // X-axis label
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - 20)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .text("Country");

    // Y-axis label
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", -margin.left + 135)
        .attr("x", -height / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .text("Percentage (%)");

    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("visibility", "hidden")
        .style("background-color", "#f4f4f4")
        .style("color", "#333")
        .style("padding", "10px")
        .style("border-radius", "4px")
        .style("box-shadow", "0px 0px 10px rgba(0, 0, 0, 0.1)");

    const bar = svg.selectAll(".country")
        .data(stackedData)
        .enter().append("g")
        .attr("fill", (d, i) => color(categories[i]));

    bar.selectAll("rect")
        .data(d => d)
        .enter().append("rect")
        .attr("x", d => x(d.data.country))
        .attr("y", height)
        .attr("height", 0)
        .attr("width", x.bandwidth())
        .transition()
        .duration(800)
        .delay((d, i) => i * 100)
        .attr("y", d => y(d[1]))
        .attr("height", d => y(d[0]) - y(d[1]));

    bar.selectAll("rect")
        .on("mouseover", function(event, d) {
            const countryData = d.data;
            const hoveredCategory = d3.select(this.parentNode).datum().key;

            let tooltipContent = `<div class="tooltip-header">${countryData.country}</div>`;
            categories.forEach(category => {
                const isHovered = category === hoveredCategory;
                const boldClass = isHovered ? 'bold' : '';
                const percentage = countryData[category].toFixed(1) + '%';

                tooltipContent += `
                    <div class="tooltip-row">
                        <span class="tooltip-color-box" style="background-color: ${color(category)};"></span>
                        <span class="tooltip-category ${boldClass}">${category}</span>
                        <span class="tooltip-percentage ${boldClass}">${percentage}</span>
                    </div>`;
            });

            tooltip.html(tooltipContent)
                .style("visibility", "visible");
        })
        .on("mousemove", function(event) {
            tooltip.style("top", (event.pageY + 10) + "px")
                .style("left", (event.pageX + 10) + "px");
        })
        .on("mouseout", function() {
            tooltip.style("visibility", "hidden");
        });

    // Add legend for stacked bar chart at the bottom
    const legend = svg.append("g")
        .attr("transform", `translate(0, ${height + 85})`);

    categories.forEach((cat, i) => {
        const legendRow = legend.append("g")
            .attr("transform", `translate(${i * 110}, 0)`);

        legendRow.append("rect")
            .attr("width", 15)
            .attr("height", 15)
            .attr("fill", color(cat));

        legendRow.append("text")
            .attr("x", 20)
            .attr("y", 12)
            .text(cat)
            .style("font-size", "9px")
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