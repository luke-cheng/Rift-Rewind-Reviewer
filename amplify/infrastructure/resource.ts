import { Stack, RemovalPolicy, Duration } from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as iam from "aws-cdk-lib/aws-iam";
import * as path from "path";
import { Construct } from "constructs";

export function defineInfrastructure(scope: Construct) {
  const stack = Stack.of(scope);

  // S3 Bucket for data storage
  const dataBucket = new s3.Bucket(scope, "RiftRewindDataBucket", {
    bucketName: `rift-rewind-data-${stack.account}`,
    versioned: true,
    encryption: s3.BucketEncryption.S3_MANAGED,
    blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    removalPolicy: stack.node.tryGetContext("production")
      ? undefined
      : RemovalPolicy.DESTROY,
    autoDeleteObjects: !stack.node.tryGetContext("production"),
  });

  // IAM Role for Lambda functions with Bedrock access
  const lambdaRole = new iam.Role(scope, "RiftRewindLambdaRole", {
    assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
    managedPolicies: [
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        "service-role/AWSLambdaBasicExecutionRole"
      ),
    ],
  });

  // Grant S3 permissions to Lambda role
  dataBucket.grantReadWrite(lambdaRole);

  // Grant Bedrock permissions to Lambda role
  lambdaRole.addToPolicy(
    new iam.PolicyStatement({
      actions: [
        "bedrock:InvokeAgent",
        "bedrock:InvokeModel",
        "bedrock:GetAgent",
        "bedrock:ListAgents",
      ],
      resources: ["*"],
    })
  );

  // API Lambda Function
  const apiFunction = new lambda.Function(scope, "ApiFunction", {
    runtime: lambda.Runtime.NODEJS_20_X,
    handler: "index.handler",
    code: lambda.Code.fromAsset(
      path.join(__dirname, "../functions/api")
    ),
    role: lambdaRole,
    environment: {
      DATA_BUCKET_NAME: dataBucket.bucketName,
      BEDROCK_AGENT_ID: "TBD", // To be configured with actual Bedrock Agent ID
      BEDROCK_AGENT_ALIAS_ID: "TBD",
    },
    timeout: Duration.seconds(30),
  });

  // Ingest Lambda Function
  const ingestFunction = new lambda.Function(scope, "IngestFunction", {
    runtime: lambda.Runtime.NODEJS_20_X,
    handler: "index.handler",
    code: lambda.Code.fromAsset(
      path.join(__dirname, "../functions/ingest")
    ),
    role: lambdaRole,
    environment: {
      DATA_BUCKET_NAME: dataBucket.bucketName,
    },
    timeout: Duration.seconds(60),
  });

  // Tools Lambda Function (for Bedrock Agent)
  const toolsFunction = new lambda.Function(scope, "ToolsFunction", {
    runtime: lambda.Runtime.NODEJS_20_X,
    handler: "index.handler",
    code: lambda.Code.fromAsset(
      path.join(__dirname, "../functions/tools")
    ),
    role: lambdaRole,
    environment: {
      DATA_BUCKET_NAME: dataBucket.bucketName,
    },
    timeout: Duration.seconds(30),
  });

  // API Gateway REST API
  const api = new apigateway.RestApi(scope, "RiftRewindApi", {
    restApiName: "Rift Rewind Reviewer API",
    description: "API for Rift Rewind Reviewer - Personalized LoL insights",
    defaultCorsPreflightOptions: {
      allowOrigins: apigateway.Cors.ALL_ORIGINS,
      allowMethods: apigateway.Cors.ALL_METHODS,
      allowHeaders: [
        "Content-Type",
        "X-Amz-Date",
        "Authorization",
        "X-Api-Key",
        "X-Amz-Security-Token",
      ],
    },
  });

  // API Gateway integrations
  const apiIntegration = new apigateway.LambdaIntegration(apiFunction);
  const ingestIntegration = new apigateway.LambdaIntegration(ingestFunction);
  const toolsIntegration = new apigateway.LambdaIntegration(toolsFunction);

  // API Routes
  const apiResource = api.root.addResource("api");
  apiResource.addMethod("GET", apiIntegration);
  apiResource.addMethod("POST", apiIntegration);

  const ingestResource = api.root.addResource("ingest");
  ingestResource.addMethod("POST", ingestIntegration);

  const toolsResource = api.root.addResource("tools");
  toolsResource.addMethod("POST", toolsIntegration);

  // Export values for use in the application
  return {
    dataBucket,
    apiFunction,
    ingestFunction,
    toolsFunction,
    api,
    apiEndpoint: api.url,
  };
}
