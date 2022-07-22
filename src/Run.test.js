/* globals Wsh: false */
/* globals process: false */
/* globals __filename: false */
/* globals __dirname: false */

/* globals describe: false */
/* globals test: false */
/* globals expect: false */

// Shorthand
var util = Wsh.Util;
var path = Wsh.Path;
var os = Wsh.OS;
var fs = Wsh.FileSystem;
var fse = Wsh.FileSystemExtra;
var child_process = Wsh.ChildProcess;

var includes = util.includes;
var parseTmp = util.parseTemplateLiteral;
var parseDate = util.parseDateLiteral;
var srrd = os.surroundCmdArg;
var CSCRIPT = os.exefiles.cscript;
var execSync = child_process.execSync;

var testRun;
if (includes(process.execArgv, '//job:test:dist:Run')) {
  testRun = srrd(CSCRIPT) + ' ' + srrd(path.join(__dirname, 'dist', 'Run.wsf')) + ' //nologo';
} else {
  testRun = srrd(CSCRIPT) + ' ' + srrd(__filename) + ' //nologo //job:test:src:Run';
}

describe('Run', function () {
  var testName;

  testName = 'backup_help';
  test(testName, function () {
    var args = ['backup', '-h'];
    var retObj = execSync(testRun + ' ' + args.join(' '));
    // console.dir(retObj);
    expect(retObj.error).toBeFalsy();
    expect(retObj.stderr).toBe('');

    var expC = expect(retObj.stdout).toContain; // Shorthand
    expC('Usage: backup <srcDir> <destDir> [options]');
    expC('The command to back up a directory');
    expC('Options:');
    expC('  -S, --sync-method <method>     Synchronization method. "UPDATE" (default) or "MIRROR"');
    expC('  -C, --comparison <method>      Comparison method. Default is "TIME" (modification date). otherwise "CONTENT" (MD5, slow)\r\n');
    // ...
  });

  testName = 'backup_DefOp_dryRun';
  test(testName, function () {
    var srcDir = path.join(process.cwd(), 'WshModules', 'WshJest');
    var destDir = 'D:\\BackUp\\Users\\#{yyyy-[MM - 2]}';
    var destDirParsed = parseDate('D:\\BackUp\\Users\\#{yyyy-[MM - 2]}');
    var args = ['backup', srrd(srcDir), srrd(destDir), '--dry-run'];
    var retObj = execSync(testRun + ' ' + args.join(' '));
    // console.dir(retObj);
    expect(retObj.error).toBeFalsy();
    expect(retObj.stderr).toBe('');

    var expC = expect(retObj.stdout).toContain; // Shorthand
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
    expC('Comparing a difference of file TIME');
    // ...
    expC('Finished the function dirbkup.backupDirUsingLog');
  });

  testName = 'backup_Op1_dryRun';
  test(testName, function () {
    var srcDir = path.join(process.cwd(), 'WshModules', 'WshJest');
    var destDir = 'D:\\BackUp\\Users\\#{yyyy-[MM - 2]}';
    var destDirParsed = parseDate('D:\\BackUp\\Users\\#{yyyy-[MM - 2]}');

    var args = ['backup', srrd(srcDir), srrd(destDir),
      '--sync-method MIRROR',
      '--comparison CONTENT',
      '--no-recursively',
      '--no-omit-empdir',
      '--no-omit-symlink',
      '--matched-reg \\.js',
      '--ignored-reg \\.git\\w+',
      '--no-ignore-err',
      '--dry-run'
    ];
    var retObj = execSync(testRun + ' ' + args.join(' '));
    // console.dir(retObj);
    expect(retObj.error).toBeFalsy();
    expect(retObj.stderr).toBe('');

    var expC = expect(retObj.stdout).toContain; // Shorthand
    expC('Start the function dirbkup.backupDirUsingLog');
    expC('srcDir: "' + srcDir + '" -> "' + srcDir + '"');
    expC('destDir: "' + destDir + '" -> "' + destDirParsed + '"');
    expC('syncMethod: MIRROR');
    expC('comparison: CONTENT');
    expC('isRecursive: false');
    expC('copiesEmpDir: true');
    expC('includesSymlink: true');
    expC('matchedRegExp: \\.js');
    expC('ignoredRegExp: \\.git\\w+');
    expC('throws: true');
    expC('Reading srcDir...');
    expC('Found ');
    expC('destDir is not existing');
    expC('Comparing a difference of file CONTENT');
    // ...
    expC('Finished the function dirbkup.backupDirUsingLog');
  });

  testName = 'schemaBackup_help_noArg';
  test(testName, function () {
    var args = ['schemaBackup'];
    var retObj = execSync(testRun + ' ' + args.join(' '));
    // console.dir(retObj);
    expect(retObj.error).toBeTruthy();
    expect(retObj.stdout).toBe(''); // Stdout

    var expC = expect(retObj.stderr).toContain; // Shorthand
    expC('Usage: schemaBackup <taskName> [overwriteKey:val...] [options]');
    expC('The command to back up directories defined with a schema JSON');
    expC('Options:');
    expC('  -V, --version          Output the version number');
    expC('  -D, --dir-path <path>  The path name where the schema JSON is located. <Directory Path> or "cwd", "portable", "userProfile". Default: "cmd" is "%CD%\\.wsh"');
    // ...
  });

  testName = 'schemaBackup_help';
  test(testName, function () {
    var args = ['schemaBackup', '-h'];
    var retObj = execSync(testRun + ' ' + args.join(' '));
    // console.dir(retObj);
    expect(retObj.error).toBeFalsy();
    expect(retObj.stderr).toBe('');

    var expC = expect(retObj.stdout).toContain; // Shorthand
    expC('Usage: schemaBackup <taskName> [overwriteKey:val...] [options]');
    expC('The command to back up directories defined with a schema JSON');
    expC('Options:');
    expC('  -V, --version          Output the version number');
    expC('  -D, --dir-path <path>  The path name where the schema JSON is located. <Directory Path> or "cwd", "portable", "userProfile". Default: "cmd" is "%CD%\\.wsh"');
    // ...
  });

  var schema = {
    dirBackUpperSchema: {
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
    }
  };

  testName = 'schemaBackup_dryRun';
  test(testName, function () {
    var tmpDir = os.makeTmpPath() + '_' + testName;
    var wshDir = path.join(tmpDir, '.wsh');
    var schemaJson = path.join(wshDir, 'settings.json');

    fse.ensureDirSync(wshDir);
    fse.writeJsonSync(schemaJson, schema);

    var args = ['schemaBackup', '*', '--dir-path', wshDir, '--dry-run'];
    var retObj = execSync(testRun + ' ' + args.join(' '));
    // console.dir(retObj);
    // expect(retObj.error).toBeFalsy();
    // expect(retObj.stderr).toBe('');

    var scm = schema.dirBackUpperSchema;
    var tasks = scm.tasks;
    var expC = expect(retObj.stdout).toContain; // Shorthand
    expC('Start function dirbkup.backupDirUsingSchema');
    expC('taskName: "*"');
    expC('matched tasks: ' + Object.keys(tasks).length);
    expC('dry-run [dirbkup.backupDirUsingSchema]:');
    expC('Start the function dirbkup.backupDirUsingLog');

    (function () {
      var params = scm.tasks.userAppData;
      var srcDir = parseDate(parseTmp(params.srcDir, scm.components));
      var destDir = parseDate(parseTmp(params.destDir, scm.components));
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
      expC('Comparing a difference of file TIME');
    })();

    (function () {
      var params = scm.tasks['appLog:current'];
      var srcDir = parseDate(parseTmp(params.srcDir, scm.components));
      var destDir = parseDate(parseTmp(params.destDir, scm.components));
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
    })();

    (function () {
      expC('Start the task: appLog:lastMonth');
      expC('available: false => Skip this task');
    })();

    expC('Finished function dirbkup.backupDirUsingSchema');

    // Cleans
    fse.removeSync(tmpDir);
    expect(fs.existsSync(tmpDir)).toBe(false);
  });

  testName = 'schemaBackup_dryRun_task';
  test(testName, function () {
    var tmpDir = os.makeTmpPath() + '_' + testName;
    var wshDir = path.join(tmpDir, '.wsh');
    var schemaJson = path.join(wshDir, 'settings.json');

    fse.ensureDirSync(wshDir);
    fse.writeJsonSync(schemaJson, schema);

    var args = ['schemaBackup', 'appLog:*', '--dir-path', wshDir, '--dry-run'];
    var retObj = execSync(testRun + ' ' + args.join(' '));
    // console.dir(retObj);
    // expect(retObj.error).toBeFalsy();
    // expect(retObj.stderr).toBe('');

    var scm = schema.dirBackUpperSchema;
    var tasks = scm.tasks;
    var expC = expect(retObj.stdout).toContain; // Shorthand
    expC('Start function dirbkup.backupDirUsingSchema');
    expC('taskName: "appLog:*"');
    expC('matched tasks: 2');
    expC('dry-run [dirbkup.backupDirUsingSchema]:');
    expC('Start the function dirbkup.backupDirUsingLog');

    (function () {
      expect(retObj.stdout).not.toContain('Start the task: userAppData');
    })();

    (function () {
      var params = tasks['appLog:current'];
      var srcDir = parseDate(parseTmp(params.srcDir, scm.components));
      var destDir = parseDate(parseTmp(params.destDir, scm.components));
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
    })();

    (function () {
      expC('Start the task: appLog:lastMonth');
      expC('available: false => Skip this task');
    })();

    expC('Finished function dirbkup.backupDirUsingSchema');

    // Cleans
    fse.removeSync(tmpDir);
    expect(fs.existsSync(tmpDir)).toBe(false);
  });

  testName = 'schemaBackup_dryRun_defJson';
  test(testName, function () {
    var args = ['schemaBackup', '*', '--dry-run'];
    var retObj = execSync(testRun + ' ' + args.join(' '));
    // console.dir(retObj);
    // expect(retObj.error).toBeFalsy();
    // expect(retObj.stderr).toBe('');

    var scm = schema.dirBackUpperSchema;
    var tasks = scm.tasks;
    var expC = expect(retObj.stdout).toContain; // Shorthand
    expC('Start function dirbkup.backupDirUsingSchema');
    expC('taskName: "*"');
    expC('matched tasks: ' + Object.keys(tasks).length);
    expC('dry-run [dirbkup.backupDirUsingSchema]:');
    expC('Start the function dirbkup.backupDirUsingLog');

    (function () {
      var params = scm.tasks.userAppData;
      var srcDir = parseDate(parseTmp(params.srcDir, scm.components));
      var destDir = parseDate(parseTmp(params.destDir, scm.components));
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
      expC('Comparing a difference of file TIME');
    })();

    (function () {
      var params = scm.tasks['appLog:current'];
      var srcDir = parseDate(parseTmp(params.srcDir, scm.components));
      var destDir = parseDate(parseTmp(params.destDir, scm.components));
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
    })();

    (function () {
      expC('Start the task: appLog:lastMonth');
      expC('available: false => Skip this task');
    })();

    expC('Finished function dirbkup.backupDirUsingSchema');
  });
});
