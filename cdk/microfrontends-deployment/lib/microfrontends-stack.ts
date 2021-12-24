import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { MicrofrontendsCiCdConstruct as CiCd } from "./constructs/microfrontends-cicd-construct";
import { MicrofrontendsFoundationalConstruct as Foundations } from "./constructs/microfrontends-foundational-construct";
import { stackPrefix } from "./utils";

export class MicrofrontendsStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);

    const foundations = new Foundations(
      this,
      `${stackPrefix}-Foundations`,
      props
    );

    new CiCd(this, `${stackPrefix}-CiCd`, {
      bucketArn: foundations.bucketArn,
      distributionId: foundations.distributionId,
      env: props.env,
    });
  }
}
