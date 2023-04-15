import * as d3 from 'd3';
import { parseExchangeRate, parseInvariant } from './parsers';
import { Balance, Flow, Time } from './typings';

const margin = { top: 10, right: 50, bottom: 70, left: 120 },
    width = 500 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;

/**
 *
 * @param tokens the token symbols of the reserve tokens. eg ['USDC', 'WETH']
 * @param currentExchangeRate a function that returns the current exchange rate
 * @returns a function that renders the exchange rate using the current exchange rate
 */
export const renderHistoricalRates = (
    // tokens: string[],
    times: Time[],
    poolBalances: Balance[],
    currentFlow: () => Flow,
    currentBalance: () => Balance,
): (() => void) => {
    // add SVG to the page
    const svg = d3
        .select('#historicalRates')
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        // .call(responsivefy)
        .append('g')
        .attr('transform', `translate(${margin.left},  ${margin.top})`);

    const blockScale = d3
        .scaleLinear()
        .domain(d3.extent(times, (d) => d.block))
        .range([0, width])
        .nice();
    svg.append('g')
        .attr('transform', 'translate(0,' + height + ')')
        .call(d3.axisBottom(blockScale))
        .selectAll('text')
        .attr('transform', 'translate(-10,0)rotate(-45)')
        .style('text-anchor', 'end');

    // Historical exchange rate (price)
    const ratesDomain = d3.extent(
        poolBalances.map((bals) => parseExchangeRate(bals).toNumber()),
    );
    const priceScale = d3
        .scaleLinear()
        .domain(ratesDomain)
        .range([height, 0])
        .nice();
    svg.append('g')
        .attr('transform', `translate(${width}, 0)`)
        .call(d3.axisRight(priceScale));
    const pricesLineContainer = svg
        .append('path')
        .style('fill', 'none')
        .attr('id', 'historicalPrices')
        .attr('stroke', '#69b3a2')
        .attr('stroke-width', '1.5');

    // Historical exchange rate (price)
    const invariantDomain = d3.extent(
        poolBalances.map((bals) => parseInvariant(bals).toNumber()),
    );
    const invariantScale = d3
        .scaleLinear()
        .domain(invariantDomain)
        .range([height, 0])
        .nice();
    svg.append('g')
        .attr('transform', `translate(${0}, 0)`)
        .call(d3.axisLeft(invariantScale));
    const invariantLineContainer = svg
        .append('path')
        .style('fill', 'none')
        .attr('id', 'historicalInvariants')
        .attr('stroke', 'orange')
        .attr('stroke-width', '1.5');

    let historicalRates: [number, number][] = [];
    let historicalInvariants: [number, number][] = [];
    let lastTime;

    const updateHistoricalRates = () => {
        const flow = currentFlow();
        const balance = currentBalance();
        const exchangeRate = parseExchangeRate(balance);
        const invariant = parseInvariant(balance);

        if (
            lastTime &&
            (flow.block < lastTime.block ||
                (flow.block === lastTime.block &&
                    flow.logIndex < lastTime.logIndex))
        ) {
            historicalRates = [];
            historicalInvariants = [];
            lastTime = undefined;
            pricesLineContainer.select('d').remove();
        } else {
            lastTime = flow;
            historicalRates.push([flow.block, exchangeRate.toNumber()]);
            historicalInvariants.push([flow.block, invariant.toNumber()]);

            // generates price line
            const priceLine = d3
                .line()
                .curve(d3.curveStep)
                .x((d) => blockScale(d[0]))
                .y((d) => priceScale(d[1]));
            pricesLineContainer.data([historicalRates]).attr('d', priceLine);

            // generates invariant line
            const invariantLine = d3
                .line()
                .curve(d3.curveStep)
                .x((d) => blockScale(d[0]))
                .y((d) => invariantScale(d[1]));
            invariantLineContainer
                .data([historicalInvariants])
                .attr('d', invariantLine);
        }
    };

    updateHistoricalRates();

    return updateHistoricalRates;
};
