#! /usr/bin/env node

//  inquirer插件可以做人机交互，询问创建者问题。
const inquirer = require('inquirer');
// node中文件函数
const fs = require('fs');
// node中路径函数
const path = require('path');
// ejs插件  创建ejs模版可以将用户输入的问题渲染到模版中
const ejs = require('ejs');

// 执行任务的loading
const Listr = require('listr');
// node中child_process的exec  可以在node中执行shell脚本
const { exec } = require('child_process');
// 自动执行install的插件
const { projectInstall } = require('pkg-install');
// 打印logo
const figlet = require('figlet');
// 输出文字的颜色样式。
const chalk = require('chalk');
const program = require('commander');
/**
  create files
 */
const createFIles = (templatespath, answer, paths) => {
  // 使用文件函数读取当前文件夹内的文件
  fs.readdir(templatespath, (err, files) => {
    // files是一个数组 遍历这个数据
    (files || []).forEach((file) => {
      if (
        file === 'srcjs' ||
        file === 'srcts' ||
        file === 'app' ||
        file === '.git'
      )
        return;
      // 通过ejs渲染模版   ejs通过renderFile会获取到文件里面的内容
      ejs
        .renderFile(path.join(templatespath, file), answer)
        .then((data) => {
          /**
          下面两个if是为了兼容不同的后缀文件
            path.extname(file)  获取文件的后缀名称
            path.basename(file, '.ejs') 获取后缀名称为.ejs的文件名称。
         */
          if (path.extname(file) === '.ejs') {
            file = `${path.basename(file, '.ejs')}.js`;
          }
          if (path.basename(file, '.js') === 'package') {
            file = 'package.json';
          }
          if (answer.jsType === 'ts') {
            if (path.extname(file) === '.jsx') {
              file = `${path.basename(file, '.jsx')}.tsx`;
            }
          }
          // 通过fs.writeFileSync方法将 renderFile获取到的文件内容写进新的文件中
          fs.writeFileSync(path.join(process.cwd(), `${paths}/${file}`), data);
        })
        .catch((err, path) => {
          console.log(err, file, 'pathpathpathpathpath');
        });
    });
  });
};

const templatespath = path.join(__dirname);
const project = 'mylcra-react-vue-templetes';
// create project
const createProject = async (answer) => {
  /**
    先获取到当前文件中的templates文件夹
    __dirname 代表当前文件的路径
   */
  /**
    1、先创建 ${answer.projectName} 文件夹
    2、然后创建文件夹中的文件
   */
  const src = answer.jsType === 'js' ? 'srcjs' : 'srcts';
  fs.mkdir(answer.projectName, { recursive: true }, () => {
    createFIles(`${templatespath}/${project}`, answer, answer.projectName);
  });

  /**
    ej.renderFile 无法读取文件夹，所以需要手动创建，脚手架的结构是固定的所以不需要写太多逻辑在里面
        只需在需要创建文件夹的地方通过fs.mkdir创建一下
   */
  fs.mkdir(`${answer.projectName}/src/app`, { recursive: true }, () => {
    const app = `${templatespath}/${project}/${src}/app`;
    createFIles(app, answer, `${answer.projectName}/src/app`);
  });

  fs.mkdir(`${answer.projectName}/src/componment`, { recursive: true }, () => {
    const app = `${templatespath}/${project}/${src}/componment`;
    createFIles(app, answer, `${answer.projectName}/src/componment`);
  });

  fs.mkdir(`${answer.projectName}/src/pages`, { recursive: true }, () => {
    fs.mkdir(`${answer.projectName}/src/pages/404`, { recursive: true }, () => {
      const app = `${templatespath}/${project}/${src}/pages/404`;
      createFIles(app, answer, `${answer.projectName}/src/pages/404`);
    });
    fs.mkdir(
      `${answer.projectName}/src/pages/home`,
      { recursive: true },
      () => {
        const app = `${templatespath}/${project}/${src}/pages/home`;
        createFIles(app, answer, `${answer.projectName}/src/pages/home`);
      },
    );
    fs.mkdir(
      `${answer.projectName}/src/pages/goods`,
      { recursive: true },
      () => {
        const app = `${templatespath}/${project}/${src}/pages/goods`;
        createFIles(app, answer, `${answer.projectName}/src/pages/goods`);
      },
    );
  });

  fs.mkdir(`${answer.projectName}/src/static`, { recursive: true }, () => {
    const app = `${templatespath}/${project}/${src}/static`;
    createFIles(app, answer, `${answer.projectName}/src/static`);
  });
};

const question = [
  {
    type: 'input',
    message: 'projectName',
    default: 'my-app',
    name: 'projectName',
  },
  {
    name: 'language',
    type: 'list',
    choices: ['react', 'vue'],
    default: 'react',
  },
  {
    name: 'style',
    type: 'list',
    choices: ['less', 'sass'],
    default: 'less',
  },
  {
    name: 'jsType',
    type: 'list',
    choices: ['js', 'ts'],
    default: 'js',
  },
  {
    type: 'input',
    message: 'version',
    name: 'version',
    default: '1.0.0',
  },
  {
    type: 'input',
    message: 'prot',
    default: '3000',
    name: 'prot',
  },
];

const questionList = (name) => {
  inquirer.prompt(question).then(async (answer) => {
    /**
    Listr 是一个一步的loading插件。
    task指的是要执行那一个任务
    Listr执行顺序是从上到下依次执行
  */
    const dirname = process.cwd();

    const tasks = new Listr([
      {
        title: chalk.blue('git clone'),
        task: () =>
          exec(
            'git clone git@github.com:ghost-myl/mylcra-react-vue-templetes.git',
            {
              cwd: templatespath,
            },
          ),
      },
      {
        title: chalk.yellow('create directory and file'),
        task: () => createProject(answer),
      },
      {
        title: chalk.blue('create git'),
        task: () =>
          exec('git init', {
            cwd: path.join(dirname, answer.projectName),
          }),
      },
      {
        title: chalk.magenta('npm install'),
        task: () =>
          projectInstall({
            cwd: path.join(dirname, answer.projectName),
            prefer: 'npm',
          }),
      },
    ]);
    await tasks.run();
  });
};

program
  .command('create <app-name>')
  .description('create a new project')
  .option('-f, --force', 'overwrite target directory if it exist') // 是否强制创建，当文件夹已经存在
  .action((name, options) => {
    questionList(name);
    // 在 create.js 中执行创建任务
    // require("./bin.js")(name, options);
  });

// 配置 config 命令
program
  .command('config [value]')
  .description('inspect and modify the config')
  .option('-g, --get <path>', 'get value from option')
  .option('-s, --set <path> <value>')
  .option('-d, --delete <path>', 'delete option from config')
  .action((value, options) => {
    console.log(value, options);
  });

// 配置 ui 命令
program
  .command('ui')
  .description('start add open roc-cli ui')
  .option('-p, --port <port>', 'Port used for the UI Server')
  .action((option) => {
    console.log(option);
  });

program
  // 配置版本号信息
  .version(`v${require('./package.json').version}`)
  .usage('<command> [option]');

program.on('--help', () => {
  console.log(
    chalk.green(
      '\r\n' +
        figlet.textSync('myl-cli', {
          font: 'Ghost',
          horizontalLayout: 'default',
          verticalLayout: 'default',
          width: 80,
          whitespaceBreak: true,
        }),
    ),
  );
  console.log(
    `\r\nRun ${chalk.cyan(
      `zr <command> --help`,
    )} for detailed usage of given command\r\n`,
  );
});

program.parse(process.argv);
