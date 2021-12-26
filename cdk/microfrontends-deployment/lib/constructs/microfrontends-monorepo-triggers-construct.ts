import {
  aws_apigateway as apigateway,
  aws_iam as iam,
  aws_lambda as lambda,
  StackProps,
} from "aws-cdk-lib";
import { Effect } from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";
import { stackPrefix } from "../utils";

export interface MonoRepoTriggersProps extends StackProps {
  pipelineArns: string[];
}

export class MicrofrontendsMonoRepoTriggersConstruct extends Construct {
  constructor(scope: Construct, id: string, props: MonoRepoTriggersProps) {
    super(scope, id);

    const { env } = props;

    const secretManagerPolicy = new iam.PolicyStatement({
      effect: Effect.ALLOW,
      actions: ["secretsmanager:GetSecretValue"],
      resources: [
        `arn:aws:secretsmanager:${env?.region}:${env?.account}:secret:*`,
      ],
    });

    const cicdLambda = new lambda.Function(
      this,
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
      new iam.Policy(this, `${stackPrefix}-get-secret-policy`, {
        statements: [secretManagerPolicy],
      })
    );

    props.pipelineArns.forEach((pipelineArn, index) => {
      const codePipelinePolicy = new iam.PolicyStatement({
        actions: ["codepipeline:StartPipelineExecution"],
        resources: [pipelineArn],
      });
      cicdLambda.role?.attachInlinePolicy(
        new iam.Policy(
          this,
          `${stackPrefix}-${index}-start-code-pipeline-policy`,
          {
            statements: [codePipelinePolicy],
          }
        )
      );
    });

    const webHookApiGateway = new apigateway.LambdaRestApi(
      this,
      `${stackPrefix}-cicd-api-gateway`,
      {
        handler: cicdLambda,
        proxy: false,
      }
    );

    webHookApiGateway.root.addMethod(
      "POST",
      new apigateway.LambdaIntegration(cicdLambda)
    );
  }
}
