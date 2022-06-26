function renderCommandLinks(params){

    var wrapper = $('.command-links-content');
    var html = '';

    if (params.links.length > 0) {

        params.links.forEach(function(link){
            if (link.type === 'link') {

                var err_msg = null;

                if (link.msg_binding
                    && params.messages
                    && params.messages[link.msg_binding]
                ) {
                    err_msg = "Запись в очередь к врачу не доступна: ";
                    // выводим сообщения если есть
                    params.messages[link.msg_binding].forEach(function(msg){
                        err_msg += '&#10 - ' + msg;
                    })
                }

                html += '' +
                    '<li title="'+ (err_msg ? err_msg : '') + '" class="command-links-link ' + link.cls + (err_msg ? ' disabled' : '') + '" data-href="' + link.href + '" tabindex="0">' +
                    '<span class="command-links-arrow"></span>' +
                    '<h3>' + link.title +'</h3>';

                if (link.desc) {
                    desc_list = link.desc.split('|');
                    if (desc_list.length > 0) {
                        desc_list.forEach(function(dsc){
                            html += '<p>' + dsc +'</p>';
                        })
                    }
                }

                html += '</li>';
            } else if (link.type === 'footer') {
                html += '' +
                    '<li class="command-links-footer">' +
                    '<p>' + link.desc + '</p>' +
                    '</li>';
            }
        });

        wrapper.html(html);

        if (params.callback && typeof params.callback === 'function') {
            params.callback();
        }
    }
}

function showEvnQueuePopup() {
    $(".popup.evn-queue").dialog({
        dialogClass: "Dialog",
        minWidth: $(window).width() <= 640 ? 299 : 600,
        modal: true
    });
    if ($(window).width()<=640) {
        $("a.button.queue-confirm-button").css({"width":"100%", "margin":"0px 0 5px 0" , "padding": "10px 0px 10px 0"});
        $("a.button.grey.popup-close-button").css({"width":"100%", "margin":"0"});
    }

}

