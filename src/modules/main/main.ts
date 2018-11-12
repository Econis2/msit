// Author: Derek Spiner
// Date: 11-6-2018
// Description:
//  Class to get AWS credentials (AssumeRole) from an Okta SAML Assurtion

// Import Modules
import cli from 'cli-ux';
import { awsTasks } from '../Aws/AwsTasks'
import { ConfigParser } from '../ConfigParser/ConfigParser'
import { oktaUtil } from '../Okta/oktaUtil'

// Import Interfaces
import { publicProfile, status, payload } from '../ConfigParser/interfaces'
import { awsGetTokenPayload } from '../Aws/interfaces'

export default class MainApp {

  os = require('os')
  awsConfigFile = this.os.homedir() + "/" + ".aws/config"
  awsCredsFile = this.os.homedir() + "/" + ".aws/credentials"
  parser = new ConfigParser()

  constructor(){}

  // Tested Fully Working
  async login(profileName: string){

    const oUtil: oktaUtil = new oktaUtil()

    // Check if the profile Exists
    if ( await this.parser.profileExist(this.awsConfigFile, profileName) ){

      let configProfile: payload = this.parser.getProfile(this.awsConfigFile, profileName)

      if( await this.parser.appUrlExist(configProfile.profiles[0]) ){

        // Browser - Runs through App login via the "Okta" way - Gets the Role / Saml
        // assurtion needed to auth AWS
        
        let awsPayload: awsGetTokenPayload = await oUtil.getSAMLAssertion(configProfile.profiles[0].data.appurl)

        const aws: awsTasks = new awsTasks()

        // Gets an AWS Token / Temp Credentials
        let creds: any = await aws.getAwsToken(awsPayload)


        let credProfile: publicProfile = {
          options: {
            name: profileName,
            path: this.awsCredsFile
          },
          data: {},
        }

        const keys: string[] = Object.keys(creds) 

        for(let x: number = 0; x < keys.length; x ++){
          credProfile.data[keys[x]] = creds[keys[x]]
        }

        // Updates Existing Creds or Creates New
        await this.parser.setProfile(credProfile)
        
        // Call the aws caller identity to confirm that auth was successful 
        const { spawn } = require('child_process')
        let child = await spawn("aws",['--profile', profileName, 'sts', 'get-caller-identity'])
        
        // display account / role information on auth completion
        child.stdout.on('data', (data: any) => {
          let Ndata: any = JSON.parse(data)
          console.log("[Account] " + Ndata.Account + '\n[User] ' + Ndata.UserId.split(":")[1] + "\n[Role] " + Ndata.Arn.split("/")[1])
          })

      }
      else{
        throw new Error(".aws/config is not set up correctly [ missing: appurl ]")
      }

    }

    // Profile Doesn't Exist, Prompt for creation of a new one
    else{

      // Prompt for new Profile creation?
      let res: string = await cli.prompt("Profile does not exist. Would you like to create one[y/n]?")

      if( res.toLocaleLowerCase() === "y"){
        await this.configure(profileName)

        // Wait for the file to finish writing
        // There is probably a better way to perform this
        setTimeout(async ()=>{
          
          await this.parser.getProfile(this.awsConfigFile, profileName)
        
          let configProfile: payload = await this.parser.getProfile(this.awsConfigFile, profileName)

          // Browser - Runs through App login via the "Okta" way - Gets the Role / Saml
          // assurtion needed to auth AWS
          let awsPayload: awsGetTokenPayload = await oUtil.getSAMLAssertion(configProfile.profiles[0].data.appurl)

          const aws: awsTasks = new awsTasks()

          // Gets an AWS Token / Temp Credentials
          let creds: any = await aws.getAwsToken(awsPayload)
  
          let credProfile: publicProfile = {
            options: {
              name: profileName,
              path: this.awsCredsFile
            },
            data: {},
          }
  
          const keys: string[] = Object.keys(creds) 
  
          for(let x: number = 0; x < keys.length; x ++){
            credProfile.data[keys[x]] = creds[keys[x]]
          }

          // Updates Existing Creds or Creates New
          await this.parser.setProfile(credProfile)

          // Call the aws caller identity to confirm that auth was successful 
          const { spawn } = require('child_process')
          let child = await spawn("aws",['--profile', profileName, 'sts', 'get-caller-identity'])
          
          // display account / role information on auth completion
          child.stdout.on('data', (data: any) => {
            let Ndata: any = JSON.parse(data)
            console.log("[Account] " + Ndata.Account + '\n[User] ' + Ndata.UserId.split(":")[1] + "\n[Role] " + Ndata.Arn.split("/")[1])
          })

        }, 1000)

      }
    }

  }

  logout(profileName: string){

    console.log("Logout")
    
    if(this.parser.profileExist(this.awsCredsFile, profileName)){

      let clearCreds: publicProfile = {
        options: {
          name: profileName,
          path: this.awsCredsFile,
        },
        data:{
          aws_access_key_id: "", 
          aws_secret_access_key: "",
          aws_session_token: ""
        }
      }
      
      this.parser.setProfile(clearCreds)

    }
    else{
      console.log("Profile [" + profileName + "] does not exist")
    }
    
  }

  // Fully tested working
  async configure(profileName: string){

    console.log(":Configure")

    const appUrl: any = await cli.prompt("Enter the SSO app URL")

    const region: any = await cli.prompt("Enter the AWS region")

    let newProfile: publicProfile = {
      data: {
        region: region,
        output: "json",
        appurl: appUrl
      },
      options: {
        name: profileName,
        path: this.awsConfigFile,
      },

    }
    
    await this.parser.setProfile(newProfile)
      
  }

  // Tested working fully
  async delete(profileName: string){

    async function deleteProfile(parser: ConfigParser, path: string, profileName: string){
      
      //if( parser.profileExist(path, profileName) ){

        let deleteProfile: publicProfile = {
          options: {
            path: path,
            name: profileName,
          },
          data:{},

        }

        //await parser.setProfile(deleteProfile)
        await parser.deleteProfile(deleteProfile)
        return

      //}
  }

    let res: string = await cli.prompt("Delete profile " + profileName + " [Y/n]?")

    if( res === "Y"){

      await deleteProfile(this.parser, this.awsCredsFile, profileName)

      await deleteProfile(this.parser, this.awsConfigFile, profileName)

      console.log( profileName + ": Has been removed")

    }
    else{
      console.log("exiting...")
    }

  }

      
}