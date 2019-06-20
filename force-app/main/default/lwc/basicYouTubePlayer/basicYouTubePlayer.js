import { LightningElement, api } from 'lwc';
import { loadScript } from 'lightning/platformResourceLoader';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import YouTubePath from '@salesforce/resourceUrl/YouTubeJS';

export default class BasicYouTubePlayer extends LightningElement {
    @api youTubeId;
    player;

    YouTubePathInitialized = false;
    renderedCallback() {
        if (!this.youTubeId) {
            return;
        }

        if (this.YouTubePathInitialized && this.player) {
            this.player.loadVideoById(this.youTubeId, 0, 0);
        } 

        if (!this.YouTubePathInitialized) {
            Promise.all([
                loadScript(this, YouTubePath + '/iframe_api.js'),
                loadScript(this, YouTubePath + '/widget_api.js')
            ])
                .then(() => {
                    this.onYouTubeIframeAPIReady();
                })
                .catch(error => {
                    this.showErrorToast(error);
                });
        }

        this.YouTubePathInitialized = true;
    }

    onPlayerError(e) {
        let explanation = '';
        if (e.data === 2) {
            explanation = 'Invalid YouTube ID';
        } else if (e.data === 5) {
            explanation =
                'The requested content cannot be played in an HTML5 player or another error related to the HTML5 player has occurred.';
        } else if (e.data === 100) {
            explanation =
                'The video requested was not found. This error occurs when a video has been removed (for any reason) or has been marked as private.';
        } else if (e.data === 101 || e.data === 150) {
            explanation =
                'The owner of the requested video does not allow it to be played in embedded players.';
        }

        this.showErrorToast(explanation);
    }

    showErrorToast(explanation) {
        const evt = new ShowToastEvent({
            title: 'Error loading YouTube player',
            message: explanation,
            variant: 'error'
        });
        this.dispatchEvent(evt);
    }

    onYouTubeIframeAPIReady() {
        // check if the playerElem exists before creating new elements
        let playerElem = this.template.querySelector('.player');
        if (!playerElem) {
            const containerElem = this.template.querySelector('.wrapper');
            playerElem = document.createElement('DIV');
            playerElem.className = 'player';
            containerElem.appendChild(playerElem);

            this.player = new window.YT.Player(playerElem, {
                height: '390',
                width: '100%',
                videoId: this.youTubeId,
                events: {
                    onError: this.onPlayerError.bind(this)
                }
            });
        } 
    }
}
