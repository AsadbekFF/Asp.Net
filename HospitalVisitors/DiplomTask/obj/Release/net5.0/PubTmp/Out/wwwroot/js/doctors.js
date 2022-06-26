

$(document).ready(function() {
	
	$( ".lift, .Doc" ).on("click", function() {
		$( this ).parent().toggleClass('selected');
		return false;
	});

	$( "#toggleAllDoctors" ).click(function() {
		
		$( 'div.hidden' ).toggle();
		if (this.innerHTML.indexOf('Показать ') != -1 ) {
			this.innerHTML = this.innerHTML.replace(SHOW + ' ', HIDE + ' ');
		} else {
			this.innerHTML = this.innerHTML.replace(HIDE + ' ', SHOW + ' ');
		}
		
		if ($('dl.otherLpu').children().length == 0 ) {
			$( "#otherDoctors" ).html('<div style="vertical-align: bottom; text-align:center; height: 100px;"> <img src="/design/common_new/img/ajax-loader.gif" align="center" /></div>');
			$.ajax({
                url: location.href + '/other',
				dataType: "html",
				type: "GET",
                success: function(data) {
					$( "#otherDoctors" ).html(data);
					$( ".lift, .Doc" ).off("click");
					$( ".lift, .Doc" ).on("click", function() {
						$( this ).parent().toggleClass('selected');
						return false;
					})
                }
            });
		}
		
		return false;
	})
	
	$( ".autoCompleteInput" ).autocomplete({
		source: '/service/schedule/search?profile_id=' + $('#LpuSectionProfile_id').val(),
		minLength: 3,
		delay: 500,
		select: function( event, ui ) {
			location.href = '/service/record/' + $('#Person_id').val() + '/' + ui.item.id + '/timetable';
			$(this).val('');
			event.preventDefault();
			return false;
		}
	}).autocomplete( "widget" ).addClass( "autoCompleteInput_menu" );
	$( ".autoCompleteInput" ).autocomplete( "instance" )._renderItem = function( ul, item ) {
		var substr_pos = item.label.toLowerCase().indexOf(this.term.toLowerCase());
		return $( "<li></li>" ) 
		.data( "item.autocomplete", item )
		.append( item.label.substring(0, substr_pos) )
		.append( '<span class="coincident_text">' + item.label.substring(substr_pos, this.term.length + substr_pos ) + '</span>' )
		.append( item.label.substring(substr_pos + this.term.length ) )
		.appendTo( ul );
    };
	
	$( "#otherDoctors" ).click(function() {
		$(".popup.warningCancelInvite").dialog({
			dialogClass: "Dialog warningAlertCancelInvite",
			minWidth: $(window).width() <= 768? 299 : 445,
			modal: true
		})
		return false;
	})

	$( ".isAttachmentWrong" ).click(function() {		
		$(".popup.warningAttach").dialog({
			dialogClass: "Dialog warningAlertCancelInvite",
			minWidth: 445,
			modal: true
		})
		if ($(window).width()<=640) {
			let widthScreen = $(window).width();
			let heightwarningAttach = $(".popup.warningAttach").height();
			$(".popup.warningAttach").width(widthScreen-32);
			$(".popup.warningAttach").height(heightwarningAttach+40);
			$("span.close").width(widthScreen-32);
		}
		return false;
	})
	
	$( "#doctorSearch" ).click (function(e, x){
		$( "#filterForm" ).submit();
		return false;
	});
	
	$( "#filterForm" ).submit (function(){
		if ( $('#terr_id').val() ) {
			var terr_query = '&terr_id=' + $('#terr_id').val();
		} else {
			terr_query = '';
		}
		var show_other_mo = '';
		if ( +$('#show_other_mo').val() ) {
			var show_other_mo = '&show_other_mo=1';
		}
		location.href = location.pathname + '?q=' + $('#doctorSearchQuery').val() + terr_query + show_other_mo;
		return false;
	});

	function getCookie(name) {
		var matches = document.cookie.match(new RegExp(
			"(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
		));
		return matches ? decodeURIComponent(matches[1]) : undefined;
	}

	$( "#searchOnBigMap" ).change (function(e, x){
		$('.mapContainer').toggleClass('hidden', !$( "#searchOnBigMap" ).prop('checked'));

		if ( !$('.mapContainer').hasClass('hidden') ) {
			ymaps.ready(function() {
				var coords = [54.83, 37.11];
				if (getCookie('rmp_region') == 'crimea' || getCookie('rmp_region') == 'crimea_new') {
					coords = [45.3, 34];
				}
				map = new ymaps.Map('map', {
					zoom: 8,
					controls: ['smallMapDefaultSet'],
					center: coords
				});

				map.behaviors.disable('scrollZoom');
				map.controls
					.remove('searchControl')
					.remove('geolocationControl');


				if (units.length > 0) {
					$.each(units, function(index, unit) {
						var marker = new ymaps.Placemark([unit.lat, unit.lng], {
							balloonContentBody: '<div class="gmap-popupContent"><h2>' + unit.name + '</h2><p>' + unit.address + '<br/>' + unit.phone + '<br/><a href=' + location.pathname + '?u=' + unit.id + '>' + ONLY_THIS_HOSPITAL_DOCTORS + '</a></p></div>',
							hintContent: unit.name
						});

						map.geoObjects.add(marker);
						map.setCenter(marker.geometry.getCoordinates());
					});
					if (units.length == 1 || map.getZoom() > 16) map.setZoom(16);
				}
			});

		
		} else {
			$('.mapContainer').find('ymaps').remove();
		}
	});
});

// Сортировка списка
function sortList(el, col, order){
	if ($(el).children().length >0 ) {
		tinysort(el, {selector: 'span'+col, order: order});
		return true;
	}
	return false
}

// Сортировка списка
function sortListWithRegion(el, col, order){
	if ($(el).children().length >0 ) {
		tinysort(el+' > div.def', {selector: 'dt>span.myDoctor', order: 'desc'}, {selector: 'dt>span'+col, order: order});
		return true;
	}
	return false
}