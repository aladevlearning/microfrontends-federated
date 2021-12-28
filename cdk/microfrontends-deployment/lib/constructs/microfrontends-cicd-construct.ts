import {
  aws_codebuild as codebuild,
  aws_codepipeline as codepipeline,
  aws_codepipeline_actions as codepipeline_actions,
  aws_iam as iam,
  aws_s3 as s3,
  Environment,
  StackProps,
} from "aws-cdk-lib";
import { IBucket } from "aws-cdk-lib/aws-s3/lib";
import { Construct } from "constructs";
import { mfes, stackPrefix } from "../constants";

export interface CiCdProps extends StackProps {
  bucketArn: string;
  distributionId: string;
  codeStarIdConnectionId: string;
}

export class MicrofrontendsCiCdConstruct extends Construct {
  public readonly pipelineArns: string[] = [];

  constructor(scope: Construct, id: string, props: CiCdProps) {
    super(scope, id);

    const { distributionId, bucketArn, env, codeStarIdConnectionId } = props;

    const sourceOutput = new codepipeline.Artifact();

    const sourceAction = buildSourceAction(
      sourceOutput,
      codeStarIdConnectionId,
      env
    );

    const microFrontendBucket = getBucketFromArn(this, bucketArn);

    mfes.forEach((mfe) => {
      const mfeCodePipeline = buildCodePipeline(this, mfe);

      const buildOutput = new codepipeline.Artifact();

      const buildAction = buildCodeBuildAction(
        this,
        sourceOutput,
        buildOutput,
        mfe
      );

      const deployAction = buildCodeDeployAction(
        buildOutput,
        microFrontendBucket,
        mfe
      );

      const cdnInvalidationAction = buildCodeBuildCacheInvalidationAction(
        this,
        buildOutput,
        mfe,
        distributionId,
        env?.account
      );

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

const getBucketFromArn = (construct: Construct, bucketArn: string): IBucket => {
  return s3.Bucket.fromBucketArn(
    construct,
    `${stackPrefix}-microfrontends-federated`,
    bucketArn
  );
};

const buildCodePipeline = (
  construct: Construct,
  mfe: string
): codepipeline.Pipeline => {
  return new codepipeline.Pipeline(
    construct,
    `${stackPrefix}-${mfe}-code-pipeline`,
    {
      pipelineName: `${mfe}`,
      crossAccountKeys: false,
    }
  );
};

const buildSourceAction = (
  artifact: codepipeline.Artifact,
  codeStarIdConnectionId: string,
  env?: Environment
): codepipeline_actions.CodeStarConnectionsSourceAction => {
  return new codepipeline_actions.CodeStarConnectionsSourceAction({
    actionName: "GitHub_Source",
    owner: "aladevlearning",
    repo: "microfrontends-federated",
    output: artifact,
    connectionArn: `arn:aws:codestar-connections:${env?.region}:${env?.account}:connection/${codeStarIdConnectionId}`,
    triggerOnPush: false,
    branch: "main",
  });
};

const buildCodeDeployAction = (
  inputArtifact: codepipeline.Artifact,
  bucket: IBucket,
  mfe: string
): codepipeline_actions.S3DeployAction => {
  return new codepipeline_actions.S3DeployAction({
    actionName: "S3Deploy",
    bucket,
    input: inputArtifact,
    extract: true,
    objectKey: `${mfe}`,
  });
};

const buildCodeBuildCacheInvalidationAction = (
  construct: Construct,
  inputArtifact: codepipeline.Artifact,
  mfe: string,
  distributionId: string,
  account?: string
): codepipeline_actions.CodeBuildAction => {
  // Create the build project that will invalidate the cache
  const invalidateBuildProject = buildInvalidationCacheProject(
    construct,
    mfe,
    distributionId,
    account
  );

  return new codepipeline_actions.CodeBuildAction({
    actionName: "InvalidateCache",
    project: invalidateBuildProject,
    input: inputArtifact,
  });
};

const buildCodeBuildAction = (
  construct: Construct,
  inputArtifact: codepipeline.Artifact,
  outputArtifact: codepipeline.Artifact,
  mfe: string
): codepipeline_actions.CodeBuildAction => {
  const project = new codebuild.PipelineProject(
    construct,
    `${stackPrefix}-${mfe}-pipeline-project`,
    {
      buildSpec: codebuild.BuildSpec.fromSourceFilename(`${mfe}/buildspec.yml`),
    }
  );

  return new codepipeline_actions.CodeBuildAction({
    actionName: "CodeBuild",
    project,
    input: inputArtifact,
    outputs: [outputArtifact],
    variablesNamespace: "build",
  });
};
const buildInvalidationCacheProject = (
  construct: Construct,
  mfe: string,
  distributionId: string,
  account?: string
): codebuild.PipelineProject => {
  // Create the build project that will invalidate the cache
  const invalidateBuildProject = new codebuild.PipelineProject(
    construct,
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
  const distributionArn = `arn:aws:cloudfront::${account}:distribution/${distributionId}`;
  invalidateBuildProject.addToRolePolicy(
    new iam.PolicyStatement({
      resources: [distributionArn],
      actions: ["cloudfront:CreateInvalidation"],
    })
  );

  return invalidateBuildProject;
};
