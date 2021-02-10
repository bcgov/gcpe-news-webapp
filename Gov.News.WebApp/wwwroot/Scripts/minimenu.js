function closeSearchMenu(speed) {
    $('.mini-search-container-trigger').removeClass('triggered');
    if (speed == undefined) {
        
    } else {
        $('.mini-menu-search').slideUp('fast');
    }   
}

$(function () {

    $('#mini-menu-container').on('shown.bs.collapse', function () {
        $('#hamburger-button').toggleClass('hidden');
        $('#close-hamburger-button').toggleClass('hidden');
    })
    $('#mini-menu-container').on('hidden.bs.collapse', function () {
        $('#hamburger-button').toggleClass('hidden');
        $('#close-hamburger-button').toggleClass('hidden');
    })
    $('#mini-search-container').on('shown.bs.collapse', function () {
        $('#search-button').toggleClass('hidden');
        $('#close-search-button').toggleClass('hidden');
        $('.mini-search-container-trigger').addClass('triggered');
        $('.mini-menu-search').slideDown(200, function () { });

    })
    $('#mini-search-container').on('hidden.bs.collapse', function () {
        $('#search-button').toggleClass('hidden');
        $('#close-search-button').toggleClass('hidden');
        $('.mini-search-container-trigger').removeClass('triggered');
        $('.mini-menu-search').hide();
    })

    $("#ministry-dropdown").on('click', function () {

        $('#ministry-dropdown-down').toggleClass('hidden');
        $('#ministry-dropdown-up').toggleClass('hidden');
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
