// AWS Amplify Configuration
// Updated with production Cognito values from AWS deployment

// Determine redirect URLs based on current environment
const getRedirectUrls = () => {
  const isLocalDev = typeof window !== 'undefined' && window.location.hostname === 'localhost'
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://dbwgrrx6epya7.cloudfront.net'
  
  return {
    redirectSignIn: isLocalDev ? `${baseUrl}/home` : 'https://dbwgrrx6epya7.cloudfront.net/home',
    redirectSignOut: isLocalDev ? baseUrl : 'https://dbwgrrx6epya7.cloudfront.net/'
  }
}

const redirectUrls = getRedirectUrls()

export const awsConfig = {
  aws_project_region: 'us-east-1',
  aws_cognito_region: 'us-east-1',
  aws_user_pools_id: 'us-east-1_CTxmgowG1',
  aws_user_pools_web_client_id: '2hpdsefl89pngdv7n3e7fvgral',
  oauth: {
    domain: 'budget-planner-dev-654654434566.auth.us-east-1.amazoncognito.com',
    scope: ['email', 'profile', 'openid'],
    redirectSignIn: redirectUrls.redirectSignIn,
    redirectSignOut: redirectUrls.redirectSignOut,
    responseType: 'code'
  }
}

export default awsConfig