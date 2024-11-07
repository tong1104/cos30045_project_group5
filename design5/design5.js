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

    // Dropdown for rate selection
    const rateDropdown = d3.select("body").append("select")
        .attr("id", "rateDropdown")
        .style("margin", "10px");
    
    rateDropdown.append("option").text("Anxiety Rate").attr("value", "Anxiety_Rate");
    rateDropdown.append("option").text("Disease Rate").attr("value", "Disease_Rate");
    rateDropdown.append("option").text("Suicide Rate").attr("value", "Suicide_Rate");

    // Dropdown for country selection
    const countryDropdown = d3.select("body").append("select")
        .attr("id", "countryDropdown")
        .style("margin", "10px");
    
    countryDropdown.append("option").text("All Countries").attr("value", "all");
    countries.forEach(country => {
        countryDropdown.append("option").text(country).attr("value", country);
    });

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

    // Tooltip setup
    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("background-color", "#fff")
        .style("border", "1px solid #ccc")
        .style("padding", "5px")
        .style("border-radius", "3px")
        .style("pointer-events", "none")
        .style("font-size", "12px")
        .style("opacity", 0);

    function updateChart(rateType, selectedCountry = "all") {
        const yAxisSettings = getYAxisSettings(rateType);
        let y = d3.scaleLinear().domain([yAxisSettings.min, yAxisSettings.max]).range([height, 0]);

        chart.selectAll(".y-axis").remove();
        const yAxis = chart.append("g")
            .attr("class", "y-axis")
            .call(d3.axisLeft(y).ticks((yAxisSettings.max - yAxisSettings.min) / yAxisSettings.step));

         chart.append("text")
            .attr("class", "y-axis-label")
            .attr("text-anchor", "middle")
            .attr("transform", `rotate(-90)`)
            .attr("x", -height / 2) // Center vertically
            .attr("y", -margin.left + 15) // Position to the left of the Y-axis
            .style("font-size", "11.5px")
            .style("fill", "black")
            .style("font-family", "Arial") // Font styling as per your preference
            .text("Rates");

        chart.selectAll(".line").remove();
        chart.selectAll(".hover-point").remove();

        const countriesToShow = selectedCountry === "all" ? countries : [selectedCountry];

        countriesToShow.forEach(country => {
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

            // Mouse event for glowing effect and tooltip
            path.on("mouseover", function(event, d) {
                d3.selectAll(".line").attr("opacity", 0.1);  // Dim other lines
                d3.select(this).attr("opacity", 1).attr("stroke-width", 4); // Highlight selected line

                svg.on("mousemove", function(event) {
                    const [mouseX] = d3.pointer(event, this);
                    const year = Math.round(x.invert(mouseX - margin.left));
                    const closestData = countryData.find(d => d.Year === year);

                    if (closestData) {
                        tooltip.transition().style("opacity", 1);
                        tooltip.html(`<strong>${country}</strong><br>Year: ${year}<br>Rate: ${closestData[rateType].toFixed(2)}`)
                            .style("left", (event.pageX + 10) + "px")
                            .style("top", (event.pageY - 20) + "px");
                    }
                });
            })
            .on("mouseout", function() {
                d3.selectAll(".line").attr("opacity", 0.6).attr("stroke-width", 2.5); // Reset lines
                tooltip.transition().style("opacity", 0); // Hide tooltip
                svg.on("mousemove", null); // Remove the mousemove event handler on mouseout
            });
        });
    }

    function zoomed(event) {
        const transform = event.transform;
        x = transform.rescaleX(d3.scaleLinear().domain([2010, 2022]).range([0, width]));

        const tickInterval = Math.ceil(10 / transform.k);
        xAxis.call(d3.axisBottom(x).ticks(tickInterval).tickFormat(d3.format("d")));

        chart.selectAll(".line").attr("d", line);
    }

    const zoom = d3.zoom()
        .scaleExtent([1, 5])
        .translateExtent([[0, 0], [width, height]])
        .extent([[0, 0], [width, height]])
        .on("zoom", zoomed);

    svg.call(zoom);

    updateChart("Anxiety_Rate");

    rateDropdown.on("change", function() {
        const selectedRate = rateDropdown.node().value;
        updateChart(selectedRate, countryDropdown.node().value);
    });

    countryDropdown.on("change", function() {
        const selectedCountry = countryDropdown.node().value;
        updateChart(rateDropdown.node().value, selectedCountry);
    });
});
