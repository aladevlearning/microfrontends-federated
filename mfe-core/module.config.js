const moduleFileName = "remoteEntry.js";

// Host module
const mfeShell = {
    fileName: moduleFileName,
    name: "mfeShell",
    port: 8080,
};

// Remote modules
const mfePayments = {
    fileName: moduleFileName,
    name: "mfePayments",
    path: "/payments/",
    port: 8081,
    get url() {
        return `http://localhost:${this.port}`;
    },
    urlGlobalVariable: "mfePaymentsUrl",
    get federationConfig() {
        // mfePayments@[window.mfeAccountsUrl]/remoteEntry.js
        return `${this.name}@${this.url}/${this.fileName}`;
    },
};


const mfeAccounts = {
    fileName: moduleFileName,
    name: "mfeAccounts",
    path: "/accounts/",
    port: 8082,
    get url() {
        return `http://localhost:${this.port}`;
    },
    urlGlobalVariable: "mfeAccountsUrl",
    get federationConfig() {
        // mfeAccounts@[window.mfeAccountsUrl]/remoteEntry.js
        return `${this.name}@${this.url}/${this.fileName}`;
    },
};


const remotes = {
    mfePayments: mfePayments.federationConfig,
    mfeAccounts: mfeAccounts.federationConfig,
};

module.exports = {
    mfeShell,
    mfeAccounts,
    mfePayments,
    remotes
};