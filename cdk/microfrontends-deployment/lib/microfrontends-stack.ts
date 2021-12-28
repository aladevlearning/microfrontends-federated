import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { stackPrefix } from "./constants";
import { MicrofrontendsCiCdConstruct } from "./constructs/microfrontends-cicd-construct";
import { MicrofrontendsFoundationalConstruct } from "./constructs/microfrontends-foundational-construct";
import { MicrofrontendsMonoRepoTriggersConstruct } from "./constructs/microfrontends-monorepo-triggers-construct";

export class MicrofrontendsStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);

    const codeStarIdConnectionId = this.node.tryGetContext(
      "codeStarIdConnectionId"
    );
    const { env } = props;

    const { bucketArn, distributionId } =
      new MicrofrontendsFoundationalConstruct(
        this,
        `${stackPrefix}-Foundations`,
        {
          env,
        }
      );

    const { pipelineArns } = new MicrofrontendsCiCdConstruct(
      this,
      `${stackPrefix}-CiCd`,
      {
        bucketArn,
        distributionId,
        env,
        codeStarIdConnectionId,
      }
    );

    new MicrofrontendsMonoRepoTriggersConstruct(
      this,
      `${stackPrefix}-MonoRepoTriggers`,
      {
        pipelineArns,
        env,
      }
    );
  }
}
