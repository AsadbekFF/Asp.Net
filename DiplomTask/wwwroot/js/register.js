$(document).ready(function() {
	$.ajaxSetup({
		cache: false
	});

    var jqPhone = $('#mobile_phone');
	jqPhone.inputmask('+7 (999) 999-99-99', {
		'oncomplete': function(){
			var value = jqPhone.val();
			$.ajax({
				url: '/user/checkMobilePhone/' + value,
				dataType: 'json',
				success: function(data){
					if(data.ok){
						jqPhone.removeClass('error');
						$('#phone_status').text('');
					}else{
						jqPhone.addClass('error');
						$("#phone_status").html('<label>&nbsp;</label>' + data.error);
					}
				}
			});
		},
		'onincomplete': function(){
			var value = jqPhone.val();
			$('#phone_status').text('');
			if(value.length){
				jqPhone.addClass('error');
			}
		},
		'oncleared': function(){
			jqPhone.removeClass('error');
		}
	});

	var jqPolisTypeSel = $('#polis_type');// селектор типа полиса
	var jqPolisNumInput = $('#polis-num-input');// поле номера полиса
	var jqPolisSerInput = $('#polis-ser-input');// поле серии полиса

	var jqPolisNumInputErr = jqPolisNumInput.siblings('span.error[rel~="polis-num-input"]');// сообщение с ошибкой для номера полиса
	var jqPolisSerInputErr = jqPolisSerInput.siblings('span.error[rel~="polis-ser-input"]');// сообщение с ошибкой для серии

	function changeMask(polisType){
		jqPolisNumInput.inputmask('remove');
		jqPolisNumInput.removeClass('error');

		jqPolisSerInput.inputmask('remove');
		jqPolisSerInput.removeClass('error');

		jqPolisNumInput.attr('data-polis-type', polisType);
		$('.polistype').hide();
		$('[id ^= polistype_hint_]').hide();
		$('#polistype_hint_' + polisType).show();

		switch(polisType){
			case 1:// новый
				jqPolisNumInput.inputmask('9999999999999999', {
					'oncomplete': function(){
						var noValidNumberMsg = '<label>&nbsp;</label>' + 'Невалидный номер полиса' + '<br>';
						if(checkEdNumFedSignature(jqPolisNumInput.val().replace('/_*/g', ''))){// проверка на валидность по CRC
							jqPolisNumInput.removeClass('error');
							noValidNumberMsg = '';
						}
						jqPolisNumInputErr.html(noValidNumberMsg);
					},
					'onincomplete': function(){
						var noValidNumberMsg = '<label>&nbsp;</label>' + REGISTER_INSURANCE_NUMBER_IS_EMPTY + '<br>';
						jqPolisNumInput.addClass('error');
						if(0 == jqPolisNumInput.val().replace('/_*/g', '').length){
							noValidNumberMsg = '<label>&nbsp;</label>' + REGISTER_FIELD_IS_EMPTY + '<br>';
						}
						jqPolisNumInputErr.html(noValidNumberMsg);
					}
				});
				jqPolisSerInput.hide();
				jqPolisSerInput.attr('disabled','disabled');
				break;
			case 2:// старый
				var inputmask = '99999{1,6}';
				if (REGION == "penza_new") {
					inputmask = '99999{1,12}'; //на Пензе есть старые полиса где номер 16 симоволов
				}
				jqPolisNumInput.inputmask(inputmask, {
					'oncomplete': function(){
						jqPolisNumInput.removeClass('error');
						jqPolisNumInputErr.text('');
					},
					'onincomplete': function(){
						var noValidNumberMsg = '<label>&nbsp;</label>' + REGISTER_INSURANCE_NUMBER_IS_EMPTY + '<br>';
						jqPolisNumInput.addClass('error');
						if(0 == jqPolisNumInput.val().replace('/_*/g', '').length){
							noValidNumberMsg = '<label>&nbsp;</label>' + REGISTER_FIELD_IS_EMPTY + '<br>';
						}
						jqPolisNumInputErr.html(noValidNumberMsg);
					}
				});// 4 номера обязательны, остальные 6 нет
				jqPolisSerInput.inputmask({regex: '[а-яёА-ЯЁa-zA-Z0-9-][а-яёА-ЯЁa-zA-Z0-9- ]{1,5}'});
				jqPolisSerInput.show();
				jqPolisSerInput.removeAttr('disabled');
				break;
			case 3:// временный
				if(REGION.indexOf('karelia') !== -1){// в Карелии другой формат временного полиса - 9 чисел
					jqPolisNumInput.inputmask('999999999', {
						'oncomplete': function(){
							jqPolisNumInput.removeClass('error');
							jqPolisNumInputErr.text('');
						},
						'onincomplete': function(){
							var noValidNumberMsg = '<label>&nbsp;</label>' + REGISTER_INSURANCE_NUMBER_IS_EMPTY + '<br>';
							jqPolisNumInput.addClass('error');
							if(0 === jqPolisNumInput.val().replace('/_*/g', '').length){
								noValidNumberMsg = '<label>&nbsp;</label>' + REGISTER_FIELD_IS_EMPTY + '<br>';
							}
							jqPolisNumInputErr.html(noValidNumberMsg);
						}
					});
					jqPolisSerInput.hide();
					jqPolisSerInput.attr('disabled','disabled');
				}else{
					jqPolisNumInput.inputmask('999999', {
						'oncomplete': function(){
							jqPolisNumInput.removeClass('error');
							jqPolisNumInputErr.text('');
						},
						'onincomplete': function(){
							var noValidNumberMsg = '<label>&nbsp;</label>' + REGISTER_INSURANCE_NUMBER_IS_EMPTY + '<br>';
							jqPolisNumInput.addClass('error');
							if(0 == jqPolisNumInput.val().replace('/_*/g', '').length){
								noValidNumberMsg = '<label>&nbsp;</label>' + REGISTER_FIELD_IS_EMPTY + '<br>';
							}
							jqPolisNumInputErr.html(noValidNumberMsg);
						}
					});
					jqPolisSerInput.inputmask('999');
					jqPolisSerInput.show();
					jqPolisSerInput.removeAttr('disabled');
				}
				break;
			default:
				return;
		}
	}

	var polisType = jqPolisNumInput.attr('data-polis-type');
	if((typeof polisType) === 'undefined'){
		polisType = 1;// по умолчанию новый полис
		var jqPolisTypeOption = jqPolisTypeSel.children('option[selected]');
		if(jqPolisTypeOption.length){
			polisType = parseInt(jqPolisTypeOption.val());
		}
	}
	if((typeof polisType) === 'string' && polisType !== ''){
		polisType = parseInt(polisType);
	}
	changeMask(polisType);

	jqPolisTypeSel.on('change', function(){
		jqPolisNumInput.val('');
		jqPolisSerInput.val('');
		jqPolisNumInputErr.text('');
		jqPolisSerInputErr.text('');
		changeMask(parseInt($(this).val()));
	});

    function checkEmailInput() {
        var field = $('#email-input');
        var email = field.val();
        $.ajax({
            url: '/user/checkEmail/',
            dataType: 'json',
            data: {
                email: email
            },
            success: function(data) {
                if (data.ok) {
                    field.removeClass('error');
                    field.siblings("span.error[rel~='email-input']").html('');
                } else if (!data.ok) {
                    field.addClass('error');
                    field.siblings("span.error[rel~='email-input']").html('<label>&nbsp;</label>' + data.error);
                }
            }
        });
    }

    function checkPasswordInput() {
        var field = $('#password-input');
        var password = field.val();

        var ok = true;
        var error = '';

        if (password.length > 0) {
            if (password.length < 6) {
                error = REGISTER_PASSWORD_MIN;
                ok = false;
            }
            if (password.length > 30) {
                error = REGISTER_PASSWORD_MAX;
                ok = false;
            }
        } else {
            error = REGISTER_NO_PASSWORD;
            ok = false;
        }

        if (ok) {
            field.removeClass('error');
            field.siblings("span.error[rel~='password-input']").html('');
            field.siblings("span.error[rel~='password-input']").next().show();
            return true;
        } else if (!ok) {
            field.addClass('error');
            field.siblings("span.error[rel~='password-input']").html('<label>&nbsp;</label>' + error);
            field.siblings("span.error[rel~='password-input']").next().hide();
            return false;
        }

    }

    function checkPasswordConfirmInput() {

        var field = $('#password-confirm-input');
        var password_confirm = field.val();

        var password = $('#password-input').val();

        var ok = true;
        var error = '';

        if (password_confirm.length > 0) {
            if (password !== password_confirm) {
                error = REGISTER_NOT_EQUAL_PASSWORDS;
                ok = false;
            }
        } else {
            error = REGISTER_NO_PASSWORD_CONFIRMATION;
            ok = false;
        }

        if (ok) {
            field.removeClass('error');
            field.siblings("span.error[rel~='password-confirm-input']").html('');
            return true;
        } else {
            field.addClass('error');
            field.siblings("span.error[rel~='password-confirm-input']").html('<label>&nbsp;</label>' + error);
            return false;
        }
    }

    function checkNameInput(field) {
        var value = field.val();

        var ok = true;
        var error = '';

        if (value.length === 0 && field.prop('id') != 'second-name-input') {
            error = REGISTER_MANDATORY_FIELD;
            ok = false;
        }

        if (value.length > 0) {
			var reg = /^[а-яёəәұіңғүқөһ -]+$/i;// русские и казахские
			if((typeof LANG) !== 'undefined' && LANG === 'ky'){
				reg = /^[а-яёңөү -]+$/i;// русские и киргизские
			}
            if (!value.match(reg)) {
                error = REGISTER_FIO_ALLOWED_SYMBOLS;
                ok = false;
            }
        }

        if (ok) {
            field.removeClass('error');
            field.siblings("span.error[rel~='" + field.attr('id') + "']").html('');
        } else {
            field.addClass('error');
            field.siblings("span.error[rel~='" + field.attr('id') + "']").html('<label>&nbsp;</label>' + error);
        }
    }

    function checkBirthdayInput() {
        var day = Number.parseInt($('#day-select').val());
        var month = Number.parseInt($('#month-select').val());
        var year = Number.parseInt($('#year-select').val());

        var ok = true;
        var error = '';

        if (day === null || month === null || year === null) {
            error = REGISTER_BIRTHDATE;
            ok = false;
        } else {

            var birth_date = new Date(year, month-1, day+1, 0, 0, 0, 0);
            var current_date = new Date();

            if (birth_date > current_date) {
                error = REGISTER_BIRTHDATE_TOO_LATE;
                ok = false;
            }

        }

        var error_indicator = $('#birthday-error');

        if (ok) {
            error_indicator.html('');
        } else if (!ok) {
            error_indicator.html('<label>&nbsp;</label>' + error);
        }

    }

    function checkRulesInput() {
        var field = $('#submitRules');

        if ($('#submitRulesLabel').hasClass('active')) {
            field.siblings('.hiddenErrorDescr').text('');
        } else {
            field.siblings('.hiddenErrorDescr').text(REGISTER_ACCEPT_RULES);
        }

    }

    function ErrorsExists() {
        var result = false;

        $('.hiddenErrorDescr').each(function() {
            if (this.textContent && this.textContent.length > 0) {
                result = true;
            }
        });

        return result;
    }

    function validateAll() {
        const territory = $('#territory-id');
        const town = $('#town-id');
        const listElememts = [territory, town]
        if (multiregional_mode) {
            return true;
        }

        return listElememts.every(el=>{
            if (+el.children("option:selected").val() > 0) {
                highlightErrorFields(true, el, REGISTER_FIELD_IS_EMPTY)
                return true;
            } else {
                highlightErrorFields(false, el, REGISTER_FIELD_IS_EMPTY)
                return false;
            }
        })
    }

    $('#add-box').submit( (e)=>{
        const isEmailError = $('#email-input').siblings("span.error[rel~='email-input']").html()
        if(!validateAll() || !checkPasswordConfirmInput() || !checkPasswordInput() || !checkAgree() || isEmailError){
            e.preventDefault()
        }
    })


    $('#email-input').blur(function() {
        checkEmailInput();
    });

    $('#password-input').blur(function() {
        checkPasswordInput();
    });

    $('#password-confirm-input').blur(function() {
        checkPasswordConfirmInput();
    });

	$('#surname-input, #first-name-input, #second-name-input').on('keyup change blur',function(){
		var value = $(this).val();
		$(this).val(value.replace(/^\s/, '').replace(/^-/, '').replace(/\s{2,}/g, ' ').replace(/-{2,}/g, '-'));
		checkNameInput($(this));
	});

    $('#captcha-input').focus(function() {
        var element = $(this);
        element.removeClass('error_indicator');
        element.siblings("span.error").html('');
    });

    $('#year-select').blur(function() {
        checkBirthdayInput();
    });

    $('#submitRules').change(function() {
        checkRulesInput();
    });

    // Workaround для IE7-8 и только для него, у остальных браузеров глючит
    if ($.browser && $.browser.msie  && parseInt($.browser.version, 10) <= 8) {
        $('#submitRulesLabel').click(function() {
            var checkbox = $('#' + $(this).attr('for'));
            if (checkbox.is(':checked')) {
                checkbox.removeAttr('checked');
            } else {
                checkbox.attr('checked', 'checked');
            }
        });
    }

    $(document).on("focus", ".select2-selection",  function (e) {
        var select = $(this).parent().parent().prev();
        if (!select.data('select2').isOpen() && !select.prop('disabled')) {
            select.select2("open");
        }
    });

    const highlightErrorFields =  function (ok, el, error) {
        if (ok) {
            $(el).removeClass('error');
            $(el).siblings("span.error[rel~='" + $(el).prop('id') + "']").html('');
        } else {
            $(el).addClass('error');
            $(el).siblings("span.error[rel~='" + $(el).prop('id') + "']").html('<label>&nbsp;</label>' + error);
        }
    }



    $(document).on("select2:close", "select#territory-id, select#town-id", function (e) {
        var value = $(this).val();
        var ok = true;
        var error = '';

        if ( !multiregional_mode && (value == "0" || value == null) ) {
            error = REGISTER_FIELD_IS_EMPTY;
            ok = false;
        }

        highlightErrorFields(ok, this, error)
    } );

    $( "a.polis_info" ).click(function() {
		$(".popup.typepoliswin").dialog({
			dialogClass: "Dialog typepolis",/*Dialog добавляем всем попапам. Второй класс для специфики.*/
			minWidth: $(window).width() <=640? 299 :570,
			height: document.body.clientHeight - 100,
            modal: true,
            open: function(event, ui) {
			    if ($(window).width() >=640) { //на телефоне ломался скролл страницы после закрытия
                    $("body").css({ overflow: 'hidden' })
                }
            },
            beforeClose: function(event, ui) {
                if ($(window).width() >=640) {
                    $("body").css({overflow: 'inherit'})
                }
            }
		});
        let widthImgBlock = $(".polis_image").width();
        $(".close").width(widthImgBlock);

        $(".image-typepoliswin").width(widthImgBlock);
        return false;
	});

	$('#agree').on('change', checkAgree);

    function checkAgree(){
        const el = $('#agree')
        var jqError =  el.siblings('.error');
        if(el.is(':checked')){
            jqError.empty();
            return true;
        }else{
            jqError.html('<label>&nbsp;</label>' + REGISTER_ACCEPT_RULES);
            return false;
        }
    }
});
