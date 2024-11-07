// Load data from the CSV file
d3.csv("Design4.csv").then(data => {
    // Convert data into the format needed for the circular packing chart
    const countriesData = data.map(d => ({
        country: d.Entity,
        categories: [
            { name: "Spiritual Activities", value: +d["Share - Question: mh8b - Engaged in religious/spiritual activities when anxious/depressed - Answer: Yes - Gender: all - Age group: all"] },
            { name: "Healthy Lifestyle", value: +d["Share - Question: mh8e - Improved healthy lifestyle behaviors when anxious/depressed - Answer: Yes - Gender: all - Age group: all"] },
            { name: "Work Changes", value: +d["Share - Question: mh8f - Made a change to work situation when anxious/depressed - Answer: Yes - Gender: all - Age group: all"] },
            { name: "Personal Relationships", value: +d["Share - Question: mh8g - Made a change to personal relationships when anxious/depressed - Answer: Yes - Gender: all - Age group: all"] },
            { name: "Family/Friends", value: +d["Share - Question: mh8c - Talked to friends or family when anxious/depressed - Answer: Yes - Gender: all - Age group: all"] },
            { name: "Medication", value: +d["Share - Question: mh8d - Took prescribed medication when anxious/depressed - Answer: Yes - Gender: all - Age group: all"] },
            { name: "Nature/Outdoors", value: +d["Share - Question: mh8h - Spent time in nature/the outdoors when anxious/depressed - Answer: Yes - Gender: all - Age group: all"] },
            { name: "Mental Health Professional", value: +d["Share - Question: mh8a - Talked to mental health professional when anxious/depressed - Answer: Yes - Gender: all - Age group: all"] }
        ]
    }));

    // Updated Country-Color mapping
    const countryColorMap = {
        "Austria": "#A4C400", // Lime
        "Belgium": "#60A917", // Green
        "Bulgaria": "#008A00", // Emerald
        "Croatia": "#00ABA9", // Teal
        "Cyprus": "#1BA1E2", // Cyan
        "Czechia": "#0050EF", // Cobalt
        "Denmark": "#6A00FF", // Indigo
        "Estonia": "#AA00FF", // Violet
        "Finland": "#F472D0", // Pink
        "France": "#D80073", // Magenta
        "Germany": "#A20025", // Crimson
        "Greece": "#E51400", // Red
        "Hungary": "#FA6800", // Orange
        "Ireland": "#F0A30A", // Amber
        "Italy": "#E3C800", // Yellow
        "Latvia": "#825A2C", // Brown
        "Malta": "#6D8764", // Olive
        "Netherlands": "#647687", // Steel
        "Poland": "#76608A", // Mauve
        "Portugal": "#87794E", // Taupe
        "Romania": "#FF5733", // New color - Orange-Red
        "Slovakia": "#33FF57", // New color - Green-Blue
        "Spain": "#3357FF", // New color - Blue
        "Sweden": "#FF33A1"  // New color - Pink-Purple
    };

    // Flatten the data structure to combine countries and categories
    const flatData = countriesData.flatMap(country => 
        country.categories.map(category => ({
            country: country.country,
            category: category.name,
            value: category.value
        }))
    );

    // Define dimensions for the chart
    const width = 1700, height = 1200;

    // Create an SVG element
    const svg = d3.select("#radarChart")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    // Create a size scale for the circles
    const size = d3.scaleSqrt()
        .domain([0, d3.max(flatData, d => d.value)])
        .range([5, 40]); // Adjust the range as needed for circle sizes

    // Tooltip setup
    const tooltip = d3.select("body").append("div")
        .style("opacity", 0)
        .attr("class", "tooltip")
        .style("background-color", "white")
        .style("border", "solid")
        .style("border-width", "2px")
        .style("border-radius", "5px")
        .style("padding", "5px");

    // Tooltip mouse events
    const mouseover = function(event, d) {
        tooltip.style("opacity", 1);
    };
    const mousemove = function(event, d) {
        tooltip.html(`<strong>Country:</strong> ${d.country}<br><strong>Category:</strong> ${d.category}<br><strong>Value:</strong> ${d.value}`)
            .style("left", (event.pageX + 20) + "px")
            .style("top", (event.pageY) + "px");
    };
    const mouseleave = function(event, d) {
        tooltip.style("opacity", 0);
    };

    // Force simulation
    const simulation = d3.forceSimulation(flatData)
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("charge", d3.forceManyBody().strength(1))
        .force("collide", d3.forceCollide().radius(d => size(d.value) + 2))
        .on("tick", ticked);

    // Create circles with drag behavior
    const node = svg.selectAll("circle")
        .data(flatData)
        .enter()
        .append("circle")
        .attr("r", d => size(d.value))
        .attr("cx", width / 2)
        .attr("cy", height / 2)
        .style("fill", d => countryColorMap[d.country] || "#ccc") // Assign color using countryColorMap or fallback to default color
        .style("fill-opacity", 0.8)
        .attr("stroke", "black")
        .style("stroke-width", 1)
        .on("mouseover", mouseover)
        .on("mousemove", mousemove)
        .on("mouseleave", mouseleave)
        .call(d3.drag() // Add drag behavior
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));

    // Drag functions
    function dragstarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }

    function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
    }

    function dragended(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }

    // Function for ticked events in the simulation
    function ticked() {
        node
            .attr("cx", d => d.x)
            .attr("cy", d => d.y);
    }

    // Dropdown to filter countries
    const selectCountry = d3.select("#country-select");
    selectCountry.on("change", function() {
        const selectedCountry = d3.select(this).property("value");
        const selectedCategory = d3.select("#category-select").property("value");
        updateChart(selectedCountry, selectedCategory);
    });

    // Dropdown to filter categories
    const selectCategory = d3.select("body").append("select")
        .attr("id", "category-select")
        .on("change", function() {
            const selectedCategory = d3.select(this).property("value");
            const selectedCountry = d3.select("#country-select").property("value");
            updateChart(selectedCountry, selectedCategory);
        });

        // Add default option for category selection
    selectCategory.append("option")
       .attr("value", "all")
       .text("All Categories");

    // Populate country dropdown
    countriesData.forEach(d => {
        selectCountry.append("option")
            .attr("value", d.country)
            .text(d.country);
    });

    // Populate category dropdown
    const categories = [...new Set(flatData.map(d => d.category))];
    categories.forEach(category => {
        selectCategory.append("option")
            .attr("value", category)
            .text(category);
    });

    // Function to update chart based on selected country and category
    function updateChart(selectedCountry, selectedCategory) {
        let filteredData = flatData;

        // Apply country filter
        if (selectedCountry !== "all") {
            filteredData = filteredData.filter(d => d.country === selectedCountry);
        }

        // Apply category filter
        if (selectedCategory !== "all") {
            filteredData = filteredData.filter(d => d.category === selectedCategory);
        }

        // Bind the filtered data to the nodes (circles)
        const nodes = svg.selectAll("circle")
            // Continue from the previous function

            .data(filteredData, d => d.country + d.category); // Use a key function for better binding

        // Remove any circles that are no longer in the data
        nodes.exit().transition().duration(500).style("opacity", 0).remove();

        // Update existing circles
        nodes.transition().duration(500)
            .attr("r", d => size(d.value))
            .style("fill", d => countryColorMap[d.country] || "#ccc")
            .style("opacity", 1);

        // Enter any new circles
        nodes.enter()
            .append("circle")
            .attr("r", d => size(d.value))
            .attr("cx", width / 2)
            .attr("cy", height / 2)
            .style("fill", d => countryColorMap[d.country] || "#ccc")
            .style("fill-opacity", 0.8)
            .attr("stroke", "black")
            .style("stroke-width", 1)
            .on("mouseover", mouseover)
            .on("mousemove", mousemove)
            .on("mouseleave", mouseleave)
            .call(d3.drag() // Add drag behavior
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended))
            .transition().duration(500)
            .attr("cx", d => d.x) // Using x and y if simulation is needed
            .attr("cy", d => d.y); // Adjust position with x and y if needed

        // Restart the simulation with the filtered data
        simulation.nodes(filteredData).alpha(1).restart();
    }

    // Add a legend at the top right for country colors
    const legend = svg.append("g")
        .attr("transform", `translate(${width - 250}, 20)`); // Adjust x-value for positioning

    // Create legend items for each country
    const legendItem = legend.selectAll(".legend-item")
        .data(Object.keys(countryColorMap))
        .enter()
        .append("g")
        .attr("class", "legend-item")
        .attr("transform", (d, i) => `translate(0, ${i * 20})`); // Adjust spacing between legend items

    // Add colored rectangles
    legendItem.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", 15)
        .attr("height", 15)
        .style("fill", d => countryColorMap[d] || "#ccc") // Assign colors using the map
        .style("stroke", "black")
        .style("stroke-width", 0.5);

    // Add country labels
    legendItem.append("text")
        .attr("x", 25) // Adjusted spacing between rectangle and text
        .attr("y", 12)
        .style("font-size", "12px")
        .style("dominant-baseline", "middle") // Align text vertically with the rectangle
        .text(d => d);

});

