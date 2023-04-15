import BigNumber from 'bignumber.js';
import * as d3 from 'd3';
import { flowDuration } from './main';
import { Balance } from './typings';

// set the dimensions and margins of the graph
const margin = { top: 5, right: 5, bottom: 70, left: 70 },
    width = 400 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom,
    dotRadius = 5;

export const renderReserveProduct = (
    tokens: string[],
    balances: Balance[],
    currentBalance: () => Balance,
): (() => void) => {
    const svg = d3
        .select('#reserve_product')
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    // Add X axis --> Token 0 - USDC
    const token0Domain = d3.extent(balances, (d) => d[0]) as [number, number];
    const xScale = d3
        .scaleLinear()
        .domain(token0Domain)
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
    const token1Domain = d3.extent(balances, (d) => d[1]) as [number, number];
    const yScale = d3
        .scaleLinear()
        .domain(token1Domain)
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

    // Container for the exchange rate circle and lines to the x and y axis
    const rate = svg.append('g');
    rate.append('path')
        .attr('id', 'xLine')
        .attr('stroke', 'currentColor')
        .style('stroke-dasharray', '3 3');
    rate.append('path')
        .attr('id', 'yLine')
        .attr('stroke', 'currentColor')
        .style('stroke-dasharray', '3 3');
    rate.append('path').attr('id', 'xyCurve').attr('stroke', 'currentColor');
    rate.append('circle')
        .attr('id', 'xyPoint')
        .attr('r', dotRadius)
        .attr('fill', '#69b3a2');

    const updateReserveProduct = () => {
        const bal = currentBalance();
        const x = xScale(bal[0]);
        const y = yScale(bal[1]);
        // rate = x / y
        // eg rate = USDC / WETH
        // which is the WETH/USDC exchange rate
        // invariant = x * y
        const invariant = BigNumber(bal[0]).times(bal[1]);

        svg.select('#xyPoint')
            .attr('cx', x)
            .attr('cy', y)
            .transition()
            .duration(flowDuration);
        const xline = d3.line()([
            [0, y],
            [x, y],
        ]);
        svg.select('#xLine')
            .attr('d', xline)
            .transition()
            .duration(flowDuration);
        const yLine = d3.line()([
            [x, height],
            [x, y],
        ]);
        svg.select('#yLine')
            .attr('d', yLine)
            .transition()
            .duration(flowDuration);

        // Calc top left point
        // min x = k / max y
        let maxY = token1Domain[1];
        let minX = invariant.div(maxY).toNumber();
        if (minX < token0Domain[0]) {
            minX = token0Domain[0];
            // max y = invariant / min x
            maxY = invariant.div(minX).toNumber();
        }

        // Calc bottom right point
        // min y = invariant / max x
        let maxX = token0Domain[1];
        let minY = invariant.div(maxX).toNumber();
        if (minY < token1Domain[0]) {
            minY = token1Domain[0];
            // max x = invariant \ min y
            maxX = invariant.div(minY).toNumber();
        }

        // Draw the xy curve the rate moves along
        const xyCurve = d3.line().curve(d3.curveCatmullRom.alpha(1))([
            [xScale(minX), yScale(maxY)],
            [x, y],
            [xScale(maxX), yScale(minY)],
        ]);
        svg.select('#xyCurve')
            .attr('d', xyCurve)
            .transition()
            .duration(flowDuration);
    };

    updateReserveProduct();

    return updateReserveProduct;
};
