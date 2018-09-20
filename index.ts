const gitAsync = require('simple-git/promise');

(async function() {
  const packages = [ 'common', 'build', 'server' ]

  Promise.all(packages.map(package => {
    const pkg = gitAsync(`./packages/${package}`);
    return pkg.checkout('master')
      .then(() => pkg.pull())
      .then(() => pkg.checkout('ts'));
  }))


})();