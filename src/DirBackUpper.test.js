/* globals Wsh: false */
/* globals __dirname: false */
/* globals process: false */

/* globals describe: false */
/* globals test: false */
/* globals expect: false */

// Shorthand
var util = Wsh.Util;
var path = Wsh.Path;
var os = Wsh.OS;
var fs = Wsh.FileSystem;
var fse = Wsh.FileSystemExtra;
var logger = Wsh.Logger;
var dirBkup = Wsh.DirBackUpper;

var parseTmp = util.parseTemplateLiteral;
var parseDate = util.parseDateLiteral;
var includes = util.includes;
var endsWith = util.endsWith;

var noneStrVals = [true, false, undefined, null, 0, 1, NaN, Infinity, [], {}];
var noneObjVals = [true, false, undefined, null, 0, 1, NaN, Infinity, [], ''];

var _cb = function (fn/* , args */) {
  var args = Array.from(arguments).slice(1);
  return function () { fn.apply(null, args); };
};

var _makeTestFiles = function (testDir) {
  /*
   * <testDir>
   * │  fileRoot1.txt
   * │  fileRoot2-Symlink.log // SYMLINKD
   * │  fileRoot2.log
   * │
   * ├─DirBar\
   * │  │  fileBar1.txt
   * │  │
   * │  └─DirQuux\
   * │          fileQuux1-Symlink.log // SYMLINKD
   * │          fileQuux1.txt
   * │
   * ├─DirQuux-Symlink\ // SYMLINKD
   * └─DirEmp\ // Empty Directory
   */
  var fileNames = {
    dirs: [
      'DirBar',
      'DirBar\\DirQuux',
      'DirEmp'
    ],
    files: [
      'fileRoot1.txt',
      'fileRoot2.log',
      'DirBar\\fileBar1.txt',
      'DirBar\\DirQuux\\fileQuux1.txt'
    ],
    linkPairs: [
      { src: 'fileRoot2.log', link: 'fileRoot2-Symlink.log' },
      { src: 'DirBar\\DirQuux', link: 'DirQuux-Symlink' },
      {
        src: 'DirBar\\DirQuux\\fileQuux1.txt',
        link: 'DirBar\\DirQuux\\fileQuux1-Symlink.txt'
      }
    ],
    links: [
      'fileRoot2-Symlink.log',
      'DirBar\\DirQuux\\fileQuux1-Symlink.txt',
      'DirQuux-Symlink',
      'DirQuux-Symlink\\fileQuux1-Symlink.txt',
      'DirQuux-Symlink\\fileQuux1.txt'
    ],
    nums: {
      root: 4,
      rootFile: 2,
      rootSymlink: 2,
      all: 7,
      allCopied: 12,
      symlink: 3,
      empDir: 1
    }
  };

  // Creates the directories
  fileNames.dirs.forEach(function (dirName) {
    var dirPath = path.join(testDir, dirName);
    fse.ensureDirSync(dirPath);
  });
  // Creates the files
  fileNames.files.forEach(function (fileName) {
    var filePath = path.join(testDir, fileName);
    fs.writeFileSync(filePath, 'This is ' + fileName);
  });
  // Creates the files
  fileNames.linkPairs.forEach(function (linkPair) {
    var srcPath = path.join(testDir, linkPair.src);
    var linkPath = path.join(testDir, linkPair.link);
    fs.linkSync(srcPath, linkPath);
  });

  return fileNames;
};

