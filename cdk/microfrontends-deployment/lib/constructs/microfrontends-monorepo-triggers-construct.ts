import {
  aws_apigateway as apigateway,
  aws_iam as iam,
  aws_lambda as lambda,
  aws_secretsmanager as secretsmanager,
  Environment,
  StackProps,
} from "aws-cdk-lib";
import { Effect } from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";
import { stackPrefix } from "../constants";

export interface MonoRepoTriggersProps extends StackProps {
  pipelineArns: string[];
}

export class MicrofrontendsMonoRepoTriggersConstruct extends Construct {
  constructor(scope: Construct, id: string, props: MonoRepoTriggersProps) {
    super(scope, id);

    const { env, pipelineArns } = props;

    const { secretName } = buildSecret(this);

    const cicdLambda = buildLambdaFn(this, pipelineArns, secretName, env);

    buildApiGateway(this, cicdLambda);
  }
}

const buildSecret = (construct: Construct): secretsmanager.Secret => {
  return new secretsmanager.Secret(construct, `${stackPrefix}-mfe-secret`, {
    secretName: `${stackPrefix}-mfe-secret-github`,
  });
};

const buildLambdaFn = (
  construct: Construct,
  pipelineArns: string[],
  secretName: string,
  env?: Environment
): lambda.Function => {
  const secretManagerPolicy = new iam.PolicyStatement({
    effect: Effect.ALLOW,
    actions: ["secretsmanager:GetSecretValue"],
    resources: [
      `arn:aws:secretsmanager:${env?.region}:${env?.account}:secret:${secretName}-*`,
    ],
  });

  const cicdLambda = new lambda.Function(
    construct,
    `${stackPrefix}-mfe-cicd-lambda`,
    {
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: "cicdLambda.handler",
      code: lambda.Code.fromAsset("resources/cicd-lambda"),
      memorySize: 1024,
      description: `Generated on: ${new Date().toISOString()}`,
    }
  );

  cicdLambda.role?.attachInlinePolicy(
    new iam.Policy(construct, `${stackPrefix}-get-secret-policy`, {
      statements: [secretManagerPolicy],
    })
  );

  attachPipelineArnsToLambda(construct, pipelineArns, cicdLambda);

  return cicdLambda;
};

const buildApiGateway = (
  construct: Construct,
  lambda: lambda.IFunction
): apigateway.LambdaRestApi => {
  const webHookApiGateway = new apigateway.LambdaRestApi(
    construct,
    `${stackPrefix}-cicd-api-gateway`,
    {
      handler: lambda,
      proxy: false,
    }
  );

  webHookApiGateway.root.addMethod(
    "POST",
    new apigateway.LambdaIntegration(lambda)
  );

  return webHookApiGateway;
};

const attachPipelineArnsToLambda = (
  construct: Construct,
  pipelineArns: string[],
  lambda: lambda.IFunction
) => {
  pipelineArns.forEach((pipelineArn, index) => {
    const codePipelinePolicy = new iam.PolicyStatement({
      actions: ["codepipeline:StartPipelineExecution"],
      resources: [pipelineArn],
    });
    lambda.role?.attachInlinePolicy(
      new iam.Policy(
        construct,
        `${stackPrefix}-${index}-start-code-pipeline-policy`,
        {
          statements: [codePipelinePolicy],
        }
      )
    );
  });
};
