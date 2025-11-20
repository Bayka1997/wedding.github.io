import { progress } from './progress.js';
import { util } from '../../common/util.js';
import { cache } from '../../connection/cache.js';

export const audio = (() => {

    const statePlay = '<i class="fa-solid fa-circle-pause spin-button"></i>';
    const statePause = '<i class="fa-solid fa-circle-play"></i>';

    /**
     * @param {boolean} [playOnOpen=true]
     * @returns {Promise<void>}
     */
    const load = async (playOnOpen = true) => {

        let isPausedByVisibility = false; 

        const url = document.body.getAttribute('data-audio');
        if (!url) {
            progress.complete('audio', true);
            return;
        }

        /**
         * @type {HTMLAudioElement|null}
         */
        let audioEl = null;

        try {
            audioEl = new Audio(await cache('audio').withForceCache().get(url, progress.getAbort()));
            audioEl.loop = true;
            audioEl.muted = false;
            audioEl.autoplay = false;
            audioEl.controls = false;

            progress.complete('audio');
        } catch {
            progress.valid('audio');
            return;
        }

        let isPlay = false;
        const music = document.getElementById('button-music');

        /**
         * @returns {Promise<void>}
         */
        const play = async () => {
            // ... (logic kiểm tra navigator.onLine và music)
            
            music.disabled = true;
            try {
                await audioEl.play();
                isPlay = true;
                isPausedByVisibility = false; // <-- Đặt lại trạng thái này khi Play thủ công
                music.disabled = false;
                music.innerHTML = statePlay;
            } catch (err) {
                // ...
            }
        };

        /**
         * @returns {void}
         */
        const pause = () => {
            // Luôn dừng và đặt trạng thái người dùng là PAUSED
            isPlay = false;
            isPausedByVisibility = false; // <-- Đặt lại trạng thái này khi Pause thủ công
            audioEl.pause();
            music.innerHTML = statePause;
        };

        document.addEventListener('undangan.open', () => {
            music.classList.remove('d-none');

            if (playOnOpen) {
                play();
            }
        });

        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                // --- ẨN TAB ---
                // Nếu nhạc đang chạy (do người dùng bật), thì tạm dừng và ghi nhận là do chuyển tab
                if (isPlay) { 
                    audioEl.pause();
                    isPausedByVisibility = true; // <-- Đánh dấu đã dừng do chuyển tab
                }
            } else {
                // --- HIỂN THỊ LẠI TAB ---
                // Nếu nhạc ĐÃ BỊ DỪNG DO CHUYỂN TAB (và isPlay là true - trạng thái mong muốn là play)
                if (isPausedByVisibility && isPlay) { 
                    try {
                        audioEl.play();
                        isPausedByVisibility = false; // <-- Đặt lại trạng thái sau khi phát lại
                    } catch (err) {
                        console.error("Lỗi khi cố gắng phát lại âm thanh:", err);
                    }
                }
            }
        });
        music.addEventListener('click', () => isPlay ? pause() : play());
    };

    /**
     * @returns {object}
     */
    const init = () => {
        progress.add();

        return {
            load,
        };
    };

    return {
        init,
    };
})();