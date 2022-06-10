const Telegraf = require('telegraf');
const cors = require('cors');
const express = require('express');
const app = express();
const axios   = require('axios');
const connectDB = require('./config/db');

const path   = require('path');
const fs     = require('fs');
const FormData = require('form-data');

const { engine } = require('express-handlebars');
const fileUpload = require('express-fileupload')

const controller = require('./controllers/number.controller');
const bot = new Telegraf('5348159248:AAHLL8Jus0JKkVGQH58H49NXjKa0_uzNS4M');

let token = '5348159248:AAHLL8Jus0JKkVGQH58H49NXjKa0_uzNS4M';
const url = 'https://api.telegram.org/bot'+token+'/sendDocument'

app.use(cors());
app.use(express.json());
app.use(fileUpload());
app.use(express.urlencoded({ extended: false }));

connectDB();
 
// Settings
app.set("views", path.join(__dirname, "views"));
app.engine('.hbs', engine({
    defaultLayout: false,
    layoutsDir:  path.join(__dirname, "views", "layouts"),
    partialsDir: path.join(__dirname, "views", "partials"),
    extname: ".hbs",
}));
app.set('view engine', '.hbs');

// Define Routes
app.use('/', require('./routes/index'));

const usersChat = [
  {user: "KaizerBlack", chat: 745535067},
  {user: "koby" , chat: 951742175}
];

const COMMANDS = `LISTADO DE COMANDOS\n\n* Obtener Conteo *\n   count\n   total\n   conteo\n   cantidad\n\n* Obtener Reportes *\n   reporte\n   compañias\n   contador\n   proveedores\n\n* Restaurar Numbers *\n   clear\n   limpiar\n   restaurar\n\n* Agregar Numeros *\n   add\n   agregar\n\n* Obtener Numeros *\n   get:telcel:0\n   get:movistar:100\n\n* Obtener y Marcar como Usados *\n   upd:at&t:100\n   update:altan:0\n\n* Eliminar Numeros *\n   del:all\n   del:tercel:100\n`;

bot.start((ctx) => {
  ctx.reply(COMMANDS);
})

bot.on('text', async (ctx) => {
  let message = ctx.update.message.text.toLowerCase();
  // counter, providers, get:movistar:25 , upd:movistar:25

  if(message === "proveedores" 
        || message === "compañias" 
        || message === "contador" 
        || message === "reporte")
  {

    const response = await getReport();
    ctx.reply(response.toUpperCase());

  }else if(message === "count" 
    || message === "total" 
    || message === "conteo" 
    || message === "cantidad")
  {

    const response = await getCount();
    ctx.reply(response.toUpperCase());

  }else if(message === "add" || message === "agregar"){
    ctx.reply('https://numberbot.info/add');
  }else if(message.match(/get:/gi)){

    const response = await getNumbers(message);
    if(!response || !response.isOk){
      ctx.reply(response);
      return false;
    }

    if(response.quanty < 100){
      ctx.reply(response.numberResults);
      return false;
    }

    const savTvt = await saveTxt(response.identifier, response.numberResults);
    if(!savTvt || !savTvt.isOk){
      ctx.reply(savTvt.message);
      return false;
    }

    const sendTxt = await sendTxtFile(savTvt.location);
    if(!sendTxt || !sendTxt.isOk){
      ctx.reply(sendTxt.message);
      return false;
    }

  }else if(message.match(/upd:/gi)){

    const response = await updateNumber(message);
    if(!response || !response.isOk){
      ctx.reply(response);
      return false;
    }

    if(response.quanty < 100){
      ctx.reply(response.numberResults);
      return false;
    }

    const savTvt = await saveTxt(response.identifier, response.numberResults);
    if(!savTvt || !savTvt.isOk){
      ctx.reply(savTvt.message);
      return false;
    }

    const sendTxt = await sendTxtFile(savTvt.location);
    if(!sendTxt || !sendTxt.isOk){
      ctx.reply(sendTxt.message);
      return false;
    }
    
  }else if(message.match(/clear/gi) || message.match(/limpiar/gi) || message.match(/restaurar/gi)){

    const response = await clear();
    ctx.reply(response.toUpperCase());

  }else if(message.match(/del:all/gi)){
    const response = await deleteAll(message);
    ctx.reply(response.toUpperCase());

  }else if(message.match(/del:/gi)){

    const response = await deleteNumber(message);
    ctx.reply(response.toUpperCase());

  }else if(message.match(/restoredb/gi)){

    const response = await restoreDB();
    ctx.reply(response.toUpperCase());

  }else if(message === "comandos" || message === "comando" || message === "command"){
    ctx.reply(COMMANDS);
  }else{
    ctx.reply(`COMANDO NO IDENTIFICADO\n\nPara ver todos los comando escriba COMANDOS`);
  }
  
});

function saveTxt(fileName, list){
  const location = path.join(__dirname, '/documents', fileName);
  return new Promise(function(resolve, reject) {
    fs.writeFile(location, list, (err) => {
        if(err){ 
          return resolve({isOk: false, message: 'ERROR GUARDANDO EL ARCHIVO'});
        }
        return resolve({isOk: true, location})
    });
  });
}

