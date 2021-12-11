import {
  aws_cloudfront as cloudfront,
  aws_cloudfront_origins as origins,
  aws_lambda as lambda,
  aws_s3 as s3,
  RemovalPolicy,
  Stack,
  StackProps,
} from "aws-cdk-lib";
import { Construct } from "constructs";

export class MicrofrontendsDeploymentStack extends Stack {
  public readonly microFrontendFederatedBucket: s3.IBucket;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const name = "cdk-v2";

    this.microFrontendFederatedBucket = new s3.Bucket(
      this,
      `${name}-mfe-federated`,
      {
        bucketName: `${name}-mfe-federated`,
        publicReadAccess: false,
        removalPolicy: RemovalPolicy.DESTROY,
        autoDeleteObjects: false,
        versioned: false,
        encryption: s3.BucketEncryption.S3_MANAGED,
        cors: [
          {
            maxAge: 3000,
            allowedHeaders: ["Authorization", "Content-Length"],
            allowedMethods: [s3.HttpMethods.GET],
            allowedOrigins: ["*"],
          },
        ],
      }
    );

    const cloudFrontOAI = new cloudfront.OriginAccessIdentity(
      this,
      `${name}-mfe-oai`
    );

    const lambdaAtEdge = new cloudfront.experimental.EdgeFunction(
      this,
      `${name}-mfe-lambda-edge`,
      {
        runtime: lambda.Runtime.NODEJS_14_X,
        handler: "mfe-lambda-edge.handler",
        code: lambda.Code.fromAsset("resources/cdn"),
        memorySize: 1024,
        description: `Generated on: ${new Date().toISOString()}`,
      }
    );

    new cloudfront.Distribution(this, `${name}-mfe-cf-distro`, {
      defaultBehavior: {
        origin: new origins.S3Origin(this.microFrontendFederatedBucket, {
          originAccessIdentity: cloudFrontOAI,
        }),
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        edgeLambdas: [
          {
            functionVersion: lambdaAtEdge.currentVersion,
            eventType: cloudfront.LambdaEdgeEventType.ORIGIN_REQUEST,
            includeBody: true,
          },
        ],
      },
    });
  }
}
