module.exports = 
/**
 * TimeStamp class for YTP+
 *
 * @author benb
 * @author TeamPopplio
 */
class {
    setup(time) {
        var parts = []
        if(typeof time == "string") {
            parts = time.split(":");
        } else if(typeof time == "object") {
            parts = (time.getHours()+":"+time.getMinutes()+":"+time.getSeconds()+"."+time.getMilliseconds()).split(":")
        }
        this.HOURS = parseInt(parts[0]);
        this.MINUTES = parseInt(parts[1]);
        this.SECONDS = parseFloat(parts[2]);
        return this
    }
    
    getLengthSec() {
        return this.SECONDS + (this.MINUTES*60) + (this.HOURS*60*60);
    }

    getLengthMilliseconds() {
        return (this.SECONDS + (this.MINUTES*60) + (this.HOURS*60*60))*1000;
    }
    
    getHours() {
        return this.HOURS;
    }
    getMinutes() {
        return this.MINUTES;
    }
    getSeconds() {
        return this.SECONDS;
    }
    
    /*getDeets() {
        print("HOURS: " + HOURS);
        print("MIN: " + MINUTES);
        print("SEC: " + SECONDS);
    }*/
    
    getTimeStamp() {
        return this.HOURS + ":" + this.MINUTES + ":" + this.SECONDS;
    }
}