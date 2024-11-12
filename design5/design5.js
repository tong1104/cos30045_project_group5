function showExplanation(rateType) {
    // Hide all explanations
    document.querySelectorAll('.explanation-text').forEach(el => el.style.display = 'none');

    // Show the selected explanation
    if (rateType === "Anxiety_Rate") {
        document.getElementById('anxietyExplanation').style.display = 'block';
    } else if (rateType === "Disease_Rate") {
        document.getElementById('diseaseExplanation').style.display = 'block';
    } else if (rateType === "Suicide_Rate") {
        document.getElementById('suicideExplanation').style.display = 'block';
    }

    // Update active button styling
    document.querySelectorAll('.rate-button').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`button[data-rate="${rateType}"]`).classList.add('active');
}

// Initialize chart with the default explanation
showExplanation("Anxiety_Rate");

const width = 700;
const height = 400;
const margin = { top: 120, right: 40, bottom: 80, left: 60 }; // Increase top margin to 60


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

// Select the existing dropdowns from HTML instead of appending new ones
const rateDropdown = d3.select("#rateDropdown");
const countryDropdown = d3.select("#countryDropdown");

// Populate country dropdown dynamically
countries.forEach(country => {
countryDropdown.append("option").text(country).attr("value", country);
});

const svg = d3.select("#chart")
.attr("width", width + margin.left + margin.right)
.attr("height", height + margin.top + margin.bottom);

const chart = svg.append("g")
.attr("transform", `translate(${margin.left}, ${margin.top})`);

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

// Add x-axis label
chart.append("text")
.attr("class", "x-axis-label")
.attr("text-anchor", "middle")
.attr("x", width / 2)
.attr("y", height + margin.bottom - 40) // Position below x-axis
.style("font-size", "11.5px")
.style("fill", "black")
.style("font-family", "Arial")
.text("Year");

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
.style("font-size", "12px");

tooltip.transition().style("opacity", 1);

function updateChart(rateType, selectedCountry = "all") {
// Clear any existing title to avoid duplicates
svg.selectAll(".chart-title").remove();

// Define a title based on the selected rate type
let chartTitle;
if (rateType === "Anxiety_Rate") {
    chartTitle = "Anxiety Rate";
} else if (rateType === "Disease_Rate") {
    chartTitle = "Disease Rate";
} else if (rateType === "Suicide_Rate") {
    chartTitle = "Suicide Rate";
}

// Append the title text to the chart
svg.append("text")
    .attr("class", "chart-title")
    .attr("x", width / 2 + margin.left) // Center horizontally
    .attr("y", margin.top / 2) // Position slightly above the chart
    .attr("text-anchor", "middle")
    .style("font-size", "14px")
    .style("fill", "#413e66")
    .text(chartTitle);

// Existing code for updating the Y-axis and chart contents...
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
    .attr("x", -height / 2)
    .attr("y", -margin.left + 15)
    .style("font-size", "11.5px")
    .style("fill", "black")
    .style("font-family", "Arial")
    .text("Rates");

chart.selectAll(".line").remove();
chart.selectAll(".hover-point").remove();

// Code to add line paths and tooltips (unchanged)
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

    path.on("mouseover", function(event, d) {
        d3.selectAll(".line").attr("opacity", 0.1);
        d3.select(this).attr("opacity", 1).attr("stroke-width", 4);

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
        d3.selectAll(".line").attr("opacity", 0.6).attr("stroke-width", 2.5);
        tooltip.transition().style("opacity", 0);
        svg.on("mousemove", null);
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

const rateButtons = document.querySelectorAll(".rate-button");
rateButtons.forEach(button => {
button.addEventListener("click", () => {
// Remove 'active' class from all buttons
rateButtons.forEach(btn => btn.classList.remove("active"));

// Add 'active' class to the clicked button
button.classList.add("active");

// Update the chart based on the selected rate type
const selectedRate = button.getAttribute("data-rate");
updateChart(selectedRate, countryDropdown.node().value);
});
});


// Initialize the chart with "Anxiety_Rate" as default
updateChart("Anxiety_Rate");

// Listen to country dropdown changes
countryDropdown.on("change", function() {
const selectedCountry = countryDropdown.node().value;
const selectedRate = document.querySelector(".rate-button.active").getAttribute("data-rate");
updateChart(selectedRate, selectedCountry);
});
});