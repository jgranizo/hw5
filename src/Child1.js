import React, { Component } from "react";
import * as d3 from "d3";
import "./Child1.css"; // Import the CSS file

class Child1 extends Component {
  state = {
    selectedCompany: "Apple", // Default company
    selectedMonth: "November", // Default month (use month name)
  };

  componentDidMount() {
    this.renderChart();
  }

  componentDidUpdate(prevProps, prevState) {
    if (
      prevProps.csv_data !== this.props.csv_data ||
      prevState.selectedCompany !== this.state.selectedCompany ||
      prevState.selectedMonth !== this.state.selectedMonth
    ) {
      this.renderChart();
    }
  }

  handleCompanyChange = (event) => {
    this.setState({ selectedCompany: event.target.value });
  };

  handleMonthChange = (event) => {
    this.setState({ selectedMonth: event.target.value });
  };

  renderChart() {
    // Create a copy of the data to avoid mutating props
    const dataCopy = this.props.csv_data.map((d) => ({
      ...d,
      Open: +d.Open,
      Close: +d.Close,
      Date: d.Date instanceof Date ? d.Date : new Date(d.Date),
    }));

    // Filter out data points where d.Date is invalid
    const validData = dataCopy.filter((d) => d.Date);

    const filteredData = validData.filter(
      (d) =>
        d.Company === this.state.selectedCompany &&
        d.Date.toLocaleString("en-US", { month: "long" }) ===
          this.state.selectedMonth
    );

    // Clear the SVG before rendering
    d3.select(".mysvg").selectAll("*").remove();

    if (filteredData.length === 0) {
      console.log("No data for selected company and month.");
      return;
    }

    const margin = { top: 20, right: 100, bottom: 40, left: 40 },
      width = 700,
      height = 400,
      innerWidth = width - margin.left - margin.right,
      innerHeight = height - margin.top - margin.bottom;

    const svg = d3
      .select(".mysvg")
      .attr("width", width)
      .attr("height", height);

    const g = svg
      .append("g")
      .attr("class", "chart")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // Create the x and y scales
    const xScale = d3
      .scaleTime()
      .domain(d3.extent(filteredData, (d) => d.Date))
      .range([0, innerWidth]);

    const yMin = d3.min(filteredData, (d) => Math.min(d.Close, d.Open));
    const yMax = d3.max(filteredData, (d) => Math.max(d.Open, d.Close));
    const yPadding = (yMax - yMin) * 0.1;

    const yScale = d3
      .scaleLinear()
      .domain([yMin - yPadding, yMax + yPadding])
      .range([innerHeight, 0]);

    // Define the line generators
    const lineGeneratorClose = d3
      .line()
      .x((d) => xScale(d.Date))
      .y((d) => yScale(d.Close))
      .curve(d3.curveCardinal);

    const lineGeneratorOpen = d3
      .line()
      .x((d) => xScale(d.Date))
      .y((d) => yScale(d.Open))
      .curve(d3.curveCardinal);

    // Draw the 'Close' line
    g.append("path")
      .datum(filteredData)
      .attr("class", "close-line")
      .attr("d", lineGeneratorClose);

    // Draw the 'Open' line
    g.append("path")
      .datum(filteredData)
      .attr("class", "open-line")
      .attr("d", lineGeneratorOpen);

    // Add circles for 'Close' data points
    g.selectAll(".dot-close")
      .data(filteredData)
      .enter()
      .append("circle")
      .attr("class", "dot-close")
      .attr("cx", (d) => xScale(d.Date))
      .attr("cy", (d) => yScale(d.Close))
      .attr("r", 4)
      .on("mouseover", function (event, d) {
        tooltip
          .html(
            `<strong>Date:</strong> ${d.Date.toLocaleDateString()}<br/>
            <strong>Close:</strong> ${d.Close.toFixed(2)}<br/>
            <strong>Difference:</strong> ${(d.Close - d.Open).toFixed(2)}`
          )
          .style("visibility", "visible");
      })
      .on("mousemove", function (event) {
        tooltip
          .style("top", event.pageY - 10 + "px")
          .style("left", event.pageX + 10 + "px");
      })
      .on("mouseout", function () {
        tooltip.style("visibility", "hidden");
      });

    // Add circles for 'Open' data points
    g.selectAll(".dot-open")
      .data(filteredData)
      .enter()
      .append("circle")
      .attr("class", "dot-open")
      .attr("cx", (d) => xScale(d.Date))
      .attr("cy", (d) => yScale(d.Open))
      .attr("r", 4)
      .on("mouseover", function (event, d) {
        tooltip
          .html(
            `<strong>Date:</strong> ${d.Date.toLocaleDateString()}<br/>
            <strong>Open:</strong> ${d.Open.toFixed(2)}<br/>
            <strong>Difference:</strong> ${(d.Close - d.Open).toFixed(2)}`
          )
          .style("visibility", "visible");
      })
      .on("mousemove", function (event) {
        tooltip
          .style("top", event.pageY - 10 + "px")
          .style("left", event.pageX + 10 + "px");
      })
      .on("mouseout", function () {
        tooltip.style("visibility", "hidden");
      });

    // Add the x-axis
    g.append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale));

    // Add the y-axis
    g.append("g").attr("class", "y-axis").call(d3.axisLeft(yScale));

    // Add a legend
    const legend = svg.append("g").attr("class", "legend");

    const legendData = [
      { name: "Open", color: "#b2df8a" },
      { name: "Close", color: "#e41a1c" },
    ];

    legend
      .selectAll("rect")
      .data(legendData)
      .enter()
      .append("rect")
      .attr("x", width - margin.right + 20)
      .attr("y", (d, i) => margin.top + i * 25)
      .attr("width", 20)
      .attr("height", 10)
      .attr("fill", (d) => d.color);

    legend
      .selectAll("text")
      .data(legendData)
      .enter()
      .append("text")
      .attr("x", width - margin.right + 45)
      .attr("y", (d, i) => margin.top + i * 25 + 9)
      .text((d) => d.name)
      .style("font-size", "12px")
      .attr("alignment-baseline", "middle");

    // Create a tooltip
    const tooltip = d3
      .select(".tooltip-container")
      .append("div")
      .attr("class", "tooltip")
      .style("visibility", "hidden");
  }

  render() {
    const companies = ["Apple", "Microsoft", "Amazon", "Google", "Meta"];
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    return (
      <div className="child1-container">
        <div className="controls">
          <div className="company-selector">
            <h3>Select Company:</h3>
            {companies.map((company, index) => (
              <label key={index}>
                <input
                  type="radio"
                  name="company"
                  value={company}
                  checked={this.state.selectedCompany === company}
                  onChange={this.handleCompanyChange}
                />
                {company}
              </label>
            ))}
          </div>
          <div className="month-selector">
            <h3>Select Month:</h3>
            <select
              name="Month-Names"
              id="Month-Names"
              value={this.state.selectedMonth}
              onChange={this.handleMonthChange}
            >
              {months.map((month, index) => (
                <option key={index} value={month}>
                  {month}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="chart-container">
          <svg className="mysvg"></svg>
        </div>
        <div className="tooltip-container"></div>
      </div>
    );
  }
}

export default Child1;
