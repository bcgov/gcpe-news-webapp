
$(document).ready(function () {
    var timeoutlength = 200;

    setTimeout(function () {
        $("div[id^='youtube-asset-']").each(function (index) {
            initializeEmbeddedYoutubePlaceholders(this, youtubeProxyUrl);
        });
    }, timeoutlength);

        $("div[id^='youtube-asset-']").find('.play-button').click(function () {
            playMediaYoutube($(this), false);
        });

        $("div[id^='youtube-asset-']").find('.save-preference').click(function () {
            playMediaYoutube(this, true);
        });

        $("div[id^='youtube-asset-']").find('.play-instructions a').click(function () {
            closeYoutubeInstructions(this);
        });

    });
    $(window).resize(function () {
        setTimeout(function () {
            $("div[id^='youtube-asset-']").each(function (index) {
                initializeEmbeddedYoutubePlaceholders(this, youtubeProxyUrl);
            });
        }, timeoutlength);
    });
