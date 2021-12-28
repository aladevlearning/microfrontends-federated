import {
  aws_cloudfront as cloudfront,
  aws_cloudfront_origins as origins,
  aws_lambda as lambda,
  aws_s3 as s3,
  PhysicalName,
  RemovalPolicy,
  StackProps,
} from "aws-cdk-lib";
import { IOriginAccessIdentity } from "aws-cdk-lib/aws-cloudfront/lib";
import { IBucket } from "aws-cdk-lib/aws-s3/lib";
import { CfnWebACL } from "aws-cdk-lib/aws-wafv2";
import { Construct } from "constructs";
import { mfes, stackPrefix } from "../constants";
import { lambdaEdgeFn, makeWafRules } from "../utils";

export interface FoundationalOptions extends StackProps {}

export class MicrofrontendsFoundationalConstruct extends Construct {
  public readonly bucketArn: string;
  public readonly distributionId: string;

  constructor(scope: Construct, id: string, props: FoundationalOptions) {
    super(scope, id);

    // Creates the single target S3 bucket where all MFEs will be hosted
    const microFrontendFederatedBucket = buildMicroFrontendBucket(this);

    // Creates the CF distribution including WAF and Edge components
    const distribution = buildCloudFrontDistribution(
      this,
      microFrontendFederatedBucket,
      props.env?.region
    );

    this.bucketArn = microFrontendFederatedBucket.bucketArn;
    this.distributionId = distribution.distributionId;
  }
}

const buildMicroFrontendBucket = (construct: Construct): IBucket => {
  return new s3.Bucket(construct, `${stackPrefix}-microfrontends-federated`, {
    bucketName: PhysicalName.GENERATE_IF_NEEDED,
    publicReadAccess: false,
    removalPolicy: RemovalPolicy.DESTROY,
    autoDeleteObjects: true,
    versioned: true,
    encryption: s3.BucketEncryption.S3_MANAGED,
    cors: [
      {
        maxAge: 3000,
        allowedHeaders: ["Authorization", "Content-Length"],
        allowedMethods: [s3.HttpMethods.GET],
        allowedOrigins: ["*"],
      },
    ],
  });
};

const buildOriginAccessIdentity = (
  construct: Construct
): IOriginAccessIdentity => {
  return new cloudfront.OriginAccessIdentity(
    construct,
    `${stackPrefix}-mfe-oai`
  );
};

const buildLambdaEdge = (
  construct: Construct,
  bucketName: string,
  region?: string
): cloudfront.experimental.EdgeFunction => {
  return new cloudfront.experimental.EdgeFunction(
    construct,
    `${stackPrefix}-mfe-lambda-edge`,
    {
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: "index.handler",
      code: new lambda.InlineCode(lambdaEdgeFn(bucketName, region)),
      memorySize: 1024,
      description: `Generated on: ${new Date().toISOString()}`,
    }
  );
};

const buildWafConfiguration = (construct: Construct): CfnWebACL => {
  return new CfnWebACL(construct, `${stackPrefix}-mfe-waf`, {
    name: `${stackPrefix}-mfe-waf`,
    scope: "CLOUDFRONT",
    description: "Web ACL created as part of CDK",
    defaultAction: {
      allow: {},
    },
    visibilityConfig: {
      sampledRequestsEnabled: true,
      cloudWatchMetricsEnabled: true,
      metricName: `${stackPrefix}-mfe-waf`,
    },
    rules: makeWafRules(),
  });
};

const buildCloudFrontDistribution = (
  construct: Construct,
  bucket: IBucket,
  region?: string
) => {
  const lambdaAtEdge = buildLambdaEdge(construct, bucket.bucketName, region);

  const wafConfiguration = buildWafConfiguration(construct);

  const cloudFrontOAI = buildOriginAccessIdentity(construct);

  bucket.grantRead(cloudFrontOAI);

  return new cloudfront.Distribution(
    construct,
    `${stackPrefix}-mfe-cf-distro`,
    {
      defaultBehavior: {
        origin: new origins.S3Origin(bucket, {
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
      defaultRootObject: `${mfes[0]}/index.html`, // To set '/' to the main shell app
      webAclId: wafConfiguration.attrArn,
    }
  );
};
