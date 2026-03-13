import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import idID from 'antd/locale/id_ID';
import App from './App';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ConfigProvider locale={idID} theme={{
      token: {
        colorPrimary: '#25D366',
        colorSuccess: '#25D366',
        borderRadius: 8,
        fontFamily: "'Plus Jakarta Sans', sans-serif"
      }
    }}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ConfigProvider>
  </React.StrictMode>
);
