/**
 * !!!!!!!!!!!!!!!!!!! ONDE PAREI !!!!!!!!!!!!!!!!!!!
 * 
 * Eu fiz as principais funções para o progarma como pro exemplo
 * salvar audio no arquivo, ler o texto do arquivo, fazer requestes
 * para sintetezar audio
 * 
 * 1° coisa!! o titulo esta sendo salvo junco com o audio do texto
 * retirar o titulo do texto principal o titulo é sempre a primeira linha
 * 
 * Para o programa de pdf to natural speech ficar pronto eu preciso dar um jeito
 * de ele mesmo ler o pdf ou o arquivo word e extrar o texto de lá e sintetizar
 * 
 */

const axios = require('axios');
const querystring = require('querystring');
const fs = require('fs');

const CHAPTER_NAME = "11 A religião dos dados";

const sleep = (ms) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function getTextFromFile(fileName){
  return fs.readFileSync(fileName, {encoding: 'utf8'});
}

function writeAudio(binariesDataAudio, fileName) {
  fs.appendFileSync(`audios/${CHAPTER_NAME}/${fileName}.ogg`, binariesDataAudio, { encoding: 'latin1' });
}

function generateAudioFileName(title) {
  let dir = fs.readdirSync(__dirname + `/audios/${CHAPTER_NAME}/`);
  title = title.replace(/[^\w\s]/gi, '');
  if (dir.length === 0) {
    return '001 - ' + title;  
  } else {
    for (let i = 0; i < dir.length; i++) {
      dir[i] = Number(dir[i].split(" ")[0]);
    }
    dir = dir.sort((a, b) => a-b);
    let newIndex = dir[dir.length -1] + 1;
    let alphabeticNewIndex = (newIndex < 10) ? "00" + newIndex : "0" + newIndex;
    return alphabeticNewIndex + ' - ' + title;
  }
}

let synthesizesFail = false;

async function synthesizes(dataText) {
  let resource = querystring.stringify({
    text: dataText,
    voice: 'pt-BR_IsabelaV3Voice',
    ssmlLabel: 'SSML',
    download: true,
    accept: 'audio/mp3'
  });
  let config = {
    responseType: 'arraybuffer',
  }
  const apiPath = 'https://text-to-speech-demo.ng.bluemix.net/api/v3/synthesize?';
  try {
    let response = await axios.get(apiPath + resource, config);
    synthesizesFail = false;
    return response.data;
  } catch (e) {
    console.log('ERRO NO SYNTHESIZE!!')
    synthesizesFail = true;
    //throw e;
  }
}

async function generateAudioFile(text) {
  try {
    text = text.replace(/sapiens/g, "sápiens");
    // text = text.replace(/erectus/g, "heréctus");
    // text = text.replace(/apto/g, "hapto");
    // text = text.replace(/Watson/g, "Wótson");
    text = text.replace(/Google/g, "Gúgou");
    text = text.replace(/Facebook/g, "Feicebuk");
    // text = text.replace(/Likes/g, "láik");
    // text = text.replace(/Waze/g, "Weize");
    // text = text.replace(/Microsoft/g, "Maicrossoft");
    text = text.replace(/New York Times/g, "New York Taimes");
    // text = text.replace(/high-tech/g, "rai-ték");
    text = text.replace(/hacker/g, "rácker");
    text = text.replace(/smartphone/g, "smartfone");
    text = text.replace(/Harvard/g, "rárvard");
    let lines = text.split('\r\n');
    lines = lines.filter(line => line != '');
    let title = lines.shift();
    console.log("begin to generate " + generateAudioFileName(title) + " file");
    lines.push('<sentence>Fim do texto</sentence><break strength="weak"/>')
    text = lines.join('\r\n');
    let binaries = [];
    titleSSML = '<sentence>Título: ' + title + ' </sentence><break strength="weak"/>';
    binaries.push(await synthesizes(titleSSML));
    let paragraphs = text.split('. ');
    let numParagraphs = paragraphs.length;
    let ssml = '';
    for (let i = 0; i < paragraphs.length; i++) {
      ssml += paragraphs[i] + '. ';
      if(ssml.length > 300 || i == paragraphs.length -1){
        let chunk;
        chunk = await synthesizes(ssml);
        await sleep(5000);
        while (synthesizesFail) {
          console.log('Tentando de novo!');
          await sleep(5000);
          chunk = await synthesizes(ssml);
        }
        binaries.push(chunk);
        let progress = (i*100)/numParagraphs;
        console.log('   Progress: ' + progress + '%');
        ssml = '';
      }
    }
    let fileName = generateAudioFileName(title);
    binariesDataAudio = Buffer.concat(binaries);
    writeAudio(binariesDataAudio, fileName);
    console.log(generateAudioFileName(title) + " salvo com sucesso!");
  } catch (e) {
    console.log('ERRRRRR!!!');
    console.log(e);
  }
}

(async () => {
  let wholeChapter = getTextFromFile('text.txt');
  let texts = wholeChapter.split("FIM_DO_TEXTO");
  
  for (let i = 0; i < texts.length; i++) {

    await generateAudioFile(texts[i]);

    let max = 1000;
    let min = 1000*60;
    let timeTosleep = Math.floor(Math.random() * (max - min + 1)) + min;
    await sleep(timeTosleep);
  }
  
  process.exit();
  generateAudioFile(text);
})();