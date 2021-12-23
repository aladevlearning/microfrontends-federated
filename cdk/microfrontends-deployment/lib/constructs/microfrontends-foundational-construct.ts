import {
  aws_cloudfront as cloudfront,
  aws_cloudfront_origins as origins,
  aws_lambda as lambda,
  aws_s3 as s3,
  PhysicalName,
  RemovalPolicy,
  StackProps,
} from "aws-cdk-lib";
import { CfnWebACL } from "aws-cdk-lib/aws-wafv2";
import { Construct } from "constructs";
import { lambdaEdgeFn, makeWafRules, stackPrefix } from "../utils";

export class MicrofrontendsFoundationalConstruct extends Construct {
  public readonly bucketArn: string;
  public readonly distributionId: string;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id);

    const microFrontendFederatedBucket = new s3.Bucket(
      this,
      `${stackPrefix}-microfrontends-federated`,
      {
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
      }
    );

    const cloudFrontOAI = new cloudfront.OriginAccessIdentity(
      this,
      `${stackPrefix}-mfe-oai`
    );

    const lambdaAtEdge = new cloudfront.experimental.EdgeFunction(
      this,
      `${stackPrefix}-mfe-lambda-edge`,
      {
        runtime: lambda.Runtime.NODEJS_14_X,
        handler: "index.handler",
        code: new lambda.InlineCode(
          lambdaEdgeFn(
            microFrontendFederatedBucket.bucketName,
            props?.env?.region
          )
        ),
        memorySize: 1024,
        description: `Generated on: ${new Date().toISOString()}`,
      }
    );

    /*
    const wafConfiguration = new CfnWebACL(this, `${stackPrefix}-mfe-waf`, {
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
*/
    const distribution = new cloudfront.Distribution(
      this,
      `${stackPrefix}-mfe-cf-distro`,
      {
        defaultBehavior: {
          origin: new origins.S3Origin(microFrontendFederatedBucket, {
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
        defaultRootObject: "mfe-app1/index.html", // To set '/' to the main shell app
        // webAclId: wafConfiguration.attrArn,
      }
    );

    this.bucketArn = microFrontendFederatedBucket.bucketArn;
    this.distributionId = distribution.distributionId;
  }
}
