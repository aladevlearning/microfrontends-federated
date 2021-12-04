import {
  aws_apigateway as apigateway,
  aws_codebuild as codebuild,
  aws_codepipeline as codepipeline,
  aws_codepipeline_actions as codepipeline_actions,
  aws_iam as iam,
  aws_lambda as lambda,
  aws_secretsmanager as secretsmanager,
  Stack,
  StackProps,
} from "aws-cdk-lib";
import { Construct } from "constructs";

export class MicrofrontendsCiCdStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const name = "cdk-v2";

    const secret = secretsmanager.Secret.fromSecretNameV2(
      this,
      `${name}-secret-webhook`,
      "github/secrets"
    );

    const secretManagerPolicy = new iam.PolicyStatement({
      actions: ["secretsmanager:GetSecretValue"],
      resources: [secret.secretArn],
    });

    const mfeCodePipeline = new codepipeline.Pipeline(
      this,
      `${name}-code-pipeline`,
      {
        pipelineName: "mfe-app1-dev",
        crossAccountKeys: false,
      }
    );

    const sourceOutput = new codepipeline.Artifact();
    const sourceAction = new codepipeline_actions.GitHubSourceAction({
      actionName: "GitHub_Source",
      owner: "aladevlearning",
      repo: "microfrontends-federated",
      oauthToken: secret.secretValueFromJson("GITHUB_ACCESS_TOKEN"),
      output: sourceOutput,
      branch: "main",
    });

    const project = new codebuild.PipelineProject(
      this,
      `${name}-pipeline-project`,
      {
        buildSpec: codebuild.BuildSpec.fromSourceFilename(
          "mfe-app1/buildspec.yml"
        ),
      }
    );

    const buildAction = new codepipeline_actions.CodeBuildAction({
      actionName: "CodeBuild",
      project,
      input: sourceOutput,
      outputs: [new codepipeline.Artifact()], // optional
    });

    mfeCodePipeline.addStage({
      stageName: "Source",
      actions: [sourceAction],
    });

    mfeCodePipeline.addStage({
      stageName: "Build",
      actions: [buildAction],
    });

    const codePipelinePolicy = new iam.PolicyStatement({
      actions: ["codepipeline:StartPipelineExecution"],
      resources: [mfeCodePipeline.pipelineArn],
    });

    const cicdLambda = new lambda.Function(this, `${name}-mfe-cicd-lambda`, {
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: "cicdLambda.handler",
      code: lambda.Code.fromAsset("resources/cicd-lambda"),
      memorySize: 1024,
      description: `Generated on: ${new Date().toISOString()}`,
    });

    cicdLambda.role?.attachInlinePolicy(
      new iam.Policy(this, `${name}-get-secret-policy`, {
        statements: [secretManagerPolicy],
      })
    );

    cicdLambda.role?.attachInlinePolicy(
      new iam.Policy(this, `${name}-start-code-pipeline-policy`, {
        statements: [codePipelinePolicy],
      })
    );

    const webHookApiGateway = new apigateway.LambdaRestApi(
      this,
      `${name}-cicd-api-gateway`,
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
