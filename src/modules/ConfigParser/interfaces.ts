export interface profile {
    options: profileOptions
    data: {[key: string]: string}

}

export interface publicProfile extends profile {
    options: publicProfileOptions

}

interface profileOptions {
    name: string

}

interface publicProfileOptions extends profileOptions{
    path: string,
    //delete: boolean

}



export interface status {
    code: number,
    msg: string,

}


export interface payload extends status {
    profiles: profile[]

}