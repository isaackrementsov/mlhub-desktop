const electron = require('electron');

var message = document.getElementById('message');
var password = document.getElementById('key');

document.getElementById('close').addEventListener('click', () => {
    electron.ipcRenderer.send('close-main-window');
});

document.getElementById('login').addEventListener('submit', (e) => {
    let xHttp = new XMLHttpRequest();

    xHttp.onreadystatechange = function(){
        if(this.readyState == 4 && this.status == 200){
            let res = JSON.parse(this.responseText);
            if(res.login){
                //Implement form change
            }else{
                showError('Incorrect Password')
            }
        }
    }

    xHttp.open('POST', `http://localhost:8080/api/login?password=${password.value}`, true);
    xHttp.send();

    e.preventDefault();
});

function showError(msg){
    message.style.color = '#FF8A80';
    message.innerHTML = msg;
}
