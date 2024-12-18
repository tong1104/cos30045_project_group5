const width = 700;
const height = 400;
const margin = { top: 40, right: 40, bottom: 80, left: 60 };

const educationData = d3.csv("education.csv");
const incomeData = d3.csv("income.csv");
const disabilityData = d3.csv("disability.csv");

Promise.all([educationData, incomeData, disabilityData]).then(([education, income, disability]) => {
    createChart(education, "educationChart", ["levels 0-2", "levels 3 and 4", "levels 5-8"], "Education Levels");
    createChart(income, "incomeChart", ["first quintile", "second quintile", "third quintile", "fourth quintile", "fifth quintile"], "Income Levels");
    createChart(disability, "disabilityChart", ["moderate", "severe", "some or severe", "none"], "Disability Levels");

    showChart('education');
});

function createChart(data, chartId, categories, title) {
    const svg = d3.select(`#${chartId}`).append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand()
        .domain(data.map(d => d.country))
        .range([0, width])
        .padding(0.1);

    const y = d3.scaleLinear()
        .domain([0, 100])
        .nice()
        .range([height, 0]);

    const color = d3.scaleOrdinal(d3.schemeCategory10);

    const stack = d3.stack().keys(categories);

    const stackedData = stack(data.map(d => {
        const values = {};
        categories.forEach(cat => {
            values[cat] = +d[cat];
        });
        return { country: d.country, ...values };
    }));

    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    // Create the stacked bars with animation
    svg.append("g")
        .selectAll("g")
        .data(stackedData)
        .enter().append("g")
        .attr("fill", (d, i) => color(i))
        .selectAll("rect")
        .data(d => d)
        .enter().append("rect")
        .attr("x", d => x(d.data.country))
        .attr("y", height)
        .attr("height", 0)
        .attr("width", x.bandwidth())
        .on("mouseover", function(event, d) {
            d3.select(this).attr("opacity", 0.7);
            tooltip.transition().duration(200).style("opacity", 0.9);
            tooltip.html(`Country: ${d.data.country}<br>Value: ${(d[1] - d[0]).toFixed(1)}%`)
                .style("left", (event.pageX + 5) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function() {
            d3.select(this).attr("opacity", 1);
            tooltip.transition().duration(500).style("opacity", 0);
        })
        .transition()
        .duration(1000)
        .delay((d, i) => i * 50)
        .attr("y", d => y(d[1]))
        .attr("height", d => y(d[0]) - y(d[1]));

    // Add axes
    svg.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .attr("dy", "1em")
        .style("text-anchor", "end");

    svg.append("g")
        .attr("class", "axis")
        .call(d3.axisLeft(y).ticks(10, "s"));

    // Add labels
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - 5)
        .attr("text-anchor", "middle")
        .text("Countries")
        .style("font-family", "Roboto")
        .style("font-size", "14px");

    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", -margin.left + 20)
        .attr("x", -height / 2)
        .attr("text-anchor", "middle")
        .text("Percentage (%)")
        .style("font-family", "Roboto")
        .style("font-size", "14px");

    svg.append("text")
        .attr("x", width / 2)
        .attr("y", -10)
        .attr("text-anchor", "middle")
        .text(title)
        .style("font-family", "Roboto")
        .style("font-size", "14px");

    // Clear any existing legend to prevent duplication
    d3.select(`#${chartId}`).select(".legend").remove();

    // Create legend
    const legend = d3.select(`#${chartId}`).append("div").attr("class", "legend");

    categories.forEach((cat, i) => {
        const legendItem = legend.append("div").attr("class", "legend-item");

        legendItem.append("div")
            .attr("class", "legend-color")
            .style("background-color", color(i));

        legendItem.append("span")
            .text(cat)
            .style("font-family", "Roboto")
            .style("font-size", "12px");
    });
}

function showChart(chart) {
    // Hide all charts and descriptions
    document.querySelectorAll('.chart').forEach(div => {
        div.style.display = 'none';
    });
    document.querySelectorAll('.desc').forEach(desc => {
        desc.style.display = 'none';
    });
    document.querySelectorAll('.data-source').forEach(footer => {
        footer.style.display = 'none';
    });

    // Select the chart container and clear existing SVG elements
    const selectedChart = document.getElementById(`${chart}Chart`);
    d3.select(selectedChart).select("svg").remove();

    // Display the selected chart container
    selectedChart.style.display = 'block';

    // Re-fetch the data and render the chart
    if (chart === 'education') {
        d3.csv("education.csv").then(data => {
            createChart(data, "educationChart", ["levels 0-2", "levels 3 and 4", "levels 5-8"], "Education Levels");
        });
    } else if (chart === 'income') {
        d3.csv("income.csv").then(data => {
            createChart(data, "incomeChart", ["first quintile", "second quintile", "third quintile", "fourth quintile", "fifth quintile"], "Income Levels");
        });
    } else if (chart === 'disability') {
        d3.csv("disability.csv").then(data => {
            createChart(data, "disabilityChart", ["moderate", "severe", "some or severe", "none"], "Disability Levels");
        });
    }

    // Show the selected chart's description and footer
    document.getElementById(`${chart}Desc`).style.display = 'block';
    document.querySelector(`#${chart}Footer`).style.display = 'block';

    // Update button styles
    document.querySelectorAll('.button-container button').forEach(button => {
        button.classList.remove('active');
    });
    const activeButton = document.querySelector(`button[onclick="showChart('${chart}')"]`);
    if (activeButton) {
        activeButton.classList.add('active');
    }
}
