import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

(window as unknown as {__LAMACCA_TOACCA_MOUNTED__?: boolean}).__LAMACCA_TOACCA_MOUNTED__ = true;

createRoot(document.getElementById('root')!).render(<App />);
