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
import { Balance, Component, Flow, Time } from './typings';
import { getFlows, getReserves } from './uniswap';

// Time in milliseconds between each flow
export let flowDuration = 500;

// TODO hard code for now. Ideally these would come from UI
let poolAddress = '0x8ad599c3a0ff1de082011efddc58f1908eb6e6d8';
let tokens = ['USDC', 'WETH'];
let startTime = 1660150000;
let endTime = 1660170000;

let flows: Flow[];
let poolBalances: Balance[];
let times: Time[];
let shortAddresses: string[];

let flowIndex = 0;
const incrementFlow = () => {
    if (flowIndex < flows.length - 1) {
        flowIndex++;
    } else {
        flowIndex = 0;
    }
    console.log(`flowIndex: ${flowIndex}`);
};
const decrementFlow = () => {
    if (flowIndex > 0) {
        flowIndex--;
    } else {
        flowIndex = flows.length - 1;
    }
};

let reserveProduct: Component,
    historicalRates: Component,
    updatePoolFlow: Component;

const updateAll = () => {
    reserveProduct.update();
    historicalRates.update();
    updatePoolFlow.update();
};

const renderAll = () => {
    reserveProduct.render();
    historicalRates.render();
    updatePoolFlow.render();
};

const fetchData = async () => {
    flows = await getFlows(poolAddress, startTime, endTime);
    const { accounts } = parseAccountsFlows(flows);
    shortAddresses = shortenAddresses(accounts);

    const startBlock = flows[0].block;
    const balancesStart = await getReserves(poolAddress, startBlock);
    poolBalances = parsePoolBalances(flows, balancesStart);
    times = parseTimes(flows);
};

(async () => {
    await fetchData();

    reserveProduct = renderReserveProduct(
        () => flowDuration,
        () => tokens,
        () => poolBalances,
        () => poolBalances[flowIndex],
    );

    historicalRates = renderHistoricalRates(
        () => flowDuration,
        () => times,
        () => poolBalances,
        () => flows[flowIndex],
        () => poolBalances[flowIndex],
    );

    updatePoolFlow = renderPoolFlows(
        () => shortAddresses,
        () => flows,
        () => flows[flowIndex],
    );

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
        .addEventListener('change', async (event: Event) => {
            const selectedOption = (event.target as HTMLSelectElement).value;
            console.log('Selected option: ', selectedOption);
            if (selectedOption === 'example1') {
                poolAddress = '0x8ad599c3a0ff1de082011efddc58f1908eb6e6d8';
                tokens = ['USDC', 'WETH'];
                startTime = 1660150000;
                endTime = 1660170000;
            }
            if (selectedOption === 'example2') {
                poolAddress = '0x8ad599c3a0ff1de082011efddc58f1908eb6e6d8';
                tokens = ['USDC', 'WETH'];
                startTime = 1681507271;
                endTime = 1681507300;
            }

            await fetchData();
            renderAll();
            updateAll();
        });
})();
