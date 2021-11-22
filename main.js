const prompt = require('prompt-sync')();
const colors = require('colors');
const request = require('request')
const path = require('path');

class StemGen {
    constructor() {
        this.stemPoll = 0
        this.loaded = false
    }

    init() {  
        this.url = prompt('Enter your song url: ');
        this.getStem(this.url);
    }

    getStem() {
        if (!this.loaded) {
            this.log("Loading stem", "magenta");
            this.loaded = true
        }

        const opts = {
            method: "POST",
            timeout: 10000,
            body: JSON.stringify(
                {    
                    "link": this.url, 
                    // TODO: Add support for other file types
                    "stem_codec": "mp3" 
                }
            )
        }

        request("https://api.stemplayer.com/tracks", opts, (error, response, body) => {
            if (error) {
                let err = 'Error:' + error.toString()
                this.log(err, "red"); // Print the error if one occurred
                this.kill();
            } else {
                let stems = JSON.parse(body);
                
                switch (response.statusCode) {
                    case 201:
                        if (stems.data.status == "ready") {
                            this.log(`Stems created for - ${stems.data.metadata.title}`, 'green')

                            this.saveStem(stems.data.stems)
                        } else if (stems.data.status == "pending") {
                            this.stemPoll += 1;
                            
                            this.log(`Waiting for stem - [${this.stemPoll}]`, "blue");
                            this.sleep(5000).then(() => {
                                this.getStem();
                            })
                        } else {                            
                            this.log(`Song error - ${stems}`, "red");
                            this.kill();
                        }
                        break;
                    case 422:
                        this.log(`Song error - ${stems.error.message} [${stems.error.error}]`, "red");
                        this.kill();
                        break
                    default:
                        this.log("Unknown error", "red");
                        this.log(`${body} - ${response.statusCode}`,"red");
                        this.kill();
                        break

                }
            }
        });
    }

    saveStem(stems) {
        // TODO: Write stems to file
        
        this.log(
            "Bass: " + stems.bass + "\n" +
            "Drums: " + stems.drums + "\n" +
            "Other: " + stems.other + "\n" +
            "Vocals: " + stems.vocals,
            "yellow"
        )
        this.kill();
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async kill() {
        await this.sleep(3500)
        process.exit(0);
    }

    log(message, color) {
        console.log(message[color]);
    }
}

stemGen = new StemGen();
stemGen.init();
