const { app, BrowserWindow } = require('electron');
const { Menu, MenuItem } = require('electron')
const menu = new Menu()
const path = require('path')
const { exec } = require('child_process');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

function createWindow() {
    const mode = process.env.NODE_ENV;
    mainWindow = new BrowserWindow({
        width: 900,
        height: 680,
    });
    mainWindow.loadURL(`file://${path.join(__dirname, '../public/index.html')}`);
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async function(){
    let flag = await isElasticsearchEnabled()
    if(flag){
        console.log(flag);
        createWindow();
    }else{
        enableElasticsearch()
    }
});


function isElasticsearchEnabled() {
    const exec = require('child_process').exec;
    return new Promise((resolve, reject) => {
     exec("service elasticsearch status", (error, stdout, stderr) => {
      if (error) {
       console.warn(error);
       resolve(false)
      }
      resolve(stdout? true : false);
     });
    });
   }

function enableElasticsearch(){
    exec("service elasticsearch start",(error,stdout,stderr)=>{
        if (error) {
            console.log(`error: ${error.message}`);
            return ;
        }
        if (stderr) {
            console.log(`stderr: ${stderr}`);
            return;
        }
        createWindow();
        console.log(`stdout: ${stdout}`);
        return ;
    })
}
// async function (){
//     exec("service elasticsearch status",(error,stdout,stderr)=>{
//         if (error) {
//             console.log(`error: ${error.message}`);
//             return false;
//         }
//         if (stderr) {
//             console.log(`stderr: ${stderr}`);
//             return false;
//         }
//         if(stdout){
//             return true;
//         }
//         return true;
//     })
// }

// Quit when all windows are closed.
app.on('window-all-closed', () => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow();
    }
});
