import { aws_wafv2 as wafv2 } from "aws-cdk-lib";

interface ListOfRules {
  name: string;
  priority: number;
  overrideAction: string;
  excludedRules: string[];
}

export const stackPrefix = "cdk-v2-construct";

export const mfes = ["mfe-app1", "mfe-app2", "mfe-app3"]; // List of mfes. Home/shell is mfe-app1

export const lambdaEdgeFn = (
  bucketName: string,
  region: string | undefined
) => {
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

export const makeWafRules = () => {
  const managedWafRules: ListOfRules[] = [
    {
      name: "AWSManagedRulesCommonRuleSet",
      priority: 10,
      overrideAction: "none",
      excludedRules: [],
    },
    {
      name: "AWSManagedRulesAmazonIpReputationList",
      priority: 20,
      overrideAction: "none",
      excludedRules: [],
    },
    {
      name: "AWSManagedRulesKnownBadInputsRuleSet",
      priority: 30,
      overrideAction: "none",
      excludedRules: [],
    },
    {
      name: "AWSManagedRulesAnonymousIpList",
      priority: 40,
      overrideAction: "none",
      excludedRules: [],
    },
    {
      name: "AWSManagedRulesLinuxRuleSet",
      priority: 50,
      overrideAction: "none",
      excludedRules: [],
    },
    {
      name: "AWSManagedRulesUnixRuleSet",
      priority: 60,
      overrideAction: "none",
      excludedRules: [],
    },
  ];
  var rules: wafv2.CfnRuleGroup.RuleProperty[] = [];
  managedWafRules.forEach((r) => {
    var stateProp: wafv2.CfnWebACL.StatementProperty = {
      managedRuleGroupStatement: {
        name: r["name"],
        vendorName: "AWS",
      },
    };
    var overrideAction: wafv2.CfnWebACL.OverrideActionProperty = { none: {} };

    var rule: wafv2.CfnWebACL.RuleProperty = {
      name: r["name"],
      priority: r["priority"],
      overrideAction: overrideAction,
      statement: stateProp,
      visibilityConfig: {
        sampledRequestsEnabled: true,
        cloudWatchMetricsEnabled: true,
        metricName: r["name"],
      },
    };
    rules.push(rule);
  });

  // Allowed country list
  var ruleGeoMatch: wafv2.CfnWebACL.RuleProperty = {
    name: "GeoMatch",
    priority: 0,
    action: {
      block: {}, // To disable, change to *count*
    },
    statement: {
      notStatement: {
        statement: {
          geoMatchStatement: {
            // block connection if source not in the below country list
            countryCodes: [
              "DK", // Denmark
            ],
          },
        },
      },
    },
    visibilityConfig: {
      sampledRequestsEnabled: true,
      cloudWatchMetricsEnabled: true,
      metricName: "GeoMatch",
    },
  }; // GeoMatch
  // Dont push for now
  //rules.push(ruleGeoMatch);

  /**
   * The rate limit is the maximum number of requests from a
   * single IP address that are allowed in a five-minute period.
   * This value is continually evaluated,
   * and requests will be blocked once this limit is reached.
   * The IP address is automatically unblocked after it falls below the limit.
   */
  var ruleLimitRequests100: wafv2.CfnWebACL.RuleProperty = {
    name: "LimitRequests100",
    priority: 1,
    action: {
      block: {}, // To disable, change to *count*
    },
    statement: {
      rateBasedStatement: {
        limit: 100,
        aggregateKeyType: "IP",
      },
    },
    visibilityConfig: {
      sampledRequestsEnabled: true,
      cloudWatchMetricsEnabled: true,
      metricName: "LimitRequests100",
    },
  }; // limit requests to 100
  rules.push(ruleLimitRequests100);

  return rules;
};
