﻿!function(){var util,path,fs,fse,logger,objAdd,insp,obtain,parseTmp,parseDate,hasContent,includes,isArray,isSolidString,isPlainObject,dirbkup,MODULE_TITLE,throwErrNonStr;Wsh&&Wsh.DirBackUpper||(Wsh.DirBackUpper={},util=Wsh.Util,path=Wsh.Path,fs=Wsh.FileSystem,fse=Wsh.FileSystemExtra,logger=Wsh.Logger,objAdd=Object.assign,insp=util.inspect,obtain=util.obtainPropVal,parseTmp=util.parseTemplateLiteral,parseDate=util.parseDateLiteral,hasContent=util.hasContent,includes=util.includes,isArray=util.isArray,isSolidString=util.isSolidString,isPlainObject=util.isPlainObject,dirbkup=Wsh.DirBackUpper,MODULE_TITLE="WshDirBackUpper/DirBackUpper.js",throwErrNonStr=function(functionName,errVal){util.throwTypeError("string",MODULE_TITLE,functionName,errVal)},dirbkup.backupDirUsingLog=function(srcDir,destDir,options){var FN="dirbkup.backupDirUsingLog",loggerObj=obtain(options,"logger",{}),lggr=logger.create(loggerObj),srcDirPath=(lggr.info("Start the function "+FN),isSolidString(srcDir)||throwErrNonStr(FN,srcDir),isSolidString(destDir)||throwErrNonStr(FN,destDir),path.resolve(srcDir)),destDirPath=parseDate(path.resolve(destDir)),loggerObj=obtain(options,"syncMethod","UPDATE"),comparison=(/^(update|mirror)$/i.test(loggerObj)||(valName="options.update",util.throwValueError(valName,MODULE_TITLE,FN,loggerObj)),obtain(options,"comparison","TIME")),valName=obtain(options,"isRecursive",!0),readFn=valName?fse.readdirSyncRecursively:fs.readdirSync,copiesEmpDir=obtain(options,"copiesEmpDir",!1),includesSymlink=obtain(options,"includesSymlink",!1),throws=obtain(options,"throws",!1),isDryRun=obtain(options,"isDryRun",!1),copyFunc=isDryRun?function(){}:fse.copySync,removeFunc=isDryRun?function(){}:fse.removeSync,matchedRegExp=obtain(options,"matchedRegExp",null),ignoredRegExp=(matchedRegExp&&isArray(matchedRegExp)&&0<matchedRegExp.length&&(matchedRegExp="("+matchedRegExp.join("|")+")"),obtain(options,"ignoredRegExp",null)),srcFileNames=(ignoredRegExp&&isArray(ignoredRegExp)&&0<ignoredRegExp.length&&(ignoredRegExp="("+ignoredRegExp.join("|")+")"),lggr.info('srcDir: "'+srcDir+'" -> "'+srcDirPath+'"'),lggr.info('destDir: "'+destDir+'" -> "'+destDirPath+'"'),lggr.info("syncMethod: "+loggerObj),lggr.info("comparison: "+comparison),lggr.info("isRecursive: "+String(valName)),lggr.info("copiesEmpDir: "+String(copiesEmpDir)),lggr.info("includesSymlink: "+String(includesSymlink)),lggr.info("matchedRegExp: "+matchedRegExp),lggr.info("ignoredRegExp: "+ignoredRegExp),lggr.info("throws: "+String(throws)),lggr.info("Reading srcDir"+(valName?" recursively...":"...")),readFn(srcDirPath,{withFileTypes:!1,excludesSymlink:!includesSymlink,matchedRegExp:matchedRegExp,ignoredRegExp:ignoredRegExp})),srcNum=(lggr.debug(srcFileNames),srcFileNames.length),destFileNames=(lggr.info("Found "+srcNum+" files/directories in src"),[]);fs.existsSync(destDirPath)?(lggr.info("Reading destDir"+(valName?" recursively...":"...")),destFileNames=readFn(destDirPath,{withFileTypes:!1,excludesSymlink:!includesSymlink,matchedRegExp:matchedRegExp,ignoredRegExp:ignoredRegExp}),lggr.info("Found "+destFileNames.length+" files/directories in dest")):lggr.info("destDir is not existing"),lggr.debug(destFileNames),lggr.info("Comparing a difference of file "+comparison),srcFileNames.forEach(function(srcFileName,i){"CONSOLE"===lggr.transportation&&WScript.StdOut.Write(".");var i="["+(i+1)+"/"+srcNum+'] "'+srcFileName+'"',srcPath=(lggr.debug(i),path.join(srcDirPath,srcFileName)),destPath=path.join(destDirPath,srcFileName);lggr.debug("srcPath: "+srcPath),lggr.debug("destPath: "+destPath);try{if(fs.statSync(srcPath).isDirectory())return void(copiesEmpDir&&!isDryRun&&fse.ensureDirSync(destPath));if(!includes(destFileNames,srcFileName,"i"))return lggr.info("Copied "+i+" (New file)"),copyFunc(srcPath,destPath);if(/^time$/i.test(comparison))return fse.isTheSameFile(srcPath,destPath,"date")?void 0:(lggr.info("Copied "+i+" (Modified date are different)"),copyFunc(srcPath,destPath));if(/^content$/i.test(comparison))return fse.isTheSameFile(srcPath,destPath,"MD5")?void 0:(lggr.info("Copied "+i+" (MD5 values are different)"),copyFunc(srcPath,destPath));throw new Error('"'+comparison+'" is undefined comparison method.')}catch(e){if(throws)throw new Error(insp(e)+"\n  at "+FN+" ("+MODULE_TITLE+')\n  copy "'+srcPath+'" to "'+destPath);lggr.error(i+' -> Error occured while trying to copy "'+srcPath+'" to "'+destPath+'". '+insp(e))}}),/^mirror$/i.test(loggerObj)&&(lggr.info("Remove none-existing files from dest"),destFileNames.forEach(function(destFileName){if(!includes(srcFileNames,destFileName,"i"))return lggr.info("Remove "+destFileName+" in "+destDirPath),removeFunc(path.join(destDirPath,destFileName))})),lggr.info("Finished the function "+FN),obtain(options,"transportsLog",!0)&&lggr.transport()},dirbkup.backupDirUsingSchema=function(schema,taskName,options){var FN="dirbkup.backupDirUsingSchema",loggerObj=(isPlainObject(schema)||util.throwTypeError("object",MODULE_TITLE,FN,schema),isSolidString(taskName)||throwErrNonStr(FN,taskName),obtain(options,"logger",{})),lggr=logger.create(loggerObj),tasks=(lggr.info("Start function "+FN),lggr.info('taskName: "'+taskName+'"'),schema.tasks),loggerObj=Object.keys(tasks),regNameMatcher=includes(taskName,"*")?new RegExp(taskName.replace(/\*/g,".*")):new RegExp(taskName),taskName=loggerObj.filter(function(taskName){return regNameMatcher.test(taskName)}),vals=(lggr.info("matched tasks: "+taskName.length),schema.components);hasContent(options.overwrites)&&Object.keys(vals).forEach(function(key){null===vals[key]&&Object.keys(options.overwrites).some(function(writeKey){if(key===writeKey)return vals[key]=options.overwrites[writeKey],!0})}),obtain(options,"isDryRun",!1)&&lggr.info("dry-run ["+FN+"]:"),taskName.forEach(function(taskName){if(lggr.info("Start the task: "+taskName),!1===tasks[taskName].available)lggr.info("available: false => Skip this task");else{var srcDir=parseDate(parseTmp(tasks[taskName].srcDir||"",vals)),destDir=parseDate(parseTmp(tasks[taskName].destDir||"",vals)),syncMethod=parseTmp(tasks[taskName].syncMethod||"",vals),comparison=parseTmp(tasks[taskName].comparison||"",vals),isRecursive=obtain(tasks[taskName],"isRecursive",null),copiesEmpDir=obtain(tasks[taskName],"copiesEmpDir",null),includesSymlink=obtain(tasks[taskName],"includesSymlink",null),matchedRegExp=obtain(tasks[taskName],"matchedRegExp",null),taskName=obtain(tasks[taskName],"ignoredRegExp",null);try{dirbkup.backupDirUsingLog(srcDir,destDir,objAdd({},options,{syncMethod:syncMethod,comparison:comparison,isRecursive:isRecursive,copiesEmpDir:copiesEmpDir,includesSymlink:includesSymlink,matchedRegExp:matchedRegExp,ignoredRegExp:taskName,logger:lggr,transportsLog:!1,"throws":!1}))}catch(e){lggr.error(insp(e))}}}),lggr.info("Finished function "+FN),obtain(options,"transportsLog",!0)&&lggr.transport()})}();
