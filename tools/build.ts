import { clean } from './clean';

const exec =  require('child_process').exec;

const packages = [ 'common', 'build', 'server', 'task' ];

async function build() {
  await Promise.all(packages.map(folder => {
    return Promise.all([ 
      clean(`packages/${folder}/dist`), 
      clean(`packages/${folder}/.tmp`) 
    ])
  }))
  for (const folder of packages) {
    await exec(`npm run build --prefix packages/${folder}`);
  }
}

export {  build }