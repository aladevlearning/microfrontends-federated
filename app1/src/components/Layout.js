import React, { useState } from 'react';
import Aside from './Aside';
import Main from './Main';

function Layout({ setApp2, setApp3 }) {

    const [rtl, setRtl] = useState(false);
    const [image, setImage] = useState(true);
    const [toggled, setToggled] = useState(false);

    const [system, setSystem] = React.useState(undefined);
    const remoteEntry2 = PRODUCTION ? "https://d2k71yp5oqw0km.cloudfront.net/app2/remoteEntry.js" : "http://localhost:3002/remoteEntry.js";
    const remoteEntry3 = PRODUCTION ? "https://d2k71yp5oqw0km.cloudfront.net/app3/remoteEntry.js" : "http://localhost:3003/remoteEntry.js";
    function setApp2() {
        setSystem({
            url: remoteEntry2,
            scope: "app2",
            module: "./App",
        });
    }

    function setApp3() {
        setSystem({
            url: remoteEntry3,
            scope: "app3",
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