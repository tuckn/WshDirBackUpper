/* globals Wsh: false */
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
var dirbkup = Wsh.DirBackUpper;

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
    var retVal = dirbkup.backupDirUsingLog(srcDir, destDir, {
      logger: lggr,
      isDryRun: true
    });
    expect(retVal).toBeUndefined();

    var logStr = fs.readFileSync(logFile, { encoding: 'utf8' });
    // console.log(logStr);
    var expC = expect(logStr).toContain; // Shorthand
    expC('Start the function dirbkup.backupDirUsingLog');
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
    expC('Compare "TIME" differences of file and copy');
    // ...
    expC('Finished the function dirbkup.backupDirUsingLog');

    // Cleans
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
    var retVal = dirbkup.backupDirUsingLog(srcDir, destDir, {
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
    expC('Start the function dirbkup.backupDirUsingLog');
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
    expC('Compare "CONTENT" differences of file and copy');
    expC('Start the function dirbkup.backupDirUsingLog');
    // ...
    expC('Remove none-existing files from dest');
    expC('Finished the function dirbkup.backupDirUsingLog');

    // Cleans
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
      var retVal = dirbkup.backupDirUsingLog(srcDir, destDir, {
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
      expC('Start the function dirbkup.backupDirUsingLog');
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
      expC('Found ' + srcInfo.nums.all + ' files/directories in src');
      expC('destDir is not existing');
      expC('Compare "TIME" differences of file and copy');
      srcInfo.files.forEach(function (fileName) {
        expC('"' + fileName + '" is copied (New file)');
      });
      srcInfo.links.forEach(function (linkName) {
        expect(logStr).not.toContain(linkName);
      });
      expC('Finished the function dirbkup.backupDirUsingLog');
    })();

    // 2. Second Back Up
    (function () {
      // Add a file
      var fileNameAdd = path.join(srcInfo.dirs[1], 'xyzzy');
      var fileAdd = path.join(srcDir, fileNameAdd);
      fs.writeFileSync(fileAdd, 'Added ' + fileNameAdd);

      var logFile = path.join(testDir, 'test2.log');
      var lggr = logger.create('info/' + logFile);
      var retVal = dirbkup.backupDirUsingLog(srcDir, destDir, {
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
      expC('Start the function dirbkup.backupDirUsingLog');
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
        + ' files/directories in src');
      expC('Compare "TIME" differences of file and copy');
      expC('"' + fileNameAdd + '" is copied (New file)');
      srcInfo.files.forEach(function (fileName) {
        expect(logStr).not.toContain(fileName);
      });
      srcInfo.links.forEach(function (linkName) {
        expect(logStr).not.toContain(linkName);
      });
      expC('Finished the function dirbkup.backupDirUsingLog');
    })();

    // Cleans
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
      var retVal = dirbkup.backupDirUsingLog(srcDir, destDir, {
        syncMethod: 'MIRROR',
        logger: lggr
      });
      expect(retVal).toBeUndefined();

      var logStr = fs.readFileSync(logFile, { encoding: 'utf8' });
      var expC = expect(logStr).toContain; // Shorthand
      expC('syncMethod: MIRROR');
      expC('Found ' + srcInfo.nums.all + ' files/directories in src');
      expC('destDir is not existing');
      srcInfo.files.forEach(function (fileName) {
        expC('"' + fileName + '" is copied (New file)');
      });
      srcInfo.links.forEach(function (linkName) {
        expect(logStr).not.toContain(linkName);
      });
      expC('Finished the function dirbkup.backupDirUsingLog');
    })();

    // 2. Second (MIRROR)
    (function () {
      var logFile = path.join(testDir, 'test2.log');
      var lggr = logger.create('info/' + logFile);
      var retVal = dirbkup.backupDirUsingLog(srcDir, destDir, {
        syncMethod: 'MIRROR',
        logger: lggr
      });
      expect(retVal).toBeUndefined();

      var logStr = fs.readFileSync(logFile, { encoding: 'utf8' });
      // console.dir(srcInfo);
      // console.log(logStr);
      var expC = expect(logStr).toContain; // Shorthand
      expC('syncMethod: MIRROR');
      expC('Found ' + srcInfo.nums.all + ' files/directories in src');
      expC('Found ' + (srcInfo.nums.all - srcInfo.nums.empDir) + ' files/directories in dest');
      srcInfo.files.forEach(function (fileName) {
        expect(logStr).not.toContain(fileName);
      });
      srcInfo.links.forEach(function (linkName) {
        expect(logStr).not.toContain(linkName);
      });
      expC('Finished the function dirbkup.backupDirUsingLog');
    })();

    // 3. Third (MIRROR)
    (function () {
      // Removes from src
      var fileNameRm = srcInfo.files[3];
      fse.removeSync(path.join(srcDir, fileNameRm));

      var logFile = path.join(testDir, 'test3.log');
      var lggr = logger.create('info/' + logFile);
      var retVal = dirbkup.backupDirUsingLog(srcDir, destDir, {
        syncMethod: 'MIRROR',
        logger: lggr
      });
      expect(retVal).toBeUndefined();

      var logStr = fs.readFileSync(logFile, { encoding: 'utf8' });
      // console.dir(srcInfo);
      // console.log(logStr);
      var expC = expect(logStr).toContain; // Shorthand
      expC('syncMethod: MIRROR');
      expC('Found ' + (srcInfo.nums.all - 1) + ' files/directories in src');
      expC('Reading destDir recursively...');
      expC('Found ' + (srcInfo.nums.all - srcInfo.nums.empDir) + ' files/directories in dest');
      expC('Compare "TIME" differences of file and copy');
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
      expC('Finished the function dirbkup.backupDirUsingLog');
    })();

    // Cleans
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
      var retVal = dirbkup.backupDirUsingLog(srcDir, destDir, {
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
      expC('Found ' + srcInfo.nums.root + ' files/directories in src');
      expC('destDir is not existing');
      srcInfo.files.forEach(function (fileName) {
        if (includes(fileName, 'fileRoot', 'i')) {
          expC('"' + fileName + '" is copied (New file)');
        } else {
          expect(logStr).not.toContain(fileName);
        }
      });
      srcInfo.links.forEach(function (linkName) {
        expect(logStr).not.toContain(linkName);
      });
      expC('Finished the function dirbkup.backupDirUsingLog');
    })();

    // 2. Second Back Up (recursive true)
    (function () {
      var logFile = path.join(testDir, 'test2.log');
      var lggr = logger.create('info/' + logFile);
      var retVal = dirbkup.backupDirUsingLog(srcDir, destDir, {
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
      expC('Found ' + srcInfo.nums.all + ' files/directories in src');
      expC('Reading destDir recursively...');
      expC('Found ' + srcInfo.nums.rootFile + ' files/directories in dest');
      srcInfo.files.forEach(function (fileName) {
        if (includes(fileName, 'fileRoot', 'i')) {
          expect(logStr).not.toContain(fileName);
        } else {
          expC('"' + fileName + '" is copied (New file)');
        }
      });
      srcInfo.links.forEach(function (linkName) {
        expect(logStr).not.toContain(linkName);
      });
      expC('Finished the function dirbkup.backupDirUsingLog');
    })();

    // Cleans
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
      var retVal = dirbkup.backupDirUsingLog(srcDir, destDir, {
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
      expC('Found ' + srcInfo.nums.all + ' files/directories in src');
      expC('destDir is not existing');
      srcInfo.files.forEach(function (fileName) {
        if (includes(fileName, 'DirEmp', 'i')) {
          expect(logStr).not.toContain(fileName);
        } else {
          expC('"' + fileName + '" is copied (New file)');
        }
      });
      srcInfo.links.forEach(function (linkName) {
        expect(logStr).not.toContain(linkName);
      });
      expC('Finished the function dirbkup.backupDirUsingLog');
    })();

    // 2. Second Back Up (recursive true)
    (function () {
      var logFile = path.join(testDir, 'test2.log');
      var lggr = logger.create('info/' + logFile);
      var retVal = dirbkup.backupDirUsingLog(srcDir, destDir, {
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
      expC('Found ' + srcInfo.nums.all + ' files/directories in src');
      expC('Reading destDir recursively...');
      expC('Found ' + (srcInfo.nums.all - srcInfo.nums.empDir) + ' files/directories in dest');
      srcInfo.files.forEach(function (fileName) {
        if (includes(fileName, 'DirEmp', 'i')) {
          expC('"' + fileName + '" is copied (New file)');
        } else {
          expect(logStr).not.toContain(fileName);
        }
      });
      srcInfo.links.forEach(function (linkName) {
        expect(logStr).not.toContain(linkName);
      });
      expC('Finished the function dirbkup.backupDirUsingLog');
    })();

    // Cleans
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
      var retVal = dirbkup.backupDirUsingLog(srcDir, destDir, {
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
      expC('Found ' + srcInfo.nums.allCopied + ' files/directories in src');
      expC('destDir is not existing');
      srcInfo.files.forEach(function (fileName) {
        if (includes(fileName, 'DirEmp', 'i')) {
          expect(logStr).not.toContain(fileName);
        } else {
          expC('"' + fileName + '" is copied (New file)');
        }
      });
      srcInfo.links.forEach(function (linkName) {
        if (linkName === 'DirQuux-Symlink') {
          // A directory is not logged
          expect(logStr).not.toContain(linkName + '" is copied (New file)');
        } else {
          expC('"' + linkName + '" is copied (New file)');
        }
      });
      expC('Finished the function dirbkup.backupDirUsingLog');
    })();

    // Cleans
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
      var retVal = dirbkup.backupDirUsingLog(srcDir, destDir, {
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
      expC('Found 2 files/directories in src');
      expC('destDir is not existing');
      srcInfo.files.forEach(function (fileName) {
        if (includes(fileName, 'quux', 'i')) {
          expect(logStr).not.toContain(fileName);
        } else if (endsWith(fileName, '.txt', 'i')) {
          expC('"' + fileName + '" is copied (New file)');
        } else {
          expect(logStr).not.toContain(fileName);
        }
      });
      srcInfo.links.forEach(function (linkName) {
        expect(logStr).not.toContain(linkName);
      });
      expC('Finished the function dirbkup.backupDirUsingLog');
    })();

    // Cleans
    fse.removeSync(testDir);
    expect(fs.existsSync(testDir)).toBe(false);
  });

  testName = 'Op_throws';
  test(testName, function () {
    expect('@TODO').toBe('PASS');
  });

  var schema = {
    description: 'Example Schema WshDirBackUpper',
    components: {
      dest: '\\\\MyNas\\BackUp',
      anyVal1: null
    },
    tasks: {
      userAppData: {
        description: 'Example task with options',
        srcDir: 'C:\\Users\\Default\\AppData',
        destDir: '${dest}\\AppData\\#{yyyy}\\#{MM-dd}',
        ignoredRegExp: [
          'Windows\\\\WebCache',
          'Packages\\\\.*Cache\\\\',
          '\\.mui$',
          '\\.settingcontent-ms$'
        ]
      },
      'appLog:current': {
        srcDir: 'D:\\AppLogs\\#{yyyy}\\#{MM}',
        destDir: '${dest}\\AppLogs\\#{yyyy}\\#{MM}',
        syncMethod: 'MIRROR',
        comparison: 'CONTENT',
        isRecursive: false,
        copiesEmpDir: true,
        includesSymlink: true,
        matchedRegExp: '\\.csv$'
      },
      'appLog:lastMonth': {
        available: false,
        srcDir: '${anyVal1}:\\AppLogs\\#{yyyy\\[MM-1]}',
        destDir: '${dest}\\AppLogs\\#{yyyy\\[MM-1]}',
        syncMethod: 'MIRROR',
        comparison: 'TIME',
        matchedRegExp: '\\.csv$'
      }
    }
  };

  testName = 'Schema_all_dryRun';
  test(testName, function () {
    var testDir = os.makeTmpPath('_' + testName);
    fse.ensureDirSync(testDir);

    var logFile = path.join(testDir, 'test1.log');
    var lggr = logger.create('info/' + logFile);

    var taskName = '*';
    var retVal = dirbkup.backupDirUsingSchema(schema, taskName, {
      logger: lggr,
      isDryRun: true
    });
    expect(retVal).toBeUndefined();

    var logStr = fs.readFileSync(logFile, { encoding: 'utf8' });
    // console.log(logStr);
    var expC = expect(logStr).toContain; // Shorthand
    expC('Start function dirbkup.backupDirUsingSchema');
    expC('taskName: "' + taskName + '"');
    expC('matched tasks: ' + Object.keys(schema.tasks).length);
    expC('dry-run [dirbkup.backupDirUsingSchema]:');
    expC('Start the function dirbkup.backupDirUsingLog');

    // 1. task: userAppData
    (function () {
      var params = schema.tasks.userAppData;
      var srcDir = parseDate(parseTmp(params.srcDir, schema.components));
      var destDir = parseDate(parseTmp(params.destDir, schema.components));
      expC('Start the task: userAppData');
      expC('srcDir: "' + srcDir + '" -> "' + srcDir + '"');
      expC('destDir: "' + destDir + '" -> "' + destDir + '"');
      expC('syncMethod: UPDATE');
      expC('comparison: TIME');
      expC('isRecursive: true');
      expC('copiesEmpDir: false');
      expC('includesSymlink: false');
      expC('matchedRegExp: null');
      expC('ignoredRegExp: (' + params.ignoredRegExp.join('|') + ')');
      expC('throws: false');
      expC('Reading srcDir recursively...');
      expC('Compare "TIME" differences of file and copy');
    })();

    // 2. task: appLog:current
    (function () {
      var params = schema.tasks['appLog:current'];
      var srcDir = parseDate(parseTmp(params.srcDir, schema.components));
      var destDir = parseDate(parseTmp(params.destDir, schema.components));
      expC('Start the task: appLog:current');
      expC('srcDir: "' + srcDir + '" -> "' + srcDir + '"');
      expC('destDir: "' + destDir + '" -> "' + destDir + '"');
      expC('syncMethod: MIRROR');
      expC('comparison: CONTENT');
      expC('isRecursive: false');
      expC('copiesEmpDir: true');
      expC('includesSymlink: true');
      expC('matchedRegExp: ' + params.matchedRegExp);
      expC('ignoredRegExp: null');
      expC('throws: false');
      expC('Reading srcDir...');
      expC('Error: [] Error: ENOENT: no such file or directory');
    })();

    // 3. task: appLog:lastMonth
    (function () {
      expC('Start the task: appLog:lastMonth');
      expC('available: false => Skip this task');
    })();

    expC('Finished function dirbkup.backupDirUsingSchema');

    // Cleans
    fse.removeSync(testDir);
    expect(fs.existsSync(testDir)).toBe(false);
  });

  testName = 'Schema_log_dryRun';
  test(testName, function () {
    var testDir = os.makeTmpPath('_' + testName);
    fse.ensureDirSync(testDir);

    var logFile = path.join(testDir, 'test1.log');
    var lggr = logger.create('info/' + logFile);

    var taskName = 'appLog:*';
    var retVal = dirbkup.backupDirUsingSchema(schema, taskName, {
      logger: lggr,
      isDryRun: true
    });
    expect(retVal).toBeUndefined();

    var logStr = fs.readFileSync(logFile, { encoding: 'utf8' });
    // console.log(logStr);
    var expC = expect(logStr).toContain; // Shorthand
    expC('Start function dirbkup.backupDirUsingSchema');
    expC('taskName: "' + taskName + '"');
    expC('matched tasks: 2');
    expC('dry-run [dirbkup.backupDirUsingSchema]:');
    expC('Start the function dirbkup.backupDirUsingLog');

    // 1. task: userAppData
    (function () {
      expect(logStr).not.toContain('Start the task: userAppData');
    })();

    // 2. task: appLog:current
    (function () {
      var params = schema.tasks['appLog:current'];
      var srcDir = parseDate(parseTmp(params.srcDir, schema.components));
      var destDir = parseDate(parseTmp(params.destDir, schema.components));
      expC('Start the task: appLog:current');
      expC('srcDir: "' + srcDir + '" -> "' + srcDir + '"');
      expC('destDir: "' + destDir + '" -> "' + destDir + '"');
      expC('syncMethod: MIRROR');
      expC('comparison: CONTENT');
      expC('isRecursive: false');
      expC('copiesEmpDir: true');
      expC('includesSymlink: true');
      expC('matchedRegExp: ' + params.matchedRegExp);
      expC('ignoredRegExp: null');
      expC('throws: false');
      expC('Reading srcDir...');
      expC('Error: [] Error: ENOENT: no such file or directory');
    })();

    // 3. task: appLog:lastMonth
    (function () {
      expC('Start the task: appLog:lastMonth');
      expC('available: false => Skip this task');
    })();

    expC('Finished function dirbkup.backupDirUsingSchema');

    // Cleans
    fse.removeSync(testDir);
    expect(fs.existsSync(testDir)).toBe(false);
  });
});