function sendTxtFile(fileLocation){
  return new Promise((resolve)=>{
    var form = new FormData();
    form.append("chat_id", usersChat[0].chat);
    form.append('document', fs.createReadStream(fileLocation));
    axios.post(url, form, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
    }).then((response) => {
      return resolve({isOk: true, message: "ARCHIVO ENVIADO CORRECTAMENTE"});
    }).catch((error) => {
      return resolve({isOk: false, message: "HUBO UN ERROR ENVIANDO EL ARCHIVO"})
    })
  })
}

async function getReport(){
  const data = await controller.getProviders();
  if(!data || !data.isOk){
    return data.message;
  }

  if(!data.result || !data.result.length){
    return 'NO TIENES NUMEROS DISPONIBLE!';
  }

  let providers = `LISTA DE PROVEEDORES\n\n`;
  const results = data.result.sort(function (a, b) { return b.count - a.count; });

  let noVerificado = undefined;

  for (let i = 0; i < results.length; i++) {
    const element = results[i];
    if (element && element._id && element._id.provider && element._id.provider.match(/VERIFICADO/gi)) {
      noVerificado = element;
      continue;
    }
    providers += `${element._id.provider} (${element.count})\n`;
  }

  if(noVerificado){
    providers += `\n${noVerificado._id.provider} (${noVerificado.count})`;
  }

  return providers;
}

async function getCount(){
  const count = await controller.getCount();
  if(!count || !count.isOk){
    return count.message;
  }

  return count;
}

async function getNumbers(message){
  const result = command(message, 'get');
    if(!result || !result.isOk){
      return result.message;
    }

    const data = await controller.getNumbers(message);
    if(!data || !data.isOk){
      return data.message;
    }

    let now= new Date();
    const pls = data.result.length > 1 ? 'S' : '';
    let numberResults = `${data.result.length} NUMERO${pls} DE ${data.provider}\n\n`;
    let identifier = `${data.result.length}_NUMERO${pls}_${data.provider}_${now.getTime()}.txt`;

    for (let i = 0; i < data.result.length; i++) {
      const element = data.result[i];
      numberResults += `${element.number}\n`;
    }

    return {isOk: true, quanty: data.result.length, identifier, numberResults};
}

async function updateNumber(message){
  const result = command(message, 'upd');
  if(!result || !result.isOk){
    return result.message;
  }

  const data = await controller.getAndUpdateNumbers(message);
  if(!data || !data.isOk){
    return data.message;
  }

  let now= new Date();
  const pls = data.result.length > 1 ? 'S' : '';
  let numberResults = `${data.result.length} NUMERO${pls} DE ${data.provider}\n\n`;
  let identifier = `${data.result.length}_NUMERO${pls}_${data.provider}_${now.getTime()}.txt`;

  for (let i = 0; i < data.result.length; i++) {
    const element = data.result[i];
    numberResults += `${element.number}\n`;
  }

  return {isOk: true, quanty: data.result.length, identifier, numberResults};
}

async function clear(){
  const data = await controller.clearEditting();
  if(!data || !data.isOk){
    return data.message;
  }

  let pls = data.quanty > 1 ? 's' : '';
  return `${data.quanty} numero${pls} restaurado${pls}!`;
}

async function deleteAll(){
  const data = await controller.deleteAll();

  if(!data || !data.isOk){
    return data.message;
  }

  let pls = data.quanty > 1 ? 's' : '';
  return `${data.quanty} numero${pls} eliminados!`;
}

async function deleteNumber(message){
  const result = command(message, 'del');
    if(!result || !result.isOk){
      return result.message;
    }

    const data = await controller.deleteNumbers(message);
    if(!data || !data.isOk){
      return data.message;
    }

    let pls = data.quanty > 1 ? 's' : '';
    return `${data.quanty} numero${pls} de ${data.privider} eliminado${pls}!`;
}

async function restoreDB(){
  const data = await controller.restoreDB();
  if(!data || !data.isOk){
    return data.message;
  }

  let pls = data.quanty > 1 ? 's' : '';
  return `${data.quanty} numero${pls} restablecido${pls}!`;
}

function command(message, identifier){
  let current = message.replace(/ /g, "");
  let commands = current.split(':');

  if(!commands[0] || !commands[1] || !commands[2]){
    return {isOk: false, message: "Comando mal formateado."};
  }

  if(commands[4]){
    return {isOk: false, message: "Solo se aceptan 3 parametros."};
  }

  if(commands[0].trim() !== identifier){
    return {isOk: false, message: `'${commands[0]}' no es un identificador valido.`};
  }

  if(!hasLetter(commands[1]) || commands[1].length < 4){
    return {isOk: false, message: `'${commands[1]}' no es un proveedor valido.`};
  }

  if(hasLetter(commands[2])){
    return {isOk: false, message: `'${commands[2]}' no es una cantidad valida.`};
  }

  return {isOk: true}
}

function hasLetter(cadena) {
  if(isNaN(+cadena)){
    return true;
  }
  return false;
}

var server = app.listen(process.env.PORT || 3000, ()=> {
  console.log('server online')
})
server.timeout = 500000;

bot.launch()