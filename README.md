# WshDirBackUpper

The WSH (Windows Script Host) CLI updates or mirrors or archives directories according to the schema defined in a JSON file.

## Operating environment

Works on JScript in Windows.

## Installation

Download this ZIP and unzip or Use the following `git` command.

```console
D:\> git clone https://github.com/tuckn/WshDirBackUpper.git
D:\> cd WshDirBackUpper
```

Now suppose your directory structure looks like this.

```console
D:\WshDirBackUpper\
  ├─ .wsh\
  │ └─ settings.json
  └─ dist\
     ├─ Run.wsf
     └─ bundle.js
```

## Usage

### Command Line

Copy the directory

```console
> cscript .\dist\Run.wsf backup "C:\Users\Public" "\\MyNas\Archives"
```

Archive each sub directory in the directory "C:\Users\Public"

```console
> cscript .\dist\Run.wsf archive "C:\Users\Public" "\\MyNas\Archives"
```

### With Schema JSON

The JSON default path to load is _%CD%\.wsh\\settings.json_.
See _.\\.wsh\\settings.json_ as example.

Write your backing up schema in the JSON file, for example,

```json
{
  "dirBackUpperSchema": {
    "tasks": {
      "userAppData": {
        "srcDir": "C:\\Users\\Default\\AppData",
        "destDir": "\\\\MyNas\\BackUp\\User\\AppData",
        "method": "MIRROR", // default: "UPDATE"
      },
      "appLog": {
        "srcDir": "D:\\logs\\csv",
        "destDir": "\\\\MyNas\\BackUp\\csvLogs",
        "method": "ARCHIVE", // default: "UPDATE"
      }
    }
  }
}
```

You can also define variables into `components` object.
The defined variable can be used as `${valName}` in `tasks`.

```json
{
  "dirBackUpperSchema": {
    "components": {
      "dest": "\\\\MyNas\\BackUp"
    },
    "tasks": {
      "userAppData": {
        "srcDir": "C:\\Users\\Default\\AppData",
        "destDir": "${dest}\\User\\AppData",
        "method": "MIRROR",
      },
      "appLog": {
        "srcDir": "D:\\logs\\csv",
        "destDir": "${dest}\\csvLogs",
        "method": "ARCHIVE",
      }
    }
  }
}
```

You can also use a date code literal to define `srcDir` and `destDir`.

```json
{
  "dirBackUpperSchema": {
    "tasks": {
      "appLog:current": {
        "srcDir": "C:\\logs\\csv",
        "destDir": "D:\\BackUp\\#{yyyy}\\#{MM}",
        "method": "MIRROR",
      },
      "appLog:lastMonth": {
        "srcDir": "D:\\BackUp\\#{yyyy\\[MM-1]}",
        "destDir": "\\MyNas\\CsvLogs\\#{yyyy\\[MM-1]}",
        "method": "ARCHIVE",
      }
    }
  }
}
```

