import {
  aws_apigateway as apigateway,
  aws_codebuild as codebuild,
  aws_codepipeline as codepipeline,
  aws_codepipeline_actions as codepipeline_actions,
  aws_iam as iam,
  aws_lambda as lambda,
  aws_s3 as s3,
  aws_secretsmanager as secretsmanager,
  RemovalPolicy,
  Stack,
  StackProps,
} from "aws-cdk-lib";
import { Effect } from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";

export interface CiCdStackProps extends StackProps {
  bucket: s3.IBucket;
}

export class MicrofrontendsCiCdStack extends Stack {
  constructor(scope: Construct, id: string, props?: CiCdStackProps) {
    super(scope, id, props);

    const name = "cdk-v2";

    const secret = secretsmanager.Secret.fromSecretNameV2(
      this,
      `${name}-secret-webhook`,
      "github/secrets"
    );

    const secretManagerPolicy = new iam.PolicyStatement({
      effect: Effect.ALLOW,
      actions: ["secretsmanager:GetSecretValue"],
      resources: [
        `arn:aws:secretsmanager:${props?.env?.region}:${props?.env?.account}:secret:*`,
      ],
    });

    const mfes = ["mfe-app1", "mfe-app2", "mfe-app3"];

    const sourceOutput = new codepipeline.Artifact();
    const sourceAction = new codepipeline_actions.GitHubSourceAction({
      actionName: "GitHub_Source",
      owner: "aladevlearning",
      repo: "microfrontends-federated",
      oauthToken: secret.secretValueFromJson("GITHUB_ACCESS_TOKEN"),
      output: sourceOutput,
      branch: "main",
    });

    const microFrontendFederatedBucket = props?.bucket;

    if (!microFrontendFederatedBucket) {
      throw new Error("microFrontendFederatedBucket cannot be null");
    }

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

    mfes.forEach((mfe) => {
      const mfeCodePipeline = new codepipeline.Pipeline(
        this,
        `${name}-${mfe}-code-pipeline`,
        {
          pipelineName: `${mfe}`,
          crossAccountKeys: false,
        }
      );

      const project = new codebuild.PipelineProject(
        this,
        `${name}-${mfe}-pipeline-project`,
        {
          buildSpec: codebuild.BuildSpec.fromSourceFilename(
            `${mfe}/buildspec.yml`
          ),
        }
      );

      const buildOutput = new codepipeline.Artifact();
      const buildAction = new codepipeline_actions.CodeBuildAction({
        actionName: "CodeBuild",
        project,
        input: sourceOutput,
        outputs: [buildOutput], // optional
        variablesNamespace: "build",
      });

      const deployAction = new codepipeline_actions.S3DeployAction({
        actionName: "S3Deploy",
        bucket: microFrontendFederatedBucket,
        input: buildOutput,
        extract: true,
        objectKey: `${mfe}`,
      });

      mfeCodePipeline.addStage({
        stageName: "Source",
        actions: [sourceAction],
      });

      mfeCodePipeline.addStage({
        stageName: "Build",
        actions: [buildAction],
      });

      mfeCodePipeline.addStage({
        stageName: "Deploy",
        actions: [deployAction],
      });

      const codePipelinePolicy = new iam.PolicyStatement({
        actions: ["codepipeline:StartPipelineExecution"],
        resources: [mfeCodePipeline.pipelineArn],
      });

      cicdLambda.role?.attachInlinePolicy(
        new iam.Policy(this, `${name}-${mfe}-start-code-pipeline-policy`, {
          statements: [codePipelinePolicy],
        })
      );
    });

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
