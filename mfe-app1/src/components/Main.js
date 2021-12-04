import React from 'react';
import System from '../System.js';

const Main = ({
    system
}) => {
    return (
        <main>
            <div style={{ marginTop: "2em" }}>
                <System system={system} />
            </div>
        </main>
    );
};

export default Main;