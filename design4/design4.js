// Set dimensions and margins for the SVG
const margin = {top: 20, right: 30, bottom: 40, left: 40},
      width = 300 - margin.left - margin.right,
      height = 500 - margin.top - margin.bottom;

// Create an SVG container
const svg = d3.select("body").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

let data; // Declare a variable to store data

// Load data from CSV
d3.csv("employment.csv").then(loadedData => {
    data = loadedData; // Store the loaded data
    updateChart('2020'); // Show the chart for 2020 by default
});

// Determine the fixed maximum value for y-axis
const fixedMaxY = 80; // Set this to the maximum expected value

// Function to update the chart based on the selected year
function updateChart(selectedYear) {
    // Filter data for the selected year
    const filteredData = data.filter(d => d.Year === selectedYear);

    // Clear previous bars and text
    svg.selectAll("*").remove(); // Remove existing bars and axes

    // Define the x and y scales
    const x = d3.scaleBand()
        .domain(filteredData.map(d => d["Employment Status"]))
        .range([0, width])
        .padding(0.1);

    const y = d3.scaleLinear()
        .domain([0, fixedMaxY]) // Use fixed maximum for y-axis
        .range([height, 0]);

    // Add the x-axis
    svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x));

    // Add the y-axis
    svg.append("g")
        .call(d3.axisLeft(y));

    // Create the bars
    svg.selectAll("bars")
        .data(filteredData)
        .enter()
        .append("rect")
        .attr("x", d => x(d["Employment Status"]))
        .attr("y", d => y(+d["Risk Percentage"]))
        .attr("height", d => height - y(+d["Risk Percentage"]))
        .attr("width", x.bandwidth())
        .attr("fill", "#007bff"); // Set bar color

    // Add text labels on top of the bars
    svg.selectAll("text")
        .data(filteredData)
        .enter()
        .append("text")
        .attr("x", d => x(d["Employment Status"]) + x.bandwidth() / 2) // Center the label
        .attr("y", d => {
            const riskValue = +d["Risk Percentage"];
            return riskValue > 0 ? y(riskValue) - 5 : height; // Adjust position above the bar
        }) // Position above the bar
        .attr("text-anchor", "middle") // Center the text
        .text(d => d["Risk Percentage"])
        .attr("fill", "black") // Set text color
        .style("font-size", "12px"); // Optional: Set font size
}
