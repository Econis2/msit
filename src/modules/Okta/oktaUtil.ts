import { awsGetTokenPayload } from '../Aws/interfaces'

export class oktaUtil {
    
    constructor(){}
        
    // Get AWS Creds from Okta SAML Assume Role
    async getSAMLAssertion(appUrl: string) {

        const puppet: any = require('puppeteer-core')
        const fs = require('fs')

        let isFile: any = ""
        let browserPath: string = ""

        // Check that Chrome is already installed
        try{
        isFile = fs.lstatSync('/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome').isFile()
        }
        catch(err){
        if(err.code == 'ENOENT'){
            // Chrome not installed
            console.error("No instance of Chrome found")
        }
        // Something else happend with getting the file
        else{throw new Error("Another error occured getting file: " + err)}
        }

        // Does Chrome Exist?
        if(isFile){
        // Chrome is there, set that as broswer
        browserPath = '/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome'
        }
        // Chrome not installed
        else{

        const cli: any = require("cli-ux")
        // Prompt for an install of Chromium
        let install: any = await cli.prompt("No version of Chrome found, Install Chromium instead?[y/n]")
        //let install: any =  cli.prompt("No version of Chrome found, Install Chromium instead?[y/n]")


        // If yes
        if(install.trim().toLowerCase() === "y"){
            const { chromiumVersion } = require('puppeteer/package.json')
            // Download and install Chromium
            const fetcher: any = puppet.createBrowserFetcher()
            
            const broswerInfo = await fetcher.download(chromiumVersion)
            //const broswerInfo = fetcher.download(chromiumVersion)
            
            // Set browser to new Chromium install
            browserPath = broswerInfo.executablePath
        }
        else{
            //Install chrome manually
            throw "Please Install Chrome before proceeding"
        }

        }

        let puppetOptions: any = {
            // Build check to verify that chome exists
            executablePath: browserPath,
            headless: false, 
            devtools: false,
            args:[
            "--window-size=800,800",
            "--disable-infobars",
            ]
        }

        // create browser instance
        const browser: any = await puppet.launch(puppetOptions)
        //const browser: any = puppet.launch(puppetOptions)

        // Get the current pages
        let pages: any = await browser.pages()
        //let pages: any = browser.pages()
        
        // Select the first page (this is done so there isnt an empty tab next to a new page)
        const page: any = pages[0]
        
        // Go to the AppUrl provided in the Okta Admin
        await page.goto(appUrl)
        //page.goto(appUrl)
        
        // Let okta/browser handle the auth
        const response: any = await page.waitForResponse((response: any) => {
        //const response: any = page.waitForResponse((response: any) => {
        
        // Wait for the saml assertion response to AWS and capture
        if (response.url() === "https://signin.aws.amazon.com/saml" && response.status() === 302){
            return response
        }
        else{ return null }
        
        }, {timeout: 0})
        
        //Collect the call and data
        const r_request: string = await response.request().postData()
        //const r_request: string = response.request().postData()

        // URL decode the payload
        let response_array: any = decodeURIComponent(r_request).split('&')

        // Parse the encoded SAML
        const encodedSAML: string = response_array[1].replace('SAMLResponse=','')
        
        // Parse the Selected Role
        const role: string = response_array[response_array.length -1].replace('roleIndex=','')
        
        // Get the PrincipalArn
        //const principalArn: any = await this.parseSAML(encodedSAML, role)
        const principalArn: any = this.parseSAML(encodedSAML, role)
        
        // Build the AWS request
        const stsTokenOptions: awsGetTokenPayload = {
        method: "POST",
        uri: "https://sts.amazonaws.com",
        form: {
            SAMLAssertion: encodedSAML,
            PrincipalArn: principalArn,
            RoleArn: role,
            Action: "AssumeRoleWithSAML",
            Version: "2011-06-15"
        },
        headers: {
            Accept: "application/json"
        }
        }
        
        // Close the browser window
        await browser.close()
        //browser.close()

        return stsTokenOptions

  }

  // Parses the SAML response from OKTA and returns the principalArn
  // This may only work for OKTA will need to verify or have more sample
  //  data to provide a more dynamic version
  parseSAML(encodedSAML: string, role: string): string{
    let saml_response: string = ""
    try{
      // Convert the SAML Response from Base64 to xaml
      saml_response = Buffer.from(encodedSAML , 'base64').toString('ascii')
    }
    catch{
      throw new Error("Unable to convert base64 to ASCii - possible incorrect SAML")
    }
    // Start Parsing the SAML Assertion for required Information
    // Create Array of Principal Arns / Role Arns
    const saml_array: any = saml_response.split('<saml2:AttributeValue xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:type="xs:string">')
    
    // Choose Arns based on selected choice
    let options: any = saml_array.filter((item: any) => {
        if(item.includes(role)){
          return true
        }
        else{return false}
    })
    // Return the parsed PrincipalArn
    return options[0].split(',')[0]

  }

}