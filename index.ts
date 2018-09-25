
import { symlink, unlink, lstat, readdir, rmdir, existsSync, readlinkSync, statSync, mkdirSync } from 'fs';
import { promisify } from 'util';
import { join, resolve, sep, dirname } from 'path';

const gitAsync = require('simple-git/promise');
const exec =  require('child_process').exec;

const symlinkAsync = promisify(symlink);
const unlinkAsync = promisify(unlink);
const lstatAsync = promisify(lstat);
const readdirAsync = promisify(readdir);
const rmdirAsync = promisify(rmdir);

(async function() {
  const packages = [ 'common', 'build', 'server', 'task' ];

  function mkdirp(directory: string) {
    const dirPath = resolve(directory).replace(/\/$/, '').split(sep);
    for (let i = 1; i <= dirPath.length; i++) {
      const segment = dirPath.slice(0, i).join(sep);
      if (!existsSync(segment) && segment.length > 0) {
        mkdirSync(segment);
      }
    }
  }

  async function clean(dir: string) {
    if (existsSync(dir)) {
      const files = await readdirAsync(dir);
      await Promise.all(files.map(async (file) => {
        const p = join(dir, file);
        const stat = await lstatAsync(p);
        if (stat.isDirectory()) {
          await clean(p);
        } else {
          await unlinkAsync(p);
        }
      }));
      await rmdirAsync(dir);
    }
  }

  async function symlinkPackages(src, dest) {
    const srcNodeModules = join(src, 'node_modules');
    return ((existsSync(srcNodeModules) && statSync(srcNodeModules).isDirectory())
      ? readlinkSync(srcNodeModules) === join(resolve(), 'node_modules')
        ? unlinkAsync(srcNodeModules)
        : clean(srcNodeModules)
      : Promise.resolve()
    ).then(() => {
      mkdirp(dirname(dest))
      return symlinkAsync(src, dest, 'dir');
    })
  }

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