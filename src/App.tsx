import React from 'react';
import './App.css';
import {useDisplay} from "./components/providers/display-provider";
import {calculateFieldValue, formatCAD, formatCADSmall, formatDuration2} from "./lib/utils";
import {LucideLoader2} from "lucide-react";
import {StaticDesignRenderer} from "./components/static-renderers";

function App() {
    const { config } = useDisplay();

    if (!config) {
        return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", color: "black" }}>
            <LucideLoader2 style={{
                animation: 'spin 1s linear infinite',
                width: 80,
                height: 80,
                color: 'black'
            }} />
        </div>;
    }

    return (
        <div style={{ background: 'black', height: "fit-content", width: "fit-content" }}>
            <StaticDesignRenderer
                config={config}
                textFormatter={(e) => e}
            />
        </div>
    );
}

export default App;

// import React from "react";
//
// const imageUrl =
//     'https://mop1d9vixutfhs5k.public.blob.vercel-storage.com/assets/ef9189e4-57c3-4eba-98c1-2682d3b87fcb/root/parkeo.png';
//
// function App() {
//     return (
//         <div
//             style={{
//                 width: '100vw',
//                 height: '100vh',
//                 backgroundImage: `url("${imageUrl}")`,
//                 backgroundRepeat: 'no-repeat',
//                 backgroundPosition: 'center',
//                 backgroundSize: 'cover',
//             }}
//         />
//     );
// }
//
// export default App;