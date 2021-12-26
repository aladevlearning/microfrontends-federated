import {
  aws_codebuild as codebuild,
  aws_codepipeline as codepipeline,
  aws_codepipeline_actions as codepipeline_actions,
  aws_iam as iam,
  aws_lambda as lambda,
  aws_s3 as s3,
  StackProps,
} from "aws-cdk-lib";
import { Construct } from "constructs";
import { mfes, stackPrefix } from "../utils";

export interface CiCdProps extends StackProps {
  bucketArn: string;
  distributionId: string;
}

export class MicrofrontendsCiCdConstruct extends Construct {
  public readonly pipelineArns: string[] = [];

  constructor(scope: Construct, id: string, props: CiCdProps) {
    super(scope, id);

    const { distributionId, bucketArn, env } = props;

    const sourceOutput = new codepipeline.Artifact();

    const sourceAction =
      new codepipeline_actions.CodeStarConnectionsSourceAction({
        actionName: "GitHub_Source",
        owner: "aladevlearning",
        repo: "microfrontends-federated",
        output: sourceOutput,
        connectionArn: `arn:aws:codestar-connections:${env?.region}:${env?.account}:connection/1b5d4d38-f62d-4cb3-bedc-950886888de1`,
        //connectionArn: `arn:aws:codestar-connections:${env?.region}:${env?.account}:connection/b8e608e3-97f6-45eb-888a-30c09980e095`,
        triggerOnPush: false,
        branch: "main",
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

    const bucket = s3.Bucket.fromBucketArn(
      this,
      `${stackPrefix}-microfrontends-federated`,
      bucketArn
    );

    mfes.forEach((mfe) => {
      const mfeCodePipeline = new codepipeline.Pipeline(
        this,
        `${stackPrefix}-${mfe}-code-pipeline`,
        {
          pipelineName: `${mfe}`,
          crossAccountKeys: false,
        }
      );

      const project = new codebuild.PipelineProject(
        this,
        `${stackPrefix}-${mfe}-pipeline-project`,
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
        bucket,
        input: buildOutput,
        extract: true,
        objectKey: `${mfe}`,
      });

      // Create the build project that will invalidate the cache
      const invalidateBuildProject = new codebuild.PipelineProject(
        this,
        `${stackPrefix}-${mfe}-invalidate-project`,
        {
          buildSpec: codebuild.BuildSpec.fromObject({
            version: "0.2",
            phases: {
              build: {
                commands: [
                  'aws cloudfront create-invalidation --distribution-id ${CLOUDFRONT_ID} --paths "/' +
                    mfe +
                    '/*"',
                ],
              },
            },
          }),
          environmentVariables: {
            CLOUDFRONT_ID: { value: distributionId },
          },
        }
      );

      // Add Cloudfront invalidation permissions to the project
      const distributionArn = `arn:aws:cloudfront::${env?.account}:distribution/${distributionId}`;
      invalidateBuildProject.addToRolePolicy(
        new iam.PolicyStatement({
          resources: [distributionArn],
          actions: ["cloudfront:CreateInvalidation"],
        })
      );

      const cdnInvalidationAction = new codepipeline_actions.CodeBuildAction({
        actionName: "InvalidateCache",
        project: invalidateBuildProject,
        input: buildOutput,
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

      mfeCodePipeline.addStage({
        stageName: "InvalidateCache",
        actions: [cdnInvalidationAction],
      });

      this.pipelineArns.push(mfeCodePipeline.pipelineArn);
    });
  }
}
