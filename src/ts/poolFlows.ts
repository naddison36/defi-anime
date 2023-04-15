import * as d3 from 'd3';
import { flowDuration } from './main';
import { parseMaxFlows, shortenAddress } from './parsers';
import { Flow } from './typings';

// set the dimensions and margins of the graph
const margin = { top: 100, right: 100, bottom: 100, left: 100 },
    width = 400 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom,
    maxRadius = 50;

export const renderPoolFlows = (
    accounts: string[],
    flows: Flow[],
    currentFlow: () => Flow,
): (() => void) => {
    const maxFlows = parseMaxFlows(flows);

    const token0SqrtScale = d3
        .scaleSqrt()
        .domain([0, maxFlows[0]])
        .range([0, maxRadius]);

    const token1SqrtScale = d3
        .scaleSqrt()
        .domain([0, maxFlows[1]])
        .range([0, maxRadius]);

    // append the svg object
    const svg = d3
        .select('#pool_flows')
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr(
            'transform',
            `translate(${width / 2 + margin.left}, ${height / 2 + margin.top})`,
        );

    svg.append('circle')
        .attr('r', width - margin.left - margin.right)
        .attr('fill', 'none')
        .style('stroke', 'currentColor') // set the color of the stroke
        .style('stroke-width', '1px'); // set the width of the stroke

    // X scale: common for 2 data series
    const xScale = d3
        .scaleBand()
        .range([0, 2 * Math.PI]) // X axis goes from 0 to 2pi = all around the circle. If I stop at 1Pi, it will be around a half circle
        .align(0) // This does nothing
        .domain(accounts); // The domain of the X axis is the list of accounts.

    // Add the labels again so they are on top
    svg.append('g')
        .attr('id', 'flowAccountText')
        .selectAll('g')
        .data(accounts)
        .join('g')
        .attr('text-anchor', (d) => {
            return (xScale(d) + xScale.bandwidth() / 2 + Math.PI) %
                (2 * Math.PI) <
                Math.PI
                ? 'end'
                : 'start';
        })
        .attr('transform', (d) => {
            return (
                'rotate(' +
                (((xScale(d) + xScale.bandwidth() / 2) * 180) / Math.PI - 90) +
                ')' +
                `translate(${2 + width / 2},0)`
            );
        })
        .append('text')
        .text((d) => d)
        .attr('transform', (d) => {
            return (xScale(d) + xScale.bandwidth() / 2 + Math.PI) %
                (2 * Math.PI) <
                Math.PI
                ? 'rotate(180)'
                : 'rotate(0)';
        })
        .attr('fill', 'currentColor')
        .style('font-size', '11px')
        .attr('alignment-baseline', 'middle');

    const updateFlows = () => {
        const flow = currentFlow();
        const shortAddress = shortenAddress(flow.sender);

        // Inbound flows
        const inFlows = svg.append('g').attr('transform', () => {
            return (
                'rotate(' +
                (((xScale(shortAddress) + xScale.bandwidth() / 2) * 180) /
                    Math.PI -
                    90) +
                ')' +
                `translate(${width / 2 - 20},0)`
            );
        });
        inFlows
            .transition()
            .duration(flowDuration)
            .attr('transform', 'translate(0,0)')
            .remove();
        inFlows
            .append('circle')
            .attr('r', token0SqrtScale(flow.in[0]))
            .attr('fill', 'blue');
        inFlows
            .append('circle')
            .attr('r', token1SqrtScale(flow.in[1]))
            .attr('fill', 'currentColor');

        // Outbound flows
        const outFlows = svg.append('g');
        outFlows
            .transition()
            .duration(flowDuration)
            .attr('transform', () => {
                return (
                    'rotate(' +
                    (((xScale(shortAddress) + xScale.bandwidth() / 2) * 180) /
                        Math.PI -
                        90) +
                    ')' +
                    `translate(${width / 2 - 20},0)`
                );
            })
            .remove();
        outFlows
            .append('circle')
            .attr('r', token0SqrtScale(flow.out[0]))
            .attr('fill', 'blue');
        outFlows
            .append('circle')
            .attr('r', token1SqrtScale(flow.out[1]))
            .attr('fill', 'currentColor');
    };

    updateFlows();

    return updateFlows;
};
