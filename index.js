
const {Client, Intents} = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const Utils = require('./utils.js')
const client = new Client({intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.DIRECT_MESSAGES, Intents.FLAGS.MESSAGE_CONTENT]});
const child_process = require("child_process");
const ytdl = require('ytdl-core');
const { clientId, token } = require("./config.json")

client.login(token);


const prefix = "b!";

let request = require(`request`);
let fs = require(`fs`);
client.once('ready', () => {
    console.log('Ready!');
    client.user.setPresence({ activities: [{ type: 'WATCHING',name: '/ytp[solo]' }], status: 'dnd' });
});

const commands = [
	new SlashCommandBuilder().setName('ytp').addAttachmentOption(option => option.setName('video').setDescription('The video file')).setDescription('Creates a YTP+ video!'),
	new SlashCommandBuilder().setName('ytpsolo').setDescription('Creates a Solo YTP+ video!'),
	new SlashCommandBuilder().setName('download').setDescription('Adds a video to the YTP+ videos folder!').addAttachmentOption(option => option.setName('video').setDescription('The video file')).addStringOption(option => option.setName("link").setDescription('The video link')),
	new SlashCommandBuilder().setName('invite').setDescription('Replies with the bot invite!'),
]
	.map(command => command.toJSON());
    
const rest = new REST({ version: '9' }).setToken(token);

rest.put(Routes.applicationCommands(clientId), { body: commands })
	.then(() => console.log('Successfully registered application commands.'))
	.catch(console.error);
const YTPGenerator = require("./lib/YTPGenerator.js")

function sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
}

