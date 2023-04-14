import '../style.css';
import { parsePoolBalances } from './parsers';
import { render } from './reserveProduct';
import { getFlows, getReserves } from './uniswap';

// TODO hard code for now. Ideally these would come from UI
const poolAddress = '0x8ad599c3a0ff1de082011efddc58f1908eb6e6d8';
const tokens = ['USDC', 'WETH'];
const startTime = 1625037000;
const endTime = 1625038000;

let flowIndex = 0;

(async () => {
    const flows = await getFlows(poolAddress, startTime, endTime);
    const startBlock = flows[0].block;
    const balancesStart = await getReserves(poolAddress, startBlock);
    const poolBalances = parsePoolBalances(flows, balancesStart);

    const refesh = await render(
        tokens,
        poolBalances,
        () => poolBalances[flowIndex],
    );

    const previous = () => {
        flowIndex--;
        refesh();
    };

    const next = () => {
        flowIndex++;
        refesh();
    };

    document
        .querySelector<HTMLButtonElement>('#btnPrevious')!
        .addEventListener('click', previous);
    document
        .querySelector<HTMLButtonElement>('#btnNext')!
        .addEventListener('click', next);
})();
