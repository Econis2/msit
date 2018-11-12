export interface awsTempCreds {
    aws_access_key_id: string, 
    aws_secret_access_key: string,
    aws_session_token: string
}

export  interface awsGetTokenPayload {
    method: string,
    uri: string,
    form: {
      SAMLAssertion: string,
      PrincipalArn: string,
      RoleArn: string,
      Action: string,
      Version: string
    },
    headers: {
      Accept: string
    }
  }