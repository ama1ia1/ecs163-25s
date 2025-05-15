let musichours = 0;
const width = window.innerWidth;
const height = window.innerHeight;

//scatter plot dimensions
let scatterLeft = 10, scatterTop = 20;
let scatterMargin = {top: 10, right: 30, bottom: 50, left: 60},
    scatterWidth = 400 - scatterMargin.left - scatterMargin.right,
    scatterHeight = 350 - scatterMargin.top - scatterMargin.bottom;

    //pie chart dimensions
let pieLeft = 10, pieTop = 400;
let pieMargin = {top: 10, right: 30, bottom: 50, left: 60};
const pieRadius = 200;

//parallel coordinates dimensions
let parallelLeft = 415, parallelTop = 20;
let parallelMargin = {top: 10, right: 30, bottom: 30, left: 60},
    parallelWidth = width - parallelLeft - 50,
    parallelHeight = height - 100;

// plots
// filtering the data
d3.csv("mxmh_survey_results.csv").then(rawData =>{
    console.log("rawData", rawData);

    rawData.forEach(function(d){
        d.hours = Number(d["Hours per day"]);
        d.depression = Number(d["Depression"]);
        d.anxiety = Number(d["Anxiety"]);
        d.insomnia = Number(d["Insomnia"]);
        d.ocd = Number(d["OCD"]);
        d.age = Number(d["Age"]);
    });
    //filters data to only allow data points with hours greater than 0
    const filteredData = rawData.filter(d=>d.hours>musichours);
    
    //plot 1: Scatter Plot: Hours per day vs Depression
    const svg = d3.select("svg");

    const g1 = svg.append("g")
                .attr("transform", `translate(${scatterMargin.left}, ${scatterMargin.top})`);

    // X-axis label
    g1.append("text")
    .attr("x", scatterWidth / 2)
    .attr("y", scatterHeight + 50)
    .attr("font-size", "20px")
    .attr("text-anchor", "middle")
    .text("Hours per day");

    // Y-axis label
    g1.append("text")
    .attr("x", -(scatterHeight / 2))
    .attr("y", -40)
    .attr("font-size", "20px")
    .attr("text-anchor", "middle")
    .attr("transform", "rotate(-90)")
    .text("Depression Score");

    // X ticks
    const x1 = d3.scaleLinear()
    .domain([0, d3.max(filteredData, d => d.hours)])
    .range([0, scatterWidth]);

    const xAxisCall = d3.axisBottom(x1)
                        .ticks(7);
    g1.append("g")
    .attr("transform", `translate(0, ${scatterHeight})`)
    .call(xAxisCall)
    .selectAll("text")
        .attr("y", "10")
        .attr("x", "-5")
        .attr("text-anchor", "end")
        .attr("transform", "rotate(-40)");

    // Y ticks
    const y1 = d3.scaleLinear() 
    .domain([0, d3.max(filteredData, d => d.depression)])
    .range([scatterHeight, 0]); 

    const yAxisCall = d3.axisLeft(y1)
                        .ticks(13);
    g1.append("g").call(yAxisCall);

    // scatterplot circles
    const circles = g1.selectAll("circle").data(filteredData);

    circles.enter().append("circle")
         .attr("cx", d => x1(d.hours))
         .attr("cy", d => y1(d.depression))
         .attr("r", 5)
         .attr("fill", "#69b3a2");

     //plot 2: Pie Chart: Depression Score Distribution
     // filters data to only allow data points with depression score greater than 0
    const filteredData2 = rawData.filter(d=>d.depression>0);

    // counts the frequency of each depression score
    const depressionCount = d3.nest()
        .key(d => d.depression)
        .rollup(v => v.length)
        .entries(filteredData2);

    //creates the pie chart
    const svg2 = d3.select("svg")
        .append("g")
        .attr("transform", `translate(${pieLeft + pieRadius}, ${pieTop + pieRadius})`);

    const pie = d3.pie()
        .value(d => d.value);

    const arc = d3.arc()
        .innerRadius(0)
        .outerRadius(pieRadius);

    const labelRadius = pieRadius * 0.7;
    const arcLabel = d3.arc()
        .innerRadius(labelRadius)
        .outerRadius(labelRadius);

    const color = d3.scaleOrdinal(d3.schemeCategory10);

    const arcs = svg2.selectAll("arc")
        .data(pie(depressionCount))
        .enter()
        .append("g")
        .attr("class", "arc");

    arcs.append("path")
        .attr("d", arc)
        .attr("fill", (d, i) => color(i));

    // adds labels to the pie chart
    arcs.append("text")
        .attr("transform", d => `translate(${arcLabel.centroid(d)})`)
        .attr("text-anchor", "middle")
        .attr("font-size", "11px")
        .attr("font-family", "sans-serif")
        .call(text => text.append("tspan")
            .attr("x", 0)
            .attr("y", "-1.9em")
            .attr("font-weight", "bold")
            .text(d => "Score"))
        .call(text => text.append("tspan")
            .attr("x", 0)
            .attr("y", "-0.6em")
            .attr("font-weight", "bold")
            .text(d => `${d.data.key}`))
        .call(text => text.append("tspan")
            .attr("x", 0)
            .attr("y", "0.5em")
            .attr("fill-opacity", 0.7)
            .text(d => `${d.data.value}`));

    //plot 3: parallel coordinates: hours per day, depression score, fav genre, age

    const keys3 = ["hours", "depression", "insomnia", "ocd", "age"];
    const colors3 = "depression";
    // X ticks
    const x = new Map(
        keys3.map(key => [key, d3.scaleLinear(d3.extent(filteredData, d => d[key]), [parallelMargin.left, parallelWidth - parallelMargin.right])])
    );
    
    // Y position of each axis
    const y = d3.scalePoint()
        .domain(keys3)
        .range([parallelMargin.top, parallelHeight - parallelMargin.bottom]);

    // sets the color scale for the lines
    const colorscale = d3.scaleSequential()
        .domain(d3.extent(filteredData, d => d[colors3]))
        .interpolator(t => d3.interpolateBrBG(1-t));

    const svg3 = d3.select("svg")
        .append("g")
        .attr("transform", `translate(${parallelLeft}, ${parallelTop})`);

    // connects the lines to the axes
    const line = d3.line()
        .x(([key, value]) => x.get(key)(value))
        .y(([key, value]) => y(key));

    svg3.append("g")
        .attr("fill", "none")
        .attr("stroke-width", 1.5)
        .attr("stroke-opacity", 0.4)
        .selectAll("path")
        .data(filteredData)
        .join ("path")
            .attr("stroke", d => colorscale(d[colors3]))
            .attr("d", d => line(keys3.map(key => [key, d[key]])))
    
    // creates the axes for each attribute
    svg3.append("g")
        .selectAll("g")
        .data(keys3)
        .join("g")
            .attr("transform", d => `translate(0, ${y(d)})`)
            .each(function(d) {
                d3.select(this).call(d3.axisBottom(x.get(d)));
            })
            .call(g => g.append("text")
                .attr("x", parallelMargin.left)
                .attr("y", -6)
                .attr("text-anchor", "start")
                .attr("fill", "currentColor")
                .text(d => d.charAt(0).toUpperCase() + d.slice(1)))
            .call(g => g.selectAll("text")
                .clone(true).lower()
                .attr("fill", "none")   
                .attr("stroke-width", 5)
                .attr("stroke-linejoin", "round")
                .attr("stroke", "white"));

});

/* Sources
1. https://observablehq.com/@d3/pie-chart/2
2. http://127.0.0.1:5500/Template/index.html
3. https://observablehq.com/@d3/scatterplot-with-shapes
4. https://observablehq.com/@d3/parallel-coordinates

*/