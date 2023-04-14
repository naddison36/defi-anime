import '../style.css';
import { parsePoolBalances } from './parsers';
import { render } from './reserveProduct';
import { Flow } from './typings';
import { getFlows, getReserves } from './uniswap';

// Time in milliseconds between each flow
export const flowDuration = 500;

// TODO hard code for now. Ideally these would come from UI
const poolAddress = '0x8ad599c3a0ff1de082011efddc58f1908eb6e6d8';
const tokens = ['USDC', 'WETH'];
const startTime = 1625037000;
const endTime = 1625038000;

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
    const startBlock = flows[0].block;
    const balancesStart = await getReserves(poolAddress, startBlock);
    const poolBalances = parsePoolBalances(flows, balancesStart);

    const refesh = await render(
        tokens,
        poolBalances,
        () => poolBalances[flowIndex],
    );

    const previous = () => {
        decrementFlow();
        refesh();
    };

    const next = () => {
        incrementFlow();
        refesh();
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