describe('DirBackUpper', function () {
  var testName;

  // Copy

  testName = 'DefOp_dryRun';
  test(testName, function () {
    var testDir = os.makeTmpPath('_' + testName);
    fse.ensureDirSync(testDir);

    var logFile = path.join(testDir, 'test1.log');
    var lggr = logger.create('info/' + logFile);

    // var srcDir = process.env.TEMP;
    var srcDir = path.join(process.cwd(), 'WshModules', 'WshJest');
    var destDir = 'D:\\BackUp\\Users\\#{yyyy-[MM - 2]}';
    var destDirParsed = parseDate('D:\\BackUp\\Users\\#{yyyy-[MM - 2]}');
    // var destDir = 'D:\\BackUp\\Users\\#{yyyy-MM}';

    // dry-run
    var retVal = dirBkup.backupDir(srcDir, destDir, {
      logger: lggr,
      isDryRun: true
    });
    expect(retVal).toBeUndefined();

    var logStr = fs.readFileSync(logFile, { encoding: 'utf8' });
    // console.log(logStr);
    var expC = expect(logStr).toContain; // Shorthand
    expC('Start the function dirBkup.backupDir');
    expC('srcDir: "' + srcDir + '" -> "' + srcDir + '"');
    expC('destDir: "' + destDir + '" -> "' + destDirParsed + '"');
    expC('syncMethod: UPDATE');
    expC('comparison: TIME');
    expC('isRecursive: true');
    expC('copiesEmpDir: false');
    expC('includesSymlink: false');
    expC('matchedRegExp: null');
    expC('ignoredRegExp: null');
    expC('throws: false');
    expC('Reading srcDir recursively...');
    expC('Found ');
    expC('destDir is not existing');
    expC('Comparing a difference of file TIME');
    // ...
    expC('Finished the function dirBkup.backupDir');

    // Cleaning
    fse.removeSync(testDir);
    expect(fs.existsSync(testDir)).toBe(false);
  });

  testName = 'Op1_dryRun';
  test(testName, function () {
    var testDir = os.makeTmpPath('_' + testName);
    fse.ensureDirSync(testDir);

    var logFile = path.join(testDir, 'test1.log');
    var lggr = logger.create('info/' + logFile);

    // var srcDir = process.env.TEMP;
    var srcDir = path.join(process.cwd(), 'WshModules', 'WshJest');
    var destDir = 'D:\\BackUp\\Users\\WshModules';

    // dry-run
    var retVal = dirBkup.backupDir(srcDir, destDir, {
      syncMethod: 'MIRROR',
      comparison: 'CONTENT',
      isRecursive: false,
      // copiesEmpDir: false,
      // includesSymlink: true,
      // matchedRegExp: '\\w+\\.txt$',
      // ignoredRegExp: '\\.tmp$',
      logger: lggr,
      isDryRun: true
    });
    expect(retVal).toBeUndefined();

    var logStr = fs.readFileSync(logFile, { encoding: 'utf8' });
    // console.log(logStr);
    var expC = expect(logStr).toContain; // Shorthand
    expC('Start the function dirBkup.backupDir');
    expC('srcDir: "' + srcDir + '" -> "' + srcDir + '"');
    expC('destDir: "' + destDir + '" -> "' + destDir + '"');
    expC('syncMethod: MIRROR');
    expC('comparison: CONTENT');
    expC('isRecursive: false');
    expC('copiesEmpDir: false');
    expC('includesSymlink: false');
    expC('matchedRegExp: null');
    expC('ignoredRegExp: null');
    expC('throws: false');
    expC('Reading srcDir...');
    expC('Found ');
    expC('destDir is not existing');
    expC('Comparing a difference of file CONTENT');
    expC('Start the function dirBkup.backupDir');
    // ...
    expC('Remove none-existing files from dest');
    expC('Finished the function dirBkup.backupDir');

    // Cleaning
    fse.removeSync(testDir);
    expect(fs.existsSync(testDir)).toBe(false);
  });

  testName = 'DefOp';
  test(testName, function () {
    var testDir = os.makeTmpPath('_' + testName);
    fse.ensureDirSync(testDir);

    var srcDir = path.join(testDir, 'src');
    var srcInfo = _makeTestFiles(srcDir);
    var destDir = path.join(testDir, 'dest');

    // 1. The First Back Up
    (function () {
      var logFile = path.join(testDir, 'test1.log');
      var lggr = logger.create('info/' + logFile);
      var retVal = dirBkup.backupDir(srcDir, destDir, {
        // syncMethod: 'UPDATE',
        // comparison: 'TIME',
        // isRecursive: true,
        // copiesEmpDir: false,
        // includesSymlink: false,
        logger: lggr
      });
      expect(retVal).toBeUndefined();

      var logStr = fs.readFileSync(logFile, { encoding: 'utf8' });
      // console.dir(srcInfo);
      // console.log(logStr);
      var expC = expect(logStr).toContain; // Shorthand
      expC('Start the function dirBkup.backupDir');
      expC('srcDir: "' + srcDir + '" -> "' + srcDir + '"');
      expC('destDir: "' + destDir + '" -> "' + destDir + '"');
      expC('syncMethod: UPDATE');
      expC('comparison: TIME');
      expC('isRecursive: true');
      expC('copiesEmpDir: false');
      expC('includesSymlink: false');
      expC('matchedRegExp: null');
      expC('ignoredRegExp: null');
      expC('throws: false');
      expC('Reading srcDir recursively...');
      expC('Found ' + srcInfo.nums.all + ' files and directories in src');
      expC('destDir is not existing');
      expC('Comparing a difference of file TIME');
      srcInfo.files.forEach(function (fileName) {
        expC('"' + fileName + '" (New file)');
      });
      srcInfo.links.forEach(function (linkName) {
        expect(logStr).not.toContain(linkName);
      });
      expC('Finished the function dirBkup.backupDir');
    })();

    // 2. Second Back Up
    (function () {
      // Add a file
      var fileNameAdd = path.join(srcInfo.dirs[1], 'xyzzy');
      var fileAdd = path.join(srcDir, fileNameAdd);
      fs.writeFileSync(fileAdd, 'Added ' + fileNameAdd);

      var logFile = path.join(testDir, 'test2.log');
      var lggr = logger.create('info/' + logFile);
      var retVal = dirBkup.backupDir(srcDir, destDir, {
        // syncMethod: 'UPDATE',
        // comparison: 'TIME',
        // isRecursive: true,
        // copiesEmpDir: false,
        // includesSymlink: false,
        logger: lggr
      });
      expect(retVal).toBeUndefined();

      var logStr = fs.readFileSync(logFile, { encoding: 'utf8' });
      // console.dir(srcInfo);
      // console.log(logStr);
      var expC = expect(logStr).toContain; // Shorthand
      expC('Start the function dirBkup.backupDir');
      expC('srcDir: "' + srcDir + '" -> "' + srcDir + '"');
      expC('destDir: "' + destDir + '" -> "' + destDir + '"');
      expC('syncMethod: UPDATE');
      expC('comparison: TIME');
      expC('isRecursive: true');
      expC('copiesEmpDir: false');
      expC('includesSymlink: false');
      expC('matchedRegExp: null');
      expC('ignoredRegExp: null');
      expC('throws: false');
      expC('Reading srcDir recursively...');
      expC('Found '
        + (srcInfo.dirs.length + srcInfo.files.length + 1)
        + ' files and directories in src');
      expC('Comparing a difference of file TIME');
      expC('"' + fileNameAdd + '" (New file)');
      srcInfo.files.forEach(function (fileName) {
        expect(logStr).not.toContain(fileName);
      });
      srcInfo.links.forEach(function (linkName) {
        expect(logStr).not.toContain(linkName);
      });
      expC('Finished the function dirBkup.backupDir');
    })();

    // Cleaning
    fse.removeSync(testDir);
    expect(fs.existsSync(testDir)).toBe(false);
  });

  testName = 'Op_syncMethod_MIRROR';
  test(testName, function () {
    var testDir = os.makeTmpPath('_' + testName);
    fse.ensureDirSync(testDir);

    var srcDir = path.join(testDir, 'src');
    var srcInfo = _makeTestFiles(srcDir);
    var destDir = path.join(testDir, 'dest');

    // 1. The First Back Up
    (function () {
      var logFile = path.join(testDir, 'test1.log');
      var lggr = logger.create('info/' + logFile);
      var retVal = dirBkup.backupDir(srcDir, destDir, {
        syncMethod: 'MIRROR',
        logger: lggr
      });
      expect(retVal).toBeUndefined();

      var logStr = fs.readFileSync(logFile, { encoding: 'utf8' });
      var expC = expect(logStr).toContain; // Shorthand
      expC('syncMethod: MIRROR');
      expC('Found ' + srcInfo.nums.all + ' files and directories in src');
      expC('destDir is not existing');
      srcInfo.files.forEach(function (fileName) {
        expC('"' + fileName + '" (New file)');
      });
      srcInfo.links.forEach(function (linkName) {
        expect(logStr).not.toContain(linkName);
      });
      expC('Finished the function dirBkup.backupDir');
    })();

    // 2. Second (MIRROR)
    (function () {
      var logFile = path.join(testDir, 'test2.log');
      var lggr = logger.create('info/' + logFile);
      var retVal = dirBkup.backupDir(srcDir, destDir, {
        syncMethod: 'MIRROR',
        logger: lggr
      });
      expect(retVal).toBeUndefined();

      var logStr = fs.readFileSync(logFile, { encoding: 'utf8' });
      // console.dir(srcInfo);
      // console.log(logStr);
      var expC = expect(logStr).toContain; // Shorthand
      expC('syncMethod: MIRROR');
      expC('Found ' + srcInfo.nums.all + ' files and directories in src');
      expC('Found ' + (srcInfo.nums.all - srcInfo.nums.empDir) + ' files and directories in dest');
      srcInfo.files.forEach(function (fileName) {
        expect(logStr).not.toContain(fileName);
      });
      srcInfo.links.forEach(function (linkName) {
        expect(logStr).not.toContain(linkName);
      });
      expC('Finished the function dirBkup.backupDir');
    })();

    // 3. Third (MIRROR)
    (function () {
      // Removes from src
      var fileNameRm = srcInfo.files[3];
      fse.removeSync(path.join(srcDir, fileNameRm));

      var logFile = path.join(testDir, 'test3.log');
      var lggr = logger.create('info/' + logFile);
      var retVal = dirBkup.backupDir(srcDir, destDir, {
        syncMethod: 'MIRROR',
        logger: lggr
      });
      expect(retVal).toBeUndefined();

      var logStr = fs.readFileSync(logFile, { encoding: 'utf8' });
      // console.dir(srcInfo);
      // console.log(logStr);
      var expC = expect(logStr).toContain; // Shorthand
      expC('syncMethod: MIRROR');
      expC('Found ' + (srcInfo.nums.all - 1) + ' files and directories in src');
      expC('Reading destDir recursively...');
      expC('Found ' + (srcInfo.nums.all - srcInfo.nums.empDir) + ' files and directories in dest');
      expC('Comparing a difference of file TIME');
      expC('Remove none-existing files from dest');
      srcInfo.files.forEach(function (fileName) {
        if (includes(fileName, fileNameRm, 'i')) {
          expC('Remove ' + fileNameRm + ' in ' + destDir);
        } else {
          expect(logStr).not.toContain(fileName);
        }
      });
      srcInfo.links.forEach(function (linkName) {
        expect(logStr).not.toContain(linkName);
      });
      expC('Finished the function dirBkup.backupDir');
    })();

    // Cleaning
    fse.removeSync(testDir);
    expect(fs.existsSync(testDir)).toBe(false);
  });

  testName = 'Op_isRecursive';
  test(testName, function () {
    var testDir = os.makeTmpPath('_' + testName);
    fse.ensureDirSync(testDir);

    var srcDir = path.join(testDir, 'src');
    var srcInfo = _makeTestFiles(srcDir);
    var destDir = path.join(testDir, 'dest');

    // 1. The First Back Up (recursive false)
    (function () {
      var logFile = path.join(testDir, 'test1.log');
      var lggr = logger.create('info/' + logFile);
      var retVal = dirBkup.backupDir(srcDir, destDir, {
        isRecursive: false,
        logger: lggr
      });
      expect(retVal).toBeUndefined();

      var logStr = fs.readFileSync(logFile, { encoding: 'utf8' });
      // console.dir(srcInfo);
      // console.log(logStr);
      var expC = expect(logStr).toContain; // Shorthand
      expC('isRecursive: false');
      expC('Reading srcDir...');
      expC('Found ' + srcInfo.nums.root + ' files and directories in src');
      expC('destDir is not existing');
      srcInfo.files.forEach(function (fileName) {
        if (includes(fileName, 'fileRoot', 'i')) {
          expC('"' + fileName + '" (New file)');
        } else {
          expect(logStr).not.toContain(fileName);
        }
      });
      srcInfo.links.forEach(function (linkName) {
        expect(logStr).not.toContain(linkName);
      });
      expC('Finished the function dirBkup.backupDir');
    })();

    // 2. Second Back Up (recursive true)
    (function () {
      var logFile = path.join(testDir, 'test2.log');
      var lggr = logger.create('info/' + logFile);
      var retVal = dirBkup.backupDir(srcDir, destDir, {
        isRecursive: true,
        logger: lggr
      });
      expect(retVal).toBeUndefined();

      var logStr = fs.readFileSync(logFile, { encoding: 'utf8' });
      // console.dir(srcInfo);
      // console.log(logStr);
      var expC = expect(logStr).toContain; // Shorthand
      expC('isRecursive: true');
      expC('Reading srcDir recursively...');
      expC('Found ' + srcInfo.nums.all + ' files and directories in src');
      expC('Reading destDir recursively...');
      expC('Found ' + srcInfo.nums.rootFile + ' files and directories in dest');
      srcInfo.files.forEach(function (fileName) {
        if (includes(fileName, 'fileRoot', 'i')) {
          expect(logStr).not.toContain(fileName);
        } else {
          expC('"' + fileName + '" (New file)');
        }
      });
      srcInfo.links.forEach(function (linkName) {
        expect(logStr).not.toContain(linkName);
      });
      expC('Finished the function dirBkup.backupDir');
    })();

    // Cleaning
    fse.removeSync(testDir);
    expect(fs.existsSync(testDir)).toBe(false);
  });

  testName = 'Op_copiesEmpDir';
  test(testName, function () {
    var testDir = os.makeTmpPath('_' + testName);
    fse.ensureDirSync(testDir);

    var srcDir = path.join(testDir, 'src');
    var srcInfo = _makeTestFiles(srcDir);
    var destDir = path.join(testDir, 'dest');

    // 1. The First Back Up (copiesEmpDir false)
    (function () {
      var logFile = path.join(testDir, 'test1.log');
      var lggr = logger.create('info/' + logFile);
      var retVal = dirBkup.backupDir(srcDir, destDir, {
        copiesEmpDir: false,
        logger: lggr
      });
      expect(retVal).toBeUndefined();

      var logStr = fs.readFileSync(logFile, { encoding: 'utf8' });
      // console.dir(srcInfo);
      // console.log(logStr);
      var expC = expect(logStr).toContain; // Shorthand
      expC('copiesEmpDir: false');
      expC('Reading srcDir recursively...');
      expC('Found ' + srcInfo.nums.all + ' files and directories in src');
      expC('destDir is not existing');
      srcInfo.files.forEach(function (fileName) {
        if (includes(fileName, 'DirEmp', 'i')) {
          expect(logStr).not.toContain(fileName);
        } else {
          expC('"' + fileName + '" (New file)');
        }
      });
      srcInfo.links.forEach(function (linkName) {
        expect(logStr).not.toContain(linkName);
      });
      expC('Finished the function dirBkup.backupDir');
    })();

    // 2. Second Back Up (recursive true)
    (function () {
      var logFile = path.join(testDir, 'test2.log');
      var lggr = logger.create('info/' + logFile);
      var retVal = dirBkup.backupDir(srcDir, destDir, {
        copiesEmpDir: true,
        logger: lggr
      });
      expect(retVal).toBeUndefined();

      var logStr = fs.readFileSync(logFile, { encoding: 'utf8' });
      // console.dir(srcInfo);
      // console.log(logStr);
      var expC = expect(logStr).toContain; // Shorthand
      expC('copiesEmpDir: true');
      expC('Reading srcDir recursively...');
      expC('Found ' + srcInfo.nums.all + ' files and directories in src');
      expC('Reading destDir recursively...');
      expC('Found ' + (srcInfo.nums.all - srcInfo.nums.empDir) + ' files and directories in dest');
      srcInfo.files.forEach(function (fileName) {
        if (includes(fileName, 'DirEmp', 'i')) {
          expC('"' + fileName + '" (New file)');
        } else {
          expect(logStr).not.toContain(fileName);
        }
      });
      srcInfo.links.forEach(function (linkName) {
        expect(logStr).not.toContain(linkName);
      });
      expC('Finished the function dirBkup.backupDir');
    })();

    // Cleaning
    fse.removeSync(testDir);
    expect(fs.existsSync(testDir)).toBe(false);
  });

  testName = 'Op_includesSymlink';
  test(testName, function () {
    var testDir = os.makeTmpPath('_' + testName);
    fse.ensureDirSync(testDir);

    var srcDir = path.join(testDir, 'src');
    var srcInfo = _makeTestFiles(srcDir);
    var destDir = path.join(testDir, 'dest');

    // 1. The First Back Up (includesSymlink true)
    (function () {
      var logFile = path.join(testDir, 'test1.log');
      var lggr = logger.create('info/' + logFile);
      var retVal = dirBkup.backupDir(srcDir, destDir, {
        includesSymlink: true,
        logger: lggr
      });
      expect(retVal).toBeUndefined();

      var logStr = fs.readFileSync(logFile, { encoding: 'utf8' });
      // console.dir(srcInfo);
      // console.log(logStr);
      var expC = expect(logStr).toContain; // Shorthand
      expC('copiesEmpDir: false');
      expC('Reading srcDir recursively...');
      expC('Found ' + srcInfo.nums.allCopied + ' files and directories in src');
      expC('destDir is not existing');
      srcInfo.files.forEach(function (fileName) {
        if (includes(fileName, 'DirEmp', 'i')) {
          expect(logStr).not.toContain(fileName);
        } else {
          expC('"' + fileName + '" (New file)');
        }
      });
      srcInfo.links.forEach(function (linkName) {
        if (linkName === 'DirQuux-Symlink') {
          // A directory is not logged
          expect(logStr).not.toContain(linkName + '" (New file)');
        } else {
          expC('"' + linkName + '" (New file)');
        }
      });
      expC('Finished the function dirBkup.backupDir');
    })();

    // Cleaning
    fse.removeSync(testDir);
    expect(fs.existsSync(testDir)).toBe(false);
  });

  testName = 'Op_RegExp';
  test(testName, function () {
    var testDir = os.makeTmpPath('_' + testName);
    fse.ensureDirSync(testDir);

    var srcDir = path.join(testDir, 'src');
    var srcInfo = _makeTestFiles(srcDir);
    var destDir = path.join(testDir, 'dest');

    // 1. The First Back Up
    (function () {
      var logFile = path.join(testDir, 'test1.log');
      var lggr = logger.create('info/' + logFile);
      var retVal = dirBkup.backupDir(srcDir, destDir, {
        matchedRegExp: '\\.txt$',
        ignoredRegExp: '\\w+quux',
        logger: lggr
      });
      expect(retVal).toBeUndefined();

      var logStr = fs.readFileSync(logFile, { encoding: 'utf8' });
      // console.dir(srcInfo);
      // console.log(logStr);
      var expC = expect(logStr).toContain; // Shorthand
      expC('matchedRegExp: \\.txt$');
      expC('ignoredRegExp: \\w+quux');
      expC('Reading srcDir recursively...');
      expC('Found 2 files and directories in src');
      expC('destDir is not existing');
      srcInfo.files.forEach(function (fileName) {
        if (includes(fileName, 'quux', 'i')) {
          expect(logStr).not.toContain(fileName);
        } else if (endsWith(fileName, '.txt', 'i')) {
          expC('"' + fileName + '" (New file)');
        } else {
          expect(logStr).not.toContain(fileName);
        }
      });
      srcInfo.links.forEach(function (linkName) {
        expect(logStr).not.toContain(linkName);
      });
      expC('Finished the function dirBkup.backupDir');
    })();

    // Cleaning
    fse.removeSync(testDir);
    expect(fs.existsSync(testDir)).toBe(false);
  });

  testName = 'Op_throws';
  test(testName, function () {
    expect('@TODO').toBe('PASS');
  });

  // Archive

  var dirAssets = path.join(__dirname, 'assets');
  var dirBin = path.join(dirAssets, 'bin');
  var dir7zip = path.join(dirBin, '7-Zip');
  var exe7z = path.join(dir7zip, '7z.exe');
  var dirWinRar = path.join(dirBin, 'WinRAR');

  var dirSandbox = path.join(dirAssets, 'Sandbox');
  var dirArchiving = path.join(dirSandbox, 'ZippingDir');
  var dirDest = path.join(dirSandbox, 'DestDir');
  var dirDestDeflate = path.join(dirDest, 'deflate');

  testName = 'archiveIntoZip';
  test(testName, function () {
    var testDir = os.makeTmpPath('_' + testName);
    fse.ensureDirSync(testDir);

    var logFile = path.join(testDir, 'test1.log');
    var lggr = logger.create('info/' + logFile);

    var rtns = dirBkup.archiveDir(dirArchiving, dirDestDeflate, {
      archiveType: 'ZIP',
      compressLv: 9,
      dateCode: 'yyyy-MM-dd',
      password: 'This is mY&p@ss ^_<',
      exe7z: exe7z,
      logger: lggr
    });

    // Checking the Logger log
    var logStr = fs.readFileSync(logFile, { encoding: 'utf8' });
    var expC = expect(logStr).toContain; // Shorthand

    expC('Start the function dirBkup.archiveDir');
    expC('Found 6 files and directories in src');
    expC('throws: false');
    expC('isDryRun: false');
    expC('archiveType: ZIP');
    expC('forEachSubDir: true');
    expC('includesEmptyDir: false');
    expC('includesSymlink: false');
    expC('matchedRegExp: null');
    expC('ignoredRegExp: null');
    expC('Finished the function dirBkup.archiveDir');

    // Checking the returned values
    expect(rtns).toBeDefined();
    expect(rtns).toHaveLength(3);

    rtns.forEach(function (rtn) {
      expect(rtn.exitCode).toBe(0);
      expect(fs.existsSync(rtn.archivedPath)).toBe(true);

      // Cleaning
      fse.removeSync(rtn.archivedPath);
      expect(fs.existsSync(rtn.archivedPath)).toBe(false);
    });

    // Cleaning
    fse.removeSync(testDir);
    expect(fs.existsSync(testDir)).toBe(false);
  });

  var schema = {
    description: 'Example Schema WshDirBackUpper',
    components: {
      dest: '\\\\MyNas\\BackUp',
      exe7z: 'C:\\My Apps\\7-Zip\\7z.exe',
      anyVal1: null
    },
    tasks: {
      userAppData: {
        description: 'Example task with options',
        srcDir: 'C:\\Users\\Default\\AppData',
        destDir: '${dest}\\AppData\\#{yyyy}\\#{MM-dd}',
        method: 'UPDATE',
        options: {
          comparison: 'TIME',
          ignoredRegExp: [
            'Windows\\\\WebCache',
            'Packages\\\\.*Cache\\\\',
            '\\.mui$',
            '\\.settingcontent-ms$'
          ]
        }
      },
      'userAppData:zip': {
        srcDir: 'C:\\Users\\Default\\AppData',
        destDir: '${dest}\\AppData\\archives',
        method: 'ARCHIVE',
        options: {
          archiveType: 'ZIP',
          exe7z: '${exe7z}',
          dateCode: 'yyyy-MM-dd',
          compressLv: 9,
          password: 'This is mY&p@ss ^_<',
          ignoredRegExp: ['\\.git.*']
        }
      },
      'appLog:current': {
        srcDir: 'D:\\AppLogs\\#{yyyy}\\#{MM}',
        destDir: '${dest}\\AppLogs\\#{yyyy}\\#{MM}',
        method: 'MIRROR',
        options: {
          comparison: 'CONTENT',
          isRecursive: false,
          copiesEmpDir: true,
          includesSymlink: true,
          matchedRegExp: '\\.csv$'
        }
      },
      'appLog:lastMonth': {
        available: false,
        srcDir: '${anyVal1}:\\AppLogs\\#{yyyy\\[MM-1]}',
        destDir: '${dest}\\AppLogs\\#{yyyy\\[MM-1]}',
        method: 'MIRROR',
        options: {
          comparison: 'TIME',
          matchedRegExp: '\\.csv$'
        }
      }
    }
  };

  testName = 'Schema_all_dryRun';
  test(testName, function () {
    // Creating a temporary log directory
    var testDir = os.makeTmpPath('_' + testName);
    fse.ensureDirSync(testDir);

    var logFile = path.join(testDir, 'test1.log');
    var lggr = logger.create('info/' + logFile);

    // Executing
    var asterisk = '*';
    var rtn = dirBkup.backupDirUsingSchema(schema, asterisk, {
      logger: lggr,
      isDryRun: true
    });
    expect(rtn).toBeUndefined();

    // Checking the executing log
    var logStr = fs.readFileSync(logFile, { encoding: 'utf8' });
    var expC = expect(logStr).toContain; // Shorthand

    expC('Start the function dirBkup.backupDirUsingSchema');
    expC('isDryRun: true');
    expC('taskName: ' + asterisk);
    expC('matched tasks number: ' + Object.keys(schema.tasks).length);
    expC('Start the function dirBkup.backupDir');

    // Checking a task executed or not
    Object.keys(schema.tasks).forEach(function (taskName) {
      expC('Start the task: ' + taskName);

      if (schema.tasks[taskName].available === false) {
        expC('available: false => Skip the task: ' + taskName);
      } else {
        expC('Finished the task: ' + taskName);
      }
    });

    expC('Finished the function dirBkup.backupDir');
    expC('Finished the function dirBkup.backupDirUsingSchema');

    // Cleaning
    fse.removeSync(testDir);
    expect(fs.existsSync(testDir)).toBe(false);
  });

  testName = 'Schema_task1_dryRun';
  test(testName, function () {
    // Creating a temporary log directory
    var testDir = os.makeTmpPath('_' + testName);
    fse.ensureDirSync(testDir);

    var logFile = path.join(testDir, 'test1.log');
    var lggr = logger.create('info/' + logFile);

    // Executing
    var taskName = 'userAppData';

    var rtn = dirBkup.backupDirUsingSchema(schema, taskName, {
      logger: lggr,
      isDryRun: true
    });
    expect(rtn).toBeUndefined();

    // Checking the executing log
    var logStr = fs.readFileSync(logFile, { encoding: 'utf8' });
    var expC = expect(logStr).toContain; // Shorthand

    expC('Start the function dirBkup.backupDirUsingSchema');
    expC('isDryRun: true');
    expC('throws: false');
    expC('taskName: ' + taskName);
    expC('matched tasks number: 1');

    var task = schema.tasks[taskName];
    var srcDir = parseDate(parseTmp(task.srcDir, schema.components));
    var destDir = parseDate(parseTmp(task.destDir, schema.components));

    expC('Start the task: ' + taskName);
    expC('srcDir: ' + task.srcDir + ' -> ' + srcDir);
    expC('destDir: ' + task.destDir + ' -> ' + destDir);
    expC('method: ' + task.method);

    expC('Start the function dirBkup.backupDir');
    expC('comparison: ' + task.options.comparison);
    expC('isRecursive: true');
    expC('copiesEmpDir: false');
    expC('includesSymlink: false');
    expC('matchedRegExp: null');
    expC('ignoredRegExp: (' + task.options.ignoredRegExp.join('|') + ')');
    expC('Reading srcDir recursively...');
    expC('Comparing a difference of file ' + task.options.comparison);
    expC('Finished the function dirBkup.backupDir');

    expC('Finished the task: ' + taskName);
    expC('Finished the function dirBkup.backupDirUsingSchema');

    // Cleaning
    fse.removeSync(testDir);
    expect(fs.existsSync(testDir)).toBe(false);
  });

  testName = 'Schema_task2_dryRun';
  test(testName, function () {
    // Creating a temporary log directory
    var testDir = os.makeTmpPath('_' + testName);
    fse.ensureDirSync(testDir);

    var logFile = path.join(testDir, 'test1.log');
    var lggr = logger.create('info/' + logFile);

    // Executing
    var taskName = 'userAppData*';
    var rtn = dirBkup.backupDirUsingSchema(schema, taskName, {
      logger: lggr,
      isDryRun: true
    });
    expect(rtn).toBeUndefined();

    // Checking the executing log
    var logStr = fs.readFileSync(logFile, { encoding: 'utf8' });
    var expC = expect(logStr).toContain; // Shorthand

    expC('Start the function dirBkup.backupDirUsingSchema');
    expC('isDryRun: true');
    expC('throws: false');
    expC('taskName: ' + taskName);
    expC('matched tasks number: 2');

    // userAppData
    expC('Start the task: userAppData');
    expC('Start the function dirBkup.backupDir');
    expC('Finished the function dirBkup.backupDir');
    expC('Finished the task: userAppData');

    // userAppData:zip
    var task = schema.tasks['userAppData:zip'];
    var srcDir = parseDate(parseTmp(task.srcDir, schema.components));
    var destDir = parseDate(parseTmp(task.destDir, schema.components));

    expC('Start the task: userAppData:zip');
    expC('srcDir: ' + task.srcDir + ' -> ' + srcDir);
    expC('destDir: ' + task.destDir + ' -> ' + destDir);
    expC('method: ' + task.method);
    expC('options.exe7z: ${exe7z} -> ' + schema.components.exe7z);

    expC('Start the function dirBkup.archiveDir');
    expC('archiveType: ' + task.options.archiveType);
    expC('forEachSubDir: true');
    expC('includesEmptyDir: false');
    expC('includesSymlink: false');
    expC('matchedRegExp: null');
    expC('ignoredRegExp: (' + task.options.ignoredRegExp + ')');
    expC('Finished the function dirBkup.archiveDir');

    expC('Finished the task: userAppData:zip');
    expC('Finished the function dirBkup.backupDirUsingSchema');

    // Cleaning
    fse.removeSync(testDir);
    expect(fs.existsSync(testDir)).toBe(false);
  });

  testName = 'Schema_task3_dryRun';
  test(testName, function () {
    // Creating a temporary log directory
    var testDir = os.makeTmpPath('_' + testName);
    fse.ensureDirSync(testDir);

    var logFile = path.join(testDir, 'test1.log');
    var lggr = logger.create('info/' + logFile);

    // Executing
    var taskName = 'appLog:current';
    var rtn = dirBkup.backupDirUsingSchema(schema, taskName, {
      logger: lggr,
      isDryRun: true
    });
    expect(rtn).toBeUndefined();

    // Checking the executing log
    var logStr = fs.readFileSync(logFile, { encoding: 'utf8' });
    var expC = expect(logStr).toContain; // Shorthand

    expC('Start the function dirBkup.backupDirUsingSchema');
    expC('isDryRun: true');
    expC('throws: false');
    expC('taskName: ' + taskName);
    expC('matched tasks number: 1');

    var task = schema.tasks[taskName];
    var srcDir = parseDate(parseTmp(task.srcDir, schema.components));
    var destDir = parseDate(parseTmp(task.destDir, schema.components));

    expC('Start the task: ' + taskName);
    expC('srcDir: ' + task.srcDir + ' -> ' + srcDir);
    expC('destDir: ' + task.destDir + ' -> ' + destDir);
    expC('method: ' + task.method);

    expC('Start the function dirBkup.backupDir');
    expC('comparison: ' + task.options.comparison);
    expC('isRecursive: ' + task.options.isRecursive);
    expC('copiesEmpDir: ' + task.options.copiesEmpDir);
    expC('includesSymlink: ' + task.options.includesSymlink);
    expC('matchedRegExp: ' + task.options.matchedRegExp);
    expC('ignoredRegExp: null');
    expC('Reading srcDir...');
    expC('Error: [] Error: ENOENT: no such file or directory');

    expC('Finished the function dirBkup.backupDirUsingSchema');
    expC('Finished the task: ' + taskName);
    expC('Finished the function dirBkup.backupDirUsingSchema');

    // Cleaning
    fse.removeSync(testDir);
    expect(fs.existsSync(testDir)).toBe(false);
  });
});
