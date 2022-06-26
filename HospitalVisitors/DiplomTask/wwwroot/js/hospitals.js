$(document).ready(function() {
	
    $("select").select2({
        width: "element",
        placeholder: COMBOBOX_LOADING,
        formatNoMatches: function (term) {
            return COMBOBOX_NOT_FOUND
        },
		minimumResultsForSearch: 10
    });

    if ($(window).width() <= '640') {

        let regionsSelWindowHeight = $(window).height() - 130;

        $(".regionsSelWindow-outside").height(regionsSelWindowHeight);
        $(".regionsSelWindow").css("top", "0px");

        //debugger;
        $(".text-col30.territory").click(function () {
             $(".select2-dropdown").hide();
            $(".regionsSelWindow").dialog({
                dialogClass: "Dialog",
                minWidth: $(window).width() <= 768 ? 299 : 570,
                modal: true
            })
        })

        $(".close").click(function () {
            $(this).parent().dialog("close");
            return false;
        });
    }
	
	
	$("#profile-id").change( function() {
		$("#filter-form").submit();
	});
	$("#agetype-id").change( function() {
		$("#filter-form").submit();
	});
	$("#territory-id").change( function() {
		$("#filter-form").submit();
	});
    $("#region-id").change( function() {
        $("#filter-form").submit();
    });
	
	$("#org_name").keyup( function() {
        var Filter = $(this).val().toUpperCase();
        var rows = $('.moTableDetail').find('a');
        if (Filter == '') {
            rows.show();
        } else {
            $.each(rows, function(idx) {
                var name = $(this).find('.lpu-name').text();
                var address = $(this).find('.lpu-address').text();
                if (!name || (name.toUpperCase().indexOf(Filter) == -1 && address.toUpperCase().indexOf(Filter) == -1) ) {
                    $(this).hide();
				} else {
                    $(this).show();
					if ($(this).hasClass('par')) {
						//console.log('#head'+$(this).attr('rel'));
						$('#head'+$(this).attr('rel')).show();
					}
				}
            });
        }
	});
});