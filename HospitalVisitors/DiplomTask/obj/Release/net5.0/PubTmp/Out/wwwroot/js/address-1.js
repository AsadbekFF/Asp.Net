/**
 * Функционал по работе с комбобоксами адресов
 */
$(document).ready(function() {
    const disableSelect = function(elements) {
        $.each(elements, function() {
            $(this).prop( "disabled", true );
        });
    };

    let is_federal_city = 0;
    const Region = $('#region-id');
    const Territory = $('#territory-id');
    const Town = $('#town-id');
    const setStreet = (data) => {
        if (data.streets.length > 0 ) {
            setSelectOptions($('#street-id'), data.streets);
            enableSelect($('#street-id'));
        }
    }
    const getStreetByRegion = () => {
        let region_id = Region.val();
        $.ajax({
            url: '/address/getRegionTerritories/' + region_id,
            dataType:'json',
        })
        .done(data => {
           setStreet(data)
        })
    }
    const getStreetByTerritory = () => {
        let territory_id = +Territory.val();

        if (!!territory_id === false) {
            return;
        }

        $.ajax({
            url: '/address/getTerritoryLocations/' + territory_id,
            dataType:'json',
        })
        .done(data => {
            setStreet(data)
        })
    }

    is_federal_city = +$('#region-id option:selected').attr('data-is-federal-city')

    if (!is_federal_city && (!!(+Town.val()) === false || !!(+Territory.val()) === false)) {
        disableSelect($('#street-id'));
    }

    Region.change(function() {
        let region_id = Region.val();
        is_federal_city = +$('#region-id option:selected').attr('data-is-federal-city');

        if (region_id == 0) {
            resetSelect($('#territory-id, #town-id, #street-id'));
            disableSelect($('#territory-id, #town-id, #street-id'));
        } else {
            resetSelect($('#territory-id, #town-id, #street-id'));
            disableSelect($('#territory-id, #town-id, #street-id'));

            $.ajax({
                url: '/address/getRegionTerritories/' + region_id,
                dataType:'json',
                success: function(data) {

                    if(data.territories.length > 0 ) {
                        setSelectOptions($('#territory-id'), data.territories);
                        enableSelect($('#territory-id'));
                    }

                    if(data.streets.length > 0 ) {
                        setSelectOptions($('#street-id'), data.streets);
                        enableSelect($('#street-id'));
                    }
                }
            });
        }
    });

    Territory.change(function() {
        var territory_id = Territory.val();

        if (territory_id == 0 || territory_id === null) {
            resetSelect($('#town-id, #street-id'));
            disableSelect($('#town-id, #street-id'));

            if (is_federal_city) {
                getStreetByRegion();
            }
        } else {
            resetSelect($('#town-id, #street-id'));
            disableSelect($('#town-id, #street-id'));

            $.ajax({
                url: '/address/getTerritoryLocations/' + territory_id,
                dataType:'json',
                success: function(data) {
                    setSelectOptions($('#town-id'), data.towns);

                    if(data.is_city) {
                        setSelectValue($('#town-id'), data.city_id);
                    }
                    
                    if(data.is_town) {
                        setSelectValue($('#town-id'), data.town_id);
                    }
                    
                    if( data.towns.length > 0 ) {
                        enableSelect($('#town-id'));
                    }
                    
                    /*if(data.streets.length > 0) {
                        enableSelect($('#street-id'));
                    }*/
                }
            });
        }
    });
    
    $('#town-id').change(function() {
        var town_id = $(this).val();

        disableSelect($('#street-id'));

        if ( town_id == null || town_id == 0 ) {
            resetSelect($('#street-id'));
            disableSelect($('#street-id'));

            if (is_federal_city) {
                getStreetByTerritory();
            }
        } else {
            $.ajax({
                url: '/address/getTownLocations/' + town_id,
                dataType:'json',
                success: function(data) {
                    resetSelect($('#street-id'));
                    if(data.streets.length > 0) {
                        enableSelect($('#street-id'));
                        setSelectOptions($('#street-id'), data.streets);
                    }
                }
            });
        }
    });

    var enableSelect = function(elements) {
        $.each(elements, function() {
            $(this).prop( "disabled", false );
        });
    };

    var resetSelect = function(elements) {
        $.each(elements, function() {
            if (this.type == 'select-one') {
                $(this)
                    .empty()
                    .append('<option value="0">' + COMBOBOX_NOT_SELECTED + '</option>')
                    .val(0);
                $(this).val("0").trigger("change");
                disableSelect(this);
            } else {
                $(this).val("0").trigger("change");
            }
        });
    };

    var setSelectOptions = function( select, values ) {
        for( n = 0; n < values.length; n++ ){
            var pair = values[n];
            select
                .append($("<option></option>")
                .attr("value",pair['id'])
                .text(pair['name']));
        }
    }


    var setSelectValue = function(element, value) {
        $(element).val(value).trigger("change");
    };
	
	$(function(){
		$("form").submit(function(){
			$("select").removeAttr('disabled');

            var day = $("select[name='day']");
            var month = $("select[name='month']");
            var year = $("select[name='year']");

            day.attr('disabled', 'disabled');
            month.attr('disabled','disabled');
            year.attr('disabled','disabled');
		});
	});
  
    $("#region-id,#territory-id,#town-id,#street-id").select2({
        width: "element",
        placeholder: COMBOBOX_LOADING,
        language: {
            inputTooLong:function(t){var n=t.input.length-t.maximum,r="Пожалуйста, введите на "+n+" символ";return r+=e(n,"","a","ов"),r+=" меньше",r},loadingMore:function(){return"Загрузка данных…"},
            maximumSelected:function(t){var n="Вы можете выбрать не более "+t.maximum+" элемент";return n+=e(t.maximum,"","a","ов"),n},
            inputTooShort: function () {
                return COMBOBOX_TOO_SHOT;
            },
            noResults: function () {
                return COMBOBOX_NOT_FOUND;
            },
            searching: function () {
                return COMBOBOX_LOADING;
            }
        },
        minimumResultsForSearch: 10
	});
	// Зануляем данные при первом открытии или возврате назад
	if ($('#town-id').val() == 0 && $('#region-id').val() == 0) {
		$('#territory-id').val(0);
		$('#territory-id').change();
	}
});



