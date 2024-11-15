function loadChartData(file) {
    // Clear previous data, including bars, axes, labels, and tooltips
    d3.select("#chart").selectAll("*").remove();

    d3.csv(file).then(function(data) {
        // Parse and clean the dataset
        data.forEach(d => {
            d.male = parseFloat(d["Prevalence in males"].replace('%', '')) || 0;
            d.female = parseFloat(d["Prevalence in females"].replace('%', '')) || 0;
            d.grade = d["Country/area"]; // Use country as the grade label
        });

        var chart = d3.select('#chart');
        var margin = {
            top: 50,
            right: 60,
            bottom: 70,
            left: 100,
        };
        var width = chart.attr('width') - margin.left - margin.right;
        var height = chart.attr('height') - margin.top - margin.bottom;

        var innerChart = chart.append('g')
            .attr('transform', 'translate(' + margin.left + ', ' + margin.top + ')');

        var pFormat = d3.format('.2f');

        // Update x-axis domain to be symmetric
        var maxValue = d3.max(data, d => Math.max(d.female, d.male));
        var x = d3.scaleLinear()
            .domain([-maxValue, maxValue]) // Symmetric domain around 0
            .range([0, width]);

        var y = d3.scaleBand()
            .domain(data.map(function(d) { return d.grade; }))
            .rangeRound([0, height])
            .padding(0.1);

        // Tooltip setup
        var tooltip = d3.select("body").append("div")
            .attr('class', 'tooltip')
            .style('position', 'absolute')
            .style('background', '#f9f9f9')
            .style('padding', '5px 10px')
            .style('border', '1px solid #ccc')
            .style('border-radius', '4px')
            .style('pointer-events', 'none')
            .style('display', 'none');

        var grade = innerChart.selectAll('g')
            .data(data)
            .enter()
            .append('g')
            .attr('transform', function(d, i) {
                return 'translate(0, ' + y(d.grade) + ')';
            });

        // Add female bars
        grade.append('rect')
            .attr('class', 'bar bar--female')
            .attr('x', function(d) { return x(0); }) // Start at center
            .attr('width', function(d) { return Math.abs(x(0) - x(d.female)); }) // Extend right for females
            .attr('height', y.bandwidth())
            .attr('fill', '#F97B72')
            .on('mouseover', function(event, d) {
                d3.select(this)
                    .style('stroke', '#c75d44')
                    .style('stroke-width', '2px');

                tooltip.style('display', 'block')
                    .html(`<strong>Country:</strong> ${d.grade}<br><strong>Female Prevalence:</strong> ${pFormat(d.female)}%`);
            })
            .on('mousemove', function(event) {
                tooltip.style('top', (event.pageY + 10) + 'px')
                    .style('left', (event.pageX + 10) + 'px');
            })
            .on('mouseout', function() {
                d3.select(this)
                    .style('stroke', 'none');
                tooltip.style('display', 'none');
            });

        // Add male bars
        grade.append('rect')
            .attr('class', 'bar bar--male')
            .attr('x', function(d) { return x(-d.male); })
            .attr('width', function(d) { return Math.abs(x(0) - x(-d.male)); })
            .attr('height', y.bandwidth())
            .attr('fill', '#72B5F9') 
            .on('mouseover', function(event, d) {
                d3.select(this)
                    .style('stroke', '#356f99')
                    .style('stroke-width', '2px');

                tooltip.style('display', 'block')
                    .html(`<strong>Country:</strong> ${d.grade}<br><strong>Male Prevalence:</strong> ${pFormat(d.male)}%`);
            })
            .on('mousemove', function(event) {
                tooltip.style('top', (event.pageY + 10) + 'px')
                    .style('left', (event.pageX + 10) + 'px');
            })
            .on('mouseout', function() {
                d3.select(this)
                    .style('stroke', 'none');
                tooltip.style('display', 'none');
            });

        // Add main x-axis without values
        innerChart.append('g')
            .attr('class', 'axis axis--x')
            .attr('transform', `translate(0, ${height})`)
            .call(d3.axisBottom(x).tickSize(0).tickFormat('')) // Remove tick values and lines
            .selectAll('text')
            .style('font-family', 'Arial')
            .style('font-size', '12px');

        // Add y-axis (categorical) with custom font
        innerChart.append('g')
            .attr('class', 'axis axis--y')
            .call(d3.axisLeft(y))
            .selectAll('text')
            .style('font-family', 'Arial')
            .style('font-size', '12px');
            
        // Add x-axis line
        innerChart.append('line')
            .attr('x1', 0)
            .attr('x2', width)
            .attr('y1', height)
            .attr('y2', height)
            .attr('stroke', 'black')
            .attr('stroke-width', 1.5); // Increased stroke width for prominence

        // Add left y-axis line
        innerChart.append('line')
            .attr('x1', 0)
            .attr('x2', 0)
            .attr('y1', 0)
            .attr('y2', height)
            .attr('stroke', 'black')
            .attr('stroke-width', 1.5);

        // Position Female and Male labels below their respective bars with color indicators
        chart.append('g')
            .attr('transform', `translate(${width + margin.left + margin.right - 580}, ${height + margin.top + margin.bottom - 55})`)
            .append('rect')
            .attr('x', -10) // Position it to the left of the text
            .attr('y', +2)
            .attr('width', 15)
            .attr('height', 15)
            .attr('fill', '#72B5F9'); // Male bar color

        chart.append('text')
            .attr('class', 'axis-label')
            .attr('x', width + margin.left + margin.right - 550)
            .attr('y', height + margin.top + margin.bottom - 40)
            .attr('text-anchor', 'middle')
            .style('font-family', 'Arial')
            .style('font-size', '14px')
            .text('Male');

        chart.append('g')
            .attr('transform', `translate(${width + margin.left + margin.right - 250}, ${height + margin.top + margin.bottom - 55})`)
            .append('rect')
            .attr('x', -14) // Position it to the left of the text
            .attr('y', +2)
            .attr('width', 15)
            .attr('height', 15)
            .attr('fill', '#F97B72'); // Female bar color

        chart.append('text')
            .attr('class', 'axis-label')
            .attr('x', width + margin.left + margin.right - 220)
            .attr('y', height + margin.top + margin.bottom - 40)
            .attr('text-anchor', 'middle')
            .style('font-family', 'Arial')
            .style('font-size', '14px')
            .text('Female');
    });
}
// Button click functionality
document.getElementById('button-2019').addEventListener('click', function() {
    setActiveButton(this);
    loadChartData('design5_2019.csv');
});

document.getElementById('button-2020').addEventListener('click', function() {
    setActiveButton(this);
    loadChartData('design5_2020.csv');
});

document.getElementById('button-2021').addEventListener('click', function() {
    setActiveButton(this);
    loadChartData('design5_2021.csv');
});

// Helper function to set the active button
function setActiveButton(button) {
    // Remove 'active' from all buttons
    document.querySelectorAll('.button').forEach(b => b.classList.remove('active'));

    // Add 'active' to the clicked button
    button.classList.add('active');
}

// Initially load the chart for 20
loadChartData('design5_2019.csv');