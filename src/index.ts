import {Command, flags} from '@oclif/command'
import MainApp from './modules/main/main';

class Msit extends Command {
  static description = 'describe the command here'

  static flags = {
    // add --version flag to show CLI version
    version: flags.version({char: 'v'}),
    help: flags.help({char: 'h'}),
    // Mode - cli options (-m, --mode)
    mode: flags.string({
      char: "m",
      options:["login","logout","configure","delete"]
    }),
    profile: flags.string({
      char: 'p',
      default: "default"
    }),
    remove: flags.boolean({
      char: 'd',
      dependsOn: ['profile']
    }),
  }

  static args = [{name: 'file'}]

  async run() {
    const {args, flags} = this.parse(Msit)

    const aws = new MainApp()
    if(flags.profile == null){
      flags.profile = "default"
    }

    switch(true){

      case flags.mode === "login": {

        await aws.login(flags.profile)

        break
      }

      case flags.mode === "logout": {

        await aws.logout(flags.profile)

        break
      }

      case flags.mode === "configure": {

        await aws.configure(flags.profile)

        break

      }

      case flags.mode === "delete": {

        await aws.delete(flags.profile)

        break
      }

    }

  }

}

export = Msit
