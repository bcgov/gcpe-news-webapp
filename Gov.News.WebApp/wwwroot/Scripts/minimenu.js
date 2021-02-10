function closeSearchMenu(speed) {
    $('.mini-search-container-trigger').removeClass('triggered');
    if (speed == undefined) {
        
    } else {
        $('.mini-menu-search').slideUp('fast');
    }   
}

$(function () {

   
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
