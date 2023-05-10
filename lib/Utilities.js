const util = require('util'),
    cp = require('child_process'),
    fs = require("fs"),
    ffprobe = require("ffprobe"),
    TimeStamp = require("./TimeStamp")
module.exports = 
/**
 * FFMPEG utilities toolbox for YTP+
 *
 * @author benb
 * @author TeamPopplio
 */
class {
    async spawn(command,options) {
        return new Promise((res,rej) => {
            cp.exec(command,{},(error, stdout, stderr) => {
                if(error != null) {
                    console.log(error)
                    return rej(false)
                }
            }).on("close",()=>{return res(true)})
        })
    }
    setTemp(tmp) {
        this.TEMP = tmp
        console.log(this.TEMP)
    }
    setFFMPEG(tmp) {
        this.FFMPEG = tmp
        console.log(this.FFMPEG)
    }
    setProbe(tmp) {
        this.Probe = tmp
        console.log(this.Probe)
    }
    /**
     * Return the length of a video (in seconds)
     *
     * @param {string} video input video filename to work with
     * @param {function} callback Callback function.
     * @param {float} callback.value Output
     * @return {Promise} Video length as a string (output from ffprobe)
     */
    async getVideoLength(video,callback){
        return ffprobe(video,{path: this.Probe})

    }

    /**
     * Redirect for getVideoLength()
     *
     * @param {string} file input video filename to work with
     * @param {function} callback Callback function.
     * @param {float} callback.value Output
     * @return Video length as a string (output from ffprobe)
     */
    getLength(file,callback) {
        return this.getVideoLength(file,callback)
    }

    /**
     * Snip a video file between the start and end time, and save it to an output file.
     *
     * @param {string} video input video filename to work with
     * @param {TimeStamp} startTime start time (in TimeStamp format, e.g. new TimeStamp(seconds);)
     * @param {TimeStamp} endTime start time (in TimeStamp format, e.g. new TimeStamp(seconds);)
     * @param {string} output output video filename to save the snipped clip to
     */
    snipVideo(video, startTime, endTime, output, resolution, showFileNames){
        var command = this.FFMPEG
            + " -i " + video
            + " -ss " + startTime.getTimeStamp()
            + " -to " + endTime.getTimeStamp()
            + " -ac 1"
            + " -ar 44100";
            + " -vf scale="+resolution[0]+"x"+resolution[1]+",setsar=1:1,fps=fps=30";
            if (showFileNames) command += " -vf scale="+resolution[0]+"x"+resolution[1]+",setsar=1:1,fps=fps=30,drawtext=fontfile='./asset/impact.ttf':text='"+video+"':fontcolor=white:box=1:boxcolor=black:boxborderw=5";
            else command += " -vf scale="+resolution[0]+"x"+resolution[1]+",setsar=1:1,fps=fps=30";
            command += " -y"
            + " " + output + ".mp4";
        return this.spawn(command,{})
    }   
    
    /**
     * Copies a video and encodes it in the proper format without changes.
     *
     * @param {string} video input video filename to work with
     * @param {string} output output video filename to save the snipped clip to
     */ 
    copyVideo(video, output,resolution){
        var command1 = this.FFMPEG
            + " -i " + video
            + " -ar 44100"
            + " -ac 1"
            //	+ " -filter:v fps=fps=30,setsar=1:1"
            + " -vf scale="+resolution[0]+"x"+resolution[1]+",setsar=1:1,fps=fps=30"
            + " -y"
            + " " + output + ".mp4";
        return this.spawn(command1,{})
    }   
    
    /**
     * Concatenate videos by count
     *
     * @param {number} count number of input videos to concatenate
     * @param {string} out output video filename
     */
    async concatenateVideo(count, out, debug) {
        try {
            var command1 = "";
            
            for (var i=0; i<count; i++) {
                if (fs.existsSync(this.TEMP + "video" + i + ".mp4") == true) {
                    command1 = command1.concat(" -i " + this.TEMP + "video" + i + ".mp4");
                }
            }
            command1 = command1.concat(" -filter_complex \"");
            
            var realcount = 0;
            for (i=0; i<count; i++) {
                if (fs.existsSync(this.TEMP + "video" + i + ".mp4") == true) {
                    realcount++;
                }
            }
            for (i=0; i<realcount; i++) {
                command1 = command1.concat("[" + i + ":v:0][" + i + ":a:0]");
                //command1 = command1.concat("[" + i + ":v][" + i + ":a]");
            }
            
            //realcount +=1;
            //command1 = command1.concat("concat=n=" + realcount + ":v=1:a=1[outv][outa]\" -map \"[outv]\" -map \"[outa]\"   -y " + out); 
			command1=command1.concat("concat=n=" + realcount + ":v=1:a=1[outv][outa]\" -map \"[outv]\" -map \"[outa]\" -y " + out); 
            //System.out.println(command1);
            return new Promise((res,rej) => {
                cp.exec(this.FFMPEG+command1,{},(error, stdout, stderr) => {
                    if(debug == true)
                        console.log(error)
                    if(error != null)
                        return rej(false)
                }).on("close",()=>{return res(true)})
            })
            //cmdLine = CommandLine.parse(command2);
            //executor = new DefaultExecutor();
            //exitValue = executor.execute(cmdLine);
            
            //temp.delete();
        } catch (ex) {console.error(ex)}
    }
}