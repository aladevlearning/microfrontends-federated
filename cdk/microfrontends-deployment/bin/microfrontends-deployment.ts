#!/usr/bin/env node
import { App } from "aws-cdk-lib";
import { MicrofrontendsDeploymentStack } from "../lib/microfrontends-deployment-stack";
import { MicrofrontendsCiCdStack } from "../lib/microfrontends-cicd-stack";

const app = new App();
new MicrofrontendsDeploymentStack(app, "MicrofrontendsDeploymentStack", {
  env: { account: "555485882223", region: "eu-west-1" },
});

new MicrofrontendsCiCdStack(app, "MicrofrontendsCiCdStack", {
  env: { account: "555485882223", region: "eu-west-1" },
});
