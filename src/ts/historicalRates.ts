import BigNumber from 'bignumber.js';
import * as d3 from 'd3';
import { Time } from './typings';

const margin = { top: 10, right: 50, bottom: 70, left: 40 },
    width = 400 - margin.left - margin.right,
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
    exchangeRates: BigNumber[],
    currentTime: () => Time,
    currentExchangeRate: () => BigNumber,
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

    const ratesDomain = d3.extent(exchangeRates.map((rate) => rate.toNumber()));
    const yScale = d3
        .scaleLinear()
        .domain(ratesDomain)
        .range([height, 0])
        .nice();
    svg.append('g')
        .attr('transform', `translate(${width}, 0)`)
        .call(d3.axisRight(yScale));

    const pricesLine = svg
        .append('path')
        .style('fill', 'none')
        .attr('id', 'historicalPrices')
        .attr('stroke', '#69b3a2')
        .attr('stroke-width', '1.5');

    let historicalRates: [number, number][] = [];
    let lastTime;

    const updateHistoricalRates = () => {
        const time = currentTime();
        const exchangeRate = currentExchangeRate();

        if (
            lastTime &&
            (time.block < lastTime.block ||
                (time.block === lastTime.block &&
                    time.logIndex < lastTime.logIndex))
        ) {
            historicalRates = [];
            lastTime = undefined;
            pricesLine.select('d').remove();
        } else {
            lastTime = time;
            historicalRates.push([time.block, exchangeRate.toNumber()]);

            // generates close price line chart when called
            const line = d3
                .line()
                .x((d) => blockScale(d[0]))
                .y((d) => yScale(d[1]));
            // Append the path and bind data
            pricesLine.data([historicalRates]).attr('d', line);
        }
    };

    updateHistoricalRates();

    return updateHistoricalRates;
};
