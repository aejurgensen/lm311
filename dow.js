// DAY OF WEEK LINE CHART

// use same height and width as used in lm_311.js
let dow_svg = d3.select("svg.dowchart")
    .attr("height", 700)
    .attr("width", 900);

function dow_plot()  {
    // use same height and width as used in lm_311.js
    let w = 900;
    let h = 700;

    d3.json("counts_day_of_week.json").then(function(data) {
        let top_space = h / 8.0;
        let bottom_space = h / 11.0;
        let left = w / 10.0;
        let right = w / 10.0;

        let chart_height = h - top_space - bottom_space;
        let chart_width = w - left - right;

        // basic colors from colorbrewer 4-class Dark2 scheme
        let colors = ["#1b9e77", "#e7298a"];

        let selected = "dumping";
        let aggregation = "averaged"
        let year = 2020;
        let days = ['Monday','Tuesday','Wednesday','Thursday',
                    "Friday","Saturday","Sunday"];
        let issue_map = {'dumping':"Illegal Dumping",
                         'graffiti':"Graffiti", 
                         'streets':"Street Maintenance", 
                         'parking':"Illegal Parking", 
                         'litter':"Litter",}

        let max_value_map = {'summed':{'dumping': 200, 
                                    'graffiti': 350, 
                                    'streets': 150, 
                                    'litter': 100, 
                                    'parking': 100},
                             'averaged':{'dumping': 4.0,
                                    'graffiti': 6.5,
                                    'streets': 3.0,
                                    'litter': 1.5,
                                    'parking': 2.0}};     

        let max_value = max_value_map[aggregation][selected];
                                    
        // add y-axis for counts
        let y = d3.scaleLinear()
            .domain([0,max_value])
            .range([(h - bottom_space), top_space])

        let y_axis = dow_svg.append("g")
            .attr("transform", "translate(" + left + ", 0)")
            .append("g")
            .attr("class","yaxis")
                .call(d3.axisLeft(y))        
                .style("font","16px sans-serif");

        
        // add x-axis with day of week
        let x = d3.scaleBand()
            .domain(days)
            .range([left,left + chart_width])
            .padding([0.2])

        dow_svg.append("g")
            .attr("transform", "translate(0," + (h - bottom_space) + ")")
            .call(d3.axisBottom(x).tickSize(0))
                .style("font","16px sans-serif");

        // add y-axis label 
        let y_axis_label = dow_svg.append("g")
            .attr("class", "yaxis label")
            .attr("transform", "translate(" + (left / 2.5) + ", " + 
                    (top_space + chart_height / 2) + ") rotate(-90)")
            .append("text")
            .text("Total Requests")
            .attr("font-family", "sans-serif")
            .attr("font-size", "22px")
            .style("text-anchor", "middle");

        // add title
        let title = dow_svg.append("g")
            .attr("class", "chart title")
            .attr("transform", "translate(" + (w / 2) + "," + (top_space / 2) + ")")
            .append("text")
            .text(" Request Volume by Day of Week")
            .attr("font-family", "sans-serif")
            .attr("font-size", "30px")
            .attr("text-anchor", "middle");

        let bars = dow_svg.append("g")
            .attr("class", "bars");

        function update(){
            bars.selectAll("rect").remove();
            bars.selectAll("text").remove();

            // update y-axis
            let transition = dow_svg.transition();

            max_value = max_value_map[aggregation][selected];
            y.domain([0, max_value]);
            transition.select(".yaxis")
                .duration(240)
                .call(d3.axisLeft(y));
            
            // update bars and their labels
            let rect = bars.selectAll("rect")
                .data(data[aggregation][selected][year])
                .enter()
                .append("g");

            rect.append("rect")
                .attr("x", d => x(d.day))
                .attr("y", d => y(d.value))
                .attr("width", x.bandwidth())
                .attr("height", d => chart_height + top_space - y(d.value))
                .attr("fill", colors[0]);  
        
            rect.append("text")
                .attr("x",  d => {
                    let space = 10;
                    if (aggregation == "summed" && d.value >= 100) {
                        space = 0;
                    } else if (aggregation == "summed") {
                        space = 5;
                    }
                    
                    return x(d.day) + x.bandwidth()/4 + space
                }) 
                .attr("y", d => y(d.value) - 5)
                .text(d=> d3.format(".1f")(d.value))
                .attr("fill", "black") 
                .attr("font-family","sans-serif")
                .attr("font-size", "16px")
                .attr("font-weight", "800");

            let title_text = issue_map[selected] + " Requests by Day of Week (" + year + ")";
            title.text(title_text);

            let yaxis_text = aggregation == "averaged" ? "Average Request Volume" : "Total Request Volume";
            y_axis_label.text(yaxis_text);
        }
        update();


        let issue_selector = d3.select("#issue");
        issue_selector.on("change", d => {
            selected = issue_selector.property("value");
            update();
        })

        let year_selector = d3.select("#year");
        year_selector.on("change", d => {
            year = year_selector.property("value");
            update();
        })

        let aggregation_selector = d3.select("#aggregation");
        aggregation_selector.on("change", d => {
            aggregation = aggregation_selector.property("value");
            update();
        })
    });
}

dow_plot();