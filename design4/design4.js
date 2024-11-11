// Load data from the CSV file using D3
d3.csv("Design4.csv").then(data => {
    // Convert data into the format needed for the radar chart and filter out 'N/A' values
    data = data.filter(d => Object.values(d).every(val => val !== 'N/A'));

    const countriesData = data.map(d => ({
        country: d.Entity,
        categories: {
            "Extremely important": +d["Extremely important"] || 0,
            "Somewhat important": +d["Somewhat important"] || 0,
            "Don't know/Refused": +d["Don't know/Refused"] || 0,
            "Not too important": +d["Not too important"] || 0,
            "Not important at all": +d["Not important at all"] || 0
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
        "Malta": "#7f7f7f",
        "Netherlands": "#bcbd22",
        "Poland": "#17becf",
        "Portugal": "#1f77b4",
        "Romania": "#ff7f0e",
        "Slovakia": "#2ca02c",
        "Slovenia": "#d62728",
        "Spain": "#9467bd",
        "Sweden": "#8c564b"
    };

    // Populate the dropdown menu with "Select All" option and each country
    const select = d3.select("#country-select");
    select.append("option").attr("value", "all").text("Select All"); // Add "Select All" option
    countriesData.forEach(d => {
        select.append("option")
            .attr("value", d.country)
            .text(d.country);
    });

    // Create the initial radar chart with Chart.js
    const ctx = document.getElementById('radarChart').getContext('2d');
    let radarChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: Object.keys(countriesData[0].categories),  // Axis labels
            datasets: []
        },
        options: {
            responsive: true,
            scales: {
                r: {
                    angleLines: { display: true },
                    suggestedMin: 0,
                    suggestedMax: 100
                }
            },
            plugins: {
                legend: { position: 'top' },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${context.raw}%`;
                        }
                    }
                }
            }
        }
    });

    // Function to update radar chart based on selected country or "Select All"
    function updateRadarChart(selectedCountry) {
        let datasets = [];

        // If "Select All" is chosen, include data for all countries
        if (selectedCountry === "all") {
            datasets = countriesData.map(datum => ({
                label: datum.country,
                data: Object.values(datum.categories),
                fill: true,
                backgroundColor: countryColorMap[datum.country] + '33',  // Adjust opacity for background
                borderColor: countryColorMap[datum.country],
                pointBackgroundColor: countryColorMap[datum.country]
            }));
        } else {
            // Single country selection
            const countryData = countriesData.find(d => d.country === selectedCountry);
            if (countryData) {
                datasets = [{
                    label: countryData.country,
                    data: Object.values(countryData.categories),
                    fill: true,
                    backgroundColor: countryColorMap[countryData.country] + '33',
                    borderColor: countryColorMap[countryData.country],
                    pointBackgroundColor: countryColorMap[countryData.country]
                }];
            }
        }

        // Update the chart's datasets and re-render
        radarChart.data.datasets = datasets;
        radarChart.update();
    }

    // Set default chart with all countries selected
    updateRadarChart("all");

    // Update chart when a country is selected
    select.on("change", function() {
        const selectedCountry = this.value;
        updateRadarChart(selectedCountry);
    });
});
