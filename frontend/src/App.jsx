import { useState } from 'react'
import './App.css'

import Navbar from './components/navbar'
import MyHabbits from './pages/MyHabbits'

function App() {


    return (
        <div >
            <Navbar />
            <MyHabbits />
        </div>
    )
}

export default App
