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
  var os = Wsh.OS;
  var fs = Wsh.FileSystem;
  var fse = Wsh.FileSystemExtra;
  var zlib = Wsh.ZLIB;
  var logger = Wsh.Logger;

  var objAdd = Object.assign;
  var cloneDeep = util.cloneDeep;
  var insp = util.inspect;
  var obtain = util.obtainPropVal;
  var parseTmp = util.parseTemplateLiteral;
  var parseDate = util.parseDateLiteral;
  var hasContent = util.hasContent;
  var includes = util.includes;
  var isArray = util.isArray;
  var isBoolean = util.isBoolean;
  var isString = util.isString;
  var isEmpty = util.isEmpty;
  var isSolidArray = util.isSolidArray;
  var isSolidObject = util.isSolidObject;
  var isSolidString = util.isSolidString;
  var isPlainObject = util.isPlainObject;
  var isSameMeaning = util.isSameMeaning;
  var srrd = os.surroundCmdArg;

  var dirBkup = Wsh.DirBackUpper; // Shorthand

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

  // dirBkup.backupDir {{{
  /**
   * Backs up the directory.
   *
   * @example
   * var dirBkup = Wsh.DirBackUpper; // Shorthand
   *
   * var srcDir = 'C:\\Users';
   * var destDir = 'D:\\BackUp\\Users\\#{yyyy}\\#{MM - 1}';
   *
   * dirBkup.backupDir(srcDir, destDir, {
   *   sync: 'MIRROR',
   *   comparison: 'CONTENT',
   *   ignoredRegExp: 'tmp$',
   *   logger: 'warn/winEvent' // See https://github.com/tuckn/WshLogger
   * });
   * @function backupDir
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
   * @param {(Logger|string|object)} [options.logger] - The Logger instance or create options. See {@link https://docs.tuckn.net/WshLogger/Wsh.Logger.html#.create|Wsh.Logger.create}.
   * @param {boolean} [options.transportsLog=true] - Outputs Wsh.Logger logs after connecting. See {@link https://docs.tuckn.net/WshLogger/Wsh.Logger.html#.this.transport|Wsh.Logger.transport}.
   * @param {boolean} [options.isDryRun=false] - No execute, returns the string of command.
   * @param {boolean} [options.throws=false] - Throws a error.
   * @returns {void}
   */
  dirBkup.backupDir = function (srcDir, destDir, options) {
    var FN = 'dirBkup.backupDir';
    var loggerObj = obtain(options, 'logger', {});
    var lggr = logger.create(loggerObj);
    lggr.info('Start the function ' + FN);

    lggr.debug('srcDir: ' + insp(srcDir));
    lggr.debug('dest: ' + insp(destDir));
    lggr.debug('options: ' + insp(options));

    // Setting the source and destination directory
    if (!isSolidString(srcDir)) throwErrNonStr(FN, srcDir);
    if (!isSolidString(destDir)) throwErrNonStr(FN, destDir);

    var srcDirPath = path.resolve(srcDir);
    lggr.info('srcDir: "' + srcDir + '" -> "' + srcDirPath + '"');

    var destDirPath = parseDate(path.resolve(destDir));
    lggr.info('destDir: "' + destDir + '" -> "' + destDirPath + '"');

    // Setting parameters
    var syncMethod = obtain(options, 'syncMethod', 'UPDATE');
    if (!/^(update|mirror)$/i.test(syncMethod)) {
      throwValErr('options.update', FN, syncMethod);
    }
    lggr.info('syncMethod: ' + syncMethod);

    var comparison = obtain(options, 'comparison', 'TIME');
    lggr.info('comparison: ' + comparison);

    var isDryRun = obtain(options, 'isDryRun', false);
    lggr.info('isDryRun: ' + String(isDryRun));

    var throws = obtain(options, 'throws', false);
    lggr.info('throws: ' + String(throws));

    var copyDummy = function () { return; };
    var copyFunc = isDryRun ? copyDummy : fse.copySync;
    var removeDummy = function () { return; };
    var removeFunc = isDryRun ? removeDummy : fse.removeSync;

    // Setting filtering sub directories options
    var copiesEmpDir = obtain(options, 'copiesEmpDir', false);
    lggr.info('copiesEmpDir: ' + String(copiesEmpDir));

    var includesSymlink = obtain(options, 'includesSymlink', false);
    lggr.info('includesSymlink: ' + String(includesSymlink));

    var matchedRegExp = obtain(options, 'matchedRegExp', null);
    if (matchedRegExp && isArray(matchedRegExp) && matchedRegExp.length > 0) {
      matchedRegExp = '(' + matchedRegExp.join('|') + ')';
    }
    lggr.info('matchedRegExp: ' + matchedRegExp);

    var ignoredRegExp = obtain(options, 'ignoredRegExp', null);
    if (ignoredRegExp && isArray(ignoredRegExp) && ignoredRegExp.length > 0) {
      ignoredRegExp = '(' + ignoredRegExp.join('|') + ')';
    }
    lggr.info('ignoredRegExp: ' + ignoredRegExp);

    var isRecursive = obtain(options, 'isRecursive', true);
    lggr.info('isRecursive: ' + String(isRecursive));

    var readFn = isRecursive ? fse.readdirSyncRecursively : fs.readdirSync;

    // Getting files lists
    lggr.info('Reading srcDir' + (isRecursive ? ' recursively...' : '...'));

    var srcFileNames = readFn(srcDirPath, {
      withFileTypes: false,
      excludesSymlink: !includesSymlink,
      matchedRegExp: matchedRegExp,
      ignoredRegExp: ignoredRegExp
    });
    lggr.debug('srcFileNames: ' + insp(srcFileNames));

    var srcNum = srcFileNames.length;
    lggr.info('Found ' + srcNum + ' files and directories in src');

    var destFileNames = [];
    if (fs.existsSync(destDirPath)) {
      lggr.info('Reading destDir' + (isRecursive ? ' recursively...' : '...'));

      destFileNames = readFn(destDirPath, {
        withFileTypes: false,
        excludesSymlink: !includesSymlink,
        matchedRegExp: matchedRegExp,
        ignoredRegExp: ignoredRegExp
      });

      lggr.info('Found ' + destFileNames.length + ' files and directories in dest');
    } else {
      lggr.info('destDir is not existing');
    }
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

  // dirBkup.archiveDir {{{
  /**
   * Compresses the directory into archive file (ZIP or RAR).
   *
   * @example
   * var dirBkup = Wsh.DirBackUpper; // Shorthand
   *
   * var srcDir = 'C:\\Users';
   * var dest = 'D:\\BackUp\\Users\\#{yyyy}\\#{MM - 1}';
   *
   * dirBkup.archiveDir(srcDir, dest, {
   *   archiveType: 'ZIP',
   *   ignoredRegExp": ["\\.git.*"],
   *   archiveOptions": {
   *     exe7z: exe7z
   *     dateCode: 'yyyy-MM-dd_hhmmss',
   *     compressLv: 9,
   *     password: 'This is mY&p@ss ^_<',
   *   },
   *   logger: 'warn/winEvent' // See https://github.com/tuckn/WshLogger
   * });
   * @function archiveDir
   * @memberof Wsh.DirBackUpper
   * @param {string} srcDir - The source directory path to back up.
   * @param {string} dest - The destination directory path.
   * @param {object} [options] - Optional parameters.
   * @param {string} [options.archiveType='ZIP'] - The archiving method, 'ZIP' (default) or 'RAR'
   * @param {typeDeflateZipOption|typeDeflateRarOption} [options.archiveOptions] - Optional parameters. See {@link https://docs.tuckn.net/WshZLIB/global.html#typeDeflateZipOption|Wsh.ZLIB.typeDeflateZipOption} and {@link https://docs.tuckn.net/WshZLIB/global.html#typeDeflateRarOption|Wsh.ZLIB.typeDeflateRarOption}.
   * @param {boolean} [options.forEachSubDir=true] - Compresses each sub directory in the specified source directory.
   * @param {boolean} [options.rootFilesName='RootFiles'] - When forEachSubDire option is true, root files are archived as this name. (default: 'RootFiles')
   * @param {boolean} [options.includesEmptyDir=false] - Compresses empty directories.
   * @param {boolean} [options.includesSymlink=false] - Compresses symbolic links.
   * @param {string|Array} [options.matchedRegExp] - When forEachSubDir option is true, matched RegExp only for the root directories and files in the source. e.g. "^[^.].+$"
   * @param {string|Array} [options.ignoredRegExp] - When forEachSubDir option is true, ignored RegExp only for the root directories and files in the source. e.g. "\\.git.*"
   * @param {(Logger|string|object)} [options.logger] - The Logger instance or create options. See {@link https://docs.tuckn.net/WshLogger/Wsh.Logger.html#.create|Wsh.Logger.create}.
   * @param {boolean} [options.isDryRun=false] - No execute, returns the string of command.
   * @param {boolean} [options.throws=false] - Throws a error.
   * @param {boolean} [options.transportsLog=true] - Outputs Wsh.Logger logs after connecting. See {@link https://docs.tuckn.net/WshZLIB/global.html#typeDeflateResult|Wsh.ZLIB.typeDeflateResult}.
   * @returns {typeDeflateResult|typeDeflateResult[]|string|string[]} - @see typeDeflateResult. If options.isDryRun is true, returns string.
   */
  dirBkup.archiveDir = function (srcDir, dest, options) {
    var FN = 'dirBkup.archiveDir';
    var loggerObj = obtain(options, 'logger', {});
    var lggr = logger.create(loggerObj);
    lggr.info('Start the function ' + FN);

    lggr.debug('srcDir: ' + insp(srcDir));
    lggr.debug('dest: ' + insp(dest));
    lggr.debug('options: ' + insp(options));

    var errMes = '\n'
      + '  at ' + FN + ' (' + MODULE_TITLE + ').\n'
      + '  srcDir: ' + insp(srcDir) + ',\n'
      + '  dest: ' + insp(dest) + ',\n'
      + '  options: ' + insp(options);

    // Setting the source directory and destination path
    if (!isSolidString(srcDir)) throwErrNonStr(FN, srcDir);
    if (!isSolidString(dest)) throwErrNonStr(FN, dest);

    var srcDirPath = path.resolve(srcDir);
    lggr.info('srcDir: ' + srrd(srcDir) + ' -> ' + srrd(srcDirPath));

    var destPath = parseDate(path.resolve(dest));
    lggr.info('dest: ' + srrd(dest) + ' -> ' + srrd(destPath));

    // Setting parameters
    var throws = obtain(options, 'throws', false);
    lggr.info('throws: ' + String(throws));

    var archiveType = obtain(options, 'archiveType', 'ZIP');
    lggr.info('archiveType: ' + String(archiveType));

    var archiveOptions = obtain(options, 'archiveOptions', true);
    lggr.info('archiveOptions: ' + insp(archiveOptions));

    // Overwriting isDryRUn
    var isDryRun = obtain(options, 'isDryRun', null);
    lggr.info('isDryRun: ' + String(isDryRun));

    var compOp = archiveOptions;
    if (isBoolean(isDryRun)) {
      compOp = objAdd(archiveOptions, { isDryRun: isDryRun });
    }

    var archiveFunc = zlib.deflateSync;
    if (isSameMeaning(archiveType, 'RAR')) {
      archiveFunc = zlib.deflateSyncIntoRar;
    }

    var forEachSubDir = obtain(options, 'forEachSubDir', true);
    lggr.info('forEachSubDir: ' + String(forEachSubDir));

    var rtn;

    if (!forEachSubDir) {
      try {
        rtn = archiveFunc(srcDirPath, destPath, compOp);
        lggr.info('Finished to archive process with exitCode: ' + rtn.exitCode);
        lggr.info('archivedPath: ' + rtn.archivedPath);
      } catch (e) {
        if (throws) throw new Error(insp(e) + errMes);
        lggr.error(insp(e));
      }
    } else {
      // Setting options for filtering sub directories
      var includesEmptyDir = obtain(options, 'includesEmptyDir', false);
      lggr.info('includesEmptyDir: ' + String(includesEmptyDir));

      var includesSymlink = obtain(options, 'includesSymlink', false);
      lggr.info('includesSymlink: ' + String(includesSymlink));

      var matchedRegExp = obtain(options, 'matchedRegExp', null);
      if (matchedRegExp && isArray(matchedRegExp) && matchedRegExp.length > 0) {
        matchedRegExp = '(' + matchedRegExp.join('|') + ')';
      }
      lggr.info('matchedRegExp: ' + matchedRegExp);

      var ignoredRegExp = obtain(options, 'ignoredRegExp', null);
      if (ignoredRegExp && isArray(ignoredRegExp) && ignoredRegExp.length > 0) {
        ignoredRegExp = '(' + ignoredRegExp.join('|') + ')';
      }
      lggr.info('ignoredRegExp: ' + ignoredRegExp);

      // Getting files to be archive
      var srcFileNames = fs.readdirSync(srcDirPath, {
        withFileTypes: false,
        excludesSymlink: !includesSymlink,
        matchedRegExp: matchedRegExp,
        ignoredRegExp: ignoredRegExp
      });
      lggr.debug('srcFileNames: ' + insp(srcFileNames));

      var srcNum = srcFileNames.length;
      lggr.info('Found ' + srcNum + ' files and directories in src');

      // Compresses each sub directory and makes root files
      rtn = [];
      var rootFiles = [];
      var additionalArchiveOptions = obtain(options, 'additionalArchiveOptions', null);

      srcFileNames.forEach(function (srcFileName, i) {
        if (lggr.transportation === 'CONSOLE') WScript.StdOut.Write('.');

        var logHeader = '[' + (i + 1) + '/' + srcNum + '] ' + srcFileName;
        lggr.info(logHeader);

        var srcPath = path.join(srcDirPath, srcFileName);
        lggr.info('srcPath: ' + srcPath);

        if (fs.statSync(srcPath).isDirectory()) {
          if (!includesEmptyDir) {
            var srcItems = fs.readdirSync(srcPath, { withFileTypes: false });

            if (isEmpty(srcItems)) {
              lggr.info('Skipped due to empty directory. ' + srcPath);
              return;
            }
          }

          var op = cloneDeep(compOp); // Copy the Object

          // Overwriting options with the current directory options
          if (isPlainObject(additionalArchiveOptions)) {
            var dirName = path.basename(srcPath);
            var exOp = additionalArchiveOptions[dirName];
            if (isPlainObject(exOp)) op = objAdd(op, exOp);
          }

          lggr.info('options for archiving: ' + insp(op));

          try {
            var rtnCmpDir = archiveFunc(srcPath, destPath, op);
            lggr.info('Finished to archive process with exitCode: ' + rtnCmpDir.exitCode);
            lggr.info('archivedPath: ' + rtnCmpDir.archivedPath);
            rtn.push(rtnCmpDir);
          } catch (e) {
            if (throws) throw new Error(insp(e) + errMes);
            lggr.error(insp(e));
          }
          return;
        }

        if (fs.statSync(srcPath).isFile()) {
          rootFiles.push(srcPath);
        }
      });

      // Compresses root files
      if (!isEmpty(rootFiles)) {
        var rootFilesName = obtain(options, 'rootFilesName', 'RootFiles');
        var destRootFiles = path.join(destPath, rootFilesName);

        try {
          var rtnCmpFs = archiveFunc(rootFiles, destRootFiles, compOp);
          lggr.info('Finished to archive process with exitCode: ' + rtnCmpFs.exitCode);
          lggr.info('archivedPath: ' + rtnCmpFs.archivedPath);
          rtn.push(rtnCmpFs);
        } catch (e) {
          if (throws) throw new Error(insp(e) + errMes);
          lggr.error(insp(e));
        }
      }
    }

    lggr.info('Finished the function ' + FN);
    var transportsLog = obtain(options, 'transportsLog', true);
    if (transportsLog) lggr.transport();

    return rtn;
  }; // }}}

  // dirBkup.backupDirUsingSchema {{{
  /**
   * @typedef {object} typeSchemaBackUpper
   * @property {string} [description]
   * @property {object} [components]
   * @property {...(typeSchemaBackUpperTask|typeSchemaArchiverTask)} tasks
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
   * @typedef {typeDeflateZipOption|typeDeflateRarOption} typeSchemaArchiverTask - See {@link https://docs.tuckn.net/WshZLIB/global.html#typeDeflateZipOption|Wsh.ZLIB.typeDeflateZipOption} and {@link https://docs.tuckn.net/WshZLIB/global.html#typeDeflateRarOption|Wsh.ZLIB.typeDeflateRarOption}.
   * @property {string} [description] - The task description.
   * @property {boolean} [available=true] - If specifying false, Skips the task.
   * @property {string} srcDir - The source directory path to archive.
   * @property {string} dest - The destination path.
   * @property {string} archiveType - The archiving method, 'ZIP' or 'RAR'
   * @property {string} {boolean} [forEachSubDir=true] - Compresses each sub directory in the specified source directory.
   * @property {boolean} [includesEmptyDir=false] - Compresses empty directories.
   * @property {boolean} [includesSymlink] - Copies symbolic link.
   * @property {string|Array} [matchedRegExp] - e.g. "^[^.].+$"
   * @property {string|Array} [ignoredRegExp] - e.g. "\\.git.*"
   * @property {boolean} [throws=false] - Throws a error.
   */

  /**
   * Backs up the directories.
   *
   * @example
   * var dirBkup = Wsh.DirBackUpper; // Shorthand
   * var schema = {
   *   description: 'Example Schema WshDirBackUpper',
   *   components: {
   *     dest: '\\\\MyNas\\BackUp',
   *     exe7z: 'D:\\My Apps\\7-Zip\\7z.exe',
   *     anyVal1: null
   *   },
   *   tasks: {
   *     userAppData: {
   *       description: 'Example task with options',
   *       srcDir: 'C:\\Users\\Default\\AppData',
   *       destDir: '${dest}\\AppData\\#{yyyy}\\#{MM-dd}',
   *       method: 'UPDATE',
   *       options: {
   *         comparison: 'TIME',
   *         ignoredRegExp: [
   *           'Windows\\\\WebCache',
   *           'Packages\\\\.*Cache\\\\',
   *           '\\.mui$',
   *           '\\.settingcontent-ms$'
   *         ]
   *       }
   *     },
   *     'userAppData:zip': {
   *       srcDir: 'C:\\Users\\Default\\AppData',
   *       destDir: '${dest}\\AppData\\archives',
   *       method: 'ARCHIVE',
   *       options: {
   *         ignoredRegExp: ['\\.git.*'],
   *         archiveType: 'ZIP',
   *         archiveOptions: {
   *           exe7z: '${exe7z}',
   *           dateCode: 'yyyy-MM-dd',
   *           compressLv: 9,
   *           password: 'This is mY&p@ss ^_<'
   *         },
   *         additionalArchiveOptions: {
   *           'Visual Studio Code': {
   *             excludingFiles: [
   *               '*\\data\\user-data\\*Cache*\\*',
   *               '*\\data\\user-data\\logs\\*',
   *               '*\\data\\user-data\\*\\*\\LOCK'
   *             ]
   *           }
   *         }
   *       }
   *     },
   *     'appLog:current': {
   *       srcDir: 'D:\\AppLogs\\#{yyyy}\\#{MM}',
   *       destDir: '${dest}\\AppLogs\\#{yyyy}\\#{MM}',
   *       method: 'MIRROR',
   *       options: {
   *         comparison: 'CONTENT',
   *         matchedRegExp: '\\.csv$'
   *       }
   *     },
   *     'appLog:lastMonth': {
   *       available: false,
   *       srcDir: '${anyVal1}:\\AppLogs\\#{yyyy\\[MM-1]}',
   *       destDir: '${dest}\\AppLogs\\#{yyyy\\[MM-1]}',
   *       method: 'MIRROR',
   *       options: {
   *         comparison: 'TIME',
   *         matchedRegExp: '\\.csv$'
   *       }
   *     }
   *   }
   * };
   *
   * dirBkup.backupDirUsingSchema(schema, 'work:*', {
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
  dirBkup.backupDirUsingSchema = function (schema, taskName, options) {
    var FN = 'dirBkup.backupDirUsingSchema';
    var loggerObj = obtain(options, 'logger', {});
    var lggr = logger.create(loggerObj);
    lggr.info('Start the function ' + FN);

    lggr.debug('schema: ' + insp(schema));
    lggr.debug('taskName: ' + insp(taskName));
    lggr.debug('options: ' + insp(options));

    var transportsLog = obtain(options, 'transportsLog', true);
    lggr.info('transportsLog: ' + String(transportsLog));

    var isDryRun = obtain(options, 'isDryRun', false);
    lggr.info('isDryRun: ' + String(isDryRun));

    var throws = obtain(options, 'throws', false);
    lggr.info('throws: ' + String(throws));

    // Filtering execution tasks
    if (!isPlainObject(schema)) throwErrNonObject(FN, schema);
    if (!isSolidString(taskName)) throwErrNonStr(FN, taskName);

    lggr.info('taskName: ' + taskName);

    var scm = cloneDeep(schema); // Copy the Object
    var tasks = scm.tasks; // Shorthand
    var taskNames = Object.keys(tasks);

    var regNameMatcher;
    var baseRegStr = '^' + taskName + '$';
    if (includes(taskName, '*')) {
      regNameMatcher = new RegExp(baseRegStr.replace(/\*/g, '.*'));
    } else {
      regNameMatcher = new RegExp(baseRegStr);
    }

    var execTasks = taskNames.filter(function (taskName) {
      return regNameMatcher.test(taskName);
    });
    lggr.info('matched tasks number: ' + execTasks.length);

    // Getting component values in the schema
    var cmpVals = scm.components; // Shorthand

    // Overwriting component values in keys storing null.
    if (hasContent(options.overwrites)) {
      Object.keys(cmpVals).forEach(function (key) {
        if (cmpVals[key] !== null) return;

        Object.keys(options.overwrites).some(function (writeKey) {
          if (key === writeKey) {
            cmpVals[key] = options.overwrites[writeKey];
            return true;
          }
        });
      });
    }

    // Executing tasks
    execTasks.forEach(function (taskName) {
      var tsk = tasks[taskName]; // Shorthand

      lggr.info('Start the task: ' + taskName);

      // Skipping non available task
      if (tsk.available === false) {
        lggr.info('available: false => Skip the task: ' + taskName);
        return;
      }

      // Setting parameters

      // Parsing with the component values
      var parseComponentStr = function (obj, key) {
        var val = obj[key];

        if (isString(val)) {
          obj[key] = parseDate(parseTmp(val || '', cmpVals));
          lggr.info(key + ': ' + val + ' -> ' + obj[key]);
          return;
        }

        if (isSolidObject(val)) {
          Object.keys(val).forEach(function (keyInVal) {
            parseComponentStr(obj[key], keyInVal);
          });
        }
      };

      Object.keys(tsk).forEach(function (propName) {
        parseComponentStr(tsk, propName);
      });

      var method = obtain(tsk, 'method');
      lggr.info('method: ' + method);

      var op = objAdd(
        // The option on the schema
        tsk.options,
        // The options at this function
        {
          logger: lggr,
          transportsLog: transportsLog,
          isDryRun: isDryRun,
          throws: throws
        }
      );

      if (isSameMeaning(method, 'ARCHIVE')) {
        // Archiving
        try {
          dirBkup.archiveDir(tsk.srcDir, tsk.destDir, op);
        } catch (e) {
          if (throws) throw new Error(insp(e));
          lggr.error(insp(e));
        }
      } else {
        // Copying
        op = objAdd(op, { syncMethod: method });

        try {
          dirBkup.backupDir(tsk.srcDir, tsk.destDir, op);
        } catch (e) {
          if (throws) throw new Error(insp(e));
          lggr.error(insp(e));
        }
      }

      lggr.info('Finished the task: ' + taskName);
    });

    lggr.info('Finished the function ' + FN);
    if (transportsLog) lggr.transport();

    return;
  }; // }}}
})();

// vim:set foldmethod=marker commentstring=//%s :
