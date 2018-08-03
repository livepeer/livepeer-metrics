import React from 'react'
import { Link } from 'react-router-dom'

const Home = props => (
  <div>
    <h1>Home</h1>
    <p>Welcome home!</p>
    <Link to="/uivideos">Go to videos metrics</Link>
  </div>
)

export default Home
