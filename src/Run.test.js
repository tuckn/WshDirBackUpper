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

  // Backup

  testName = 'backup_help';
  test(testName, function () {
    var args = ['backup', '-h'];
    var rtn = execSync(testRun + ' ' + args.join(' '));

    // Checking the executing stdout
    expect(rtn.error).toBeFalsy();
    expect(rtn.stderr).toBe('');

    var expC = expect(rtn.stdout).toContain; // Shorthand
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
    var destDirParsed = parseDate(destDir);

    // Executing
    var args = ['backup', srrd(srcDir), srrd(destDir), '--dry-run'];
    var rtn = execSync(testRun + ' ' + args.join(' '));

    // Checking the executing stdout
    expect(rtn.error).toBeFalsy();
    expect(rtn.stderr).toBe('');

    var expC = expect(rtn.stdout).toContain; // Shorthand
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
  });

  testName = 'backup_Op1_dryRun';
  test(testName, function () {
    var srcDir = path.join(process.cwd(), 'WshModules', 'WshJest');
    var destDir = 'D:\\BackUp\\Users\\#{yyyy-[MM - 2]}';
    var destDirParsed = parseDate(destDir);

    // Executing
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
    var rtn = execSync(testRun + ' ' + args.join(' '));

    // Checking the executing stdout
    expect(rtn.error).toBeFalsy();
    expect(rtn.stderr).toBe('');

    var expC = expect(rtn.stdout).toContain; // Shorthand
    expC('Start the function dirBkup.backupDir');
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
    expC('Finished the function dirBkup.backupDir');
  });

  // Archive

  testName = 'archive_help';
  test(testName, function () {
    // Executing
    var args = ['archive', '-h'];
    var rtn = execSync(testRun + ' ' + args.join(' '));

    // Checking the executing stdout
    expect(rtn.error).toBeFalsy();
    expect(rtn.stderr).toBe('');

    var expC = expect(rtn.stdout).toContain; // Shorthand
    expC('Usage: archive <srcDir> <dest> [options]');
    expC('The command to archive a directory');
    expC('Options:');
    expC('  -A, --archive-type <type>      The archiving type, "ZIP" (default) or "RAR"');
    expC('  -F, --no-forEach-subDir        Compresses each sub directory in the specified source directory.');
    // ...
  });

  testName = 'archive_DefOp_dryRun';
  test(testName, function () {
    var srcDir = path.join(process.cwd(), 'WshModules', 'WshJest');
    var destDir = 'D:\\archive\\Users\\#{yyyy-[MM - 2]}';
    var destDirParsed = parseDate(destDir);

    // Executing
    var args = ['archive', srrd(srcDir), srrd(destDir), '--dry-run'];
    var rtn = execSync(testRun + ' ' + args.join(' '));

    // Checking the executing stdout
    expect(rtn.error).toBeFalsy();
    expect(rtn.stderr).toBe('');

    var expC = expect(rtn.stdout).toContain; // Shorthand

    expC('Start the function dirBkup.archiveDir');
    expC('srcDir: ' + srrd(srcDir) + ' -> ' + srrd(srcDir));
    expC('dest: ' + srrd(destDir) + ' -> ' + srrd(destDirParsed));
    expC('throws: false');
    expC('isDryRun: true');
    expC('archiveType: ZIP');
    expC('forEachSubDir: true');
    expC('includesEmptyDir: false');
    expC('includesSymlink: false');
    expC('matchedRegExp: null');
    expC('ignoredRegExp: null');
    // ...
    expC('Finished the function dirBkup.archiveDir');
  });

  testName = 'archive_Op1_dryRun';
  test(testName, function () {
    var srcDir = path.join(process.cwd(), 'WshModules', 'WshJest');
    var dest = 'D:\\archive\\Users\\#{yyyy-[MM - 2]}';
    var destDirParsed = parseDate(dest);

    // Executing
    var args = ['archive', srrd(srcDir), srrd(dest),
      '--archive-type RAR',
      '--date-code yyyyMMdd_hhmmss',
      '--password "This is mY&p@ss ^_<"',
      '--compressLv 0',
      '--no-forEach-subDir',
      '--no-omit-empdir',
      // '--matched-reg "^[^.].+$"',
      // '--ignored-reg "modules$"',
      '--no-ignore-err',
      '--dry-run'
    ];
    var rtn = execSync(testRun + ' ' + args.join(' '));

    // Checking the executing stdout
    expect(rtn.error).toBeFalsy();
    expect(rtn.stderr).toBe('');

    var expC = expect(rtn.stdout).toContain; // Shorthand
    var expNC = expect(rtn.stdout).not.toContain;

    expC('Start the function dirBkup.archiveDir');
    expC('srcDir: ' + srrd(srcDir) + ' -> ' + srrd(srcDir));
    expC('dest: ' + srrd(dest) + ' -> ' + srrd(destDirParsed));
    expC('throws: true');
    expC('isDryRun: true');
    expC('archiveType: RAR');
    expC('forEachSubDir: false');

    expNC('includesEmptyDir: ');
    expNC('includesSymlink: ');
    expNC('matchedRegExp: ');
    expNC('ignoredRegExp: ');
    // ...
    expC('Finished the function dirBkup.archiveDir');
  });

  // Schema

  testName = 'schemaBackup_help_noArg';
  test(testName, function () {
    // Executing
    var args = ['schemaBackup'];
    var rtn = execSync(testRun + ' ' + args.join(' '));

    // Checking the executing stdout
    expect(rtn.error).toBeTruthy();
    expect(rtn.stdout).toBe(''); // Stdout

    var expC = expect(rtn.stderr).toContain; // Shorthand
    expC('Usage: schemaBackup <taskName> [overwriteKey:val...] [options]');
    expC('The command to back up directories defined with a schema JSON');
    expC('Options:');
    expC('  -V, --version          Output the version number');
    expC('  -D, --dir-path <path>  The path name where the schema JSON is located. <Directory Path> or "cwd", "portable", "userProfile". Default: "cmd" is "%CD%\\.wsh"');
    // ...
  });

  testName = 'schemaBackup_help';
  test(testName, function () {
    // Executing
    var args = ['schemaBackup', '-h'];
    var rtn = execSync(testRun + ' ' + args.join(' '));

    // Checking the executing stdout
    expect(rtn.error).toBeFalsy();
    expect(rtn.stderr).toBe('');

    var expC = expect(rtn.stdout).toContain; // Shorthand
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
    }
  };

  testName = 'schemaBackup_all_dryRun';
  test(testName, function () {
    // Creating a temporary directory and the JSON schema file
    var tmpDir = os.makeTmpPath('_' + testName);
    var wshDir = path.join(tmpDir, '.wsh');
    fse.ensureDirSync(wshDir);

    var schemaJson = path.join(wshDir, 'settings.json');
    fse.writeJsonSync(schemaJson, schema);

    // Executing
    var asterisk = '*';
    var args = ['schemaBackup', asterisk, '--dir-path', wshDir, '--dry-run'];
    var rtn = execSync(testRun + ' ' + args.join(' '));

    // Checking the executing log
    var scm = schema.dirBackUpperSchema;
    var tasks = scm.tasks;
    var expC = expect(rtn.stdout).toContain; // Shorthand

    expC('Start the function dirBkup.backupDirUsingSchema');
    expC('isDryRun: true');
    expC('taskName: ' + asterisk);
    expC('matched tasks number: ' + Object.keys(tasks).length);
    expC('Start the function dirBkup.backupDir');

    // Checking a task executed or not
    Object.keys(scm.tasks).forEach(function (taskName) {
      expC('Start the task: ' + taskName);

      if (scm.tasks[taskName].available === false) {
        expC('available: false => Skip the task: ' + taskName);
      } else {
        expC('Finished the task: ' + taskName);
      }
    });

    expC('Finished the function dirBkup.backupDir');
    expC('Finished the function dirBkup.backupDirUsingSchema');

    // Cleaning
    fse.removeSync(tmpDir);
    expect(fs.existsSync(tmpDir)).toBe(false);
  });

  testName = 'schemaBackup_task1_dryRun';
  test(testName, function () {
    // Creating a temporary directory and the JSON schema file
    var tmpDir = os.makeTmpPath('_' + testName);
    var wshDir = path.join(tmpDir, '.wsh');
    fse.ensureDirSync(wshDir);

    var schemaJson = path.join(wshDir, 'settings.json');
    fse.writeJsonSync(schemaJson, schema);

    // Executing
    var taskName = 'userAppData';
    var args = ['schemaBackup', taskName, '--dir-path', wshDir, '--dry-run'];
    var rtn = execSync(testRun + ' ' + args.join(' '));

    // Checking the stdout
    var scm = schema.dirBackUpperSchema;
    var expC = expect(rtn.stdout).toContain; // Shorthand

    expC('Start the function dirBkup.backupDirUsingSchema');
    expC('isDryRun: true');
    expC('throws: false');
    expC('taskName: ' + taskName);
    expC('matched tasks number: 1');

    var task = scm.tasks[taskName];
    var srcDir = parseDate(parseTmp(task.srcDir, scm.components));
    var destDir = parseDate(parseTmp(task.destDir, scm.components));

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
    fse.removeSync(tmpDir);
    expect(fs.existsSync(tmpDir)).toBe(false);
  });

  testName = 'schemaBackup_task2_dryRun';
  test(testName, function () {
    // Creating a temporary directory and the JSON schema file
    var tmpDir = os.makeTmpPath('_' + testName);
    var wshDir = path.join(tmpDir, '.wsh');
    fse.ensureDirSync(wshDir);

    var schemaJson = path.join(wshDir, 'settings.json');
    fse.writeJsonSync(schemaJson, schema);

    // Executing
    var taskName = 'userAppData*';
    var args = ['schemaBackup', taskName, '--dir-path', wshDir, '--dry-run'];
    var rtn = execSync(testRun + ' ' + args.join(' '));

    // Checking the executing log
    var scm = schema.dirBackUpperSchema;
    var expC = expect(rtn.stdout).toContain; // Shorthand

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
    var task = scm.tasks['userAppData:zip'];
    var srcDir = parseDate(parseTmp(task.srcDir, scm.components));
    var destDir = parseDate(parseTmp(task.destDir, scm.components));

    expC('Start the task: userAppData:zip');
    expC('srcDir: ' + task.srcDir + ' -> ' + srcDir);
    expC('destDir: ' + task.destDir + ' -> ' + destDir);
    expC('method: ' + task.method);
    expC('options.exe7z: ${exe7z} -> ' + scm.components.exe7z);

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
    fse.removeSync(tmpDir);
    expect(fs.existsSync(tmpDir)).toBe(false);
  });

  testName = 'schemaBackup_task3_dryRun';
  test(testName, function () {
    // Creating a temporary directory and the JSON schema file
    var tmpDir = os.makeTmpPath('_' + testName);
    var wshDir = path.join(tmpDir, '.wsh');
    fse.ensureDirSync(wshDir);

    var schemaJson = path.join(wshDir, 'settings.json');
    fse.writeJsonSync(schemaJson, schema);

    // Executing
    var taskName = 'appLog:current';
    var args = ['schemaBackup', taskName, '--dir-path', wshDir, '--dry-run'];
    var rtn = execSync(testRun + ' ' + args.join(' '));

    // Checking the executing log
    var scm = schema.dirBackUpperSchema;
    var expC = expect(rtn.stdout).toContain; // Shorthand

    expC('Start the function dirBkup.backupDirUsingSchema');
    expC('isDryRun: true');
    expC('throws: false');
    expC('taskName: ' + taskName);
    expC('matched tasks number: 1');

    var task = scm.tasks[taskName];
    var srcDir = parseDate(parseTmp(task.srcDir, scm.components));
    var destDir = parseDate(parseTmp(task.destDir, scm.components));

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
    expect(rtn.stderr).toContain('Error: [] Error: ENOENT: no such file or directory');

    expC('Finished the function dirBkup.backupDirUsingSchema');
    expC('Finished the task: ' + taskName);
    expC('Finished the function dirBkup.backupDirUsingSchema');

    // Cleaning
    fse.removeSync(tmpDir);
    expect(fs.existsSync(tmpDir)).toBe(false);
  });

  testName = 'schemaBackup_portable_dryRun';
  test(testName, function () {
    // Executing
    var asterisk = '*';
    var args = ['schemaBackup', asterisk, '--dry-run'];
    var rtn = execSync(testRun + ' ' + args.join(' '));

    // Checking the executing stdout
    // Reading the settings
    var conf = new Wsh.ConfigStore(null, { dirPath: 'portable' });
    var schema = conf.get('dirBackUpperSchema');
    var tasks = schema.tasks;
    var expC = expect(rtn.stdout).toContain; // Shorthand

    expC('Start the function dirBkup.backupDirUsingSchema');
    expC('isDryRun: true');
    expC('taskName: ' + asterisk);
    expC('matched tasks number: ' + Object.keys(tasks).length);
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
  });
});
