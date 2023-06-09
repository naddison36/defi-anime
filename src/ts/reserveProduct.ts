import BigNumber from 'bignumber.js';
import * as d3 from 'd3';
import { Balance, Component } from './typings';

// set the dimensions and margins of the graph
const margin = { top: 20, right: 5, bottom: 80, left: 70 },
    width = 400 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom,
    dotRadius = 5,
    componentId = 'reserve_product';
let zoomFactor = 0.2;

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
            zoomFactor = zoomLevel / 10;
            console.log(`zoomFactor ${zoomFactor}`);
            render();
            update(false);
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
        const xBuffer = BigNumber(token0Domain[1])
            .minus(token0Domain[0])
            .times(zoomFactor);
        xDomain = [
            BigNumber(token0Domain[0]).minus(xBuffer).toNumber(),
            BigNumber(token0Domain[1]).plus(xBuffer).toNumber(),
        ];
        xDomain[0] = xDomain[0] < 0 ? 0 : xDomain[0];
        xScale = d3.scaleLinear().domain(xDomain).range([0, width]);
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
        const yBuffer = BigNumber(token1Domain[1])
            .minus(token1Domain[0])
            .times(zoomFactor);
        yDomain = [
            BigNumber(token1Domain[0]).minus(yBuffer).toNumber(),
            BigNumber(token1Domain[1]).plus(yBuffer).toNumber(),
        ];
        yDomain[0] = yDomain[0] < 0 ? 0 : yDomain[0];
        yScale = d3.scaleLinear().domain(yDomain).range([height, 0]);
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

    const update = (doTransition: boolean = true) => {
        const duration = doTransition ? flowDuration() : 0;
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
            .transition()
            .duration(duration)
            .attr('cx', x)
            .attr('cy', y);

        const xline = d3.line()([
            [0, y],
            [x, y],
        ]);
        componentContainer
            .select('#xLine')
            .transition()
            .duration(duration)
            .attr('d', xline);

        const yLine = d3.line()([
            [x, height],
            [x, y],
        ]);
        componentContainer
            .select('#yLine')
            .transition()
            .duration(duration)
            .attr('d', yLine);

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
        // TODO change to proper x * y = k curve
        const xyLine = d3
            .line()
            .x((d) => xScale(d[0]))
            .y((d) => yScale(d[1]));
        const leftPointStep = BigNumber(bal[0]).minus(minX).div(100).toNumber();
        const rightPointStep = BigNumber(maxX)
            .minus(bal[0])
            .div(100)
            .toNumber();
        const xPoints = [
            ...d3.range(minX, bal[0], leftPointStep),
            ...d3.range(bal[0], maxX, rightPointStep),
        ];
        const xyPoints = xPoints.map(
            (xPoint) =>
                [
                    xPoint,
                    BigNumber(bal[0]).times(bal[1]).div(xPoint).toNumber(),
                ] as [number, number],
        );
        const xyCurve = xyLine(xyPoints);
        componentContainer
            .select('#xyCurve')
            .transition()
            .duration(duration)
            .attr('d', xyCurve);
    };

    render();
    update();

    return { render, update };
};
