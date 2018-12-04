interface yubiKeyProfile {
    name: string
    user: string
    code: string
}

export class yubiKeyUtil {

    cp = require("child_process")

    constructor(){

    }

    installYubikeyManager(): boolean {

        let child: any = this.cp.spawnSync("brew",["ls"],
        {
            "stdio": "pipe",
            "encoding": "utf-8"
        })
        // If brew is installed
        if( child.output !== null ){
            child = this.cp.spawnSync("brew",["install","ykman"])

            return true

        }
        // Brew is not installed
        else{
            throw new Error("Brew is not installed, please install either brew first and try again.")
        }

    }

    ykmanInstalled(): boolean {

        let child: any = this.cp.spawnSync("ykman",["oath","code"],
        {
            "stdio": "pipe",
            "encoding": "utf-8"
        })

        if( child.output !== null ){return true}
        else{return false}

    }

    getProfiles(): yubiKeyProfile[] {

        let options: yubiKeyProfile[] = []

        if( this.ykmanInstalled() ){

            let child: any = this.cp.spawnSync("ykman",["oath","code"],
            {
                "stdio": "pipe",
                "encoding": "utf-8"
            })
    
            let rawOptions: string = child.output[1].split('\n')

            for( let x: number = 0; x < rawOptions.length; x++){

                let push: yubiKeyProfile = {
                    name: rawOptions[x].substring(0,rawOptions[x].length - 6).trim().split(":")[0],
                    user: rawOptions[x].substring(0,rawOptions[x].length - 6).trim().split(":")[1],
                    code: rawOptions[x].substring(rawOptions[x].length - 6,rawOptions[x].length).trim()
                }

                options.push(push)

            }
            return options

        }

        return options
        

    }

    getCodeByName(name: string): string{
        
        let profileList: yubiKeyProfile[] = this.getProfiles()

        for(let x: number = 0; x < profileList.length; x++){
            if( profileList[x].name === name){
                return profileList[x].code
            }

        }

        return "null"
    }


}