var myScrollama = scrollama();
const figureHeight = window.innerHeight * 0.8
const figureMarginTop = (window.innerHeight - figureHeight) / 2
const stepH = Math.floor(window.innerHeight * 1.8);

        var figure = d3.select('figure');
        var img1 = d3.select('#img1');
        var img2 = d3.select('#img2');
        var img3 = d3.select('#img3');
        var img4 = d3.select('#violinplot');

        var article = d3.select('article');
        var steps = d3.selectAll('.step');

        var focus = "bar_none";
        var year_foci = [];

        
        function handleResize() {
            steps.style("height", stepH + 'px')
            figure
                .style('height', figureHeight + 'px')
                .style('top', figureMarginTop + 'px')
            myScrollama.resize();
        }

        function handleStepChange(response) {
            switch(response.index) {
            case 0:
                img1.style("display", "block");
                img2.style("display", "none");
                img3.style("display", "none");
                img4.style("display", "none");
                focus = "bar_none";
                bar_plot();
                break;

            case 1:
                focus = "bar_dumping";
                bar_plot();
                break;

            case 2:
                focus = "bar_graffiti";
                bar_plot();
                break;

            case 3:
                focus = "bar_streets";
                bar_plot();
                break;

            case 4:
                focus = "bar_parking";
                bar_plot();
                break;

            case 5:
                img1.style("display", "block");
                img2.style("display", "none");
                img3.style("display", "none");
                img4.style("display", "none");
                focus = "bar_litter";
                bar_plot();
                //document.body.style.backgroundColor = "rgba(253, 221, 199, .5)";
                break;

            case 6:
                img1.style("display", "none");
                img2.style("display", "block");
                img3.style("display", "none");
                img4.style("display", "none");                
                focus = "line_dumping";
                line_plot();
                break;

            case 7:
                focus = "line_graffiti";
                line_plot();
                break;

            case 8:
                focus = "line_streets";
                line_plot();
                break;

            case 9:
                focus = "line_parking";
                line_plot();
                break;

            case 10: 
                img1.style("display", "none");
                img2.style("display", "block");
                img3.style("display", "none");
                img4.style("display", "none");
                focus = "line_litter";
                line_plot();
                break;

            case 11:
                img1.style("display", "none");
                img2.style("display", "none");
                img3.style("display", "block");
                img4.style("display", "none");
                break;

            case 12:
                img1.style("display", "none");
                img2.style("display", "none");
                img3.style("display", "none");
                img4.style("display", "block");
                break;

            default:
                img1.style("display", "block");
                img2.style("display", "none");
                img3.style("display", "none");
                img4.style("display", "none");
            }
        }

        function init() {
            // force a resize on load to ensure proper dimensions are sent to scrollama
            handleResize();

            myScrollama.setup({
                step: '.step',
                offset: Math.floor(window.innerHeight) * 0.9 + "px",//1.3 + "px",
                // set to true to see debug horizontal line
                debug: false,
            }).onStepEnter(handleStepChange)
        
            // setup resize event
            window.addEventListener('resize', handleResize);
        }

        init();


        // VISUALIZATIONS
        let w = 900;
        let h = 700;

        // BAR CHART
        let bar_svg = d3.select("div.figure1").select("svg")
            //.append("svg")
            .attr("height", h)
            .attr("width", w);

        /*roughly based on https://www.d3-graph-gallery.com/graph/barplot_grouped_basicWide.html */
        function bar_plot() {
            d3.json("prevsmidpandemic.json").then(function(data) {
            //console.log(data);
            bar_svg.selectAll("g > *").remove();

            let top_space = h / 8.0;
            let bottom_space = h / 11.0;
            let left = w / 10.0;
            let right = w / 5.0;

            let chart_height = h - top_space - bottom_space;
            let chart_width = w - left - right;

            let max_value = 1000;
            let groups = ['dumping', 'graffiti', 'streets', 'parking', 'litter',];
            let subgroups = ["pre-pandemic", "pandemic"];

            // basic colors from colorbrewer 4-class Dark2 scheme, and the 
            // not-focused colors from 4-class Pastel2 scheme
            let colors = ["#1b9e77", "#e7298a"];
            let colormap = {"#1b9e77":"#b3e2cd", 
                            "#e7298a":"#f4cae4"};

            let selected = (focus == "bar_none" || !focus.startsWith("bar_")) ? null : focus.replace(new RegExp("^bar_"), '');

            // calculate % increase/decrease of volume from pre-pandemic year for each category
            let grouped = {};
            data.forEach(function(d) {
                if (! (Object.keys(grouped).includes(d.category))) {
                    grouped[d.category] = {};
                }
                grouped[d.category][d.period] = d.count;
            });

            groups.forEach(function(d) {
                let delta = grouped[d]["pandemic"] / grouped[d]["pre-pandemic"]
                grouped[d]["delta"] = delta - 1.0;
            });

            // add x-axis with request issue types
            let x = d3.scaleBand()
                .domain(groups)
                .range([left,left + chart_width])
                .padding([0.2])
            bar_svg.append("g")
                .attr("transform", "translate(0," + (h - bottom_space) + ")")
                .call(d3.axisBottom(x).tickSize(0))
                    .style("font","16px sans-serif");

            // add y-axis for counts
            let y = d3.scaleLinear()
                .domain([0,max_value])
                .range([(h - bottom_space), top_space])
            bar_svg.append("g")
                .attr("transform", "translate(" + left + ", 0)")
                .call(d3.axisLeft(y))        
                    .style("font","16px sans-serif");

            // scale for subgroup (pre- vs mid-pandemic) position
            let xSubgroup = d3.scaleBand()
                .domain(subgroups)
                .range([0, x.bandwidth()])
                .padding([0.05])

            // color palette = one color for each pre- and mid-pandemic
            let color = d3.scaleOrdinal()
                .domain(subgroups)
                .range(colors)

            let bars = bar_svg.append("g")
                .attr("class", "bars")
                .selectAll("rect")
                .data(data)
                .enter()
                .append("g")
                .attr("transform", function(d) { return "translate(" + x(d.category) + ",0)"; });

            let annos = bar_svg.append("g");

            // plot bars
            function plot(){
                bars.selectAll("rect").remove();
                bars.selectAll("text").remove();
                annos.selectAll(".annotation.callout").remove();
                    
                bars.append("rect")
                    .attr("x", d => xSubgroup(d.period))
                    .attr("y", d => y(d.count))
                    .attr("width", xSubgroup.bandwidth())
                    .attr("height", d => chart_height + top_space - y(d.count))
                    .attr("fill", d => (selected != null && d.category != selected) ? colormap[color(d.period)]: color(d.period));  
                
                bars.append("text")
                    .attr("x",  d => xSubgroup(d.period) + xSubgroup.bandwidth()/6) 
                    .attr("y", d => y(d.count) - 5)
                    .text(d=> d.count)
                    .attr("fill", d => (selected != null && d.category != selected) ? "grey" : "black")
                    .attr("font-family","sans-serif")
                    .attr("font-size", "16px")
                    .attr("font-weight", "800");

                // add %-increase annotation for selected category
                if (selected != null) {
                    let direction = grouped[selected]["delta"] >= 0 ? "+" : "";
                    let extent = d3.extent([grouped[selected]["pre-pandemic"], grouped[selected]["pandemic"]]);
                    let start_y = y(grouped[selected]["pandemic"]);
                    let text_y = grouped[selected]["pandemic"] == extent[1] ? -20 : 
                                    y(extent[1]) - y(extent[0])  - 20;

                    // annotations from https://www.d3-graph-gallery.com/graph/custom_annotation.html
                    const annotations = [
                        {
                        note: {
                            //label: "from pre-pandemic volume",
                            title: direction + d3.format(".1%") (grouped[selected]["delta"]) + " change"
                            //(d3.format(".3") (grouped[selected]["delta"] * 100)) + "% change"
                        },
                        color: ["#606060"],
                        font: ["sans-serif"],
                        y: start_y, 
                        x:  xSubgroup("pandemic") + x(selected) + xSubgroup.bandwidth() + 5, 
                        dx: 20,
                        dy: text_y
                        }
                    ]
                    
                    // Add annotation to the chart
                    const makeAnnotations = d3.annotation()
                        .annotations(annotations)
                    annos.call(makeAnnotations)  
                }
            }

            plot();

            // create invisible hover bars over x-axis labels to highlight plot by category
            bar_svg.append("g")
                .attr("class", "bars")
                .selectAll("rect")
                .data(groups)
                .enter()
                .append("g")
                //.attr("transform", d => "translate(" + x(d) + ",0)")
                .append("rect")
                    .attr("x", d => x(d) + 3)
                    .attr("y", y(0))
                    .attr("width", xSubgroup.bandwidth() * 2 + xSubgroup.padding())
                    .attr("height", "20px")
                    .attr("fill-opacity", 0.0)
                .on("mouseover", function(event, d) {
                        selected = d;
                        plot();
                    })
                    .on("mouseout", function() {
                        selected = null;
                        plot();
                    })
                    //.on("click", function(event, d) { console.log(d); });


            // add color legend, from http://bl.ocks.org/alark/d89abee2be7c95785f63608d13180a4e 
            // and https://d3-legend.susielu.com/, roughly
            let legend = d3.legendColor()
                .title("Time Period")
                .titleWidth(right)
                .shape("path", d3.symbol().type(d3.symbolSquare).size(200)())
                .shapePadding(7)
                .scale(color);

            let added_legend = bar_svg.append("g")
                .attr("class", "color legend")
                .attr("transform", "translate(" + (left + chart_width + 20) + 
                        "," + (chart_height / 3) +")")
                .call(legend);

            added_legend.select(".legendCells")
                .selectAll(".label")
                .style("font", "16px sans-serif")

            added_legend.select(".legendTitle")
                .style("font", "20px sans-serif")
            

            // add y-axis label from 
            bar_svg.append("g")
            .attr("class", "yaxis label")
            .attr("transform", "translate(" + (left / 4) + ", " + 
                    (top_space + chart_height / 2) + ") rotate(-90)")
            .append("text")
            .text("Total Requests")
            .attr("font-family", "sans-serif")
            .attr("font-size", "22px")
            .style("text-anchor", "middle");
            

            // add x-axis label
            bar_svg.append("g")
                .attr("class", "xaxis label")
                .attr("transform", "translate(" + (left + chart_width / 2) + "," + 
                        (h - bottom_space / 7) + ")")
                .append("text")
                .text("Category")
                .attr("font-family", "sans-serif")
                .attr("font-size", "22px")
                .attr("text-anchor", "middle");

            // add title
            bar_svg.append("g")
            .attr("class", "chart title")
            .attr("transform", "translate(" + (w / 2) + "," + (top_space / 2) + ")")
            .append("text")
            .text("Pre- vs. Mid-Pandemic Request Volume")
            .attr("font-family", "sans-serif")
            .attr("font-size", "30px")
            .attr("text-anchor", "middle");
            });
        };

        

        // LINE CHART
        // tooltips based on http://bl.ocks.org/mmattozzi/7018021
        let tooltip = d3.select("body")
            .append("div")
            .style("position", "absolute")
            .style("z-index", "10")
            .style("display", "none")
            .style("color", "white")
            .style("padding", "8px")
            .style("background-color", "rgba(0, 0, 0, 0.75)")
            .style("border-radius", "0.25px")    
            .style("font", "18px sans-serif");

        let tooltipDate = tooltip.append("p")
            .attr("class", "tooltip")
            .style("margin", "0px")
            .text("date");
        let tooltipCount = tooltip.append("p")
            .attr("class", "tooltip")
            .style("margin", "0px")
            .text("count");

        let line_svg = d3.select("div.figure1").select("svg.svg2")
            .attr("height", h)
            .attr("width", w);

        function line_plot()  {
            d3.json("counts_month_year.json").then(function(data) {

            line_svg.selectAll("g > *").remove();
                
            let top_space = h / 8.0;
            let bottom_space = h / 11.0;
            let left = w / 10.0;
            let right = w / 7.5

            let chart_height = h - top_space - bottom_space;
            let chart_width = w - left - right;

            let years = [2016, 2017, 2018, 2019, 2020];
            let issue = (!focus.startsWith("line_")) ? "dumping" : focus.replace(new RegExp("^line_"), '');
            let issue_names = {'dumping':"Illegal Dumping",
                        'graffiti': "Graffiti",
                        'streets':"Street Maintenance",
                        'litter':"Litter",
                        'parking': "Illegal Parking"}

            let selected_years = [2019, 2020];
            let line_data = [];
            let dot_data = [];

            // base colors from colorbrewer 4-class Dark2 scheme, and non-focused
            // colors from colorbrewer 4-class Pastel2 scheme
            let colors = ["#1b9e77", "#d95f02","#7570b3", "#66a61e", "#e7298a", "#e6ab02"];
            let colormap = {"#1b9e77":"#b3e2cd",
                            "#d95f02":"#fdcdac",
                            "#7570b3":"#cbd5e8",
                            "#66a61e":"#e6f5c9",
                            "#e7298a":"#f4cae4",
                            "#e6ab02":"#ffffcc"}

            // from example https://www.d3-graph-gallery.com/graph/custom_color.html
            let colorscale = d3.scaleOrdinal()
            .domain(years)
            .range(colors);
            
            let xscale = d3.scaleLinear()
            .domain([1,12])
            .range([left, left  + chart_width]);

            let max_volume = focus == "line_graffiti" ? 400 : 150;
            let yscale = d3.scaleLinear()
            .domain(([0, max_volume]))
            .range([h - bottom_space, top_space]);

            // add y-axis tick marks
            let yAxis = d3.axisLeft(yscale);
            line_svg.append("g")
            .attr("class", "axis")
            .attr("transform", "translate(" + left + ",0)")
            .style("font","16px sans-serif")
            .call(yAxis);

            // add x-axis tick marks
            // from Murray's Interactive Data Visualization for the Web Chp. 8
            let xAxis = d3.axisBottom(xscale);
            line_svg.append("g")
            .attr("class", "axis")
            .attr("transform", "translate(0," + (h - bottom_space) + ")")
            .style("font","16px sans-serif")
            .call(xAxis);

            // add y-axis label 
            line_svg.append("g")
            .attr("class", "yaxis label")
            .attr("transform", "translate(" + (left / 2.5) + ", " +
                (top_space + chart_height / 2) + ") rotate(-90)")
            .append("text")    
            .text("Monthly Request Volume")
            .attr("font-family", "sans-serif")
            .attr("font-size", "22px")
            .style("text-anchor", "middle");
            

            // add x-axis label
            line_svg.append("g")
            .attr("class", "xaxis label")
            .attr("transform", "translate(" + (left + chart_width / 2) + "," + 
                        (h - bottom_space / 20) + ")")
            .append("text")
            .text("Month")
            .attr("font-family", "sans-serif")
            .attr("font-size", "22px")
            .attr("text-anchor", "middle");

            // add title
            line_svg.append("g")
            .attr("class", "chart title")
            .attr("transform", "translate(" + (w / 2) + "," + (top_space / 2) + ")")
            .append("text")
            .text(issue_names[issue] + " Requests")
            .attr("font-family", "sans-serif")
            .attr("font-size", "30px")
            .attr("text-anchor", "middle");

            // add color key, from https://www.d3-graph-gallery.com/graph/custom_legend.html
            let color_legend = line_svg.append("g")
                .attr("class", "colorlegend");
                

            color_legend.selectAll("circle")
                .data(years)
                .enter()
                .append("circle")
                .attr("class", d => "circle_" + d)
                .attr("cx", w - right + 15)
                .attr("cy", function(d, i) {return h / 4 + 25 * (i + 1);})
                .attr("r", 5)
                .style("fill", d => colorscale(d))
                .style("stroke", d => colorscale(d))

            color_legend.selectAll("text")
                .data(years)
                .enter()
                .append("text")
                .attr("class", d => "text_" + d)
                .attr("x",  w - right + 35)
                .attr("y", function(d, i) {return h / 4 + 25 * (i + 1) + 5;})
                .style("fill", d => colorscale(d))
                .attr("font-family", "sans-serif")
                .style("font-size", "16px")
                .text(d => d);

            function update_color_legend_colors() {
                years.forEach(function(d) {
                    let color = colorscale(d);
                    if (selected_years.length > 0 && !selected_years.includes(d)) { 
                        color = colormap[colorscale(d)]; 
                    }

                    color_legend.select(".circle_" + d).style("fill", color).style("stroke", color);
                    color_legend.select(".text_" + d).style("fill", color);
                });
            }

            color_legend.selectAll("rect")
                .data(years)
                .enter()
                .append("rect")
                .attr("x",  w - right + 10)
                .attr("y", function(d, i) {return h / 4 + 25 * (i + 1) - 10;})
                .attr("width", 60)
                .attr("height", 18)
                .attr("fill-opacity", 0.0)
                .on("click", function(event, d) { 
                    if (selected_years.includes(d)) {
                        for (let i = 0; i < selected_years.length; i++) {
                            if ( selected_years[i] === d) { selected_years.splice(i, 1);}
                        }
                    } else {
                        selected_years.push(d);
                        if (selected_years.length == years.length) {
                            selected_years = [];
                        }
                    }
                    plot();
                });

            /*line_svg.append("g")
            .attr("class", "color legend title")
            .attr("transform", "translate(" + (key_title_x - 15) + "," + (h / 4) + ")")
            .append("text")
                .text("Year")
                .attr("font-family", "sans-serif")
                .attr("font-size", "20px")
                .attr("text-anchor", "middle");*/

            // filter dataset to plot just request type and years of interest
            line_data = data.filter( function(d) {
                return (years.includes(d.year) && issue == d.category);
            })

            let original_line_data = line_data;

            dot_data = get_dot_data(line_data);

            let lines = line_svg.append('g')
                .attr("class", "lines");

            
            let dots = line_svg.append('g')
                .attr("class","dots");

            let annos = line_svg.append("g");

            // plot lines and dots
            function plot() {
                lines.selectAll("line").remove();            
                dots.selectAll("circle").remove();
                annos.selectAll(".annotation.callout").remove();

                rearrangeLines();
                update_color_legend_colors();

                lines.selectAll("chartlines")
                .data(line_data)
                .enter()
                .append("line") 
                    .attr("x1", d => xscale(d.month0))
                    .attr("x2", d => xscale(d.month1))
                    .attr("y1", d => yscale(d.count0))
                    .attr("y2", d => yscale(d.count1))
                    .attr("stroke", d => {
                        let color = colorscale(d.year);
                        if (selected_years.length > 0 && !selected_years.includes(d.year)) { 
                            color = colormap[colorscale(d.year)]; 
                        }
                        return color; 
                    })
                    .attr("stroke-width", 2);

                dots.selectAll("chartdots")
                    .data(dot_data)
                    .enter()
                    .append("circle")
                        .attr("cx", d => xscale(d.month))
                        .attr("cy", d => yscale(d.count))
                        .attr("fill", d => {
                            let color = colorscale(d.year);
                            if (selected_years.length > 0 && !selected_years.includes(d.year)) { 
                                color = colormap[colorscale(d.year)]; 
                            }
                            return color; 
                        })
                        .attr("r", 4)
                        .on("mouseover", function(event, d) {
                            tooltipDate.text(d.month + "/" + d.year);
                            tooltipCount.text(d.count + " requests");
                        
                            return tooltip.style("top", (event.pageY-10)+"px")
                                .style("left",(event.pageX+10)+"px")
                                .style("display", "initial");
                        })
                        .on("mouseout", function() {return tooltip.style("display","none")});
            }

            plot();


            // reorder lines for years so selected year on ends up on top (appears 'brought to front')
            function rearrangeLines() {
                if (selected_years != []) {
                    let new_lines = [];
                    let selected_data = [];

                    original_line_data.forEach(function(d) {
                        if (selected_years.includes(d.year)) {
                            selected_data.push(d);
                        } else {
                            new_lines.push(d);
                        }
                    });

                    selected_data.forEach(d => new_lines.push(d));
                    
                    line_data = new_lines;
                    dot_data = get_dot_data(line_data);
                }
            }
            
            // pulls out individual months from the month0, month1 format used for line data
            // for easier dot plotting
            function get_dot_data(data) {
                let dot_data = [];
                data.forEach(function(d) {
                    dot_data.push({
                        "month":d.month0,
                        "count":d.count0,
                        "year":d.year
                    })
                    
                    if (d.month1 == 12) {
                        dot_data.push({
                            "month":d.month1,
                            "count":d.count1,
                            "year":d.year
                        })
                    }
                });
            
                return dot_data;
            }
        });}

        line_plot();