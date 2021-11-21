import "./bootstrap.js";

export async function dynamicImport(path) {
    const remotes = {
        mfePayments: 'mfePayments@http://localhost:8081/remoteEntry.js',
        mfeAccounts: 'mfeAccounts@http://localhost:8082/remoteEntry.js',
    };
    const [remoteName, remoteUrl] = Object.entries(remotes).find(([r]) => path.startsWith(r));

    if (!remoteName) throw new Error(`URL not configured for remote '${path}'.`);
    if (remoteUrl.split('@').length !== 2) throw new Error(`URL misconfigured for remote '${path}'`);

    const [moduleName, moduleUrl] = remoteUrl.split('@');

    await __webpack_init_sharing__('default');

    await new Promise((resolve, reject) => {
        const element = document.createElement('script');

        element.src = moduleUrl;
        element.type = 'text/javascript';
        element.async = true;

        element.onload = () => {
            element.parentElement.removeChild(element);
            debugger;
            resolve();
        };

        element.onerror = (err) => {
            element.parentElement.removeChild(element);
            debugger;
            reject(err);
        };

        document.head.appendChild(element);
    });

    const container = window[moduleName];
    await container.init(__webpack_share_scopes__.default);

    const component = `.${path.replace(remoteName, '')}`;
    const factory = await container.get(component);

    return factory();
}

