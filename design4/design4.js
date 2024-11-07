// design4.js
d3.csv("Design4.csv").then(data => {
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

    const countryColorMap = {
        "Austria": "#A4C400", "Belgium": "#60A917", "Bulgaria": "#008A00", "Croatia": "#00ABA9",
        "Cyprus": "#1BA1E2", "Czechia": "#0050EF", "Denmark": "#6A00FF", "Estonia": "#AA00FF",
        "Finland": "#F472D0", "France": "#D80073", "Germany": "#A20025", "Greece": "#E51400",
        "Hungary": "#FA6800", "Ireland": "#F0A30A", "Italy": "#E3C800", "Latvia": "#825A2C",
        "Malta": "#6D8764", "Netherlands": "#647687", "Poland": "#76608A", "Portugal": "#87794E",
        "Romania": "#FF5733", "Slovakia": "#33FF57", "Spain": "#3357FF", "Sweden": "#FF33A1"
    };

    const flatData = countriesData.flatMap(country => 
        country.categories.map(category => ({
            country: country.country,
            category: category.name,
            value: category.value
        }))
    );

    const width = 800, height = 600;

    const svg = d3.select("#radarChart")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${width / 2},${height / 2})`);

    const size = d3.scaleSqrt()
        .domain([0, d3.max(flatData, d => d.value)])
        .range([3, 20]);

    const tooltip = d3.select("body").append("div")
        .style("opacity", 0)
        .attr("class", "tooltip");

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

    function updateChart(selectedCountry, selectedCategory) {
        let filteredData = flatData;

        if (selectedCountry !== "all") {
            filteredData = filteredData.filter(d => d.country === selectedCountry);
        }
        if (selectedCategory !== "all") {
            filteredData = filteredData.filter(d => d.category === selectedCategory);
        }

        const nodes = svg.selectAll("circle")
            .data(filteredData, d => d.country + d.category);

        nodes.exit().transition().duration(500).style("opacity", 0).remove();

        nodes.enter()
            .append("circle")
            .attr("r", d => size(d.value))
            .attr("fill", d => countryColorMap[d.country] || "#ccc")
            .attr("stroke", "black")
            .attr("stroke-width", 1)
            .style("fill-opacity", 0.8)
            .on("mouseover", mouseover)
            .on("mousemove", mousemove)
            .on("mouseleave", mouseleave)
            .call(d3.drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended))
            .merge(nodes)
            .transition().duration(500)
            .attr("cx", d => d.x)
            .attr("cy", d => d.y);

        simulation.nodes(filteredData).alpha(1).restart();
    }

    const simulation = d3.forceSimulation()
        .force("center", d3.forceCenter(0, 0))
        .force("charge", d3.forceManyBody().strength(1))
        .force("collide", d3.forceCollide().radius(d => size(d.value) + 5))
        .on("tick", () => {
            svg.selectAll("circle")
                .attr("cx", d => d.x)
                .attr("cy", d => d.y);
        });

    const dragstarted = (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    };

    const dragged = (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
    };

    const dragended = (event, d) => {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    };

    const zoom = d3.zoom()
        .scaleExtent([0.5, 5])
        .on("zoom", (event) => {
            svg.attr("transform", event.transform);
        });

    d3.select("svg").call(zoom);

    const selectCountry = d3.select("#country-select");
    countriesData.forEach(d => {
        selectCountry.append("option")
            .attr("value", d.country)
            .text(d.country);
    });

    const selectCategory = d3.select("#category-select");
    const categories = [...new Set(flatData.map(d => d.category))];
    categories.forEach(category => {
        selectCategory.append("option")
            .attr("value", category)
            .text(category);
    });

    selectCountry.on("change", function() {
        const selectedCountry = d3.select(this).property("value");
        const selectedCategory = d3.select("#category-select").property("value");
        updateChart(selectedCountry, selectedCategory);
    });

    selectCategory.on("change", function() {
        const selectedCountry = d3.select("#country-select").property("value");
        const selectedCategory = d3.select(this).property("value");
        updateChart(selectedCountry, selectedCategory);
    });

    updateChart("all", "all"); // Initial display with all countries and all categories

    // Adding the legend below the dropdowns
    const legend = d3.select("#legend");

    Object.keys(countryColorMap).forEach((country) => {
        const legendItem = legend.append("div").attr("class", "legend-item");

        legendItem.append("div")
            .attr("class", "legend-color")
            .style("background-color", countryColorMap[country]);

        legendItem.append("span")
            .text(country)
            .style("font-size", "12px");
    });
});
