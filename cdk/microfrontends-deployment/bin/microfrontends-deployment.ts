#!/usr/bin/env node
import { App } from "aws-cdk-lib";
import { MicrofrontendsCiCdStack } from "../lib/microfrontends-cicd-stack";
import { MicrofrontendsDeploymentStack } from "../lib/microfrontends-deployment-stack";

const app = new App();
const mfeDeploymentStack = new MicrofrontendsDeploymentStack(
  app,
  "MicrofrontendsDeploymentStack",
  {
    env: { account: "555485882223", region: "eu-west-1" },
  }
);

const mfeCiCdStack = new MicrofrontendsCiCdStack(
  app,
  "MicrofrontendsCiCdStack",
  {
    bucket: mfeDeploymentStack.microFrontendFederatedBucket,
    env: { account: "555485882223", region: "eu-west-1" },
  }
);

mfeCiCdStack.addDependency(mfeDeploymentStack);
