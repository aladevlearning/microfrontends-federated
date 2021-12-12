import {
  aws_cloudfront as cloudfront,
  aws_cloudfront_origins as origins,
  aws_lambda as lambda,
  aws_s3 as s3,
  CfnOutput,
  PhysicalName,
  RemovalPolicy,
  Stack,
  StackProps,
} from "aws-cdk-lib";
import { Construct } from "constructs";

export class MicrofrontendsDeploymentStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const name = "cdk-v2";

    const microFrontendFederatedBucket = new s3.Bucket(
      this,
      `${name}-microfrontends-federated`,
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
      `${name}-mfe-oai`
    );

    const lambdaAtEdge = new cloudfront.experimental.EdgeFunction(
      this,
      `${name}-mfe-lambda-edge`,
      {
        runtime: lambda.Runtime.NODEJS_14_X,
        handler: "index.handler",
        code: new lambda.InlineCode(
          lambdaCode(
            microFrontendFederatedBucket.bucketName,
            props?.env?.region
          )
        ),
        memorySize: 1024,
        description: `Generated on: ${new Date().toISOString()}`,
      }
    );

    const distribution = new cloudfront.Distribution(
      this,
      `${name}-mfe-cf-distro`,
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
      }
    );

    new CfnOutput(this, `${name}-mfe-s3-bucket`, {
      value: microFrontendFederatedBucket.bucketArn,
      exportName: `${name}MfeBucketArn`,
    });

    new CfnOutput(this, `${name}-mfe-cdn-distro-id`, {
      value: distribution.distributionId,
      exportName: `${name}MfeCdnDistroId`,
    });
  }
}

const lambdaCode = (bucketName: string, region: string | undefined) => {
  return `
  exports.handler = async (event, context, callback) => {
    const { request } = event.Records[0].cf;
    let uri = request.uri;

    if (uri === '' || uri === '/' || uri.indexOf("mfe-app2") !== -1 || uri.indexOf("mfe-app3") !== -1) {
        const s3DomainName = '${bucketName}.s3.${region}.amazonaws.com';

        /* Set S3 origin fields */
        request.origin = {
            s3: {
                domainName: s3DomainName,
                region: 'eu-west-1',
                authMethod: 'none',
                path: ''
            }
        };

        request.headers['host'] = [{ key: 'host', value: s3DomainName }];
    }


    if (uri === '' || uri === '/') {
        request.uri += '/mfe-app1/';
    }

    if (uri.endsWith('/')) {
        request.uri += 'index.html';
    }

    // Check whether the URI is missing a file extension.
    else if (!uri.includes('.')) {
        request.uri += '/index.html';
    }


    callback(null, request);

};

  `;
};
