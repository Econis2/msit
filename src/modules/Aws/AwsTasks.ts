import { awsTempCreds, awsGetTokenPayload } from './interfaces'

export class awsTasks {

    rp = require('request-promise')

    constructor(){}

    async getAwsToken(tokenOptions: awsGetTokenPayload): Promise<awsTempCreds> {

        // Request Token from AWS
        let stsToken: any = await this.rp(tokenOptions)

        // Parse Payload for credentials
        stsToken = JSON.parse(stsToken)
        const creds: any = stsToken.AssumeRoleWithSAMLResponse.AssumeRoleWithSAMLResult.Credentials
        
        // Build creds payload
        let aws_creds: awsTempCreds  = 
        {
            aws_access_key_id: creds.AccessKeyId,
            aws_secret_access_key: creds.SecretAccessKey,
            aws_session_token: creds.SessionToken
        }

        // Return the new Credentials
        return aws_creds
        
    }

}