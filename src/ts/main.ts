import '../style.css';
import { parsePoolBalances } from './parsers';
import { render } from './reserveProduct';
import { getFlows, getReserves } from './uniswap';

// TODO hard code for now. Ideally these would come from UI
const pairAddress = '0xb4e16d0168e52d35cacd2c6185b44281ec28c9dc';
const tokens = ['USDC', 'WETH'];
const startTime = 1660153071;
const endTime = startTime;

let flowIndex = 0;

(async () => {
    const flows = await getFlows(pairAddress, startTime, endTime);
    const balancesStart = await getReserves(
        '0xb4e16d0168e52d35cacd2c6185b44281ec28c9dc',
        12376937,
    );
    const poolBalances = parsePoolBalances(flows, balancesStart);
    await render(tokens, poolBalances, () => poolBalances[flowIndex]);
})();
