$(document).ready(function () {
    const $inInputLink = $(".inInputLink");

    if ($(window).width() <= '500') {

        let regionsSelWindowHeight = $(window).height() - 130;

        $(".regionsSelWindow-outside").height(regionsSelWindowHeight);
        $(".regionsSelWindow").css("top", "0px");

        if (!$inInputLink.hasClass('disabledLink')) {
            $(".inInputLink").click(function () {
                $(".regionsSelWindow").dialog({
                    dialogClass: "Dialog",
                    minWidth: $(window).width() <= 768 ? 299 : 570,
                    modal: true
                })
            })
        }

        $(".close").click(function () {
            $(this).parent().dialog("close");
            return false;
        });
    } else {
        if (!$inInputLink.hasClass('disabledLink')) {
            $(".inInputLink").click(function (e, x) {
                $(this).siblings(".regionsSelWindow ").toggleClass('hidden');
            });
        }
    }

    $(document).mouseup(function (e) {
        var container = $(".regionsSelWindow, .inInputLink");
        if (!container.has(e.target).length) {
            $(".regionsSelWindow").toggleClass('hidden', true);
        }

    });
});