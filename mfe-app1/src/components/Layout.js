import React, { useState } from 'react';
import Aside from './Aside';
import Main from './Main';

function Layout({ setApp2, setApp3 }) {

    const [rtl, setRtl] = useState(false);
    const [image, setImage] = useState(true);
    const [toggled, setToggled] = useState(false);

    const [system, setSystem] = React.useState(undefined);
    const remoteEntry2 = PRODUCTION ? "https://d2sv9b9wa6i567.cloudfront.net/mfe-app2/remoteEntry.js" : "http://localhost:3002/remoteEntry.js";
    const remoteEntry3 = PRODUCTION ? "https://d2sv9b9wa6i567.cloudfront.net/mfe-app3/remoteEntry.js" : "http://localhost:3003/remoteEntry.js";
    function setApp2() {
        setSystem({
            url: remoteEntry2,
            scope: "mfeApp2",
            module: "./App",
        });
    }

    function setApp3() {
        setSystem({
            url: remoteEntry3,
            scope: "mfeApp3",
            module: "./App",
        });
    }

    return (
        <div className={`app ${rtl ? 'rtl' : ''} ${toggled ? 'toggled' : ''}`}>
            <Aside
                image={image}
                handleApp2={setApp2}
                handleApp3={setApp3}
            />
            <Main
                image={image}
                system={system}
            />
        </div>
    );
}

export default Layout;