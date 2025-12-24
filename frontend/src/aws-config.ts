// AWS Amplify Configuration
// Updated with production Cognito values from AWS deployment

export const awsConfig = {
  aws_project_region: 'us-east-1',
  aws_cognito_region: 'us-east-1',
  aws_user_pools_id: 'us-east-1_nF16e4SIt',
  aws_user_pools_web_client_id: '6q9tamh87utocr04iusqevr73o',
  oauth: {
    domain: 'budget-planner-dev-654654434566.auth.us-east-1.amazoncognito.com',
    scope: ['email', 'profile', 'openid'],
    redirectSignIn: 'https://dbwgrrx6epya7.cloudfront.net/home',
    redirectSignOut: 'https://dbwgrrx6epya7.cloudfront.net/',
    responseType: 'code'
  }
}

export default awsConfig