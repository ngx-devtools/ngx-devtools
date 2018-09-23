
import { symlink, unlink } from 'fs';
import { promisify } from 'util';
import { join, resolve } from 'path';

const gitAsync = require('simple-git/promise');
const exec =  require('child_process').exec;

const symlinkAsync = promisify(symlink);
const unlinkAsync = promisify(unlink);

(async function() {
  const packages = [ 'common', 'build', 'server', 'task' ];

  Promise.all(packages.map(folder => {
    const pkgFolder = `packages/${folder}`;
    const pkg = gitAsync(`./${pkgFolder}`);
    return pkg.checkout('master')
      .then(() => exec(`cd ${pkgFolder}`))
      .then(() => exec(`git pull origin master`))
      .then(() => pkg.checkout('ts'))
      .then(() => {
        const src = join(resolve(), 'node_modules');
        const dest = join(resolve(), pkgFolder, 'node_modules');
        return symlinkAsync(src, dest, 'dir')
      })
  }));
  
})();