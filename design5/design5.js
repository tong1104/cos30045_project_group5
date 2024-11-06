d3.csv("trend_anxiety_disease_suicide_data.csv").then(data => {
    data.forEach(d => {
        d.Year = +d.Year;
        d.Anxiety_Rate = +d.Anxiety_Rate;
        d.Disease_Rate = +d.Disease_Rate;
        d.Suicide_Rate = +d.Suicide_Rate;
    });

    const groupedData = Array.from(d3.group(data, d => d.Country + "-" + d.Year), ([key, values]) => {
        const country = values[0].Country;
        const year = values[0].Year;
        return {
            Country: country,
            Year: year,
            Anxiety_Rate: d3.mean(values, d => d.Anxiety_Rate),
            Disease_Rate: d3.mean(values, d => d.Disease_Rate),
            Suicide_Rate: d3.mean(values, d => d.Suicide_Rate)
        };
    });

    const countries = Array.from(new Set(groupedData.map(d => d.Country)));

    const svg = d3.select("#chart"),
          margin = {top: 40, right: 100, bottom: 50, left: 60},
          width = +svg.attr("width") - margin.left - margin.right,
          height = +svg.attr("height") - margin.top - margin.bottom;

    const chart = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    svg.append("defs").append("clipPath")
        .attr("id", "clip")
        .append("rect")
        .attr("width", width)
        .attr("height", height);

    let x = d3.scaleLinear().domain([2010, 2022]).range([0, width]);
    const xAxis = chart.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).ticks(5).tickFormat(d3.format("d")));

    const colorScale = d3.scaleOrdinal(d3.schemeCategory10).domain(countries);

    const line = d3.line()
        .curve(d3.curveMonotoneX)
        .x(d => x(d.Year));

    function getYAxisSettings(rateType) {
        if (rateType === "Anxiety_Rate") return { min: 19.85, max: 20.45, step: 0.05 };
        if (rateType === "Disease_Rate") return { min: 24.85, max: 25.4, step: 0.05 };
        if (rateType === "Suicide_Rate") return { min: 6.95, max: 7.2, step: 0.05 };
    }

    const tooltip = d3.select(".tooltip");

    function updateChart(rateType) {
        const yAxisSettings = getYAxisSettings(rateType);
        let y = d3.scaleLinear().domain([yAxisSettings.min, yAxisSettings.max]).range([height, 0]);

        chart.selectAll(".y-axis").remove();
        const yAxis = chart.append("g")
            .attr("class", "y-axis")
            .call(d3.axisLeft(y).ticks((yAxisSettings.max - yAxisSettings.min) / yAxisSettings.step));

        chart.selectAll(".line").remove();
        chart.selectAll(".hover-point").remove();

        countries.forEach(country => {
            const countryData = groupedData.filter(d => d.Country === country).sort((a, b) => a.Year - b.Year);
            line.y(d => y(d[rateType]));

            const path = chart.append("path")
                .datum(countryData)
                .attr("class", "line")
                .attr("fill", "none")
                .attr("stroke", colorScale(country))
                .attr("stroke-width", 2.5)
                .attr("opacity", 0.6)
                .attr("clip-path", "url(#clip)")
                .attr("d", line);

            const hoverPoint = chart.append("circle")
                .attr("class", "hover-point")
                .attr("r", 0.5)
                .attr("fill", "black")
                .style("opacity", 0);

            path.on("mouseover", function(event, d) {
                    d3.selectAll(".line").attr("opacity", 0.1);
                    d3.select(this).attr("opacity", 1).attr("stroke-width", 3.5);

                    const year = Math.round(x.invert(event.offsetX - margin.left));
                    const closestData = countryData.find(d => d.Year === year);
                    if (closestData) {
                        hoverPoint
                            .attr("cx", x(closestData.Year))
                            .attr("cy", y(closestData[rateType]))
                            .style("opacity", 1);

                        tooltip.style("display", "block")
                            .html(`<strong>${country}</strong><br>Year: ${year}<br>Rate: ${closestData[rateType].toFixed(2)}`)
                            .style("left", (event.pageX + 10) + "px")
                            .style("top", (event.pageY - 20) + "px");
                    }
                })
                .on("mousemove", function(event) {
                    tooltip.style("left", (event.pageX + 10) + "px")
                           .style("top", (event.pageY - 20) + "px");
                })
                .on("mouseout", function() {
                    d3.selectAll(".line").attr("opacity", 0.6).attr("stroke-width", 2.5);
                    hoverPoint.style("opacity", 0);
                    tooltip.style("display", "none");
                });
        });
    }

    function zoomed(event) {
        const transform = event.transform;
        x = transform.rescaleX(d3.scaleLinear().domain([2010, 2022]).range([0, width]));

        xAxis.call(d3.axisBottom(x).ticks(10).tickFormat(d3.format("d")));

        chart.selectAll(".line").attr("d", line);
    }

    const zoom = d3.zoom()
        .scaleExtent([1, 5]) 
        .translateExtent([[0, 0], [width, height]]) 
        .extent([[0, 0], [width, height]])
        .on("zoom", zoomed);

    svg.call(zoom);

    updateChart("Anxiety_Rate");

    // Dropdown change event listener
    d3.select("#rateDropdown").on("change", function() {
        updateChart(this.value);
    });
});