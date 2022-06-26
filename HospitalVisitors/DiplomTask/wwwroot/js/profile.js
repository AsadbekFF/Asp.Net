$(document).ready(function() {
    var jqPhone = $('#mobile_phone');
    jqPhone.inputmask('+7 (999) 999-99-99', {
        'oncomplete': function(){
            var value = jqPhone.val();
            var phone = value.replace(/[^0-9]/g, '').slice(-10);

            var samePhone = (phone === $('#mobile_phone_old').val());// проверка, не старый ли телефон введен
            if(samePhone){
                jqPhone.removeClass('error');
                var activStatus = $('#activation_status_old').val();
                if(activStatus == 'active'){
                    $("#phone_status").empty();
                }else if(activStatus == 'pending'){
                    $('#phone_status').html('<label>&nbsp;</label><span class="error">' + PROFILE_PHONE_WAIT_CONFIRMATION + ' <a href="#" id="phone_activation_link2">' + PROFILE_PHONE_ENTER_CODE + '</a></span>');
                }else{
                    $('#phone_status').html('<label>&nbsp;</label><span class="error">' + PROFILE_PHONE_UNCONFIRMED + ' <a href="#" id="phone_activation_link">' + PROFILE_PHONE_CONFIRM + '</a></span>');
                }
                return true;
            }

            $.ajax({
                url: '/user/checkMobilePhone/' + value,
                dataType: 'json',
                success: function(data){
                    if(data.ok){
                        jqPhone.removeClass('error');
                        $('#phone_status').empty().siblings('br').nextAll('.error').empty();
                        if($('#mobile_phone_old').val().length){// если есть старый телефон
                            $('#phone_status').html('<label style="height: 35px;">&nbsp;</label>' + PROFILE_PHONE_CONFIRMATION_OLD_PHONE);
                        }
                    }else{
                        jqPhone.addClass('error');
                        $("#phone_status").html('<label>&nbsp;</label>' + data.error);
                        $('#unconfirmed_phone').hide();
                    }
                }
            });
        },
        'onincomplete': function(){
            var value = jqPhone.val();
            $('#phone_status').text('');
            if(value.length){
                jqPhone.addClass('error');
                $('#phone_status').empty().siblings('br').nextAll('.error').empty();
            }
        },
        'oncleared': function(){
            jqPhone.removeClass('error');
            $('#phone_status').empty().siblings('br').nextAll('.error').empty();
        }
    });

    $('#phone_activation_code').inputmask('9999');

    $.ajaxSetup({
        cache: false
    });

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
            field.siblings("span.error[rel~='password-input']").html('');
        } else if (!ok) {
            field.siblings("span.error[rel~='password-input']").html('<label>&nbsp;</label>' + error);
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
            field.siblings("span.error[rel~='password-confirm-input']").html('');
        } else {
            field.siblings("span.error[rel~='password-confirm-input']").html('<label>&nbsp;</label>' + error);
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
        if (
                $('#username-input').val().length > 0 &&
                $('#email-input').val().length > 0 &&
                $('#password-input').val().length > 0 &&
                $('#password-confirm-input').val().length > 0 &&
                $('#surname-input').val().length > 0 &&
                $('#first-name-input').val().length > 0 &&
                $('#captcha-input').val().length > 0 &&
                $('#day-select').val() !== 'default' &&
                $('#month-select').val() !== 'default' &&
                $('#year-select').val() !== 'default' &&
                $('#submitRulesLabel').hasClass('active') &&
                !ErrorsExists()
                ) {
            $('#register-submit').removeAttr('disabled');
        } else {
            $('#register-submit').attr('disabled', 'disabled');
        }
    }

    $('#password-input').blur(function() {
        checkPasswordInput();
    });

    $('#password-confirm-input').blur(function() {
        checkPasswordConfirmInput();
    });
    
    $("select").select2({
        width: "element",
        placeholder: COMBOBOX_LOADING,
        formatNoMatches: function (term) {
            return COMBOBOX_NOT_FOUND
        }
    });
    
    $( "#change_pass_link" ).click(function() {
		$( 'div#change_pass_block' ).toggle();
		return false;
	});
    
    /*$('#mobile_phone').change(function(e) {
        var field = $('#mobile_phone');
        var value = field.val();

        if (value === '') {
            field.removeClass('error');
            $("#phone_status").html('');
            $('#phone_activation_link').parents('span.error').siblings('br').nextAll().remove();// удаляем сообщение "Номер не подтвержден Подтвердить"
        } else {
            $.ajax({
                url: '/user/checkMobilePhone/' + value,
                dataType: 'json',
                success: function(data) {
                    if (data.ok) {
                        field.removeClass('error');
                        var re = /\+7 \(([0-9]{3})\) ([0-9]{3})\-([0-9]{2})\-([0-9]{2})/g;
                        if ( re.test(field.val()) ) {
                            var MobilePhone = value.replace(re, "9" + "$1$2$3$4");
                            if ( $('#mobile_phone_old').val() != '' && $('#mobile_phone_old').val() != MobilePhone ) {
                                $('#phone_status').html('<label>&nbsp;</label><span class="error">' + PROFILE_PHONE_UNCONFIRMED + ' ' + PROFILE_PHONE_CONFIRMATION_OLD_PHONE +'. <a href="#" id="phone_activation_link">' + PROFILE_PHONE_CONFIRM + '</a></span>');
                            } else {
                                var act_status = $('#activation_status_old').val();
                                if (act_status == 'active') {
                                    $('#phone_status').html('');
                                } else if (act_status == 'pending') {
                                    $('#phone_status').html('<label>&nbsp;</label><span class="error">' + PROFILE_PHONE_WAIT_CONFIRMATION + ' <a href="#" id="phone_activation_link2">' + PROFILE_PHONE_ENTER_CODE + '</a></span>');
                                } else {
                                    $('#phone_status').html('<label>&nbsp;</label><span class="error">' + PROFILE_PHONE_UNCONFIRMED + ' <a href="#" id="phone_activation_link">' + PROFILE_PHONE_CONFIRM + '</a></span>');
                                }
                            }
                        } else {
                            field.addClass('error');
                            $("#phone_status").html('<label>&nbsp;</label><span class="error">' + REGISTER_PHONE_REGEXP + '</span>');
                        }
                    } else if (!data.ok) {
                        field.addClass('error');
                        $("#phone_status").html('<label>&nbsp;</label><span class="error">' + data.error + '</span>');
                    }
                }
            });
        }
    });*/

    $(document).on('click', '#phone_activation_link', function(e) {
        e.preventDefault();

        if ( $('#mobile_phone_old').val() != '' && $('#activation_status_old').val() == 'active' ) {
            if (!confirm(PROFILE_PHONE_CONFIRMATION_OLD_PHONE + ' ' + PROFILE_PHONE_CONFIRMATION_CONTINUE)) {
                return;
            }
        }
        var phone = $('#mobile_phone').val();
        $('#act_phone').html(phone);
		$('#phone_activation_code').val('');
        $(".popup.phoneActivation").dialog({
            dialogClass: "Dialog regnumber2-win",/*Dialog добавляем всем попапам. Второй класс для специфики.*/
            minWidth: $(window).width() <= 640 ? 299 : 445,
            modal: true
        });
        if ($(window).width() <= 640) {
            let height =  $(".popup.phoneActivation").height();
            let width = $(".popup.phoneActivation").width();
            $("span.close").width(width);
            $(".popup.phoneActivation").height(height+40);
        }


        $.ajax({
            url: '/user/saveMobilePhone/' + phone,
            dataType:'json',
            success: function(data) {
                if(data.saved) {
                    $.ajax({
                        url: '/user/sendMobilePhoneActivationCode',
                        dataType:'json',
                        success: function(data) {
                            if(data.sent) {
								$('#activation_status_old').val('pending');
                                $('#phone_status').html('<label>&nbsp;</label><span class="error"><span>' + PROFILE_PHONE_WAIT_CONFIRMATION + '</span> <a href="#" id="phone_activation_link2">' + PROFILE_PHONE_ENTER_CODE + '</a></span>');
                                $('#phone_activation_link').parents('.error').empty();
                            } else {
                                $('#activation_errors').html(data.error);
                            }
                        },
                        error: function() {
                            $('#activation_errors').html(SERVER_ERROR);
                        }
                    });
                } else {
                    $('#phone_status').html('<label>&nbsp;</label><span class="error"><span>' + data.error + '</span>');
                }
            },
            error: function() {
                $('#phone_status').html('<label>&nbsp;</label><span class="error"><span>' + SERVER_ERROR + '</span>');
            }
        });
        return false;
    });
    
    $(document).on('click', '#phone_activation_link2', function(e) {
        e.preventDefault();

        var phone = $('#mobile_phone').val();

        $('phone_status').html('<label>&nbsp;</label><span class="error"><span>' + PROFILE_PHONE_WAIT_CONFIRMATION + '</span> <a href="#" id="phone_activation_link2">' + PROFILE_PHONE_ENTER_CODE + '</a></span>');
        
        $('#act_phone').html(phone);
		$('#phone_activation_code').val('');
        $(".popup.phoneActivation").dialog({
            dialogClass: "Dialog regnumber2-win",/*Dialog добавляем всем попапам. Второй класс для специфики.*/
            minWidth: $(window).width() <= 640 ? 299 : 445,
            modal: true
        });
        if ($(window).width() <= 640) {
            let height =  $(".popup.phoneActivation").height();
            let width = $(".popup.phoneActivation").width();
            $("span.close").width(width);
            $(".popup.phoneActivation").height(height+40);
        }
        return false;
    });

    if ($(window).width() <= 640) {
        $('#phone_activation_repeat').one( "click", function(e) {
            let height = $(".popup.phoneActivation").height();
            $(".popup.phoneActivation").height(height + 25);
        })
    }
    
    $('#phone_activation_repeat').click(function(e) {
        e.preventDefault();

        var phone = $('#mobile_phone').val();

        $.ajax({
            url: '/user/sendMobilePhoneActivationCode',
            dataType:'json',
            success: function(data) {
                if(data.sent) {
                    $('#activation_errors').html(PROFILE_PHONE_CODE_RESENT);
                } else {
                    $('#activation_errors').html(data.error);
                }
            },
            error: function() {
                $('#activation_errors').html(SERVER_ERROR);
            }
        });
        return false;
    });
    
    $('#phone_activation_code').keyup( function(){
        if ( $('#phone_activation_code').val().indexOf('_') == -1 ) {
            $("#phone_confirm_code").removeClass('disabled');
        } else {
            $("#phone_confirm_code").addClass('disabled');
        }
    });
        
    $('#phone_confirm_code').click(function() {

        var code = $('#phone_activation_code').val();

        $.ajax({
            url: '/user/checkMobilePhoneActivationCode/' + code,
            dataType:'json',
            success: function(data) {
                if(data.activated) {
					$('#activation_status_old').val('active');
					$('#phone_activation_link').parents('span.error').siblings('br').nextAll().remove();// удаляем сообщение "Номер не подтвержден Подтвердить"
                    $('#phone_status').html('<label>&nbsp;</label>' + PROFILE_PHONE_CONFIRMED);
                    $(".popup.phoneActivation").dialog('close');
                } else {
                    $('#activation_errors').html(data.error);
                }
            },
            error: function() {
                $('#activation_errors').html(SERVER_ERROR);
            }

        });
        
        return false;
    });

    function removeDevice(el){

        var TokenInfo_id = el.attr("rel");

        if (el && TokenInfo_id) {
            $.ajax({
                url: '/user/removeDevice/',
                type: 'post',
                dataType:'json',
                data: {
                    TokenInfo_id: TokenInfo_id
                },
                success: function(data) {
                    if (data.msg) {
                        $.alert(data.msg, 'Сообщение');
                        if (data.success) {
                            el.parents('li').first().remove();
                        }
                    }
                },
                error: function() {
                    $.alert("При отвязывании устройства произошла ошибка. Обратитесь в службу поддержки", 'Ошибка');
                }
            });
        }

        return false;
    }

    $('.remove-device-profile').on('click', function () {

        var el = $(this);

         $('.popup.warningCancelInvite').dialog({
            resizable: false,
            height: "auto",
            width: 460,
            modal: true,
            dialogClass: "Dialog",
            create: function(event, ui) {

                var dialog = this;

                $("#remove-device").click(function(event) {
                    removeDevice(el);
                    $(dialog).dialog("close");
                });

                $(".warningCancelInvite .buttonAlert .button.cancel").first().click(function(event) {
                    $(dialog).dialog("close");
                });
            }
        });
    });
});
