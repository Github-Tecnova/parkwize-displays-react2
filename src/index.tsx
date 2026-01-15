
import 'react-app-polyfill/ie11';
import 'react-app-polyfill/stable';
import 'text-encoding';
import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import {DisplayProvider} from "./components/providers/display-provider";

ReactDOM.render(<DisplayProvider><App /></DisplayProvider>, document.getElementById('root'));