client.on('messageCreate', async function(message){
    if (message.author.bot) return;
    if(message.attachments.first()){//checks if an attachment is sent
        if(message.attachments.first().filename === `mp4`){//Download only png (customize this)
            download(msg.attachments.first().url);//Function I will show later
        }
    }
    const args = message.content.slice(prefix.length).split(/ +/);
    const command = args.shift().toLowerCase();
    const args2 = message.content.toLowerCase();
    console.log(message);
    if (command == "download" ) {
        
        if (message.attachments.first()) {
			var guid = Utils.guidGen();
            message.reply('Downloading...')
            await request.get(message.attachments.first().url)
                .on('error', console.error)
                .pipe(fs.createWriteStream('./temp_videos/'+guid+'_uncompressed.mp4'));
            setTimeout(async function(){
				await child_process.execFile('ffmpeg', [
					'-i', __dirname + "/temp_videos/"+guid+"_uncompressed.mp4",
					'-b:v', '775k',
					'-b:a', '64k',
					//'-fs', '6.3M',
					"./videos/"+guid+".mp4"
				], function(error, stdout, stderr) {
					console.log(error, stdout, stderr);
					message.reply('Downloaded!')
				})  
				message.reply('Compressing.. This may take a while...');
			},5000);
        } else {
			var guid = Utils.guidGen();
            message.reply('Downloading...')
            var url = args.shift().replaceAll("download ","");
            if (!ytdl.validateURL(url)) {
                return message.reply("Please send a valid video link");
            }
            await ytdl(url, { filter: format => format.container === 'mp4' }).pipe(fs.createWriteStream('./temp_videos/'+guid+'_uncompressed.mp4'))
                
			setTimeout(async function(){
				await child_process.execFile('ffmpeg', [
					'-i', __dirname + "/temp_videos/"+guid+"_uncompressed.mp4",
					'-b:v', '775k',
					'-b:a', '64k',
					//'-fs', '6.3M',
					"./videos/"+guid+".mp4"
				], function(error, stdout, stderr) {
					console.log(error, stdout, stderr);
					message.reply('Downloaded!')
				})  
				message.reply('Compressing.. This may take a while...');
			},5000);
        }
    }
    else if (command == "invite") {
        message.reply("Add me here: https://discord.com/oauth2/authorize?client_id=1038474208822448188&scope=bot");
    }
    else if (command == 'ytp') 
    {   
        if (message.attachments.first()) {

            var guid = Utils.guidGen()
            message.reply('Downloading...')
            await fs.mkdirSync(__dirname + "/temp_videos/"+guid);
            await request.get(message.attachments.first().url)
                .on('error', console.error)
                .pipe(fs.createWriteStream(__dirname + "/temp_videos/"+guid+"/"+guid+"_uncompressed.mp4"));
            await child_process.execFile('ffmpeg', [
				'-i', __dirname + "/temp_videos/"+guid+"/"+guid+"_uncompressed.mp4",
				'-b:v', '775k',
				'-b:a', '64k',
				//'-fs', '6.3M',
				__dirname + "/temp_videos/"+guid+"/"+guid+".mp4"
			], function(error, stdout, stderr) {
				console.log(error, stdout, stderr);
					message.reply('Downloaded!')
				})  
			await message.reply('Compressing.. This may take a while...');
            
            await sleep(1000);
            var sourceList = [];
            
            fs.readdirSync(__dirname + "/temp_videos/"+guid).forEach(file => {
                sourceList.push(__dirname + "/temp_videos/"+guid+"/"+file)
            });
            
            console.log(sourceList)
            var guid = Utils.guidGen()
            var loadingmsg = await message.reply('Proccessing your requested YTP... this may take a while.\nThis is in beta, so expect bugs!\n\n')
            try {
    
                var options = {  
                    debug: true,
                    //MAX_STREAM_DURATION: 1.5, 
                    sourceList: sourceList,
                    resolution: [848,480],
                    //intro: "./assets/intro2.mp4",
                    OUTPUT_FILE: "./generated/ytp_"+guid+".mp4",
                    MAX_CLIPS: 60,
                    transitions: true,
                    showFileNames: true,
                    effects: {  
                        effect_RandomSound: true,
                        effect_RandomSoundMute: true,
                        effect_Reverse: true,
                        effect_Chorus: true,
                        effect_Vibrato: true,
                        effect_HighPitch: true,
                        effect_LowPitch: true,
                        effect_SpeedUp: true,
                        effect_SlowDown: true,
                        effect_Dance: true,
                        effect_Squidward: true,
                        effect_How: true,
                    }
                } 
                new YTPGenerator().configurateAndGo(options).then(function(){
                    loadingmsg.delete();
                    message.reply({
                        content: 'Heres your video!',
                        files: [{
                            attachment: './generated/ytp_'+guid+'.mp4',
                            name: 'ytp.mp4',
                            description: 'A YTP+ video.'
                        }]
                    });
                }).catch(function(e){
                    loadingmsg.delete();
                    message.reply('There was an error proccessing the video. Grab a programmer!\n```'+e+'```');
                });
            } catch(e) {
                loadingmsg.delete();
                message.reply('There was an error proccessing the video. Grab a programmer!\n```'+e+'```');
            }
        } else {
            
            if (!args2.endsWith("ytp")) {
                
                message.reply('Downloading...')
                var guid = Utils.guidGen()
                var url = args.shift().replaceAll("download ","");
                if (!ytdl.validateURL(url)) {
                    return message.reply("Please send a valid video link");
                }
                await fs.mkdirSync(__dirname + "/temp_videos/"+guid);
                await ytdl(url, { filter: format => format.container === 'mp4' }).pipe(fs.createWriteStream(__dirname + "/temp_videos/"+guid+"/"+guid+"_uncompressed.mp4"))
                await child_process.execFile('ffmpeg', [
					'-i', __dirname + "/temp_videos/"+guid+"/"+guid+"_uncompressed.mp4",
					'-b:v', '775k',
					'-b:a', '64k',
					//'-fs', '6.3M',
					__dirname + "/temp_videos/"+guid+"/"+guid+".mp4"
				], function(error, stdout, stderr) {
					console.log(error, stdout, stderr);
				})   
                message.reply('Downloaded!');
                
                await sleep(1000);
                var sourceList = [];
                
                fs.readdirSync(__dirname + "/temp_videos/"+guid).forEach(file => {
                    sourceList.push(__dirname + "/temp_videos/"+guid+"/"+file)
                });
                
                console.log(sourceList)
                var guid = Utils.guidGen()
                var loadingmsg = await message.reply('Proccessing your requested YTP... this may take a while.\nThis is in beta, so expect bugs!\n\n')
                try {
        
                    var options = {  
                        debug: true,
                        //MAX_STREAM_DURATION: 1.5, 
                        sourceList: sourceList,
                        resolution: [848,480],
                        //intro: "./assets/intro2.mp4",
                        OUTPUT_FILE: "./generated/ytp_"+guid+".mp4",
                        MAX_CLIPS: 60,
                        transitions: true,
                        showFileNames: true,
                        effects: {  
                            effect_RandomSound: true,
                            effect_RandomSoundMute: true,
                            effect_Reverse: true,
                            effect_Chorus: true,
                            effect_Vibrato: true,
                            effect_HighPitch: true,
                            effect_LowPitch: true,
                            effect_SpeedUp: true,
                            effect_SlowDown: true,
                            effect_Dance: true,
                            effect_Squidward: true,
                            effect_How: true,
                        }
                    } 
                    new YTPGenerator().configurateAndGo(options).then(function(){
                        loadingmsg.delete();
                        message.reply({
                            content: 'Heres your video!',
                            files: [{
                                attachment: './generated/ytp_'+guid+'.mp4',
                                name: 'ytp.mp4',
                                description: 'A YTP+ video.'
                            }]
                        });
                    }).catch(function(e){
                        loadingmsg.delete();
                        message.reply('There was an error proccessing the video. Grab a programmer!\n```'+e+'```');
                    });
                } catch(e) {
                    loadingmsg.delete();
                    message.reply('There was an error proccessing the video. Grab a programmer!\n```'+e+'```');
                }
            } else {

                var sourceList = [];
        
                fs.readdirSync('./videos').forEach(file => {
                    sourceList.push('./videos/'+file)
                });
                
                console.log(sourceList)
                var guid = Utils.guidGen()
                var loadingmsg = await message.reply('Proccessing your generated YTP... this may take a while.\nThis is in beta, so expect bugs!\n\n')
                try {
        
                    var options = {  
                        debug: true,
                        //MAX_STREAM_DURATION: 1.5, 
                        sourceList: sourceList,
                        resolution: [848,480],
                        //intro: "./assets/intro2.mp4",
                        OUTPUT_FILE: "./generated/ytp_"+guid+".mp4",
                        MAX_CLIPS: 60,
                        transitions: true,
                        showFileNames: true,
                        effects: {  
                            effect_RandomSound: true,
                            effect_RandomSoundMute: true,
                            effect_Reverse: true,
                            effect_Chorus: true,
                            effect_Vibrato: true,
                            effect_HighPitch: true,
                            effect_LowPitch: true,
                            effect_SpeedUp: true,
                            effect_SlowDown: true,
                            effect_Dance: true,
                            effect_Squidward: true,
                            effect_How: true,
                        }
                    } 
                    new YTPGenerator().configurateAndGo(options).then(function(){
                        loadingmsg.delete();
                        message.reply({
                            content: 'Heres your video!',
                            files: [{
                                attachment: './generated/ytp_'+guid+'.mp4',
                                name: 'ytp.mp4',
                                description: 'A YTP+ video.'
                            }]
                        });
                    }).catch(function(e){
                        loadingmsg.delete();
                        message.reply('There was an error proccessing the video. Grab a programmer!\n```'+e+'```');
                    });
                } catch(e) {
                    loadingmsg.delete();
                    message.reply('There was an error proccessing the video. Grab a programmer!\n```'+e+'```');
                }
            }

        }
    }
    else if (command == 'ytpsolo') 
    {   
        var sourceList2 = [];
        
        fs.readdirSync('./videos_solo').forEach(file => {
            sourceList2.push('./videos_solo/'+file)
        });
        
        console.log(sourceList2)
        var guid = Utils.guidGen()
        var loadingmsg = await message.reply('Proccessing the solo generated YTP... This may take a while.\nThis is in beta, so expect bugs!\n\n')

        try {

            var options = {  
                debug: true,
                //MAX_STREAM_DURATION: 1.5, 
                sourceList: sourceList2,
                resolution: [848,480],
                temp: './temp/',
                OUTPUT_FILE: "./generated/ytpsolo_"+guid+".mp4",
                MAX_CLIPS: 60,
                transitions: true,
                showFileNames: true,
                effects: {  
                    effect_RandomSound: true,
                    effect_RandomSoundMute: true,
                    effect_Reverse: true,
                    effect_Chorus: true,
                    effect_Vibrato: true,
                    effect_HighPitch: true,
                    effect_LowPitch: true,
                    effect_SpeedUp: true,
                    effect_SlowDown: true,
                    effect_Dance: true,
                    effect_Squidward: true,
                    effect_How: true,
                }
            } 
            new YTPGenerator().configurateAndGo(options).then(function(){
                loadingmsg.delete();
                message.reply({
                    content: 'Heres your video!',
                    files: [{ 
                        attachment: './generated/ytpsolo_'+guid+'.mp4',
                        //intro: "./assets/intro2.mp4",
                        name: 'ytp_solo.mp4',
                        description: 'A YTP+ video.'
                    }]
                });
            }).catch(function(e){
                loadingmsg.delete();
                message.reply('There was an error proccessing the video. Grab a programmer!\n```'+e+'```');
            });
        } catch(e) {
            loadingmsg.delete();
            message.reply('There was an error proccessing the video. Grab a programmer!\n```'+e+'```');
        }
    }
})


