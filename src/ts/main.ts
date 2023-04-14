import '../style.css';
import { render } from './reserveProduct';

(async () => {
    await render(['USDC', 'WETH']);
})();
