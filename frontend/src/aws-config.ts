// AWS Amplify Configuration
// This will be updated with your actual Cognito values

export const awsConfig = {
  aws_project_region: 'us-east-1',
  aws_cognito_region: 'us-east-1',
  aws_user_pools_id: 'us-east-1_sxf6shqOy',
  aws_user_pools_web_client_id: '7o8blbj01c31m8bhdoahluccbt',
  aws_appsync_graphqlEndpoint: 'https://your-api-id.appsync-api.us-east-1.amazonaws.com/graphql',
  aws_appsync_region: 'us-east-1',
  aws_appsync_authenticationType: 'AMAZON_COGNITO_USER_POOLS',
  oauth: {
    domain: 'https://us-east-1sxf6shqoy.auth.us-east-1.amazoncognito.com',
    scope: ['phone', 'email', 'profile', 'openid', 'aws.cognito.signin.user.admin'],
    redirectSignIn: 'http://localhost:5173/',
    redirectSignOut: 'http://localhost:5173/',
    responseType: 'code'
  }
}

export default awsConfig