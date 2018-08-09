
import React from 'react'
import ReactDOM from 'react-dom'
import { BrowserRouter } from 'react-router-dom'
import 'material-components-web/dist/material-components-web.min.css'
import 'react-table/react-table.css'

import './index.css'
import App from './containers/app'
import registerServiceWorker from './registerServiceWorker'

ReactDOM.render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
  , document.getElementById('root'))
registerServiceWorker()
