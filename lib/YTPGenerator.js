const pawn = require('child_process').execSync,
    fs = require("fs"),
    effectsFactory = require("./EffectsFactory"),
    TimeStamp = require("./TimeStamp"),
    Utilities = require("./Utilities"),
    ffmpegStatic = require("ffmpeg-static"),
    ffprobeStatic = require('ffprobe-static'),
    os = require('os')
module.exports =
    /**
     * Main file for YTP+, generates YTP videos.
     *
     * @author benb
     * @author TeamPopplio
     */
    class {
        _print(str) {
            if(this.debug == true)
                console.log(str);
        }

        _randomIntFromInterval(min, max) {
            return Math.floor(Math.random() * (max - min) + min);
        }

        _randomFloatFromInterval(minimum, maximum) {
			/*
            if(maximum === undefined) {
                maximum = minimum;
                minimum = 0;
            }
            return (Math.random() * (maximum - minimum)) + minimum;
			*/
			var finalVal = -1;
			while (finalVal<0) {
				var x = (Math.random() * ((maximum - minimum) + 0)) + minimum;
				finalVal=Math.round(x * 100.0) / 100.0; 
			}
			return finalVal;
        }
        /** 
         * Configure ytpplus-node and start generating.
         * @param {Object} options Options for setting up ytpplus-node. Required to have at least sourceList defined for usage.
         * @param {string} options.ffmpeg Set this value if you cannot access FFMPEG internally, such as with electron. Default is require("ffmpegStatic").path
         * @param {string} options.ffprobe Set this value if you cannot access FFProbe internally, such as with electron. Default is require("ffprobeStatic").path
         * @param {Date} options.date Uses the exact time from this date to create the temporary directory. Default is new Date().
         * @param {string} options.sources Directory that should contain different YTP source clips that will keep their length unspliced and will be added at random. Default is ./sources
         * @param {string} options.sounds Directory that should contain different audio files for the random sound effects' sounds. Default is ./sounds
         * @param {string} options.music Directory that should contain different audio files for the dance effect's music. Default is ./music
         * @param {string} options.resources Directory that should contain different resources. Default is ./resources
         * @param {string} options.temp Directory where the temp files will be stored. Default is ./temp
         * @param {boolean} options.transitions Whether or not to add transition clips, in the "sources" directory set. Default is false.
         * @param {string} options.OUTPUT_FILE The output destination of the completed YTP. Default is ./done.mp4
         * @param {float} options.MAX_STREAM_DURATION The maximum duration of a single clip. Default is 0.2.
         * @param {float} options.MIN_STREAM_DURATION The minimum duration of a single clip. Default is 0.4.
         * @param {float} options.MAX_CLIPS The maximum clips in a completed YTP. Default is 5.
         * @param {array} options.sourceList A list containing your videos, must be a valid file:// format. Required for usage.
         * @param {boolean} options.debug Enables console.log for a lot of different parts of the module. Not recommended for general use.
         * @param {array} options.effectRange A new implementation in ytpplus-node, allows you to choose the range of effects. 1-11 are every effect in order, with 0 being the stock clip splice. If effects are disabled, their placement will be replaced with the stock clip splice.
         * @param {number} options.effectRange[0] An integer that should be 0-10, anything greater or lower will likely cause issues! This is the starting effect range, default is 0.
         * @param {number} options.effectRange[1] An integer that should be 1-11, anything greater or lower will likely cause issues! This is the ending effect range, default is 11.
         * @param {array} options.resolution A new implementation in ytpplus-node, allows you to set the output resolution and the resolution that the effects will use to create videos.
         * @param {number} options.resolution[0] Width of the output video. Default is 640.
         * @param {number} options.resolution[1] Height of the output video. Default is 480.
         * @param {array} options.outro A new implementation in ytpplus-node, allows you to set an outro video file (*.mp4) to play at the very end of the YTP. Default is null, however you can easily set it to the included outro.mp4 in resources.
         * @param {array} options.intro A new implementation in ytpplus-node, allows you to set an intro video file (*.mp4) to play at the start of the YTP. Default is null.
         * @param {Object} options.effects An object that contains different booleans for the effects to add. Every effect defaults to false.
         * @param {boolean} options.showFileNames Show file name on top left corner of the video
         * @param {boolean} options.effects.effect_RandomSound Adds a random sound effect to either the source material or a transition clip.
         * @param {boolean} options.effects.effect_RandomSoundMute Adds a random sound effect, but mutes the original audio.
         * @param {boolean} options.effects.effect_Reverse Reverses both audio and video, sometimes doesn't work unfortunately.
         * @param {boolean} options.effects.effect_SpeedUp Speeds up the clip, may end up with broken audio.
         * @param {boolean} options.effects.effect_SlowDown Slows down the clip, may end up with broken audio.
         * @param {boolean} options.effects.effect_Chorus Applys a "chorus" effect to the audio.
         * @param {boolean} options.effects.effect_Vibrato Applys a "vibrato" effect to the audio.
         * @param {boolean} options.effects.effect_HighPitch Sets the pitch to be higher than normal.
         * @param {boolean} options.effects.effect_LowPitch Sets the pitch to be lower than normal.
         * @param {boolean} options.effects.effect_Dance Grabs a few frames from the video and continuously plays it normally and revered alongside playing music.
         * @param {boolean} options.effects.effect_Squidward Applys a bunch of ImageMagick effects to a single frame of the clip to a beat, similar to the popular "Squidward Fad" meme.
         * @param {boolean} options.effects.effect_How HOW IS HE DOING THAT?!
         * @return {promise} Resolves when YTP is finished generating, rejects using an error in a try catch loop if something is caught unexpectedly. Also rejects if there is no sourcelist.
         */
        async configurateAndGo(options) {
            return new Promise(async (resolve,reject) => {
                //add some code to load this from a .cfg file later
                //toolBox.FFMPEG = ffmpeg;
                //toolBox.FFPROBE = ffprobe;
                //toolBox.MAGICK = imagemagick;
                this.toolBox = new Utilities();
                this.debug = options.debug != undefined ? options.debug : false;
                this.done = false;
                this.doneCount = 0;
                this.factory = new effectsFactory()
                this.OUTPUT_FILE = options.OUTPUT_FILE != undefined ? options.OUTPUT_FILE : __dirname + "/done.mp4"
                if(this.OUTPUT_FILE.includes(" "))
                    return reject("output-has-spaces")
                this.MAX_CLIPS = options.MAX_CLIPS != undefined ? options.MAX_CLIPS : 5
                this.toolBox.setFFMPEG((options.ffmpeg != undefined ? options.ffmpeg : ffmpegStatic.path))
                this.toolBox.setProbe((options.ffprobe != undefined ? options.ffprobe : ffprobeStatic.path))
                this.toolBox.setTemp((options.temp != undefined ? options.temp : os.tmpdir())+"/job_" + (options.date != undefined ? options.date : new Date()).getTime() + "/");
                fs.mkdirSync(this.toolBox.TEMP)
                this.toolBox.SOURCES = options.sources != undefined ? options.sources : __dirname + "/sources/";
                this.toolBox.SOUNDS = options.sounds != undefined ? options.sounds : __dirname + "/sounds/";
                this.toolBox.MUSIC = options.music != undefined ? options.music : __dirname + "/music/";
                this.toolBox.RESOURCES = options.resources != undefined ? options.resources : __dirname + "/resources/";
                this.sourceList = options.sourceList != undefined ? options.sourceList : [__dirname + "/intro2.mp4"];
                for(var i=0;i<this.sourceList.length;i++) {
                    if(this.sourceList[i].includes(" "))
                        return reject("source-has-spaces")
                }
                this.MAX_STREAM_DURATION = options.MAX_STREAM_DURATION != undefined ? options.MAX_STREAM_DURATION : 0.4;
                this.MIN_STREAM_DURATION = options.MIN_STREAM_DURATION != undefined ? options.MIN_STREAM_DURATION : 0.2;

                this.effect1 = options.effects.effect_RandomSound != undefined ? options.effects.effect_RandomSound : false;
                this.effect2 = options.effects.effect_RandomSoundMute != undefined ? options.effects.effect_RandomSoundMute : false;
                this.effect3 = options.effects.effect_Reverse != undefined ? options.effects.effect_Reverse : false;
                this.effect4 = options.effects.effect_SpeedUp != undefined ? options.effects.effect_SpeedUp : false;
                this.effect5 = options.effects.effect_SlowDown != undefined ? options.effects.effect_SlowDown : false;
                this.effect6 = options.effects.effect_Chorus != undefined ? options.effects.effect_Chorus : false;
                this.effect7 = options.effects.effect_Vibrato != undefined ? options.effects.effect_Vibrato : false;
                this.effect8 = options.effects.effect_HighPitch != undefined ? options.effects.effect_HighPitch : false;
                this.effect9 = options.effects.effect_LowPitch != undefined ? options.effects.effect_LowPitch : false;
                this.effect10 = options.effects.effect_Dance != undefined ? options.effects.effect_Dance : false;
                this.effect11 = options.effects.effect_Squidward != undefined ? options.effects.effect_Squidward : false;
                this.effect12 = options.effects.effect_How != undefined ? options.effects.effect_How : false;

                //NEW IMPLEMENTATIONs
                this.effectRange = options.effectRange != undefined ? [(options.effectRange[0] != undefined ? options.effectRange[0] : 0),((options.effectRange[1] != undefined ? options.effectRange[1] : 12)+1)] : [0,13]
                this.resolution = options.resolution != undefined ? [(options.resolution[0] != undefined ? options.resolution[0] : 640),(options.resolution[1] != undefined ? options.resolution[1] : 480)] : [640,480]
                this.outro = options.outro != undefined ? options.outro : null;
                this.intro = options.intro != undefined ? options.intro : null;

                if(this.intro)
                    if(this.intro.includes(" "))
                        return reject("intro-has-spaces")
                
                if(this.outro)
                    if(this.outro.includes(" "))
                        return reject("outro-has-spaces")

                this.factory.setToolBox(this.toolBox);
                this.insertTransitionClips = options.transitions != undefined ? options.transitions : false;
                var oh = this
                //this._print("My FFMPEG is: " + toolBox.FFMPEG);
                //this._print("My FFPROBE is: " + toolBox.FFPROBE);
                //this._print("My MAGICK is: " + toolBox.MAGICK);
                oh._print("My TEMP is: " + oh.toolBox.TEMP);
                oh._print("My SOUNDS is: " + oh.toolBox.SOUNDS);
                oh._print("My SOURCES is: " + oh.toolBox.SOURCES);
                oh._print("My MUSIC is: " + oh.toolBox.MUSIC);
                oh._print("My RESOURCES is: " + oh.toolBox.RESOURCES);
                if(oh.sourceList.length < 1) {
                    oh._print("No sources added...");
                    return reject("no-sources")
                }
                if(fs.existsSync(oh.OUTPUT_FILE) == true) {
                    fs.unlinkSync(oh.OUTPUT_FILE);
                }
                //var out = fs.createWriteStream(oh.OUTPUT_FILE);
                try {
                    var writer = fs.createWriteStream(oh.toolBox.TEMP + "concat.txt")
                    var max = oh.MAX_CLIPS
                    if(oh.intro != null) {
                        oh._print("Adding intro "+oh.intro)
                        oh._print(oh.toolBox.TEMP+"video"+max)
                        await oh.toolBox.copyVideo(oh.intro, oh.toolBox.TEMP+"video0",oh.resolution);
                        max = max+1;
                    }
                    for(var i = 1; i < max; i++) {
                        oh.doneCount = i / max;
                        var sourceToPick = oh.sourceList[oh._randomIntFromInterval(0, oh.sourceList.length)];
                        oh._print(sourceToPick);
                        var ok = await oh.toolBox.getVideoLength(sourceToPick)
                        var value = ok.streams[0].duration 
                        var date = new Date(1970, 0, 1)
                        date.setSeconds(value)
                        var boy = new TimeStamp().setup(date);
                        oh._print(boy.getTimeStamp());
                        oh._print("STARTING CLIP " + "video" + i);
                        var date2 = new Date(1970, 0, 1)
                        date2.setMilliseconds(((oh._randomFloatFromInterval(0.0, boy.getLengthSec() - oh.MAX_STREAM_DURATION))) * 1000)
                        var startOfClip = new TimeStamp().setup(date2);
                        var date3 = new Date(1970, 0, 1)
                        date3.setMilliseconds((startOfClip.getLengthSec() + oh._randomFloatFromInterval(oh.MIN_STREAM_DURATION, oh.MAX_STREAM_DURATION)) * 1000)
                        //oh._print("boy seconds = "+  boy.getLengthSec());
                        var endOfClip = new TimeStamp().setup(date3);
                        oh._print("Beginning of clip " + i + ": " + startOfClip.getTimeStamp());
                        oh._print("Ending of clip " + i + ": " + endOfClip.getTimeStamp() + ", in seconds: ");
                        var donedoingthat = false
                        var random = oh._randomIntFromInterval(0, 16)
                        oh._print("Lucky number: " + random)
                        if(random == 15 && oh.insertTransitionClips == true) {
                            oh._print("Tryina use a diff source");
                            donedoingthat = await oh.toolBox.copyVideo(oh.toolBox.SOURCES + oh.factory.pickSource(), oh.toolBox.TEMP + "video" + i,oh.resolution);
                        } else {
                            donedoingthat = await oh.toolBox.snipVideo(sourceToPick, startOfClip, endOfClip, oh.toolBox.TEMP + "video" + i,oh.resolution, options.showFileNames);
                        }
                        if(donedoingthat) {
                            oh.factory.setToolBox(oh.toolBox);
                            //Add a random effect to the video
                            var effect = oh._randomIntFromInterval(this.effectRange[0],this.effectRange[1]);
                            oh._print("STARTING EFFECT ON CLIP " + i + " EFFECT" + effect);
                            var clipToWorkWith = oh.toolBox.TEMP + "video" + i + ".mp4";
                            switch (effect) {
                                case 1:
                                    //random sound
                                    if(oh.effect1 == true) {
                                        oh._print("effect_RandomSound initiated");
                                        await oh.factory.effect_RandomSound(clipToWorkWith, oh.debug,oh.resolution);
                                    }
                                    break;
                                case 2:
                                    //random sound
                                    if(oh.effect2 == true) {
                                        oh._print("effect_RandomSoundMute initiated");
                                        await oh.factory.effect_RandomSoundMute(clipToWorkWith, oh.debug,oh.resolution)
                                    }
                                    break;
                                case 3:
                                    if(oh.effect3 == true) {
                                        oh._print("effect_Reverse initiated");
                                        await oh.factory.effect_Reverse(clipToWorkWith, oh.debug,oh.resolution)
                                    }
                                    break;
                                case 4:
                                    if(oh.effect4 == true) {
                                        oh._print("effect_SpeedUp initiated");
                                        await oh.factory.effect_SpeedUp(clipToWorkWith, oh.debug,oh.resolution)
                                    }
                                    break;
                                case 5:
                                    if(oh.effect5 == true) {
                                        oh._print("effect_SlowDown initiated");
                                        await oh.factory.effect_SlowDown(clipToWorkWith, oh.debug,oh.resolution)
                                    }
                                    break;
                                case 6:
                                    if(oh.effect6 == true) {
                                        oh._print("effect_Chorus initiated");
                                        await oh.factory.effect_Chorus(clipToWorkWith, oh.debug,oh.resolution)
                                    }
                                    break;
                                case 7:
                                    if(oh.effect7 == true) {
                                        oh._print("effect_Vibrato initiated");
                                        await oh.factory.effect_Vibrato(clipToWorkWith, oh.debug,oh.resolution)
                                    }
                                    break;
                                case 8:
                                    if(oh.effect8 == true) {
                                        oh._print("effect_HighPitch initiated");
                                        await oh.factory.effect_HighPitch(clipToWorkWith, oh.debug,oh.resolution)
                                    }
                                    break;
                                case 9:
                                    if(oh.effect9 == true) {
                                        oh._print("effect_LowPitch initiated");
                                        await oh.factory.effect_LowPitch(clipToWorkWith, oh.debug,oh.resolution)
                                    }
                                    break;
                                case 10:
                                    if(oh.effect10 == true) {
                                        oh._print("effect_Dance initiated");
                                        await oh.factory.effect_Dance(clipToWorkWith, oh.debug,oh.resolution)
                                    }
                                    break;
                                case 11:
                                    if(oh.effect11 == true) {
                                        oh._print("effect_Squidward initiated");
                                        await oh.factory.effect_Squidward(clipToWorkWith, oh.debug,oh.resolution)
                                    }
                                    break;
                                case 12:
                                    if(oh.effect12 == true) {
                                        oh._print("effect_How initiated");
                                        await oh.factory.effect_How(clipToWorkWith, oh.debug,oh.resolution)
                                    }
                                    break;
                                default:
                                    break;
                            }
                        }
                    }
                } catch (ex) {
                    console.error(ex)
                } finally {
                    setTimeout(async function() {
                        for(var i = 0; i < max; i++) {
                            if(fs.existsSync(oh.toolBox.TEMP + "video" + i + ".mp4") == true) {
                                oh._print(i + " Exists")
                                writer.write("file 'video" + i + ".mp4'\n");
                            }
                        }
                        writer.close();
                        //Thread.sleep(10000);
                        var isok = false
                        if(oh.outro != null) {
                            oh._print("Adding outro "+oh.outro)
                            oh._print(oh.toolBox.TEMP+"video"+max)
                            isok = await oh.toolBox.copyVideo(oh.outro, oh.toolBox.TEMP+"video"+max,oh.resolution);
                            max = max+1;
                        } else isok = true
                        if(isok) {
                            var okbuddy
                            okbuddy = oh.toolBox.concatenateVideo(max, oh.OUTPUT_FILE, oh.debug)
                            okbuddy.catch(() =>
                                reject("concat-error")
                            )
                            okbuddy.then(() => {
                                var deleteFolderRecursive = function(path) {
                                    if(fs.existsSync(path)) {
                                        fs.readdirSync(path).forEach(function(file, index) {
                                            var curPath = path + "/" + file;
                                            if(fs.lstatSync(curPath).isDirectory()) { // recurse
                                                deleteFolderRecursive(curPath);
                                            } else { // delete file
                                                fs.unlinkSync(curPath);
                                            }
                                        });
                                        setTimeout(() => {
                                            fs.rmdirSync(path);
                                        }, 10)

                                    }
                                };
                                //for (int i=0; i<100; i++) {
                                deleteFolderRecursive(oh.toolBox.TEMP);
                                oh.done = true;
                                return resolve(true)
                            })
                        }
                    }, 10000)   
                }
            })
        }
    }