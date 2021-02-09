function closeSearchMenu(speed) {
    $('.mini-search-container-trigger').removeClass('triggered');
    if (speed == undefined) {
        $('.mini-menu-search').hide();
    } else {
        $('.mini-menu-search').slideUp('fast');
    }   
}

$(function () {
    $('.mini-menu-container-trigger').on('click', function () {
        $('#hamburger-button').toggleClass('hidden');
        $('#close-hamburger-button').toggleClass('hidden');
    });

    $('.mini-search-container-trigger').on('click', function () {
        var menuTrigger = $('.mini-search-container-trigger');
        var opened = menuTrigger.hasClass('triggered');
        var miniMenu = $('.mini-menu-search');
        if (opened) {
            closeSearchMenu('slow');
        } else {
            menuTrigger.addClass('triggered');
            miniMenu.slideDown(200, function () { });
        }
        
        $('#search-button').toggleClass('hidden');
        $('#close-search-button').toggleClass('hidden');
    });

    $(".level-trigger").on('click', function () {
        var childList = $(this).siblings().parent().find('ul:first');
        if (childList.length === 0)
            return;
        if (childList.is(':visible')) {
            childList.slideUp(400, function () { });
            $(this).removeClass('open');
            childList.find('ul').removeClass('open');
        } else {
            childList.slideDown(400, function () { });
            $(this).addClass('open');
        }
    });
});
