# Dynamic Micro-frontend Remote Load

This example shows how a host application loads remote micro-frontends.

- `mfe-app1` is a React host application.
- `mfe-app2` React standalone application which exposes `App` component.
- `mfe-app3` React standalone application which exposes `App` component that requires


# Running Demo

Run `yarn start`. This will build and serve both `app1`, `app2`, and `app3` on
ports `3001`, `3002`, and `3003` respectively.

- [localhost:3001](http://localhost:3001/) (HOST)
- [localhost:3002](http://localhost:3002/) (STANDALONE REMOTE)
- [localhost:3003](http://localhost:3003/) (STANDALONE REMOTE)
