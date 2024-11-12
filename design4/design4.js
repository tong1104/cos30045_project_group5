// Load data from the CSV file using D3
d3.csv("Design4.csv").then(data => {

    const columns = ["Extremely important", "Somewhat important", "Don't know/Refused", "Not too important", "Not important at all"];

    // Define the margin and dimensions for the heatmap
    const margin = { top: 20, right: 60, bottom: 100, left: 180 };
    const width = 600 - margin.left - margin.right;
    const height = 600 - margin.top - margin.bottom;

    // Create the SVG for the heatmap
    const svg = d3.select(".chart-container")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Define x and y scales for the heatmap
    const xScale = d3.scaleBand()
        .domain(columns)
        .range([0, width])
        .padding(0.05);

    const yScale = d3.scaleBand()
        .domain(data.map(d => d.Entity))
        .range([0, height])
        .padding(0.05);

    // Define color scale for heatmap
    const colorScale = d3.scaleSequential(d3.interpolateYlOrRd)
        .domain([0, 80]); // Adjust based on your data range

    // Draw x-axis
    svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(xScale).tickSize(0))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");

    // Draw y-axis
    svg.append("g")
        .call(d3.axisLeft(yScale).tickSize(0));

    // Create tooltip div
    const tooltip = d3.select("body").append("div")
        .attr("id", "tooltip")
        .style("position", "absolute")
        .style("visibility", "hidden")
        .style("background", "#f9f9f9")
        .style("padding", "10px")
        .style("border", "1px solid #ccc")
        .style("border-radius", "4px")
        .style("font-size", "14px")
        .style("box-shadow", "0px 4px 8px rgba(0, 0, 0, 0.1)");

    // Add the heatmap cells with tooltips
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
                    tooltip.html(`
                        <strong>${d.Entity}</strong><br>
                        ${col}: <strong>${value === "N/A" ? "N/A" : `${value.toFixed(1)}%`}</strong>
                    `)
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

    // Append the footer for data source and modification information
    d3.select(".chart-container").append("div")
        .attr("class", "data-source")
        .html(`
            <p>Data Source: <a href="https://ourworldindata.org/grapher/importance-government-funding-research-anxiety-depression?country=AUT~BEL~BGR~HRV~CYP~CZE~DNK~EST~FIN~FRA~DEU~GRC~HUN~IRL~ITA~LVA~LTU~MLT~NLD~POL~PRT~ROU~SVN~SVK~ESP~SWE" target="_blank">Our World in Data</a></p>
            <p>Modified by: TYP</p>
        `);
});
