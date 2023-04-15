import * as d3 from 'd3';
import { flowDuration } from './main';
import { parseMaxFlows, shortenAddress } from './parsers';
import { Component, Flow } from './typings';

// set the dimensions and margins of the graph
const margin = 80,
    width = 440 - 2 * margin,
    height = 440 - 2 * margin,
    maxRadius = 30,
    componentId = 'pool_flows';

export const renderPoolFlows = (
    accounts: () => string[],
    flows: () => Flow[],
    currentFlow: () => Flow,
): Component => {
    let componentContainer;
    let token0SqrtScale;
    let token1SqrtScale;
    let xScale;

    // append the svg object
    d3.select('#' + componentId)
        .append('svg')
        .attr('id', componentId + '_svg')
        .attr('width', width + 2 * margin)
        .attr('height', height + 2 * margin);

    const render = () => {
        const containerId = componentId + '_container';
        d3.select('#' + containerId).remove();

        componentContainer = d3
            .select(`#${componentId}_svg`)
            .append('g')
            .attr('id', containerId)
            .attr(
                'transform',
                `translate(${width / 2 + margin}, ${height / 2 + margin})`,
            );

        const maxFlows = parseMaxFlows(flows());

        token0SqrtScale = d3
            .scaleSqrt()
            .domain([0, maxFlows[0]])
            .range([2, maxRadius]);

        token1SqrtScale = d3
            .scaleSqrt()
            .domain([0, maxFlows[1]])
            .range([2, maxRadius]);

        componentContainer
            .append('circle')
            .attr('r', width - 2 * margin)
            .attr('fill', 'none')
            .style('stroke', 'currentColor') // set the color of the stroke
            .style('stroke-width', '1px'); // set the width of the stroke

        // X scale: common for 2 data series
        xScale = d3
            .scaleBand()
            .range([0, 2 * Math.PI]) // X axis goes from 0 to 2pi = all around the circle. If I stop at 1Pi, it will be around a half circle
            .align(0) // This does nothing
            .domain(accounts()); // The domain of the X axis is the list of accounts.

        // Add the labels again so they are on top
        componentContainer
            .append('g')
            .attr('id', 'flowAccountText')
            .selectAll('g')
            .data(accounts())
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
                    (((xScale(d) + xScale.bandwidth() / 2) * 180) / Math.PI -
                        90) +
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
    };

    const update = () => {
        const flow = currentFlow();
        console.log(`${flow.type} block ${flow.block}`);

        if (flow.sender) {
            const inAddress = shortenAddress(flow.sender);
            // Inbound flows
            const inFlows = componentContainer
                .append('g')
                // Start at the outer edge of the circle
                .attr(
                    'transform',
                    () =>
                        'rotate(' +
                        (((xScale(inAddress) + xScale.bandwidth() / 2) * 180) /
                            Math.PI -
                            90) +
                        `)translate(${width / 2 - 20},0)`,
                );
            // Transition to the center of the circle
            if (flow.type === 'Mint') {
                inFlows
                    .transition()
                    .duration(flowDuration)
                    .attr('transform', 'translate(0,0)')
                    .remove();
            } else {
                // must be a Swap so do it in half the time so the outflow can follow
                inFlows
                    .transition()
                    .duration(flowDuration / 2)
                    .attr('transform', 'translate(0,0)')
                    .transition()
                    .duration(flowDuration / 2)
                    .remove();
            }
            if (flow.in[0]) {
                inFlows
                    .append('circle')
                    .attr('r', token0SqrtScale(flow.in[0]))
                    .attr('fill', '#e11d73');
            }
            if (flow.in[1]) {
                inFlows
                    .append('circle')
                    .attr('r', token1SqrtScale(flow.in[1]))
                    .attr('fill', '#2670C4');
            }
        }
        if (flow.recipient) {
            const outAddress = shortenAddress(flow.recipient);

            // Outbound flows
            const outFlows = componentContainer.append('g');
            const transformFn = () =>
                'rotate(' +
                (((xScale(outAddress) + xScale.bandwidth() / 2) * 180) /
                    Math.PI -
                    90) +
                `)translate(${width / 2 - 20},0)`;
            if (flow.type === 'Burn') {
                outFlows
                    .transition()
                    .duration(flowDuration)
                    .attr('transform', transformFn)
                    .remove();
            } else {
                // Must be a swap so delay the transition by half the duration
                // before doing the transaction from the centre to the outside circle in half the duration
                outFlows
                    .transition()
                    .delay(flowDuration / 2)
                    .duration(flowDuration / 2)
                    .attr('transform', transformFn)
                    .remove();
            }
            if (flow.out[0]) {
                outFlows
                    .append('circle')
                    .attr('r', token0SqrtScale(flow.out[0]))
                    .attr('fill', '#e11d73');
            }
            if (flow.out[1]) {
                outFlows
                    .append('circle')
                    .attr('r', token1SqrtScale(flow.out[1]))
                    .attr('fill', '#2670C4');
            }
        }
    };

    render();

    return { update, render };
};
