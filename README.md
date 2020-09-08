# WshDirBackUpper

The WSH (Windows Script Host) CLI that updates or mirrors directories according to the schema defined in a JSON file.

## Operating environment

Works on JScript in Windows.

## Installation

Download this ZIP and unzipping or Use following `git` command.

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

### Write Schema JSON

The JSON default path to load is _%CD%\.wsh\\settings.json_.
See _.\\.wsh\\settings.json_ as example.

Write your backing up schema on the JSON file, for example,

```json
{
  "dirBackUpperSchema": {
    "tasks": {
      "userAppData": {
        "srcDir": "C:\\Users\\Default\\AppData",
        "destDir": "\\\\MyNas\\BackUp\\User\\AppData"
      },
      "appLog": {
        "srcDir": "D:\\logs\\csv",
        "destDir": "\\\\MyNas\\BackUp\\csvLogs"
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
        "destDir": "${dest}\\User\\AppData"
      },
      "appLog": {
        "srcDir": "D:\\logs\\csv",
        "destDir": "${dest}\\csvLogs"
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
        "destDir": "D:\\BackUp\\#{yyyy}\\#{MM}"
      },
      "appLog:lastMonth": {
        "srcDir": "D:\\BackUp\\#{yyyy\\[MM-1]}",
        "destDir": "\\MyNas\\CsvLogs\\#{yyyy\\[MM-1]}"
      }
    }
  }
}
```

See [WshUtil: parseDateLiteral](https://docs.tuckn.net/WshUtil/Wsh.Util.html#.parseDateLiteral) for the literal.

And can also use backing up Options.

```json
  "dirBackUpperSchema": {
    "tasks": {
      "userAppData": {
        "srcDir": "C:\\Users\\Default\\AppData",
        "destDir": "D:\\Backup\\AppData\\#{yyyy}\\#{MM-dd}",
        "ignoredRegExp": [
          "Windows\\\\WebCache",
          "Packages\\\\.*Cache\\\\",
          "\\.mui$",
          "\\.settingcontent-ms$"
        ]
      },
      "appLog:current": {
        "srcDir": "D:\\AppLogs\\#{yyyy}\\#{MM}",
        "destDir": "\\MyNas\\AppLogs\\#{yyyy}\\#{MM}",
        "syncMethod": "MIRROR",
        "comparison": "CONTENT",
        "isRecursive": false,
        "copiesEmpDir": true,
        "includesSymlink": true,
        "matchedRegExp": "\\.csv$"
      }
    }
  }
```

See [WshDirBackUpper: backupDirUsingLog](https://docs.tuckn.net/WshDirBackUpper/Wsh.DirBackUpper.html#.backupDirUsingLog) for the options.

### Run with WSH

Run all available backing up tasks.

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

(2) Download this ZIP and unzipping or Use following `git` command.

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

The content of above _Run.wsf_ is

```xml
<package>
  <job id = "run">
    <script language="JScript" src="./WshModules/WshDirBackUpper/dist/bundle.js"></script>
    <script language="JScript" src="./MyScript.js"></script>
  </job>
</package>
```

I recommend this .wsf file encoding to be UTF-8 [BOM, CRLF].

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

bkup.backupDirUsingLog(srcDir, destDir, {
  sync: 'MIRROR',
  comparison: 'CONTENT',
  ignoredRegExp: 'tmp$',
  logger: 'warn/winEvent' // See https://github.com/tuckn/WshLogger
});
```

With Schema

```js
var bkup = Wsh.DirBackUpper; // Shorthand

var schema = {
  description: 'Example Schema WshDirBackUpper',
  tasks: {
    userAppData: {
      srcDir: 'C:\\Users\\Default\\AppData',
      destDir: 'D:\\AppData\\#{yyyy}\\#{MM-dd}',
      syncMethod: 'UPDATE',
      comparison: 'TIME',
      ignoredRegExp: [
        'Windows\\\\WebCache',
        'Packages\\\\.*Cache\\\\',
      ]
    },
    'appLog:current': {
      srcDir: 'D:\\AppLogs\\#{yyyy}\\#{MM}',
      destDir: '\\\\MyNas\\AppLogs\\#{yyyy}\\#{MM}',
      syncMethod: 'MIRROR',
      comparison: 'CONTENT',
      matchedRegExp: '\\.csv$'
    },
    'appLog:lastMonth': {
      available: false,
      srcDir: 'D:\\AppLogs\\#{yyyy\\[MM-1]}',
      destDir: '\\\\MyNas\\AppLogs\\#{yyyy\\[MM-1]}'
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
