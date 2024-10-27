const width = 800;
const height = 400;

const educationData = d3.csv("education.csv");
const incomeData = d3.csv("income.csv");
const disabilityData = d3.csv("disability.csv");

Promise.all([educationData, incomeData, disabilityData]).then(([education, income, disability]) => {
    createChart(education, "educationChart", ["levels 0-2", "levels 3 and 4", "levels 5-8"], "Education Levels");
    createChart(income, "incomeChart", ["first quintile", "second quintile", "third quintile", "fourth quintile", "fifth quintile"], "Income Levels");
    createChart(disability, "disabilityChart", ["moderate", "severe", "some or severe", "none"], "Disability Levels");
    
    showChart('education'); // Show education chart by default
});

function createChart(data, chartId, categories, title) {
    const svg = d3.select(`#${chartId}`).append("svg")
        .attr("width", width)
        .attr("height", height);

    const x = d3.scaleBand()
        .domain(data.map(d => d.country))
        .range([0, width])
        .padding(0.1);

    const y = d3.scaleLinear()
        .domain([0, 100])
        .range([height, 0]);

    const color = d3.scaleOrdinal(d3.schemeCategory10);

    const stack = d3.stack()
        .keys(categories);

    const stackedData = stack(data.map(d => {
        const values = {};
        categories.forEach(cat => {
            values[cat] = +d[cat];
        });
        return { country: d.country, ...values };
    }));

    svg.append("g")
        .selectAll("g")
        .data(stackedData)
        .enter().append("g")
        .attr("fill", (d, i) => color(i))
        .selectAll("rect")
        .data(d => d)
        .enter().append("rect")
        .attr("x", d => x(d.data.country))
        .attr("y", d => y(d[1]))
        .attr("height", d => y(d[0]) - y(d[1]))
        .attr("width", x.bandwidth())
        .on("mouseover", function(event, d) {
            d3.select(this).attr("opacity", 0.7);
            tooltip.transition().duration(200).style("opacity", .9);
            tooltip.html(`Value: ${d[1] - d[0]}%`)
                .style("left", (event.pageX + 5) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function() {
            d3.select(this).attr("opacity", 1);
            tooltip.transition().duration(500).style("opacity", 0);
        });

    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    svg.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x).tickFormat((d, i) => data[i].country).tickSize(0)) // Removes the tick lines
        .selectAll("text")
        .attr("transform", "translate(-10,0)rotate(-45)") // Rotate the labels for better visibility
        .style("text-anchor", "end");

    svg.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(40,0)") // Move Y-axis to the right to prevent overlap
        .call(d3.axisLeft(y));

    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height - 10)
        .attr("text-anchor", "middle")
        .text("Countries")
        .style("font-weight", "bold");

    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 20)
        .attr("x", -height / 2 + 20) // Adjust Y-axis label position
        .attr("dy", ".71em")
        .attr("text-anchor", "end")
        .text("Percentage (%)")
        .style("font-weight", "bold");

    svg.append("text")
        .attr("x", width / 2)
        .attr("y", 20)
        .attr("text-anchor", "middle")
        .text(title)
        .style("font-weight", "bold");

    // Create legend
    const legend = d3.select(`#${chartId}`).append("div").attr("class", "legend");

    categories.forEach((cat, i) => {
        const legendItem = legend.append("div").attr("class", "legend-item");
        
        legendItem.append("div")
            .attr("class", "legend-color")
            .style("background-color", color(i));
        
        legendItem.append("span").text(cat);
    });
}

function showChart(chart) {
    document.querySelectorAll('.chart').forEach(div => div.style.display = 'none');
    document.getElementById(`${chart}Chart`).style.display = 'block';
}
