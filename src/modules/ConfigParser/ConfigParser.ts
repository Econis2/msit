// Descroption: Manipulates config files that follow the ini file formating (loosely)
import { status, profile, payload, publicProfile } from './interfaces'


export class ConfigParser {

    fs: any = require('fs')
  
    constructor(){}
  
    private writeFile(path: string, content: any): status {
    
      //let result = 
      return this.fs.writeFileSync( path, content, (err: any): status => {
        if(err){
          throw new Error("Error writing to file: " + path + "Error: " + err)
        }
          console.log("writeFile return")
          return {code: 200, msg: "OK"}
      })

    }
  
    // Tested Working
  private configFromFile(path: string): payload{

    try{
      this.fs.lstatSync(path).isFile()
    }
    catch(err){

      if( err.code === "ENOENT" ){
        return {code: 500, msg: "[" + path + "] does not exist", profiles: []}
      }
      else{
        throw new Error("Something went super wrong!")
      }

    }

      // Read all lines from the file
      // Split on '[' - the start of a new profile
      const profiles: any = this.fs.readFileSync(path, 'utf8').split('[')
    
      let config: any = []
      let spaceCount: number = 0
      let commentCount: number = 0

      // Loop through each profile
      for(let x: number = 1; x < profiles.length; x++){
        
        // Create an array based on the number of lines in the profile
        let currentProfile: any  = profiles[x].split("\n")
    
        // Start with a blank profile template
        let profile: profile = {
          options: {
            name: ""
          },
          data:{},

        }
        
        // Loop through each profile line
        for(let y: number = 0; y < currentProfile.length; y ++){
          
          // If this is the first line of the profile
          // This line is the name
          // Remove the ']' bracket for the parsed name
          if(y == 0){
            //console.log("first Line")
            profile.options.name = currentProfile[y].replace("]",'')
          }
          // Not the first line
          else{
            
            // Split based on '='
            // Actual params will be length = 2
            // comments / spaces length = 1
            let param: any = currentProfile[y].split('=')

            // Identifies as actual paramter
            // param has an '=' sign
            if( param.length > 1){
              
              // Add space to config if needed
              if( spaceCount > 0 ){
                let spaceKey: string = "space:" + spaceCount
                let spaceValue: string = "space"

                profile.data[spaceKey] = spaceValue

                spaceCount = 0

              }
    
              let key: string = param[0].trim()
              let value: string = param[1].trim()
    
              profile.data[key] = value

            }
            //This allows anything as a comment ( '=' will get parsed as key/pairs most likely [untested])
            //else if (param[0].length > 0 ){
            // Allows only # to signify a comment
            else if ( param[0].trim()[0] === "#"){
              if( spaceCount > 0 ){
                let spaceKey: string = "space:" + spaceCount
                let spaceValue: string = "space"

                profile.data[spaceKey] = spaceValue

                spaceCount = 0

              }
              let key: string = "comment:" + commentCount
              let value: string = param[0]

              profile.data[key] = value

              commentCount ++

            }
            // This is the last line - need to write a "comemnt for extra spaces"
            else if ( y === currentProfile.length - 1 ){
              
              if ( spaceCount > 0){
                let spaceKey: string = "space:" + spaceCount
                let spaceValue: string = "space"

                profile.data[spaceKey] = spaceValue

                spaceCount = 0
              }
              
            }
            // Not Comment / Not Key/Value - Increase Space Count
            else{

              spaceCount ++

            }
          }
        }
        config.push(profile)

      }

      return {code: 200, msg: "OK", profiles: config}

  }
  
    private configToFile(path: string, config: payload): status{

      let configOutput: string = ""


        for(let x: number = 0; x < config.profiles.length; x ++){

          // Set the name: [Name]
          configOutput += "[" + config.profiles[x].options.name + "]\n"

            // Get the property names of the profile
            let keys: any = Object.keys(config.profiles[x].data)
            
            // Loop through each key
            for(let y: number = 0; y < keys.length; y ++){
                
                // Check if data or comment
                if( keys[y].indexOf(":") === 7 ){

                  configOutput += config.profiles[x].data[keys[y]] + "\n"

                }
                // Needs Spaces injected
                else if( keys[y].indexOf(":") === 5 ){
                  let spaces: number = keys[y].split(":")[1]

                  for( let z: number = 0; z < spaces; z++ ){
                    configOutput += "\n"
                  }
                }
                // Standard Key/Value pairs
                else{
                  // Create the value/pair: value=pair
                  configOutput += keys[y] + "=" + config.profiles[x].data[keys[y]] + "\n"

                  // Give a new line space between profiles
                  if(y === keys.length - 1){
                    
                    configOutput += "\n"
                  }
                }
            }
    
        }

      return this.writeFile(path, configOutput)
    
    }
  
