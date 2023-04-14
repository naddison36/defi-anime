import * as d3 from 'd3';

// set the dimensions and margins of the graph
const margin = { top: 5, right: 5, bottom: 70, left: 70 },
    width = 400 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;

export const render = (tokens: string[]) => {
    const svg = d3
        .select('#reserve_product')
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    // Add X axis --> Token 0 - USDC
    const xScale = d3
        .scaleLinear()
        .domain([23000000, 26000000])
        .range([0, width])
        .nice();
    svg.append('g')
        .attr('transform', 'translate(0,' + height + ')')
        .call(d3.axisBottom(xScale))
        .selectAll('text')
        .attr('transform', 'translate(-10,0)rotate(-45)')
        .style('text-anchor', 'end');

    // Add X axis label:
    svg.append('text')
        .attr('text-anchor', 'end')
        .attr('class', 'xLabel')
        .attr('x', width / 2)
        .attr('y', height + margin.top + margin.bottom - 12)
        .attr('fill', 'currentColor')
        .text(tokens[0]);

    // Add Y axis --> WETH
    const yScale = d3
        .scaleLinear()
        .domain([23000, 24000])
        .range([height, 0])
        .nice();
    svg.append('g').call(d3.axisLeft(yScale));

    // Y axis label:
    svg.append('text')
        .attr('text-anchor', 'end')
        .attr('transform', 'rotate(-90)')
        .attr('y', -margin.left + 12)
        .attr('x', -margin.top - height / 2)
        .attr('fill', 'currentColor')
        .text(tokens[1]);
};
