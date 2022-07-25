﻿!function(){var util,path,os,fs,fse,zlib,logger,objAdd,insp,obtain,parseTmp,parseDate,hasContent,includes,isArray,isEmpty,isSolidString,isPlainObject,isSameMeaning,srrd,dirBkup,MODULE_TITLE,throwErrNonStr;Wsh&&Wsh.DirBackUpper||(Wsh.DirBackUpper={},util=Wsh.Util,path=Wsh.Path,os=Wsh.OS,fs=Wsh.FileSystem,fse=Wsh.FileSystemExtra,zlib=Wsh.ZLIB,logger=Wsh.Logger,objAdd=Object.assign,insp=util.inspect,obtain=util.obtainPropVal,parseTmp=util.parseTemplateLiteral,parseDate=util.parseDateLiteral,hasContent=util.hasContent,includes=util.includes,isArray=util.isArray,isEmpty=util.isEmpty,isSolidString=util.isSolidString,isPlainObject=util.isPlainObject,isSameMeaning=util.isSameMeaning,srrd=os.surroundCmdArg,dirBkup=Wsh.DirBackUpper,MODULE_TITLE="WshDirBackUpper/DirBackUpper.js",throwErrNonStr=function(functionName,errVal){util.throwTypeError("string",MODULE_TITLE,functionName,errVal)},dirBkup.backupDir=function(srcDir,destDir,options){var FN="dirBkup.backupDir",loggerObj=obtain(options,"logger",{}),lggr=logger.create(loggerObj),srcDirPath=(lggr.info("Start the function "+FN),lggr.debug("srcDir: "+insp(srcDir)),lggr.debug("dest: "+insp(destDir)),lggr.debug("options: "+insp(options)),isSolidString(srcDir)||throwErrNonStr(FN,srcDir),isSolidString(destDir)||throwErrNonStr(FN,destDir),path.resolve(srcDir)),destDirPath=(lggr.info('srcDir: "'+srcDir+'" -> "'+srcDirPath+'"'),parseDate(path.resolve(destDir))),loggerObj=(lggr.info('destDir: "'+destDir+'" -> "'+destDirPath+'"'),obtain(options,"syncMethod","UPDATE")),comparison=(/^(update|mirror)$/i.test(loggerObj)||(srcDir="options.update",util.throwValueError(srcDir,MODULE_TITLE,FN,loggerObj)),lggr.info("syncMethod: "+loggerObj),obtain(options,"comparison","TIME")),throws=(lggr.info("comparison: "+comparison),obtain(options,"throws",!1)),isDryRun=(lggr.info("throws: "+String(throws)),obtain(options,"isDryRun",!1)),copyFunc=(lggr.info("isDryRun: "+String(isDryRun)),isDryRun?function(){}:fse.copySync),removeFunc=isDryRun?function(){}:fse.removeSync,copiesEmpDir=obtain(options,"copiesEmpDir",!1),destDir=(lggr.info("copiesEmpDir: "+String(copiesEmpDir)),obtain(options,"includesSymlink",!1)),srcDir=(lggr.info("includesSymlink: "+String(destDir)),obtain(options,"matchedRegExp",null)),ignoredRegExp=(srcDir&&isArray(srcDir)&&0<srcDir.length&&(srcDir="("+srcDir.join("|")+")"),lggr.info("matchedRegExp: "+srcDir),obtain(options,"ignoredRegExp",null)),isRecursive=(ignoredRegExp&&isArray(ignoredRegExp)&&0<ignoredRegExp.length&&(ignoredRegExp="("+ignoredRegExp.join("|")+")"),lggr.info("ignoredRegExp: "+ignoredRegExp),obtain(options,"isRecursive",!0)),readFn=(lggr.info("isRecursive: "+String(isRecursive)),isRecursive?fse.readdirSyncRecursively:fs.readdirSync),srcFileNames=(lggr.info("Reading srcDir"+(isRecursive?" recursively...":"...")),readFn(srcDirPath,{withFileTypes:!1,excludesSymlink:!destDir,matchedRegExp:srcDir,ignoredRegExp:ignoredRegExp})),srcNum=(lggr.debug("srcFileNames: "+insp(srcFileNames)),srcFileNames.length),destFileNames=(lggr.info("Found "+srcNum+" files and directories in src"),[]);fs.existsSync(destDirPath)?(lggr.info("Reading destDir"+(isRecursive?" recursively...":"...")),destFileNames=readFn(destDirPath,{withFileTypes:!1,excludesSymlink:!destDir,matchedRegExp:srcDir,ignoredRegExp:ignoredRegExp}),lggr.info("Found "+destFileNames.length+" files and directories in dest")):lggr.info("destDir is not existing"),lggr.debug(destFileNames),lggr.info("Comparing a difference of file "+comparison),srcFileNames.forEach(function(srcFileName,i){"CONSOLE"===lggr.transportation&&WScript.StdOut.Write(".");var i="["+(i+1)+"/"+srcNum+'] "'+srcFileName+'"',srcPath=(lggr.debug(i),path.join(srcDirPath,srcFileName)),destPath=path.join(destDirPath,srcFileName);lggr.debug("srcPath: "+srcPath),lggr.debug("destPath: "+destPath);try{if(fs.statSync(srcPath).isDirectory())return void(copiesEmpDir&&!isDryRun&&fse.ensureDirSync(destPath));if(!includes(destFileNames,srcFileName,"i"))return lggr.info("Copied "+i+" (New file)"),copyFunc(srcPath,destPath);if(/^time$/i.test(comparison))return fse.isTheSameFile(srcPath,destPath,"date")?void 0:(lggr.info("Copied "+i+" (Modified date are different)"),copyFunc(srcPath,destPath));if(/^content$/i.test(comparison))return fse.isTheSameFile(srcPath,destPath,"MD5")?void 0:(lggr.info("Copied "+i+" (MD5 values are different)"),copyFunc(srcPath,destPath));throw new Error('"'+comparison+'" is undefined comparison method.')}catch(e){if(throws)throw new Error(insp(e)+"\n  at "+FN+" ("+MODULE_TITLE+')\n  copy "'+srcPath+'" to "'+destPath);lggr.error(i+' -> Error occured while trying to copy "'+srcPath+'" to "'+destPath+'". '+insp(e))}}),/^mirror$/i.test(loggerObj)&&(lggr.info("Remove none-existing files from dest"),destFileNames.forEach(function(destFileName){if(!includes(srcFileNames,destFileName,"i"))return lggr.info("Remove "+destFileName+" in "+destDirPath),removeFunc(path.join(destDirPath,destFileName))})),lggr.info("Finished the function "+FN),obtain(options,"transportsLog",!0)&&lggr.transport()},dirBkup.archiveDir=function(srcDir,dest,options){var rtn,FN="dirBkup.archiveDir",loggerObj=obtain(options,"logger",{}),lggr=logger.create(loggerObj),errMes=(lggr.info("Start the function "+FN),lggr.debug("srcDir: "+insp(srcDir)),lggr.debug("dest: "+insp(dest)),lggr.debug("options: "+insp(options)),"\n  at "+FN+" ("+MODULE_TITLE+").\n  srcDir: "+insp(srcDir)+",\n  dest: "+insp(dest)+",\n  options: "+insp(options)),srcDirPath=(isSolidString(srcDir)||throwErrNonStr(FN,srcDir),isSolidString(dest)||throwErrNonStr(FN,dest),path.resolve(srcDir)),destPath=(lggr.info("srcDir: "+srrd(srcDir)+" -> "+srrd(srcDirPath)),parseDate(path.resolve(dest))),throws=(lggr.info("dest: "+srrd(dest)+" -> "+srrd(destPath)),obtain(options,"throws",!1)),loggerObj=(lggr.info("throws: "+String(throws)),obtain(options,"isDryRun",!1)),srcDir=(lggr.info("isDryRun: "+String(loggerObj)),obtain(options,"archiveType","ZIP")),archiveFunc=(lggr.info("archiveType: "+String(srcDir)),zlib.deflateSync),dest=(isSameMeaning(srcDir,"RAR")&&(archiveFunc=zlib.deflateSyncIntoRar),obtain(options,"forEachSubDir",!0));if(lggr.info("forEachSubDir: "+String(dest)),dest){var includesEmptyDir=obtain(options,"includesEmptyDir",!1),loggerObj=(lggr.info("includesEmptyDir: "+String(includesEmptyDir)),obtain(options,"includesSymlink",!1)),srcDir=(lggr.info("includesSymlink: "+String(loggerObj)),obtain(options,"matchedRegExp",null)),dest=(srcDir&&isArray(srcDir)&&0<srcDir.length&&(srcDir="("+srcDir.join("|")+")"),lggr.info("matchedRegExp: "+srcDir),obtain(options,"ignoredRegExp",null)),loggerObj=(dest&&isArray(dest)&&0<dest.length&&(dest="("+dest.join("|")+")"),lggr.info("ignoredRegExp: "+dest),fs.readdirSync(srcDirPath,{withFileTypes:!1,excludesSymlink:!loggerObj,matchedRegExp:srcDir,ignoredRegExp:dest})),srcNum=(lggr.debug("srcFileNames: "+insp(loggerObj)),loggerObj.length),rootFiles=(lggr.info("Found "+srcNum+" files and directories in src"),rtn=[],[]);if(loggerObj.forEach(function(srcFileName,i){"CONSOLE"===lggr.transportation&&WScript.StdOut.Write(".");lggr.info("["+(i+1)+"/"+srcNum+"] "+srcFileName);i=path.join(srcDirPath,srcFileName);if(lggr.info("srcPath: "+i),fs.statSync(i).isDirectory()){if(!includesEmptyDir){srcFileName=fs.readdirSync(i,{withFileTypes:!1});if(isEmpty(srcFileName))return void lggr.info("Skipped due to empty directory. "+i)}try{var rtnCmpDir=archiveFunc(i,destPath,options);lggr.info("Finished to archive process with exitCode: "+rtnCmpDir.exitCode),lggr.info("archivedPath: "+rtnCmpDir.archivedPath),rtn.push(rtnCmpDir)}catch(e){if(throws)throw new Error(insp(e)+errMes);lggr.error(insp(e))}}else fs.statSync(i).isFile()&&rootFiles.push(i)}),!isEmpty(rootFiles))try{var rtnCmpFs=archiveFunc(rootFiles,destPath,options);lggr.info("Finished to archive process with exitCode: "+rtnCmpFs.exitCode),lggr.info("archivedPath: "+rtnCmpFs.archivedPath),rtn.push(rtnCmpFs)}catch(e){if(throws)throw new Error(insp(e)+errMes);lggr.error(insp(e))}}else try{rtn=archiveFunc(srcDirPath,destPath,options),lggr.info("Finished to archive process with exitCode: "+rtn.exitCode),lggr.info("archivedPath: "+rtn.archivedPath)}catch(e){if(throws)throw new Error(insp(e)+errMes);lggr.error(insp(e))}return lggr.info("Finished the function "+FN),obtain(options,"transportsLog",!0)&&lggr.transport(),rtn},dirBkup.backupDirUsingSchema=function(schema,taskName,options){var FN="dirBkup.backupDirUsingSchema",loggerObj=obtain(options,"logger",{}),lggr=logger.create(loggerObj),transportsLog=(lggr.info("Start the function "+FN),lggr.debug("schema: "+insp(schema)),lggr.debug("taskName: "+insp(taskName)),lggr.debug("options: "+insp(options)),obtain(options,"transportsLog",!0)),isDryRun=(lggr.info("transportsLog: "+String(transportsLog)),obtain(options,"isDryRun",!1)),throws=(lggr.info("isDryRun: "+String(isDryRun)),obtain(options,"throws",!1)),tasks=(lggr.info("throws: "+String(throws)),isPlainObject(schema)||util.throwTypeError("object",MODULE_TITLE,FN,schema),isSolidString(taskName)||throwErrNonStr(FN,taskName),lggr.info("taskName: "+taskName),schema.tasks),loggerObj=Object.keys(tasks),baseRegStr="^"+taskName+"$",regNameMatcher=includes(taskName,"*")?new RegExp(baseRegStr.replace(/\*/g,".*")):new RegExp(baseRegStr),taskName=loggerObj.filter(function(taskName){return regNameMatcher.test(taskName)}),cmpVals=(lggr.info("matched tasks number: "+taskName.length),schema.components);hasContent(options.overwrites)&&Object.keys(cmpVals).forEach(function(key){null===cmpVals[key]&&Object.keys(options.overwrites).some(function(writeKey){if(key===writeKey)return cmpVals[key]=options.overwrites[writeKey],!0})}),taskName.forEach(function(taskName){var tsk=tasks[taskName];if(lggr.info("Start the task: "+taskName),!1===tsk.available)lggr.info("available: false => Skip the task: "+taskName);else{var srcDir=parseDate(parseTmp(tsk.srcDir||"",cmpVals)),dest=(lggr.info("source: "+srrd(tsk.srcDir)+" -> "+srrd(srcDir)),parseDate(parseTmp(tsk.destDir||"",cmpVals))),method=(lggr.info("dest: "+srrd(tsk.destDir)+" -> "+srrd(dest)),obtain(tsk,"method")),tsk=(lggr.info("method: "+method),objAdd({logger:lggr,transportsLog:transportsLog,isDryRun:isDryRun,"throws":throws},tsk.options));if(isSameMeaning(method,"ARCHIVE"))try{dirBkup.archiveDir(srcDir,dest,tsk)}catch(e){if(throws)throw new Error(insp(e));lggr.error(insp(e))}else{tsk=objAdd(tsk,{syncMethod:method});try{dirBkup.backupDir(srcDir,dest,tsk)}catch(e){if(throws)throw new Error(insp(e));lggr.error(insp(e))}}lggr.info("Finished the task: "+taskName)}}),lggr.info("Finished the function "+FN),transportsLog&&lggr.transport()})}();
