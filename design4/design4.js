// Load data from the CSV file
d3.csv("Design4.csv").then(data => {
    // Convert data into the format needed for the radar chart
    const countriesData = data.map(d => ({
        country: d.Entity,
        categories: {
            "Spiritual Activities": +d["Share - Question: mh8b - Engaged in religious/spiritual activities when anxious/depressed - Answer: Yes - Gender: all - Age group: all"],
            "Healthy Lifestyle": +d["Share - Question: mh8e - Improved healthy lifestyle behaviors when anxious/depressed - Answer: Yes - Gender: all - Age group: all"],
            "Work Changes": +d["Share - Question: mh8f - Made a change to work situation when anxious/depressed - Answer: Yes - Gender: all - Age group: all"],
            "Personal Relationships": +d["Share - Question: mh8g - Made a change to personal relationships when anxious/depressed - Answer: Yes - Gender: all - Age group: all"],
            "Family/Friends": +d["Share - Question: mh8c - Talked to friends or family when anxious/depressed - Answer: Yes - Gender: all - Age group: all"],
            "Medication": +d["Share - Question: mh8d - Took prescribed medication when anxious/depressed - Answer: Yes - Gender: all - Age group: all"],
            "Nature/Outdoors": +d["Share - Question: mh8h - Spent time in nature/the outdoors when anxious/depressed - Answer: Yes - Gender: all - Age group: all"],
            "Mental Health Professional": +d["Share - Question: mh8a - Talked to mental health professional when anxious/depressed - Answer: Yes - Gender: all - Age group: all"]
        }
    }));

    // Define a color map for each country
    const countryColorMap = {
        "Austria": "#1f77b4",
        "Belgium": "#ff7f0e",
        "Bulgaria": "#2ca02c",
        "Croatia": "#d62728",
        "Cyprus": "#9467bd",
        "Czechia": "#8c564b",
        "Denmark": "#e377c2",
        "Estonia": "#7f7f7f",
        "Finland": "#bcbd22",
        "France": "#17becf",
        "Germany": "#1f77b4",
        "Greece": "#ff7f0e",
        "Hungary": "#2ca02c",
        "Ireland": "#d62728",
        "Italy": "#9467bd",
        "Latvia": "#8c564b",
        "Lithuania": "#e377c2",
        "Luxembourg": "#7f7f7f",
        "Malta": "#bcbd22",
        "Netherlands": "#17becf",
        "Poland": "#1f77b4",
        "Portugal": "#ff7f0e",
        "Romania": "#2ca02c",
        "Slovakia": "#d62728",
        "Slovenia": "#9467bd",
        "Spain": "#8c564b",
        "Sweden": "#e377c2"
    };


    // Configuration settings for the radar chart
    const width = 600, height = 600;
    const radius = Math.min(width, height) / 2;
    const levels = 5; // Number of concentric circles
    const categories = Object.keys(countriesData[0].categories);
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

    // Create the SVG element for the radar chart
    const svg = d3.select("#radarChart")
        .append("svg")
        .attr("width", width + 200)  // Extra space for country labels
        .attr("height", height + 100)
        .append("g")
        .attr("transform", `translate(${width / 2 + 50}, ${height / 2 + 50})`);

    // Calculate the angle of each axis
    const angleSlice = (2 * Math.PI) / categories.length;

        // Create the background circles (levels)
        for (let level = 0; level < levels; level++) {
            const levelFactor = radius * ((level + 1) / levels);
            svg.selectAll(".level")
                .data(categories)
                .enter()
                .append("line")
                .attr("x1", (d, i) => levelFactor * Math.cos(angleSlice * i - Math.PI / 2))
                .attr("y1", (d, i) => levelFactor * Math.sin(angleSlice * i - Math.PI / 2))
                .attr("x2", (d, i) => levelFactor * Math.cos(angleSlice * (i + 1) - Math.PI / 2))
                .attr("y2", (d, i) => levelFactor * Math.sin(angleSlice * (i + 1) - Math.PI / 2))
                .attr("stroke", "gray")
                .attr("stroke-width", 0.5);
        }

    // Create the tooltip
    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    // Function to map data points to coordinates, with sharp edges
    const line = d3.lineRadial()
        .radius(d => d.value * radius / 100)
        .angle((d, i) => i * angleSlice)
        .curve(d3.curveLinearClosed);  // Use this for sharp, straight lines

    // Draw the radar chart for each country
    countriesData.forEach((datum, index) => {
        const dataPoints = categories.map((category, i) => ({ axis: category, value: datum.categories[category] }));
        svg.append("path")
            .datum(dataPoints)
            .attr("d", line)
            .attr("fill", countryColorMap[datum.country] || d3.schemeCategory10[index % 10])
            .attr("fill-opacity", 0.1)
            .attr("stroke",countryColorMap[datum.country] || d3.schemeCategory10[index % 10])
            .attr("stroke-width", 2)
            .on("mouseover", function() {
                tooltip.style("opacity", 1);
            })
            .on("mousemove", function(event) {
                const [x, y] = d3.pointer(event);
                const categoryIndex = Math.floor((Math.atan2(y, x) + Math.PI) / angleSlice);
                const categoryName = categories[categoryIndex];
                const percentage = datum.categories[categoryName];

                tooltip.html(
                    `<strong>Country:</strong> ${datum.country}<br>
                    <strong>Category:</strong> ${categoryName}<br>
                    <strong>Percentage:</strong> ${percentage}%`
                )
                .style("left", (event.pageX + 15) + "px")
                .style("top", (event.pageY - 15) + "px");
            })
            .on("mouseout", function() {
                tooltip.style("opacity", 0);
            });
    });

    // Create the category labels at the outer edge
    svg.selectAll(".axisLabel")
        .data(categories)
        .enter()
        .append("text")
        .attr("x", (d, i) => (radius + 20) * Math.cos(angleSlice * (i - 1) - Math.PI / 2)) // Offset by +1
        .attr("y", (d, i) => (radius + 20) * Math.sin(angleSlice * (i - 1) - Math.PI / 2)) // Offset by +1
        .attr("dy", "0.35em")
        .style("font-size", "12px")
        .style("text-anchor", "middle")
        .text(d => d);

    // Add country names as labels on the right side
    const legend = svg.append("g")
        .attr("transform", `translate(${radius + 60}, ${-radius})`);

    legend.selectAll(".countryLabel")
        .data(countriesData)
        .enter()
        .append("text")
        .attr("x", 10) // position each label 10px to the right of the legend container
        .attr("y", (d, i) => i * 15)  // space labels vertically
        .style("font-size", "10px")
        .style("fill", d => colorScale(countriesData.indexOf(d)))
        .text(d => d.country);

    // Populate the dropdown menu with countries
const select = d3.select("#country-select");
countriesData.forEach(d => {
    select.append("option")
        .attr("value", d.country)
        .text(d.country);
});

// Function to update radar chart based on selected country
function updateRadarChart(selectedCountry) {
    // Clear existing paths and country labels
    svg.selectAll("path").remove();
    svg.selectAll(".countryLabel").remove();

    const dataToDisplay = selectedCountry === "all" ? countriesData : countriesData.filter(d => d.country === selectedCountry);

    // Redraw the radar chart for the selected country
    dataToDisplay.forEach((datum) => {
        const dataPoints = categories.map((category, i) => ({ axis: category, value: datum.categories[category] }));
        svg.append("path")
            .datum(dataPoints)
            .attr("d", line)
            .attr("fill", countryColorMap[datum.country] || "gray") // Use color from countryColorMap for fill
            .attr("fill-opacity", 0.1)
            .attr("stroke", countryColorMap[datum.country] || "gray") // Use color from countryColorMap for stroke
            .attr("stroke-width", 2)
            .on("mouseover", function() {
                tooltip.style("opacity", 1);
            })
            .on("mousemove", function(event) {
                const [x, y] = d3.pointer(event);
                const categoryIndex = Math.floor((Math.atan2(y, x) + Math.PI) / angleSlice);
                const categoryName = categories[categoryIndex];
                const percentage = datum.categories[categoryName];

                tooltip.html(
                    `<strong>Country:</strong> ${datum.country}<br>
                    <strong>Category:</strong> ${categoryName}<br>
                    <strong>Percentage:</strong> ${percentage}%`
                )
                .style("left", (event.pageX + 15) + "px")
                .style("top", (event.pageY - 15) + "px");
            })
            .on("mouseout", function() {
                tooltip.style("opacity", 0);
            });
    });

    // Add country labels if displaying all countries
    if (selectedCountry === "all") {
        legend.selectAll(".countryLabel")
            .data(countriesData)
            .enter()
            .append("text")
            .attr("x", 10)
            .attr("y", (d, i) => i * 15)  // Adjust position based on index
            .style("font-size", "10px")
            .style("fill", d => countryColorMap[d.country] || colorScale(countriesData.indexOf(d)))
            .text(d => d.country);
    }
}

// Initialize the chart with all countries
updateRadarChart("all");

// Update the chart when a new country is selected
select.on("change", function() {
    const selectedCountry = d3.select(this).property("value");
    updateRadarChart(selectedCountry);
});

});
