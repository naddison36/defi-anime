import BigNumber from 'bignumber.js';
import * as d3 from 'd3';
import { Balance, Component } from './typings';

// set the dimensions and margins of the graph
const margin = { top: 20, right: 5, bottom: 80, left: 70 },
    width = 400 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom,
    dotRadius = 5,
    componentId = 'reserve_product';
let zoomFactor = 0.1;

export const renderReserveProduct = (
    flowDuration: () => number,
    tokens: () => string[],
    balances: () => Balance[],
    currentBalance: () => Balance,
): Component => {
    let componentContainer;
    let xScale;
    let yScale;
    let xDomain;
    let yDomain;

    d3.select('#' + componentId)
        .insert('svg', '#zoomLabel')
        .attr('id', componentId + '_svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom);

    document
        .querySelector<HTMLInputElement>('#zoom')!
        .addEventListener('input', (event: Event) => {
            const zoomLevel = Number((event.target as HTMLInputElement).value);
            zoomFactor = zoomLevel / 20;
            console.log(`zoomFactor ${zoomFactor}`);
        });

    const render = () => {
        const containerId = componentId + '_container';
        d3.select('#' + containerId).remove();

        componentContainer = d3
            .select(`#${componentId}_svg`)
            .append('g')
            .attr('id', containerId)
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Add X axis --> Token 0 - USDC
        const token0Domain = d3.extent(balances(), (d) => d[0]);
        xDomain = [
            BigNumber(token0Domain[0])
                .times(1 - zoomFactor)
                .toNumber(),
            BigNumber(token0Domain[1])
                .times(1 + zoomFactor)
                .toNumber(),
        ];
        xScale = d3.scaleLinear().domain(xDomain).range([0, width]).nice();
        componentContainer
            .append('g')
            .attr('transform', 'translate(0,' + height + ')')
            .call(d3.axisBottom(xScale))
            .selectAll('text')
            .attr('transform', 'translate(-10,0)rotate(-45)')
            .style('text-anchor', 'end');

        // Add X axis label:
        componentContainer
            .append('text')
            .attr('text-anchor', 'end')
            .attr('class', 'xLabel')
            .attr('x', width / 2)
            .attr('y', height + margin.top + margin.bottom - 25)
            .attr('fill', '#2670C4')
            .text(tokens()[0]);

        // Add Y axis --> WETH
        const token1Domain = d3.extent(balances(), (d) => d[1]);
        yDomain = [
            BigNumber(token1Domain[0])
                .times(1 - zoomFactor)
                .toNumber(),
            BigNumber(token1Domain[1])
                .times(1 + zoomFactor)
                .toNumber(),
        ];
        yScale = d3.scaleLinear().domain(yDomain).range([height, 0]).nice();
        componentContainer.append('g').call(d3.axisLeft(yScale));

        // Y axis label:
        componentContainer
            .append('text')
            .attr('text-anchor', 'end')
            .attr('transform', 'rotate(-90)')
            .attr('y', -margin.left + 12)
            .attr('x', -margin.top - height / 2)
            .attr('fill', '#e11d73')
            .text(tokens()[1]);

        // title label:
        componentContainer
            .append('text')
            .attr('text-anchor', 'end')
            .attr('class', 'xLabel')
            .attr('x', width / 2 + 25)
            .attr('y', margin.top / 2 - 11)
            .attr('fill', 'currentColor')
            .text('x * y = k');

        // Container for the exchange rate circle and lines to the x and y axis
        const rate = componentContainer.append('g');
        rate.append('path')
            .attr('id', 'xLine')
            .attr('stroke', 'currentColor')
            .style('stroke-dasharray', '3 3');
        rate.append('path')
            .attr('id', 'yLine')
            .attr('stroke', 'currentColor')
            .style('stroke-dasharray', '3 3');
        rate.append('path')
            .attr('id', 'xyCurve')
            .attr('stroke', 'currentColor')
            .attr('fill', 'none');
        rate.append('circle')
            .attr('id', 'xyPoint')
            .attr('r', dotRadius)
            .attr('fill', '#69b3a2');
    };

    const update = () => {
        const bal = currentBalance();
        const x = xScale(bal[0]);
        const y = yScale(bal[1]);
        // rate = x / y
        // eg rate = USDC / WETH
        // which is the WETH/USDC exchange rate
        // invariant = x * y
        const invariant = BigNumber(bal[0]).times(bal[1]);

        componentContainer
            .select('#xyPoint')
            .attr('cx', x)
            .attr('cy', y)
            .transition()
            .duration(flowDuration());

        const xline = d3.line()([
            [0, y],
            [x, y],
        ]);
        componentContainer
            .select('#xLine')
            .attr('d', xline)
            .transition()
            .duration(flowDuration());

        const yLine = d3.line()([
            [x, height],
            [x, y],
        ]);
        componentContainer
            .select('#yLine')
            .attr('d', yLine)
            .transition()
            .duration(flowDuration());

        // Calc top left point
        // min x = k / max y
        let maxY = yDomain[1];
        let minX = invariant.div(maxY).toNumber();
        if (minX < xDomain[0]) {
            minX = xDomain[0];
            // max y = invariant / min x
            maxY = invariant.div(minX).toNumber();
        }

        // Calc bottom right point
        // min y = invariant / max x
        let maxX = xDomain[1];
        let minY = invariant.div(maxX).toNumber();
        if (minY < yDomain[0]) {
            minY = yDomain[0];
            // max x = invariant \ min y
            maxX = invariant.div(minY).toNumber();
        }

        // Draw the xy curve the rate moves along
        const xyCurve = d3.line().curve(d3.curveCatmullRom.alpha(1))([
            [xScale(minX), yScale(maxY)],
            [x, y],
            [xScale(maxX), yScale(minY)],
        ]);
        componentContainer
            .select('#xyCurve')
            .attr('d', xyCurve)
            .transition()
            .duration(flowDuration());
    };

    render();
    update();

    return { render, update };
};
