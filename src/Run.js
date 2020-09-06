﻿/* globals Wsh: false */
/* globals process: false */

// Shorthands
var util = Wsh.Util;
var CD = Wsh.Constants;
var cli = Wsh.Commander;
var ConfigStore = Wsh.ConfigStore;
var net = Wsh.Net;
var dirbkup = Wsh.DirBackUpper; // Shorthand

var isSolidArray = util.isSolidArray;

/**
 * Below are the APIs of CLI (Command Line Interface). Some inappropriate titles are used because they are generated by JsDoc.
 *
 * @namespace CLI
 */

// backup {{{
/**
 * Back up the specifying directory.
 *
 * @example
 * Usage: backup <srcDir> <destDir> [options]
 *
 * The command to back up a directory
 *
 * Options:
 *   -V, --version                  Output the version number
 *   -S, --sync-method <method>     Synchronization method. "UPDATE" (default) or "MIRROR"
 *   -C, --comparison <method>      Comparison method. Default is "TIME" (modification date). otherwise "CONTENT" (MD5, slow)
 *   -R, --no-recursively           Excludes sub directories
 *   -P, --no-omit-empdir           Copies empty directories
 *   -L, --no-omit-symlink          Copies symbolic links
 *   -M, --matched-reg <expression> Matched files RegExp
 *   -I, --ignored-reg <expression> Ignored files RegExp
 *   -E, --no-ignore-err            Throw Error
 *   -L, --logger <val>             <level>/<transportation> (e.g. "warn/popup").  (default: "info/console")
 *   -R, --dry-run                  No execute. Outputs the string of command. (default: false)
 *   -h, --help                     Output usage information
 * @function backup
 * @memberof CLI
 */
cli.addProgram({
  command: 'backup <srcDir> <destDir>',
  description: 'The command to back up a directory',
  version: '2.1.0',
  options: [
    ['-S, --sync-method <method>', 'Synchronization method. "UPDATE" (default) or "MIRROR"'],
    ['-C, --comparison <method>', 'Comparison method. Default is "TIME" (modification date). otherwise "CONTENT" (MD5, slow)'],
    ['-R, --no-recursively', 'Excludes sub directories'],
    ['-P, --no-omit-empdir', 'Copies empty directories'],
    ['-L, --no-omit-symlink', 'Copies symbolic links'],
    ['-M, --matched-reg <expression>', 'Matched files RegExp'],
    ['-I, --ignored-reg <expression>', 'Ignored files RegExp'],
    ['-E, --no-ignore-err', 'Throw Error'],
    ['-L, --logger <val>', '<level>/<transportation> (e.g. "warn/popup"). ', 'info/console'],
    ['-R, --dry-run', 'No execute. Outputs the string of command.']
  ],
  action: function (srcDir, destDir, opt) {
    var retVal = dirbkup.backupDirUsingLog(srcDir, destDir, {
      syncMethod: opt.syncMethod,
      comparison: opt.comparison,
      isRecursive: opt.recursively,
      copiesEmpDir: !opt.omitEmpdir,
      includesSymlink: !opt.omitSymlink,
      matchedRegExp: opt.matchedReg,
      ignoredRegExp: opt.ignoredReg,
      throws: !opt.ignoreErr,
      logger: opt.logger,
      isDryRun: opt.dryRun
    });

    if (opt.dryRun) console.log(retVal);

    process.exit(CD.runOk);
  }
}); // }}}

// schemaBackup {{{
/**
 * Back up directories defined with a schema JSON.
 *
 * @example
 * Usage: schemaBackup <taskName> [overwriteKey:val...] [options]
 *
 * The command to back up directories defined with a schema JSON
 *
 * Options:
 *   -V, --version          Output the version number
 *   -D, --dir-path <path>  The path name where the schema JSON is located. <Directory Path> or "cwd", "portable", "userProfile". Default: "cmd" is "%CD%\.wsh"
 *   -F, --file-name <name> A JSON file name. (default: "settings.json")
 *   -E, --encoding <name>  The JSON file encoding. (default: "utf-8")
 *   -N, --prop-name <name> A property name of the schema object. (default: "dirBackUpperSchema")
 *   -L, --logger <val>     <level>/<transportation>. e.g. "warn/popup".  (default: "info/console")
 *   -R, --dry-run          No execute. Outputs the string of command. (default: false)
 *   -h, --help             Output usage information
 * @function schemaBackup
 * @memberof CLI
 */
cli.addProgram({
  command: 'schemaBackup <taskName> [overwriteKey:val...]',
  description: 'The command to back up directories defined with a schema JSON',
  version: '2.1.0',
  options: [
    ['-D, --dir-path <path>', 'The path name where the schema JSON is located. <Directory Path> or "cwd", "portable", "userProfile". Default: "cmd" is "%CD%\\.wsh"'],
    ['-F, --file-name <name>', 'A JSON file name.', 'settings.json'],
    ['-E, --encoding <name>', 'The JSON file encoding.', CD.ado.charset.utf8],
    ['-N, --prop-name <name>', 'A property name of the schema object.', 'dirBackUpperSchema'],
    ['-L, --logger <val>', '<level>/<transportation>. e.g. "warn/popup". ', 'info/console'],
    ['-R, --dry-run', 'No execute. Outputs the string of command.']
  ],
  action: function (taskName, overwrites, opt) {
    var overwritesObj = {};
    if (isSolidArray(overwrites)) {
      overwrites.forEach(function (setStr) {
        var strs = setStr.split(':');
        if (strs.length > 1) overwritesObj[strs[0]] = strs[1];
      });
    }

    var conf = new ConfigStore(opt.fileName, {
      dirPath: opt.dirPath,
      fileOptions: { encoding: opt.encoding }
    });
    var schema = conf.get(opt.propName);

    var retVal = dirbkup.backupDirUsingSchema(schema, taskName, {
      overwrites: overwritesObj,
      logger: opt.logger,
      showsResult: opt.hasResult,
      isDryRun: opt.dryRun
    });

    if (opt.dryRun) console.log(retVal);
    process.exit(CD.runOk);
  }
}); // }}}

cli.parse(process.argv);
