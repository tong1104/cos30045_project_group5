// Set dimensions and margins for the SVG
const margin = {top: 20, right: 30, bottom: 40, left: 40},
      width = 400 - margin.left - margin.right,
      height = 500 - margin.top - margin.bottom;

// Create an SVG container
const svg = d3.select("body").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

let data; // Declare a variable to store data
let currentDataset = 'employment'; // Default dataset to display

// Function to load the appropriate data based on the current dataset
function loadData(dataset) {
    return d3.csv(`${dataset}.csv`).then(loadedData => {
        data = loadedData; // Store the loaded data
        updateChart('2020'); // Show the chart for 2020 by default
    });
}

// Load initial data for the default dataset
loadData(currentDataset);

// Determine the fixed maximum value for y-axis
const fixedMaxY = 80; // Set this to the maximum expected value

// Function to update the chart based on the selected year
function updateChart(selectedYear) {
    // Filter data for the selected year
    const filteredData = data.filter(d => d.Year === selectedYear);

    // Clear previous bars and text
    svg.selectAll("*").remove(); // Remove existing bars and axes

    // Determine the x-axis and y-axis based on the current dataset
    let x, y;

    // Check dataset type and define axes accordingly
    if (currentDataset === 'employment') {
        x = d3.scaleBand()
            .domain(filteredData.map(d => d["Employment Status"]))
            .range([0, width])
            .padding(0.1);
    } else if (currentDataset === 'gender') {
        x = d3.scaleBand()
            .domain(["Men", "Women"]) // Fixed domains for gender
            .range([0, width])
            .padding(0.1);
    } else if (currentDataset === 'financial') {
        x = d3.scaleBand()
            .domain(["Financial Difficulties", "No Financial Difficulties"]) // Fixed domains for financial
            .range([0, width])
            .padding(0.1);
    } else if (currentDataset === 'age') {
        x = d3.scaleBand()
            .domain(filteredData.map(d => d["Age Group"])) // Dynamic for age
            .range([0, width])
            .padding(0.1);
    }

    y = d3.scaleLinear()
        .domain([0, fixedMaxY]) // Use fixed maximum for y-axis
        .range([height, 0]);

    // Add the x-axis
    svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x));

    // Add the y-axis
    svg.append("g")
        .call(d3.axisLeft(y));

    // Create the bars based on the current dataset
    if (currentDataset === 'gender') {
        // Create bars for gender data
        const menData = filteredData.map(d => ({ "Status": "Men", "Value": d["Men"] }));
        const womenData = filteredData.map(d => ({ "Status": "Women", "Value": d["Women"] }));

        const allGenderData = menData.concat(womenData);

        svg.selectAll("bars")
            .data(allGenderData)
            .enter()
            .append("rect")
            .attr("x", d => x(d.Status))
            .attr("y", d => y(+d.Value))
            .attr("height", d => height - y(+d.Value))
            .attr("width", x.bandwidth())
            .attr("fill", (d, i) => i % 2 === 0 ? "#007bff" : "#ff6347"); // Alternate colors for Men and Women
    } else if (currentDataset === 'financial') {
        svg.selectAll("bars")
            .data(filteredData)
            .enter()
            .append("rect")
            .attr("x", d => x("Financial Difficulties")) // Fixed for financial difficulties
            .attr("y", d => y(+d["Financial Difficulties"]))
            .attr("height", d => height - y(+d["Financial Difficulties"]))
            .attr("width", x.bandwidth() / 2)
            .attr("fill", "#007bff"); // Set color for financial difficulties

        svg.selectAll("bars")
            .data(filteredData)
            .enter()
            .append("rect")
            .attr("x", d => x("No Financial Difficulties") + x.bandwidth() / 2) // Fixed for no financial difficulties
            .attr("y", d => y(+d["No Financial Difficulties"]))
            .attr("height", d => height - y(+d["No Financial Difficulties"]))
            .attr("width", x.bandwidth() / 2)
            .attr("fill", "#ff6347"); // Set color for no financial difficulties
    } else if (currentDataset === 'age') {
        svg.selectAll("bars")
            .data(filteredData)
            .enter()
            .append("rect")
            .attr("x", d => x(d["Age Group"]))
            .attr("y", d => y(+d["Risk Percentage"]))
            .attr("height", d => height - y(+d["Risk Percentage"]))
            .attr("width", x.bandwidth())
            .attr("fill", "#007bff"); // Set color for age

    } else {
        svg.selectAll("bars")
            .data(filteredData)
            .enter()
            .append("rect")
            .attr("x", d => x(d["Employment Status"]))
            .attr("y", d => y(+d["Risk Percentage"]))
            .attr("height", d => height - y(+d["Risk Percentage"]))
            .attr("width", x.bandwidth())
            .attr("fill", "#007bff"); // Set color for employment
    }

    // Add text labels on top of the bars
    svg.selectAll("text")
        .data(filteredData)
        .enter()
        .append("text")
        .attr("x", d => {
            if (currentDataset === 'gender') return x("Men") + x.bandwidth() / 2;
            if (currentDataset === 'financial') return x("Financial Difficulties") + x.bandwidth() / 2; // Fixed for financial
            return x(d["Employment Status"]) + x.bandwidth() / 2; // Employment or age
        })
        .attr("y", d => {
            const riskValue = currentDataset === 'gender' ? +d["Men"] : +d["Risk Percentage"] || +d["Financial Difficulties"];
            return riskValue > 0 ? y(riskValue) - 5 : height; // Adjust position above the bar
        }) // Position above the bar
        .attr("text-anchor", "middle") // Center the text
        .text(d => {
            if (currentDataset === 'gender') return d["Men"] + ' / ' + d["Women"]; // Show both
            if (currentDataset === 'financial') return d["Financial Difficulties"] + ' / ' + d["No Financial Difficulties"]; // Show both
            return d["Risk Percentage"]; // Employment or age
        })
        .attr("fill", "black") // Set text color
        .style("font-size", "12px"); // Optional: Set font size
}

// Function to set the current dataset based on button click
function setDataset(dataset) {
    currentDataset = dataset; // Update the current dataset
    loadData(currentDataset); // Load the appropriate dataset and update the chart
}
