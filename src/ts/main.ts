import '../style.css';
import { renderHistoricalRates } from './historicalRates';
import {
    parseAccountsFlows,
    parsePoolBalances,
    parseTimes,
    shortenAddresses,
} from './parsers';
import { renderPoolFlows } from './poolFlows';
import { renderReserveProduct } from './reserveProduct';
import { Flow } from './typings';
import { getFlows, getReserves } from './uniswap';

// Time in milliseconds between each flow
export const flowDuration = 500;

// TODO hard code for now. Ideally these would come from UI
const poolAddress = '0x8ad599c3a0ff1de082011efddc58f1908eb6e6d8';
const tokens = ['USDC', 'WETH'];
const startTime = 1660152000;
const endTime = 1660156000;

let flows: Flow[];
let flowIndex = 0;
function incrementFlow() {
    if (flowIndex < flows.length - 1) {
        flowIndex++;
    } else {
        flowIndex = 0;
    }
}
function decrementFlow() {
    if (flowIndex > 0) {
        flowIndex--;
    } else {
        flowIndex = flows.length - 1;
    }
}

(async () => {
    flows = await getFlows(poolAddress, startTime, endTime);
    const { accountsFlows, accounts } = parseAccountsFlows(flows);
    const shortAddresses = shortenAddresses(accounts);

    const startBlock = flows[0].block;
    const balancesStart = await getReserves(poolAddress, startBlock);
    const poolBalances = parsePoolBalances(flows, balancesStart);
    const times = parseTimes(flows);

    const updateReserveProduct = await renderReserveProduct(
        tokens,
        poolBalances,
        () => poolBalances[flowIndex],
    );

    const updateHistoricalRates = renderHistoricalRates(
        times,
        poolBalances,
        () => flows[flowIndex],
        () => poolBalances[flowIndex],
    );

    const updatePoolFlow = await renderPoolFlows(
        shortAddresses,
        flows,
        () => flows[flowIndex],
    );

    const updateAll = () => {
        updateReserveProduct();
        updateHistoricalRates();
        updatePoolFlow();
    };

    const previous = () => {
        decrementFlow();
        updateAll();
    };

    const next = () => {
        incrementFlow();
        updateAll();
    };

    let interval: NodeJS.Timer;

    document
        .querySelector<HTMLButtonElement>('#btnPrevious')!
        .addEventListener('click', previous);
    document
        .querySelector<HTMLButtonElement>('#btnNext')!
        .addEventListener('click', next);
    document
        .querySelector<HTMLButtonElement>('#btnStart')!
        .addEventListener('click', () => {
            interval = setInterval(next, flowDuration);
        });
    document
        .querySelector<HTMLButtonElement>('#btnStop')!
        .addEventListener('click', () => {
            clearInterval(interval);
        });
})();
