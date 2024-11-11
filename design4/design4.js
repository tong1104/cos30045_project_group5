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

    // Populate the checkbox dropdown with options
    const countrySelect = d3.select("#country-select");
    countriesData.forEach(d => {
        countrySelect.append("label")
            .html(`<input type="checkbox" class="country-checkbox" value="${d.country}"> ${d.country}`)
    });

    // Select all checkboxes
    const selectAllCheckbox = document.getElementById("select-all");

    selectAllCheckbox.addEventListener("change", function() {
        const checkboxes = document.querySelectorAll(".country-checkbox");
        checkboxes.forEach(checkbox => checkbox.checked = this.checked);
        updateRadarChart(getSelectedCountries());
    });

    // Function to get all selected countries
    function getSelectedCountries() {
        return Array.from(document.querySelectorAll(".country-checkbox:checked")).map(cb => cb.value);
    }

    // Create the initial radar chart with Chart.js
    const ctx = document.getElementById('radarChart').getContext('2d');
    let radarChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: Object.keys(countriesData[0].categories),
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
                            const value = context.raw.toFixed(1);
                            return `${context.dataset.label}: ${value}%`;
                        }
                    }
                }
            }
        }
    });

    // Update radar chart based on selected countries
    function updateRadarChart(selectedCountries) {
        const datasets = selectedCountries.map(country => {
            const countryData = countriesData.find(d => d.country === country);
            return {
                label: countryData.country,
                data: Object.values(countryData.categories),
                fill: true,
                backgroundColor: countryColorMap[countryData.country] + '33',
                borderColor: countryColorMap[countryData.country],
                pointBackgroundColor: countryColorMap[countryData.country]
            };
        });

        radarChart.data.datasets = datasets;
        radarChart.update();
    }

    // Event listener for individual checkboxes
    document.querySelectorAll(".country-checkbox").forEach(checkbox => {
        checkbox.addEventListener("change", () => {
            updateRadarChart(getSelectedCountries());
        });
    });

    // Initialize the chart with all countries selected
    selectAllCheckbox.checked = true;
    updateRadarChart(countriesData.map(d => d.country));
});