    appUrlExist(profile: profile): boolean{
  
      return Object.keys(profile.data).indexOf("appurl") !== -1
  
    }
  
    // Tested Wroking
    profileExist(path: string, profileName: string): boolean{
  
      let config: payload = this.configFromFile(path)
  
      let index: number = config.profiles.findIndex((item: any) => {
        return item.options.name === profileName
      })
  
      if(index === -1){
        return false
      }
      else{
        return true
      }
  
    }

    getProfile(path: string, profileName: string): payload{
  
      let config: payload = this.configFromFile(path)
    
      let index: number = config.profiles.findIndex((item: any) => {
        return item.options.name === profileName
      })
  
      if(index === -1){
        return {
          code: 500,
          msg: "Profile does not exist",
          profiles:[ 
            {
              options: { name: "null" }, 
              data:{},
            } 
          ] 
        }

      }
      else{
        return {
          code: 200,
          msg: "OK",
          profiles: [
            config.profiles[index]
          ]
        }

      }
  
    }
  
    setProfile(profile: publicProfile): status {

      const keys: string[] = Object.keys(profile.data)
      const profileName: string = profile.options.name
      
      // Get the whole File Configuration
      let configFile: payload = this.configFromFile(profile.options.path)
      
      let index: number = configFile.profiles.findIndex((item: any) => {
        return item.options.name === profileName
      })

      //Profile Exists
      // Check that Profile Exists
      if( index !== -1){

        // Profile Exists
        // Overwrite Profile
        for(let x: number = 0; x < keys.length; x ++){
          configFile.profiles[index].data[keys[x]] = profile.data[keys[x]]
        }
        
        this.configToFile(profile.options.path, configFile)

        return {code: 200, msg: "OK"}

      }

      // Profile Does not Exist
      // Create new profile
      else{
        let new_profile: profile = {
          options: {
            name: profile.options.name
          },
          data:{},
        }
  
        for(let x: number = 0; x < keys.length; x ++){
          new_profile.data[keys[x]] = profile.data[keys[x]]
        }

        configFile.profiles.push(new_profile)

        this.configToFile(profile.options.path, configFile)
        return {code: 200, msg: "OK"}

      }
    
    }
  
    deleteProfile(profile: publicProfile): status {
            
      // Get the whole File Configuration
      let configFile: payload = this.configFromFile(profile.options.path)
        
      let index: number = configFile.profiles.findIndex((item: any) => {
        return item.options.name === profile.options.name
      })

      if( index !== -1 ){
        
        // Create new Array with missing element - Store the removed
        let splice: profile[] = configFile.profiles.splice(index, 1)

        // Get the keys of the removed profile
        let keys: string[] = Object.keys(splice[0].data)

        // get the index of the "unsaved-comments" profile (if there is one)
        let ucom: number = configFile.profiles.findIndex((p) =>{
          return p.options.name === "unsaved-comments"
        })

        //No "unsaved-comments" profile
        if( ucom === -1){

          // New Profile Template
          let newProfile: profile = {
            data:{},
            options:{
              name: "unsaved-comments"
            }
          }

          // Loop Through object keys
          for(let x: number =0; x < keys.length ; x ++){
            console.log("key: " + keys[x])
            // if line is a comment, store it in new profile
            if (keys[x].includes("comment") ){
              newProfile.data[keys[x]] = splice[0].data[keys[x]]
            }

          }
          // add the "unsaved-comments profile"
          configFile.profiles.push(newProfile)

        }
        // "unsaved-comments" profile exists
        else{

          // Loop Through object keys
          for(let x: number = 0; x < keys.length; x++){
            // add comments to existing unsaved-comments profile
            configFile.profiles[ucom].data[keys[x]] = splice[0].data[keys[x]]
          }
        }
        // set status
        configFile.code = 200
        configFile.msg = "OK"

        // Write the modified config file
        return this.configToFile(profile.options.path, configFile)

      }
      else{
        // Delete Option is Set
        // Cannot remove something that does not exist
        console.log("Profile empty - no erase required")

        return {code: 205, msg: "Profile empty - no erase required"}

      }
    }
  }