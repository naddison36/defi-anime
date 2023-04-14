import '../style.css';
import { render } from './reserveProduct';
import { getReserves } from './uniswap';

(async () => {
    const reserves = await getReserves(
        '0xb4e16d0168e52d35cacd2c6185b44281ec28c9dc',
        12376937,
    );
    await render(
        ['USDC', 'WETH'],
        [reserves, [reserves[0] * 1.05, reserves[1] * 1.05]],
        () => reserves,
    );
})();