$(document).ready(function() {

    $(".apply-to-evn-queue").click(function() {

        if ($(this).hasClass('disabled')) { return false; }

        $.ajax({
            url: '/service/record/getEvnQueueData',
            dataType:'json',
            success: function(data) {

                console.log(data);

                // если не авторизован на портале
                // показываем окно авторизации
                if (data.error_code && data.error_code === 401) {
                    openEnterBoxModal();
                    return false;
                }

                if (data.error_msg) {
                    var alert = data.error_msg;

                    if (
                        data.error_code && data.error_code === 771
                        && data.messages && data.messages.errors
                    ) {
                        var errList = [];

                        if (data.messages.errors.msf_allowed) {
                            errList = data.messages.errors.msf_allowed;
                        } else if (data.messages.errors.lsp_allowed) {
                            errList = data.messages.errors.lsp_allowed;
                        }

                        if (errList.length > 0) {
                            alert += ": " + '<br>';
                            errList.forEach(function(err_msg){
                                alert += "<br> - " + err_msg;
                            })
                        }
                    }

                    $.alert(alert);
                    return false;
                }

                // формируем окно командных ссылок
                if (data.cmd_links) {

                    var cmdLinks = $(".command-links");
                    renderCommandLinks(
                        {
                            links: data.cmd_links,
                            messages: (data.messages && data.messages.errors) ? data.messages.errors : null,
                            callback: function() {

                                cmdLinks.dialog({
                                    dialogClass: "Dialog",
                                    minWidth: $(window).width() <= 640 ? 299 : 700,
                                    modal: true,
                                    position: $(window).width() <= 640 ? {
                                        my: "top+10",
                                        at: "top",
                                        of: $(document.body)
                                    } : {my: 'center', at: 'center'},
                                });

                                if ($(window).width()<=640) {
                                    let height = $ (".popup.command-links").height();
                                    let width = $ (".popup.command-links").width();
                                    $ (".popup.command-links").height(height+30);
                                    $ ("span.close").width(width);
                                }

                                cmdLinks.first().focus();
                            }
                        });
                }

                if (data.person) {

                    // клонируем объект
                    var popup_content = $('.popup.evn-queue').clone().html();

                    // подставляем параметры
                    Object.keys(data.person).forEach(function(replacedParam){

                        if (data.person[replacedParam] === null || data.person[replacedParam] === 'null') data.person[replacedParam] = '';
                        popup_content = popup_content.replace('{' + replacedParam + '}', data.person[replacedParam]);
                    });

                    // заменяем верстку
                    $('.popup.evn-queue').html(popup_content);
                    $('.popup.evn-queue .queue-confirm-button').first().addClass('disabled');
                }
            },
            error: function(err){
                if (err) console.warn('evn-queue error:', err);
                $.alert('Ошибка получения информации для записи в очередь')
            }
        });


    });

    $(document).on('click', ".command-links-link.direct-link",function() {
        $(".command-links").dialog( "close" );
        window.location.href = $(this).data('href');
    });

    $(document).on('click', ".apply-evn-queue-doctor",function() {

        $(".command-links").dialog( "close" );

        if ($(".popup.evn-queue").length) {

            // признак записи по профилю отключаем
            $(".popup.evn-queue #recordToQueueByProfile").val(0);
            $(".evn-queue-doc").show();
            showEvnQueuePopup();
        }
    });

    $(document).on('click', ".apply-evn-queue-profile",function() {

        $(".command-links").dialog( "close" );

        if ($(".popup.evn-queue").length) {
            $(".evn-queue-doc").hide();

            // признак записи по профилю включаем
            $(".popup.evn-queue #recordToQueueByProfile").val(1);

            showEvnQueuePopup();
        }
    });


    $(document).on('change', ".popup.evn-queue .agree-chkbox",function() {
        $( ".queue-confirm-button" ).toggleClass('disabled', !$(this).is(':checked'));
        return false;
    });

    $(document).on('change', ".popup.regAgree .agree-chkbox",function() {
        $( ".regagree-confirm-button" ).toggleClass('disabled', !$(this).is(':checked'));
        return false;
    });

    $(document).on('click', ".btnCancelEvnQueue",function() {

        var el = $(this),
            btnRel = el.attr("rel");

        var params = btnRel.split(':');
        if (params.length) {

            var ajaxParams = {
                EvnQueue_id: params[0]
            };

            // если есть предложенная бирка, передаем бирку для отмены
            if (params[1]) ajaxParams.record_id = params[1];

            if (confirm(DASHBOARD_CANCEL_RECORD_QUESTION)) {
                $.ajaxSetup({cache: false});
                $.ajax({
                    url: '/service/record/cancelEvnQueue/',
                    type: 'post',
                    dataType:'json',
                    data: ajaxParams,
                    success: function(data) {
                        if (data.success) {
                            var card = el.parents('.service.order.evn-queue-order');
                            if (card.length) card.first().remove();
                        } else {

                            if (data.msg) $.alert(data.msg);
                        }
                    },
                    error: function(){
                        $.alert("Ошибка отмены предложенной бирки")
                    }
                });
            }
            return false;
        }
    });

	$(document).on('click', ".btnCancelRecRequest",function() {

		const el = $(this);
        const ajaxParams = {
            EvnQueue_id: $(this).data('evnqueue_id'),
            source_system: $(this).data('source_system')
        };

        if (confirm(DASHBOARD_CANCEL_RECORD_QUESTION)) {
            $.ajaxSetup({cache: false});
            $.ajax({
                url: '/service/record/cancel_recrequest/',
                type: 'post',
                dataType:'json',
                data: ajaxParams,
                success: function(data) {

                    if (data.error_code && data.error_code === 401) {
                        openEnterBoxModal();
                        return false;
                    }

                    if (data.error_msg) {
                        $.alert(data.error_msg);
                        return false;
                    }

                    if (data.success) {
                        var card = el.parents('.service.order.recRequest');
                        if (card.length) card.first().remove();
                        location.reload();
                    } else {

                        if (data.msg) $.alert(data.msg);
                    }
                },
                error: function(){
                    $.alert("Ошибка отмены предложенной бирки")
                }
            });
        }
	});

    $(document).on('click', ".evn-queue-btn-cancel a",function() {

        var el = $(this),
            EvnQueue_id = el.attr("rel"),
            href = el.attr('href');

        $.ajaxSetup({cache: false});
        $.ajax({
            url: '/service/record/queue_reject_confirm/',
            type: 'post',
            data: {
                EvnQueue_id: EvnQueue_id
            },
            dataType:'json',
            success: function(data) {

                if (data.msg) {
                    $.alert(data.msg);
                    return false;
                }

                if (data.success && data.notice) {

                    var yesno = $(".popup.yesno");
                    if (yesno.length) {

                        if ($(window).width() <= 640) {
                            $("span.close").hide();
                        }
                        yesno.find('.alert').first().html(data.notice);
                        yesno.dialog({
                            resizable: false,
                            height: "auto",
                            minWidth: $(window).width() <= 640 ? 299 : 700,
                            modal: true,
                            dialogClass: "Dialog",
                            buttons: {
                                "Да": function() {
                                    $(this).dialog("close");
                                    window.location.href = href;
                                },
                                "Отмена": function() {
                                    $(this).dialog("close");
                                    yesno.find('.alert').first().html("");
                                }
                            }
                        });
                    }
                }
            },
            error: function(){ $.alert("Ошибка проверки количества предложенных бирок") }
        });

        return false;
    });

    $(document).on('click','.regagree-confirm-button', function() {

        if ($(this).hasClass('disabled')) {
            return false;
        }
    });

    $(document).on('click', ".queue-confirm-button",function() {

        if ( $(this).hasClass('disabled') ) return false;

        var query = '?';
        query += 'recordToQueueByProfile=' + $("#recordToQueueByProfile").val();

        $(this).addClass('disabled');
        window.location.href = this.href + query;

        return false;
    });

    let submit_href_default = [];

    $(".evn-queue-btn-agree a.button").click(function() {

        $('.warning-msg').hide();
        $('.agree-msg').hide();

        var card_agree_btn = $(this).attr('id');
        var params_list = card_agree_btn.split('-');

        var timetable_id = null;

        if (params_list.length > 1) {
            timetable_id = params_list[1];

            const agree_form = $(".popup.regAgree" + '#regagree-' +timetable_id);

            if (agree_form.length && timetable_id) {

                const form_agree_btn = agree_form.find('.regagree-confirm-button').first();

                // проверяем прикрепление
                $.ajax({
                    type: "POST",
                    url: '/service/record/checkPersonAttachment',
                    dataType: 'json',
                    data: {
                        timetable_record_id : timetable_id
                    },
                    success: function (data) {

                        if (data.msg) {
                            agree_form.find('.warning-msg').first().show();
                            agree_form.find('.agree-msg').first().show();
                            agree_form.find('.agree-chkbox').first().prop('checked', false);
                            form_agree_btn.addClass('disabled');
                        } else {
                            form_agree_btn.removeClass('disabled');
                        }
                    },
                    error: function (data) {
                        form_agree_btn.removeClass('disabled');
                    }
                });

                agree_form.find(".email_notify").first().prop('checked', true);
                agree_form.find(".push_notify" ).first().prop('checked', false);
                agree_form.find(".notify_time" ).first().prop('disabled', false);

                const EvnQueue_id = agree_form.find(".evn-queue-input" ).first().val();

                if (EvnQueue_id) {

                    if (!submit_href_default[EvnQueue_id]) {
                        submit_href_default[EvnQueue_id] = form_agree_btn.attr('href');
                    }

                    form_agree_btn.attr("href", submit_href_default[EvnQueue_id] + '/queue_confirm?EvnQueue_id=' + EvnQueue_id);
                    agree_form.dialog({
                        dialogClass: "Dialog",/*Dialog добавляем всем попапам. Второй класс для специфики.*/
                        minWidth: $(window).width() <= 640 ? 299 : 600,
                        position: { my:"top+80", at: "top", of: $(document.body)},
                        modal: true
                    });
                }
            };
        }

        return false;
    });
});