See [WshUtil: parseDateLiteral](https://docs.tuckn.net/WshUtil/Wsh.Util.html#.parseDateLiteral) for the literal.

And can also use backing up options.

```json
  "dirBackUpperSchema": {
    "tasks": {
      "userAppData": {
        "srcDir": "C:\\Users\\Default\\AppData",
        "destDir": "D:\\Backup\\AppData\\#{yyyy}\\#{MM-dd}",
        "method": "MIRROR", // default: "UPDATE"
        "options": {
          "comparison": "CONTENT", // default: "TIME"
          "isRecursive": false,
          "copiesEmpDir": true,
          "includesSymlink": true,
          "matchedRegExp": "\\.csv$",
          "ignoredRegExp": [
            "Windows\\\\WebCache",
            "Packages\\\\.*Cache\\\\",
            "\\.mui$",
            "\\.settingcontent-ms$"
          ]
        }
      },
      "appLog:current:rar": {
        "srcDir": "D:\\AppLogs\\#{yyyy}\\#{MM}",
        "destDir": "\\MyNas\\AppLogs\\#{yyyy}\\#{MM}",
        "method": "ARCHIVE",
        "options": {
            "archiveType": "RAR", // default: "ZIP"
            "archiveOptions": {
              "dirWinRar": "C:\\My Apps\\WinRAR",
              "dateCode": "yyyy-MM-dd",
              "compressLv": 0,
              "password": "This is mY&p@ss ^_<"
            },
            "ignoredRegExp": ["^\\.git.*$"]
        }
      }
    }
  }
```

See below to know all options.

- When the `method` is `UPDATE` or `MIRROR`, You can use [WshDirBackUpper: typeSchemaBackUpperTask](https://docs.tuckn.net/WshDirBackUpper/global.html#typeSchemaBackUpperTask)
- When the `method` is `ARCHIVE` and `options.archiveType` is `ZIP`, You can use [WshZLIB: typeDeflateZipOption](https://docs.tuckn.net/WshZLIB/global.html#typeDeflateZipOption)
- When the `method` is `ARCHIVE` and `options.archiveType` is `RAR`, You can use [WshZLIB: typeDeflateRarOption](https://docs.tuckn.net/WshZLIB/global.html#typeDeflateRarOption)

You can use the `schemaBackup` command to perform processing from the schema JSON file.

For example, the below command runs all available backing up tasks defined in the JSON.

```console
> cscript .\dist\Run.wsf schemaBackup *
```

Can specify any tasks to run with property names.

```console
> cscript .\dist\Run.wsf schemaBackup appLog:*
```

Show the help.

```console
> cscript .\dist\Run.wsf schemaBackup --help

Usage: schemaBackup [overwriteKey:val...] [options]

The command to back up directories defined with a schema JSON

Options:
  -V, --version          Output the version number
  -D, --dir-path <path>  The path name where the schema JSON is located. <Directory Path> or "cwd", "portable", "userProfile". Default: "cmd" is "%CD%\.wsh"
  -F, --file-name <name> A JSON file name. (default: "settings.json")
  -E, --encoding <name>  The JSON file encoding. (default: "utf-8")
  -N, --prop-name <name> A property name of the schema object. (default: "dirBackUpperSchema")
  -T, --task <name>      Specify the task name to back up. e.g. "work:*" (default: "*")
  -L, --logger <val>     <level>/<transportation>. e.g. "warn/popup".  (default: "info/console")
  -R, --dry-run          No execute. Outputs the string of command. (default: false)
  -h, --help             Output usage information
```

See [Wsh.ConfigStore](https://docs.tuckn.net/WshConfigStore/) for the options `--dir-path` and `--file-name`.
and see [Wsh.Logger](https://docs.tuckn.net/WshLogger/) for the options `--logger`.

## Installation as Module

(1) Create a directory of your WSH project.

```console
D:\> mkdir MyWshProject
D:\> cd MyWshProject
```

(2) Download this ZIP and unzip or Use the following `git` command.

```console
> git clone https://github.com/tuckn/WshDirBackUpper.git ./WshModules/WshDirBackUpper
or
> git submodule add https://github.com/tuckn/WshDirBackUpper.git ./WshModules/WshDirBackUpper
```

(3) Include _.\\WshDirBackUpper\\dist\\bundle.js_ into your .wsf file.
For Example, if your file structure is

```console
D:\MyWshProject\
├─ Run.wsf
├─ MyScript.js
└─ WshModules\
    └─ WshDirBackUpper\
        └─ dist\
          └─ bundle.js
```

The content of the above _Run.wsf_ is

```xml
<package>
  <job id = "run">
    <script language="JScript" src="./WshModules/WshDirBackUpper/dist/bundle.js"></script>
    <script language="JScript" src="./MyScript.js"></script>
  </job>
</package>
```

I recommend this WSH file (.wsf) encoding to be UTF-8 [BOM, CRLF].

### Together with another Apps

If you want to use it together with another Apps, install as following

```console
> git clone https://github.com/tuckn/WshBasicPackage.git ./WshModules/WshBasicPackage
> git clone https://github.com/tuckn/WshSmbConnector.git ./WshModules/WshSmbConnector
> git clone https://github.com/tuckn/WshDirBackUpper.git ./WshModules/WshDirBackUpper
or
> git submodule add https://github.com/tuckn/WshBasicPackage.git ./WshModules/WshBasicPackage
> git submodule add https://github.com/tuckn/WshSmbConnector.git ./WshModules/WshSmbConnector
> git submodule add https://github.com/tuckn/WshDirBackUpper.git ./WshModules/WshDirBackUpper
```

```xml
<package>
  <job id = "run">
    <script language="JScript" src="./WshModules/WshBasicPackage/dist/bundle.js"></script>
    <script language="JScript" src="./WshModules/WshSmbConnector/dist/module.js"></script>
    <script language="JScript" src="./WshModules/WshDirBackUpper/dist/module.js"></script>
    <script language="JScript" src="./MyScript.js"></script>
  </job>
</package>
```

## Usage as Module

Now _.\\MyScript.js_ (JScript ) can use `Wsh.DirBackUpper`.

Backing up and logging.

```js
var bkup = Wsh.DirBackUpper; // Shorthand

var srcDir = 'C:\\Users';
var destDir = 'D:\\BackUp\\Users\\${yyyy-MM}';

bkup.backupDir(srcDir, destDir, {
  syncMethod: 'MIRROR',
  comparison: 'CONTENT',
  ignoredRegExp: 'tmp$',
  logger: 'warn/winEvent' // See https://github.com/tuckn/WshLogger
});
```

With Schema

Example of using a schema

```js
var bkup = Wsh.DirBackUpper; // Shorthand

var schema = {
  description: 'Example Schema WshDirBackUpper',
  components: {
    exe7z: 'C:\\My Apps\\7-Zip\\7z.exe',
  },
  tasks: {
    userAppData: {
      srcDir: 'C:\\Users\\Default\\AppData',
      destDir: 'D:\\AppData\\#{yyyy}\\#{MM-dd}',
      method: 'UPDATE',
      options: {
        comparison: 'TIME',
        ignoredRegExp: ['Packages\\\\.*Cache\\\\', '\\.mui$']
      }
    },
    'appLog:current': {
      srcDir: 'D:\\My App Data',
      destDir: '\\\\MyNas\\AppLogs\\#{yyyy}\\#{MM}',
      method: 'ARCHIVE',
      options: {
        archiveType: 'ZIP',
        exe7z: '${exe7z}',
        dateCode: 'yyyyMMddThhMMss',
        compressLv: 9,
        ignoredRegExp: ['^\\.git.*']
      }
    },
    'appLog:lastMonth': {
      available: false,
      srcDir: 'D:\\AppLogs\\#{yyyy\\[MM-1]}',
      destDir: '\\\\MyNas\\AppLogs\\#{yyyy\\[MM-1]}'
      method: 'MIRROR'
    }
  }
};

bkup.backupDirUsingSchema(schema, 'appLog:*', {
  logger: 'info/console'
});
// Only process appLog:current. appLog:lastMonth is not processed because available is false.
```

### Dependency Modules

You can also use [tuckn/WshBasicPackage](https://github.com/tuckn/WshBasicPackage) functions in _.\\MyScript.js_ (JScript).

## Documentation

See all specifications [here](https://docs.tuckn.net/WshDirBackUpper) and also [WshBasicPackage](https://docs.tuckn.net/WshBasicPackage).

## License

MIT

Copyright (c) 2020 [Tuckn](https://github.com/tuckn)