client.on('interactionCreate', async interaction => {
	if (!interaction.isCommand()) return;

	const { commandName } = interaction;
    const command = commandName;
    const message = interaction;
    
    if (command == "download" ) {
        
        const attachment = interaction.options.getAttachment("video");
        if (attachment && attachment.url) {
			
			var guid  = Utils.guidGen();
            await message.reply('Downloading...');
            await request.get(attachment.url)
                .on('error', console.error)
                .pipe(fs.createWriteStream('./temp_videos/'+guid+'_uncompressed.mp4'));
			setTimeout(async function(){
				await child_process.execFile('ffmpeg', [
					'-i', __dirname + "/temp_videos/"+guid+"_uncompressed.mp4",
					'-b:v', '775k',
					'-b:a', '64k',
					//'-fs', '6.3M',
					"./videos/"+guid+".mp4"
				], function(error, stdout, stderr) {
					console.log(error, stdout, stderr);
				})  
				message.editReply('Downloaded!');
			},5000);
        } else {
			var guid  = Utils.guidGen();
            await message.reply('Downloading...')
            const link = interaction.options.getString("link");
            var url = link;
            if (!ytdl.validateURL(url)) {
                return message.editReply("Please send a valid video link");
            }
            await ytdl(url, {format: 'mp4'}).pipe(fs.createWriteStream('./temp_videos/'+guid+'_uncompressed.mp4'))
			setTimeout(async function(){
				await child_process.execFile('ffmpeg', [
					'-i', __dirname + "/temp_videos/"+guid+"_uncompressed.mp4",
					'-b:v', '775k',
					'-b:a', '64k',
					//'-fs', '6.3M',
					"./videos/"+guid+".mp4"
				], function(error, stdout, stderr) {
					console.log(error, stdout, stderr);
					message.editReply('Downloaded!')
				})  
				message.editReply('Compressing.. This may take a while...');
			},5000);
        }
    }
    else if (command == "invite") {
        message.reply("Add me here: https://discord.com/oauth2/authorize?client_id=1038474208822448188&scope=bot");
    }
    else if (command == 'ytp') 
    {   
        const attachment = interaction.options.getAttachment("video");
        if (attachment) {

            var guid = Utils.guidGen()
            await message.reply('Downloading...')
            await fs.mkdirSync(__dirname + "/temp_videos/"+guid);
            await request.get(attachment.url)
                .on('error', console.error)
                .pipe(fs.createWriteStream(__dirname + "/temp_videos/"+guid+"/"+guid+"_uncompressed.mp4"));
                await child_process.execFile('ffmpeg', [
					'-i', __dirname + "/temp_videos/"+guid+"/"+guid+"_uncompressed.mp4",
					'-b:v', '775k',
					'-b:a', '64k',
					//'-fs', '6.3M',
					__dirname + "/temp_videos/"+guid+"/"+guid+".mp4"
				], function(error, stdout, stderr) {
					message.editReply('Downloaded!')
				})  
				message.editReply('Compressing.. This may take a while...');
            
            await sleep(1000);
            var sourceList = [];
            
            fs.readdirSync(__dirname + "/temp_videos/"+guid).forEach(file => {
                sourceList.push(__dirname + "/temp_videos/"+guid+"/"+file)
            });
            
            console.log(sourceList)
            var guid = Utils.guidGen()
            var loadingmsg = await message.editReply('Proccessing your requested YTP... this may take a while.\nThis is in beta, so expect bugs!\n\n')
            try {
    
                var options = {  
                    debug: true,
                    //MAX_STREAM_DURATION: 1.5, 
                    sourceList: sourceList,
                    resolution: [848,480],
                    //intro: "./assets/intro2.mp4",
                    OUTPUT_FILE: "./generated/ytp_"+guid+".mp4",
                    MAX_CLIPS: 60,
                    transitions: true,
                    showFileNames: true,
                    effects: {  
                        effect_RandomSound: true,
                        effect_RandomSoundMute: true,
                        effect_Reverse: true,
                        effect_Chorus: true,
                        effect_Vibrato: true,
                        effect_HighPitch: true,
                        effect_LowPitch: true,
                        effect_SpeedUp: true,
                        effect_SlowDown: true,
                        effect_Dance: true,
                        effect_Squidward: true,
                        effect_How: true,
                    }
                } 
                new YTPGenerator().configurateAndGo(options).then(function(){
                    message.editReply({
                        content: 'Heres your video!',
                        files: [{
                            attachment: './generated/ytp_'+guid+'.mp4',
                            name: 'ytp.mp4',
                            description: 'A YTP+ video.'
                        }]
                    });
                }).catch(function(e){
                    message.editReply('There was an error proccessing the video. Grab a programmer!\n```'+e+'```');
                });
            } catch(e) {
                message.editReply('There was an error proccessing the video. Grab a programmer!\n```'+e+'```');
            }
        } else {
            /*
            if (!args2.endsWith("ytp")) {
                
                await message.reply('Downloading...')
                var guid = Utils.guidGen()
                var url = args.shift().replaceAll("download ","");
                if (!ytdl.validateURL(url)) {
                    return message.reply("Please send a valid video link");
                }
                await fs.mkdirSync(__dirname + "/temp_videos/"+guid);
                await ytdl(url, { filter: format => format.container === 'mp4' }).pipe(fs.createWriteStream(__dirname + "/temp_videos/"+guid+"/"+guid+".mp4"))
                    
                message.reply('Downloaded!');
                
                await sleep(1000);
                var sourceList = [];
                
                fs.readdirSync(__dirname + "/temp_videos/"+guid).forEach(file => {
                    sourceList.push(__dirname + "/temp_videos/"+guid+"/"+file)
                });
                
                console.log(sourceList)
                var guid = Utils.guidGen()
                var loadingmsg = await message.reply('Proccessing your requested YTP... this may take a while.\nThis is in beta, so expect bugs!\n\n')
                try {
        
                    var options = {  
                        debug: true,
                        //MAX_STREAM_DURATION: 1.5, 
                        sourceList: sourceList,
                        resolution: [848,480],
                        //intro: "./assets/intro2.mp4",
                        OUTPUT_FILE: "./generated/ytp_"+guid+".mp4",
                        MAX_CLIPS: 60,
                        transitions: true,
                        showFileNames: true,
                        effects: {  
                            effect_RandomSound: true,
                            effect_RandomSoundMute: true,
                            effect_Reverse: true,
                            effect_Chorus: true,
                            effect_Vibrato: true,
                            effect_HighPitch: true,
                            effect_LowPitch: true,
                            effect_SpeedUp: true,
                            effect_SlowDown: true,
                            effect_Dance: true,
                            effect_Squidward: true,
                            effect_How: true,
                        }
                    } 
                    new YTPGenerator().configurateAndGo(options).then(function(){
                        loadingmsg.delete();
                        message.reply({
                            content: 'Heres your video!',
                            files: [{
                                attachment: './generated/ytp_'+guid+'.mp4',
                                name: 'ytp.mp4',
                                description: 'A YTP+ video.'
                            }]
                        });
                    }).catch(function(e){
                        loadingmsg.delete();
                        message.reply('There was an error proccessing the video. Grab a programmer!\n```'+e+'```');
                    });
                } catch(e) {
                    loadingmsg.delete();
                    message.reply('There was an error proccessing the video. Grab a programmer!\n```'+e+'```');
                }
            } else {*/

                var sourceList = [];
        
                fs.readdirSync('./videos').forEach(file => {
                    sourceList.push('./videos/'+file)
                });
                
                console.log(sourceList)
                var guid = Utils.guidGen()
                var loadingmsg = await message.reply('Proccessing your generated YTP... this may take a while.\nThis is in beta, so expect bugs!\n\n')
                try {
        
                    var options = {  
                        debug: true,
                        //MAX_STREAM_DURATION: 1.5, 
                        sourceList: sourceList,
                        resolution: [848,480],
                        //intro: "./assets/intro2.mp4",
                        OUTPUT_FILE: "./generated/ytp_"+guid+".mp4",
                        MAX_CLIPS: 60,
                        transitions: true,
                        showFileNames: true,
                        effects: {  
                            effect_RandomSound: true,
                            effect_RandomSoundMute: true,
                            effect_Reverse: true,
                            effect_Chorus: true,
                            effect_Vibrato: true,
                            effect_HighPitch: true,
                            effect_LowPitch: true,
                            effect_SpeedUp: true,
                            effect_SlowDown: true,
                            effect_Dance: true,
                            effect_Squidward: true,
                            effect_How: true,
                        }
                    } 
                    new YTPGenerator().configurateAndGo(options).then(function(){
                        message.editReply({
                            content: 'Heres your video!',
                            files: [{
                                attachment: './generated/ytp_'+guid+'.mp4',
                                name: 'ytp.mp4',
                                description: 'A YTP+ video.'
                            }]
                        });
                    }).catch(function(e){
                        message.editReply('There was an error proccessing the video. Grab a programmer!\n```'+e+'```');
                    });
                } catch(e) {
                    message.editReply('There was an error proccessing the video. Grab a programmer!\n```'+e+'```');
                }
            //}

        }
    }
    else if (command == 'ytpsolo') 
    {   
        var sourceList2 = [];
        
        fs.readdirSync('./videos_solo').forEach(file => {
            sourceList2.push('./videos_solo/'+file)
        });
        
        console.log(sourceList2)
        var guid = Utils.guidGen()
        var loadingmsg = await message.reply('Proccessing the solo generated YTP... This may take a while.\nThis is in beta, so expect bugs!\n\n')
        try {

            var options = {  
                debug: true,
                //MAX_STREAM_DURATION: 1.5, 
                sourceList: sourceList2,
                resolution: [848,480],
                temp: './temp/',
                OUTPUT_FILE: "./generated/ytpsolo_"+guid+".mp4",
                MAX_CLIPS: 60,
                transitions: true,
                showFileNames: true,
                effects: {  
                    effect_RandomSound: true,
                    effect_RandomSoundMute: true,
                    effect_Reverse: true,
                    effect_Chorus: true,
                    effect_Vibrato: true,
                    effect_HighPitch: true,
                    effect_LowPitch: true,
                    effect_SpeedUp: true,
                    effect_SlowDown: true,
                    effect_Dance: true,
                    effect_Squidward: true,
                    effect_How: true,
                }
            } 
            new YTPGenerator().configurateAndGo(options).then(function(){
                message.editReply({
                    content: 'Heres your video!',
                    files: [{
                        attachment: './generated/ytpsolo_'+guid+'.mp4',
                        //intro: "./assets/intro2.mp4",
                        name: 'ytp_solo.mp4',
                        description: 'A YTP+ video.'
                    }]
                });
            }).catch(function(e){
                message.editReply('There was an error proccessing the video. Grab a programmer!\n```'+e+'```');
            });
        } catch(e) {
            message.editReply('There was an error proccessing the video. Grab a programmer!\n```'+e+'```');
        }
    }
});
