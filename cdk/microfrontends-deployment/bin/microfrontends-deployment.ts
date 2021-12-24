#!/usr/bin/env node
import { App } from "aws-cdk-lib";
import { MicrofrontendsStack } from "../lib/microfrontends-stack";

const app = new App();

new MicrofrontendsStack(app, "MicrofrontendsStack", {
  env: { account: "555485882223", region: "us-east-1" },
});
