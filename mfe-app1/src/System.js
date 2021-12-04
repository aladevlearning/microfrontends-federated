

import React, { useState, Suspense } from 'react';
import ClipLoader from "react-spinners/ClipLoader";

const useDynamicScript = (args) => {
    const [ready, setReady] = useState(false);
    const [failed, setFailed] = useState(false);

    React.useEffect(() => {
        if (!args.url) {
            return;
        }

        const element = document.createElement("script");

        element.src = args.url;
        element.type = "text/javascript";
        element.async = true;

        setReady(false);
        setFailed(false);

        element.onload = () => {
            console.log(`Dynamic Script Loaded: ${args.url}`);
            setReady(true);
        };

        element.onerror = () => {
            console.error(`Dynamic Script Error: ${args.url}`);
            setReady(false);
            setFailed(true);
        };

        document.head.appendChild(element);

        return () => {
            console.log(`Dynamic Script Removed: ${args.url}`);
            document.head.removeChild(element);
        };
    }, [args.url]);

    return {
        ready,
        failed,
    };
};

const System = (props) => {
    const { ready, failed } = useDynamicScript({
        url: props.system && props.system.url,
    });

    if (!props.system) {
        return <h2>Not micro-frontend loaded</h2>;
    }

    if (!ready) {
        return <ClipLoader color={"#353535"} loading={!ready} size={50} />
    }

    if (failed) {
        return <h2>Failed to load dynamic script: {props.system.url}</h2>;
    }

    const Component = React.lazy(
        loadComponent(props.system.scope, props.system.module)
    );

    return (
        <Suspense fallback={<ClipLoader color={"#353535"} loading={!ready} size={50} />}>
            <Component />
        </Suspense>
    );
}

function loadComponent(scope, module) {
    return async () => {
        // Initializes the share scope. This fills it with known provided modules from this build and all remotes
        await __webpack_init_sharing__("default");
        const container = window[scope]; // or get the container somewhere else
        // Initialize the container, it may provide shared modules
        await container.init(__webpack_share_scopes__.default);
        const factory = await window[scope].get(module);
        const Module = factory();
        return Module;
    };
}
export default System;