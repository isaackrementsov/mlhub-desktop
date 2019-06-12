const electron = require('electron');

var message;
var password;
var submit;

var key;

init();

document.getElementById('close').addEventListener('click', () => {
    electron.ipcRenderer.send('close-main-window');
});

if(getWindowPath() == 'index'){
    message = document.getElementById('message');
    password = document.getElementById('key');
    submit = document.getElementById('submit-button');
    document.getElementById('login').addEventListener('submit', (e) => {
        if(submit.value == 'Log In'){
            loginWithServer();
        }else{
            registerComputer();
        }
        e.preventDefault();
    });
}else if(getWindowPath() == 'home'){
    document.getElementById('learn').addEventListener('click', setupMl);
}

function showError(msg){
    message.style.color = '#FF8A80';
    message.innerHTML = msg;
}

function loginWithServer(){
    ajax('POST', '/api/login', `password=${password.value}`, (_, res) => {
        if(res.login){
            key = password.value;
            password.value = '';
            password.setAttribute('placeholder', 'Computer Name');
            password.setAttribute('type', 'text');
            submit.value = 'Register';
            message.innerHTML = 'Add a Computer';
            message.style.color = 'rgb(90,90,90)';
        }else{
            showError('Incorrect Password');
        }
    });
}

function registerComputer(){
    ajax('POST', '/api/computers/register', `password=${key}&name=${password.value}`, (_, res) => {
        if(res.authKey != null){
            electron.ipcRenderer.send('computer-data-request', {name: res.computer.name, authKey: res.authKey});
            electron.ipcRenderer.on('computer-data-added', () => {
                redirect('home');
            });
        }else{
            showError('Computer Name Must Be Unique');
        }
    });
}

function ajax(method, url, data, callback){
    let xHttp = new XMLHttpRequest();

    xHttp.onreadystatechange = function(){
        if(this.readyState == 4 && this.status == 200){
            let res = JSON.parse(this.responseText);
            callback(this, res);
        }
    }

    xHttp.open(method, `http://localhost${url}?${data}`, true);
    xHttp.send();
}

function redirect(path){
    let current = window.location.href.split('/');
    current[current.length - 1] = path + '.ejs';
    current = current.join('/');
    window.location.replace(current);
}

function init(){
    if(authRequired && !validAuthKey){
        redirect('index');
    }else if(!authRequired && validAuthKey){
        redirect('home');
    }
}

function getWindowPath(){
    let current = window.location.href.split('/');
    return current[current.length - 1].split('.')[0];
}

function setupMl(){
    let display = document.getElementById('learning-content');
    if(window.localStorage.getItem('learning')){
        electron.ipcRenderer.send('start-learning');
        electron.ipcRenderer.on('started-learning', () => {
            display.innerHTML = 'Learning';
        });
    }else{
        display.innerHTML = 'Learning';
        window.localStorage.setItem('learning', true);
    }



    electron.ipcRenderer.on('learning-update', (_, data) => {
        display.innerHTML = data;
    });
}
