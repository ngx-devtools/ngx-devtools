
import { symlink } from 'fs';
import { promisify } from 'util';
import { join, resolve } from 'path';

import { clean } from './tools/clean';
import { symlinkPackages } from './tools/link-packages';

const gitAsync = require('simple-git/promise');
const exec =  require('child_process').exec;

const symlinkAsync = promisify(symlink);

(async function() {
  const packages = [ 'common', 'build', 'server', 'task' ];

  await clean('node_modules/@ngx-devtools');

  await Promise.all(packages.map(folder => {
    const pkgFolder = `packages/${folder}`;
    const pkg = gitAsync(`./${pkgFolder}`);
    return pkg.checkout('master')
      .then(() => exec(`cd ${pkgFolder}`))
      .then(() => exec(`git pull origin master`))
      .then(() => pkg.checkout('ts'))
      .then(() => {
        const src = join(resolve(), pkgFolder);
        const dest = join(resolve(), 'node_modules', '@ngx-devtools', folder);
        return symlinkPackages(src, dest);
      })
      .then(() => {
        const src = join(resolve(), 'node_modules');
        const dest = join(resolve(), pkgFolder, 'node_modules');
        return symlinkAsync(src, dest, 'dir')
      })
  }));

  
  
})();