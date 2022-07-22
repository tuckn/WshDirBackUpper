/* globals Wsh: false */

(function () {
  if (Wsh && Wsh.DirBackUpper) return;

  /**
   * The WSH (Windows Script Host) CLI that updates or mirrors directories according to the schema defined in a JSON file.
   *
   * @namespace DirBackUpper
   * @memberof Wsh
   * @requires {@link https://github.com/tuckn/WshBasicPackage|tuckn/WshBasicPackage}
   */
  Wsh.DirBackUpper = {};

  // Shorthands
  var util = Wsh.Util;
  var path = Wsh.Path;
  var fs = Wsh.FileSystem;
  var fse = Wsh.FileSystemExtra;
  var logger = Wsh.Logger;

  var objAdd = Object.assign;
  var insp = util.inspect;
  var obtain = util.obtainPropVal;
  var parseTmp = util.parseTemplateLiteral;
  var parseDate = util.parseDateLiteral;
  var hasContent = util.hasContent;
  var includes = util.includes;
  var isArray = util.isArray;
  var isSolidString = util.isSolidString;
  var isPlainObject = util.isPlainObject;

  var dirbkup = Wsh.DirBackUpper; // Shorthand

  /** @constant {string} */
  var MODULE_TITLE = 'WshDirBackUpper/DirBackUpper.js';

  var throwErrNonStr = function (functionName, errVal) {
    util.throwTypeError('string', MODULE_TITLE, functionName, errVal);
  };

  var throwErrNonObject = function (functionName, errVal) {
    util.throwTypeError('object', MODULE_TITLE, functionName, errVal);
  };

  var throwValErr = function (valName, functionName, errVal) {
    util.throwValueError(valName, MODULE_TITLE, functionName, errVal);
  };

  // dirbkup.backupDirUsingLog {{{
  /**
   * Backs up the directory.
   *
   * @example
   * var dirbkup = Wsh.DirBackUpper; // Shorthand
   *
   * var srcDir = 'C:\\Users';
   * var destDir = 'D:\\BackUp\\Users\\#{yyyy-MM}';
   *
   * dirbkup.backupDirUsingLog(srcDir, destDir, {
   *   sync: 'MIRROR',
   *   comparison: 'CONTENT',
   *   ignoredRegExp: 'tmp$',
   *   logger: 'warn/winEvent' // See https://github.com/tuckn/WshLogger
   * });
   * @function backupDirUsingLog
   * @memberof Wsh.DirBackUpper
   * @param {string} srcDir - The source directory path to back up.
   * @param {string} destDir - The destination directory path.
   * @param {object} [options] - Optional parameters.
   * @param {string} [options.syncMethod='UPDATE'] - The synchronization method. "UPDATE" or "MIRROR".
   * @param {string} [options.comparison='TIME'] - "TIME" or "CONTENT".
   * @param {boolean} [options.isRecursive=true] - Copies sub directories.
   * @param {boolean} [options.copiesEmpDir=false] - Copies empty directories.
   * @param {boolean} [options.includesSymlink=false] - Copies symbolic link.
   * @param {string|Array} [options.matchedRegExp] - e.g. "\\w+\\.txt$"
   * @param {string|Array} [options.ignoredRegExp] - e.g. "\\.tmp$"
   * @param {boolean} [options.throws=false] - Throws a error.
   * @param {(Logger|string|object)} [options.logger] - The Logger instance or create options. See {@link https://docs.tuckn.net/WshLogger/Wsh.Logger.html#.create|Wsh.Logger.create}.
   * @param {boolean} [options.transportsLog=true] - Outputs Wsh.Logger logs after connecting. See {@link https://docs.tuckn.net/WshLogger/Wsh.Logger.html#.this.transport|Wsh.Logger.transport}.
   * @param {boolean} [options.isDryRun=false] - No execute, returns the string of command.
   * @returns {void}
   */
  dirbkup.backupDirUsingLog = function (srcDir, destDir, options) {
    var FN = 'dirbkup.backupDirUsingLog';
    var loggerObj = obtain(options, 'logger', {});
    var lggr = logger.create(loggerObj);
    lggr.info('Start the function ' + FN);

    if (!isSolidString(srcDir)) throwErrNonStr(FN, srcDir);
    if (!isSolidString(destDir)) throwErrNonStr(FN, destDir);

    // Sets parameters {{{
    var srcDirPath = path.resolve(srcDir);
    var destDirPath = parseDate(path.resolve(destDir));

    var syncMethod = obtain(options, 'syncMethod', 'UPDATE');
    if (!/^(update|mirror)$/i.test(syncMethod)) {
      throwValErr('options.update', FN, syncMethod);
    }

    var comparison = obtain(options, 'comparison', 'TIME');

    var isRecursive = obtain(options, 'isRecursive', true);
    var readFn = isRecursive ? fse.readdirSyncRecursively : fs.readdirSync;

    var copiesEmpDir = obtain(options, 'copiesEmpDir', false);
    var includesSymlink = obtain(options, 'includesSymlink', false);
    var throws = obtain(options, 'throws', false);

    var isDryRun = obtain(options, 'isDryRun', false);
    var copyDummy = function () { return; };
    var copyFunc = isDryRun ? copyDummy : fse.copySync;
    var removeDummy = function () { return; };
    var removeFunc = isDryRun ? removeDummy : fse.removeSync;

    var matchedRegExp = obtain(options, 'matchedRegExp', null);
    if (matchedRegExp && isArray(matchedRegExp) && matchedRegExp.length > 0) {
      matchedRegExp = '(' + matchedRegExp.join('|') + ')';
    }

    var ignoredRegExp = obtain(options, 'ignoredRegExp', null);
    if (ignoredRegExp && isArray(ignoredRegExp) && ignoredRegExp.length > 0) {
      ignoredRegExp = '(' + ignoredRegExp.join('|') + ')';
    }

    lggr.info('srcDir: "' + srcDir + '" -> "' + srcDirPath + '"');
    lggr.info('destDir: "' + destDir + '" -> "' + destDirPath + '"');
    lggr.info('syncMethod: ' + syncMethod);
    lggr.info('comparison: ' + comparison);
    lggr.info('isRecursive: ' + String(isRecursive));
    lggr.info('copiesEmpDir: ' + String(copiesEmpDir));
    lggr.info('includesSymlink: ' + String(includesSymlink));
    lggr.info('matchedRegExp: ' + matchedRegExp);
    lggr.info('ignoredRegExp: ' + ignoredRegExp);
    lggr.info('throws: ' + String(throws));
    // }}}

    // Gets files lists {{{
    lggr.info('Reading srcDir' + (isRecursive ? ' recursively...' : '...'));

    var srcFileNames = readFn(srcDirPath, {
      withFileTypes: false,
      excludesSymlink: !includesSymlink,
      matchedRegExp: matchedRegExp,
      ignoredRegExp: ignoredRegExp
    });
    lggr.debug(srcFileNames);

    var srcNum = srcFileNames.length;
    lggr.info('Found ' + srcNum + ' files/directories in src');

    var destFileNames = [];
    if (fs.existsSync(destDirPath)) {
      lggr.info('Reading destDir' + (isRecursive ? ' recursively...' : '...'));

      destFileNames = readFn(destDirPath, {
        withFileTypes: false,
        excludesSymlink: !includesSymlink,
        matchedRegExp: matchedRegExp,
        ignoredRegExp: ignoredRegExp
      });

      lggr.info('Found ' + destFileNames.length + ' files/directories in dest');
    } else {
      lggr.info('destDir is not existing');
    } // }}}

    lggr.debug(destFileNames);

    // Compare differences of file and copy {{{
    lggr.info('Comparing a difference of file ' + comparison);

    srcFileNames.forEach(function (srcFileName, i) {
      if (lggr.transportation === 'CONSOLE') WScript.StdOut.Write('.');

      var logHeader = '[' + (i + 1) + '/' + srcNum + '] "' + srcFileName + '"';
      lggr.debug(logHeader);

      var srcPath = path.join(srcDirPath, srcFileName);
      var destPath = path.join(destDirPath, srcFileName);
      lggr.debug('srcPath: ' + srcPath);
      lggr.debug('destPath: ' + destPath);

      try {
        if (fs.statSync(srcPath).isDirectory()) {
          if (copiesEmpDir && !isDryRun) fse.ensureDirSync(destPath);
          return;
        }

        if (!includes(destFileNames, srcFileName, 'i')) {
          lggr.info('Copied ' + logHeader + ' (New file)');
          return copyFunc(srcPath, destPath);
        }

        if (/^time$/i.test(comparison)) {
          if (fse.isTheSameFile(srcPath, destPath, 'date')) return;
          lggr.info('Copied ' + logHeader + ' (Modified date are different)');
          return copyFunc(srcPath, destPath);
        }

        if (/^content$/i.test(comparison)) {
          if (fse.isTheSameFile(srcPath, destPath, 'MD5')) return;
          lggr.info('Copied ' + logHeader + ' (MD5 values are different)');
          return copyFunc(srcPath, destPath);
        }

        throw new Error('"' + comparison + '" is undefined comparison method.');
      } catch (e) {
        if (throws) {
          throw new Error(insp(e) + '\n'
              + '  at ' + FN + ' (' + MODULE_TITLE + ')\n'
              + '  copy "' + srcPath + '" to "' + destPath);
        }

        lggr.error(logHeader + ' -> Error occured while trying to copy "' + srcPath + '" to "' + destPath + '". ' + insp(e));
      }
    }); // }}}

    if (/^mirror$/i.test(syncMethod)) {
      lggr.info('Remove none-existing files from dest');
      destFileNames.forEach(function (destFileName) {
        if (includes(srcFileNames, destFileName, 'i')) return;
        lggr.info('Remove ' + destFileName + ' in ' + destDirPath);
        return removeFunc(path.join(destDirPath, destFileName));
      });
    }

    lggr.info('Finished the function ' + FN);
    var transportsLog = obtain(options, 'transportsLog', true);
    if (transportsLog) lggr.transport();

    return;
  }; // }}}

  // dirbkup.backupDirUsingSchema {{{
  /**
   * @typedef {object} typeSchemaBackUpper
   * @property {string} [description]
   * @property {object} [components]
   * @property {...typeSchemaBackUpperTask} tasks
   */

  /**
   * @typedef {object} typeSchemaBackUpperTask
   * @property {string} [description] - The task description.
   * @property {boolean} [available=true] - If specifying false, Skips the task.
   * @property {string} srcDir - The source directory path to back up.
   * @property {string} destDir - The destination directory path.
   * @property {string} [syncMethod] - The synchronization method. "UPDATE" or "MIRROR".
   * @property {string} [comparison] - "TIME" or "CONTENT".
   * @property {boolean} [isRecursive] - Copies sub directories.
   * @property {boolean} [copiesEmpDir] - Copies empty directories.
   * @property {boolean} [includesSymlink] - Copies symbolic link.
   * @property {string|Array} [matchedRegExp] - e.g. "\\w+\\.txt$"
   * @property {string|Array} [ignoredRegExp] - e.g. "\\.tmp$"
   * @property {boolean} [throws=false] - Throws a error.
   */

  /**
   * Backs up the directories.
   *
   * @example
   * var dirbkup = Wsh.DirBackUpper; // Shorthand
   * var schema = {
   *   description: 'Example Schema WshDirBackUpper',
   *   components: {
   *     dest: '\\\\MyNas\\BackUp',
   *     anyVal1: null
   *   },
   *   tasks: {
   *     userAppData: {
   *       description: 'Example task with options',
   *       srcDir: 'C:\\Users\\Default\\AppData',
   *       destDir: '${dest}\\AppData\\#{yyyy}\\#{MM-dd}',
   *       comparison: 'CONTENT',
   *       ignoredRegExp: [
   *         'Windows\\\\WebCache',
   *         'Packages\\\\.*Cache\\\\',
   *         '\\.mui$',
   *         '\\.settingcontent-ms$'
   *       ]
   *     },
   *     'appLog:current': {
   *       srcDir: 'D:\\AppLogs\\#{yyyy}\\#{MM}',
   *       destDir: '${dest}\\AppLogs\\#{yyyy}\\#{MM}',
   *       syncMethod: 'UPDATE',
   *       comparison: 'TIME',
   *       matchedRegExp: '\\.csv$'
   *     },
   *     'appLog:lastMonth': {
   *       available: false,
   *       srcDir: '${anyVal1}:\\AppLogs\\#{yyyy\\[MM-1]}',
   *       destDir: '${dest}\\AppLogs\\#{yyyy\\[MM-1]}',
   *       syncMethod: 'MIRROR',
   *       comparison: 'TIME',
   *       matchedRegExp: '\\.csv$'
   *     }
   *   }
   * };
   *
   * dirbkup.backupDirUsingSchema(schema, 'work:*', {
   *   logger: 'info/console',
   *   overwrites: { anyVal1: 'E' }
   * });
   * // Only process appLog:current. appLog:lastMonth is not processed because available is false.
   * @function backupDirUsingSchema
   * @memberof Wsh.DirBackUpper
   * @param {typeSchemaBackUpper} schema
   * @param {string} [taskName] - The task name to back up.
   * @param {object} [options] - Optional parameters.
   * @param {object} [options.overwrites] - Ex. { anyVal1: 'myP@ss', anyVal2: 'p_w_d' }
   * @param {(string|Object)} [options.logger] - See options of {@link Wsh.Logger.create}
   * @param {boolean} [options.isDryRun=false] - No execute, returns the string of command.
   * @returns {void}
   */
  dirbkup.backupDirUsingSchema = function (schema, taskName, options) {
    var FN = 'dirbkup.backupDirUsingSchema';
    if (!isPlainObject(schema)) throwErrNonObject(FN, schema);
    if (!isSolidString(taskName)) throwErrNonStr(FN, taskName);

    var loggerObj = obtain(options, 'logger', {});
    var lggr = logger.create(loggerObj);
    lggr.info('Start function ' + FN);
    lggr.info('taskName: "' + taskName + '"');

    var tasks = schema.tasks; // Shorthand
    var taskNames = Object.keys(tasks);
    var regNameMatcher;
    if (includes(taskName, '*')) {
      regNameMatcher = new RegExp(taskName.replace(/\*/g, '.*'));
    } else {
      regNameMatcher = new RegExp(taskName);
    }
    var filteredNames = taskNames.filter(function (taskName) {
      return regNameMatcher.test(taskName);
    });
    lggr.info('matched tasks: ' + filteredNames.length);

    var vals = schema.components; // Shorthand

    // Set option values in keys storing null.
    if (hasContent(options.overwrites)) {
      Object.keys(vals).forEach(function (key) {
        if (vals[key] !== null) return;

        Object.keys(options.overwrites).some(function (writeKey) {
          if (key === writeKey) {
            vals[key] = options.overwrites[writeKey];
            return true;
          }
        });
      });
    }

    var isDryRun = obtain(options, 'isDryRun', false);
    if (isDryRun) lggr.info('dry-run [' + FN + ']:');

    filteredNames.forEach(function (taskName) {
      lggr.info('Start the task: ' + taskName);

      if (tasks[taskName].available === false) {
        lggr.info('available: false => Skip this task');
        return;
      }

      var srcDir = parseDate(parseTmp(tasks[taskName].srcDir || '', vals));
      var destDir = parseDate(parseTmp(tasks[taskName].destDir || '', vals));
      var syncMethod = parseTmp(tasks[taskName].syncMethod || '', vals);
      var comparison = parseTmp(tasks[taskName].comparison || '', vals);
      var isRecursive = obtain(tasks[taskName], 'isRecursive', null);
      var copiesEmpDir = obtain(tasks[taskName], 'copiesEmpDir', null);
      var includesSymlink = obtain(tasks[taskName], 'includesSymlink', null);
      var matchedRegExp = obtain(tasks[taskName], 'matchedRegExp', null);
      var ignoredRegExp = obtain(tasks[taskName], 'ignoredRegExp', null);

      try {
        dirbkup.backupDirUsingLog(srcDir, destDir,
          objAdd({}, options, {
            syncMethod: syncMethod,
            comparison: comparison,
            isRecursive: isRecursive,
            copiesEmpDir: copiesEmpDir,
            includesSymlink: includesSymlink,
            matchedRegExp: matchedRegExp,
            ignoredRegExp: ignoredRegExp,
            logger: lggr,
            transportsLog: false,
            throws: false
          })
        );
      } catch (e) { // It does not stop with an error.
        lggr.error(insp(e));
      }
    });

    lggr.info('Finished function ' + FN);
    var transportsLog = obtain(options, 'transportsLog', true);
    if (transportsLog) lggr.transport();

    return;
  }; // }}}
})();

// vim:set foldmethod=marker commentstring=//%s :
