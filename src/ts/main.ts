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
export let flowDuration = 500;

// TODO hard code for now. Ideally these would come from UI
let poolAddress = '0x8ad599c3a0ff1de082011efddc58f1908eb6e6d8';
let tokens = ['USDC', 'WETH'];
let startTime = 1660150000;
let endTime = 1660170000;

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

    document
        .querySelector<HTMLInputElement>('#duration')!
        .addEventListener('input', (event: Event) => {
            const speed = Number((event.target as HTMLInputElement).value);
            flowDuration = (-2950 / 99) * speed + 3025;
            console.log(`flowDuration ${flowDuration}`);
        });

    document
        .querySelector<HTMLSelectElement>('#exampleSelector')!
        .addEventListener('change', (event: Event) => {
            const selectedOption = (event.target as HTMLSelectElement).value;
            console.log('Selected option: ', selectedOption);
            if (selectedOption === 'example1') {
                poolAddress = '0x8ad599c3a0ff1de082011efddc58f1908eb6e6d8';
                tokens = ['USDC', 'WETH'];
                startTime = 1660152000;
                endTime = 1660154000;
            }
        });
})();
