import '../style.css';
import { render } from './reserveProduct';
import { getReserves } from './uniswap';

(async () => {
    const reserves = await getReserves(
        '0x6b175474e89094c44da98b954eedeac495271d0f',
        1660153071,
    );
    await render(['USDC', 'WETH'], reserves);
})();
