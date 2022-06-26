$(document).ready(function() {
        
    function showModal(text) {
        $(".popup.notifyEdit").html('<span class="close"></span><div>' + text + '</div>');
        $(".popup.notifyEdit").dialog({
            dialogClass: "Dialog",/*Dialog добавляем всем попапам. Второй класс для специфики.*/
            minWidth: $(window).width() <= 640 ? 299 : 570,
            modal: true
        });
    }
    
    $(".record-close-button").click(function() {
		$(this).closest('.ui-dialog-content').dialog( "close" );
        $('#warning-msg').hide();
        return false;
    });

	$(".record-info-icon").hover(
		function() {
			$(this).next(".cost-info").show();
		},
		function() {
			$(this).next(".cost-info").hide();
		}
	);
    
    $('.btnDeletePerson').click(function(){
        el = $(this);
        id = el.attr("rel");
        if (confirm(DASHBOARD_DELETE_QUESTION)) {
            $.ajaxSetup({
                cache: false
            });
            $.ajax({
                url: '/user/deletePerson/' + id,
                dataType:'json',
                success: function(data) {
                    if(data.success) {
                        window.location.reload();
                    }
                },
                error: function(){
                    $.alert(DASHBOARD_DELETE_ERROR)
                }
            });
        }
    });
	
	$('.btnCancelRecord').click(function(){
        el = $(this);
        var source_system = el.parents(".serviceContent").data('source_system');
        id = el.attr("rel");
        if (confirm(DASHBOARD_CANCEL_RECORD_QUESTION)) {
            $.ajaxSetup({
                cache: false
            });
            $.ajax({
                url: '/service/record/cancelRecord/' + id,
                data: {
                    source_system: source_system
                },
                dataType:'json',
                success: function(data) {					
                    if(data.success) {
                        window.location.reload();
                    } else {
						 $.alert(data.error);
					}
                },
                error: function(){				
                    $.alert(RECORD_CANCEL_ERROR)
                }
            });
        }
		return false;
    });


	
	$('.btnCancelRecordMedservice').click(function(){
        el = $(this);
        id = el.attr("rel");
        if (confirm(DASHBOARD_CANCEL_RECORD_QUESTION)) {
            $.ajaxSetup({
                cache: false
            });
            $.ajax({
                url: '/service/record/cancelRecordMedservice/' + id,
                dataType:'json',
                success: function(data) {					
                    if(data.success) {
                        window.location.reload();
                    } else {
						 $.alert(data.error);
					}
                },
                error: function(){				
                    $.alert(RECORD_CANCEL_ERROR)
                }
            });
        }
		return false;
    });
	
	$('.btnEQMedservice').click(function(){
        el = $(this);
        id = el.attr("rel");
        if (confirm('Вы действительно хотите зарегистрироваться в электронной очереди?')) {
            $.ajaxSetup({
                cache: false
            });
            $.ajax({
                url: '/service/record/pushTalonEQ/' + id,
                dataType:'json',
                success: function(data) {
                    if(data.success) {
                        window.location.reload();
                    } else {
						 $.alert(data.msg);
					}
                },
                error: function(){				
                    $.alert('Ошибка регистрации в очереди')
                }
            });
        }
		return false;
    });
	
	$("body").on('click', ".btnPrintRecord", (function(){
        el = $(this);
        id = el.attr("rel");
        window.open('/service/record/printRecord/' + id);
		return false;
    }) );
	
	
	$( ".cur_records" ).click(function() {
		$( this ).siblings( ".old_records" ).removeClass("selected");
		$( this ).siblings( ".cancel_records" ).removeClass("selected");
		$( this ).addClass("selected");
		$('.smart-hint').hide();
	})
	
	$( ".old_records" ).click(function() {
		var rel = $(this).attr('rel');
		$( this ).siblings( ".cur_records" ).removeClass("selected");
		$( this ).siblings( ".cancel_records" ).removeClass("selected");
		$( this ).addClass("selected");
		var button = $( this );
		
        $( "#old_records_" + rel ).html('<div class="service order" style="vertical-align:middle; text-align:center; height: 40px; padding-top: 20px;"> <img src="/design/common_new/img/ajax-loader.gif" align="center" /></div>');
		jQuery.ajax({
			url: "/user/previous_records",
			type: "GET",
			data: {"person_id" : rel},
			dataType: "html",
			success: function(data) {
				if ( data != '' ) {
					$( "#old_records_" + rel ).html(data);
				} else {
					$( "#old_records_" + rel ).html('<h2 style="margin-top:20px;">' + NO_COMPLETED_SERVICES + '</h2>')
				}
				
				button.html(COMPLETED_SERVICES + ' (' + $( "#old_records_" + rel ).find('.serviceWrapper').length + ')');
			}
		});

	})
    
	$( ".cancel_records" ).click(function() {
		var rel = $(this).attr('rel');
		$( this ).siblings( ".cur_records" ).removeClass("selected");
		$( this ).siblings( ".old_records" ).removeClass("selected");
		$( this ).addClass("selected");
		var button = $( this );
		
        $( "#cancel_records_" + rel ).html('<div class="service order" style="vertical-align:middle; text-align:center; height: 40px; padding-top: 20px;"> <img src="/design/common_new/img/ajax-loader.gif" align="center" /></div>');
		jQuery.ajax({
			url: "/user/cancel_records",
			type: "GET",
			data: {"person_id" : rel},
			dataType: "html",
			success: function(data) {
				if ( data != '' ) {
					$( "#cancel_records_" + rel ).html(data);
				} else {
					$( "#cancel_records_" + rel ).html('<h2 style="margin-top:20px;">' + NO_COMPLETED_SERVICES + '</h2>')
				}
				
				button.html(CANCEL_SERVICES + ' (' + $( "#cancel_records_" + rel ).find('.serviceWrapper').length + ')');
			}
		});

	})
    
	$(".content .person .header .right a.button.grey.moreopts").click(function(e, x){
		var nxt = $(this).next(".moreMenu");
		$(".moreMenu").not(nxt).removeClass("showed");
		nxt.toggleClass("showed");
		return false;
	});
    
    $(document).on('click', "div.more", function(e, x){
		if ( $(this).attr('rel') ) {
			var menu_top = $(this).parents('.service').position().top + 30;
			$(".moreMenu[rel='" + $(this).attr('rel')+ "']").css('top', menu_top + 'px');
			$(".moreMenu[rel='" + $(this).attr('rel')+ "']").toggleClass("showed");
		} else {
			$(this).children(".moreMenu").toggleClass("showed");
		}
		
	});
	
	function editNotification(data) {
		ShowLoadIndicator();
		jQuery.ajax({
			url: "/service/record/getRecord/"+data.record_id,
            data: {
                source_system: data.source_system,
                viewgroup: data.viewgroup,
            },
			type: "GET",
			dataType: "html",
			success: function(data) {
				HideLoadIndicator();
				console.log(data);
				$(".popup.notifyEdit").html(data);
				$(".popup.notifyEdit").dialog({
					dialogClass: "Dialog",/*Dialog добавляем всем попапам. Второй класс для специфики.*/
					minWidth: $(window).width() <=640? 299 :570,
					modal: true
				});
				$(".close").click(function() {
					$(this).parent().dialog( "close" );
					return false;
				});

				$("select").select2({
					width: "element",
					placeholder: COMBOBOX_LOADING,
					formatNoMatches: function (term) {
						return COMBOBOX_NOT_FOUND
					},
					minimumResultsForSearch: 30
				});

				$( "#email_notify" ).click(function() {
					$( "#notify_time" ).prop('disabled', !(this.checked || $( "#sms_notify" ).prop('checked')) );
				})

				$( "#sms_notify" ).click(function() {
					$( "#notify_time" ).prop('disabled', !(this.checked || $( "#email_notify" ).prop('checked')) );
				})
			}
		});
	}
	
	$('.btnEditNotify, .notify_info').click(function(){
        var source_system = $(this).parents(".serviceContent").data('source_system');
        var rel = $(this).attr("rel");
        var viewgroup = $(this).data("viewgroup");
        editNotification(
            {
                source_system: source_system,
                record_id:rel,
                viewgroup,
            }
        );
		return false;
    });
	
    $('.btnCancelHomevisit').click(function(){
        el = $(this);
        id = el.attr("rel");
        if (confirm(DASHBOARD_CANCEL_HOMEVISIT_QUESTION)) {
            $.ajaxSetup({
                cache: false
            });
            $.ajax({
                url: '/service/homevisit/cancelHomevisit/' + id,
                dataType:'json',
                success: function(data) {
                    if(data && data.success) {
                        window.location.reload();
                    }
                },
                error: function(){
                    $.alert(DASHBOARD_DELETE_ERROR)
                }
            });
        }
		return false;
    });
	
    $('.btnCancelDoctorhome').click(function(){
        el = $(this);
        id = el.attr("rel");
        if (confirm(DASHBOARD_CANCEL_HOMEVISIT_QUESTION)) {
            $.ajaxSetup({
                cache: false
            });
            $.ajax({
                url: '/service/doctorhome/cancelDoctorhome/' + id,
                dataType:'json',
                success: function(data) {
                    if(data && data.success) {
                        window.location.reload();
                    }
                },
                error: function(){
                    $.alert(DASHBOARD_DELETE_ERROR)
                }
            });
        }
		return false;
    });

    $('.cancel-attachmentapp').click(function(){

        var el = $(this),
            rawData = el.attr("rel");

        if (confirm(DASHBOARD_CANCEL_ATTACHMENTAPP_QUESTION)) {

            var data = rawData.split('-'),
                pca_id = null,
                patient_id = null;

            if (data.length === 2) {
                pca_id = data[0];
                patient_id = data[1];
            } else {
                console.log('Недостаточно данных для передачи в запрос');
                return false;
            }

            window.location.href = '/service/emk/cancelAttachmentApplication?patient_id='+ patient_id +'&pca_id=' + pca_id
        }

        return false;
    });
	$(".push-button-green").click(function () {
		var text = typeof ($(".autoCompleteInput").val()) ? $(".autoCompleteInput").val() : "";
		var type = typeof ($("#select-push option:selected").val()) ? $("#select-push option:selected").val() : "";
		var data_range = typeof ($("#date_range").val()) != "undefined" ? $("#date_range").val() : "";
		$(this).attr('href', '?page=&q=&type='+type+'&text='+text+'&dataRange='+data_range+'');
	});
    
    $(".cardData").on('click', '.person_evnqueue span', function (e) {
        
        function templateHistoryRecord(historyRecord) {
            return '<li class="historyEvnQueueRecord">' +
                    '<div>' + historyRecord.EvnQueueHist_insDT + '</div>' +
                    '<div>' + historyRecord.msgStatus + '</div>' +
                    '<div>' + historyRecord.msgOffer + '</div>' +
                    '</li>';
        }
        
        function makeHistory(data) {
            let history = '<div class="historyEvnQueue">';
            let title = '<div class="historyEvnQueueTitle">История</div>';
            history += title;
            history += '<hr>';
            history += '<ul>';
            history += data.map(function (historyRecord) {
                return templateHistoryRecord(historyRecord)
            }).join('');
            history += '</ul>';
            return history;
        }
        
        const EvnQueue_id = e.currentTarget.dataset.evnqueue_id;
        $.ajax({
            url: '/service/record/getHistoryEvnQueue',
            data: {
                EvnQueue_id: EvnQueue_id
            },
            dataType: 'json',
            success: function (data) {
                if (typeof data === 'object' && data.length > 0) {
                    $(".popup.notifyEdit").html('<span class="close"></span>' + makeHistory(data));
                    $(".popup.notifyEdit").dialog({
                        dialogClass: "Dialog",/*Dialog добавляем всем попапам. Второй класс для специфики.*/
                        minWidth: $(window).width() <= 640 ? 299 : 570,
                        modal: true
                    });
                } else {
                    $.alert(data.error_msg || 'Нет истории по данной записи!');
                }
            },
            error: function (e) {
                $.alert('Не удалось получить историю по данной записи!')
            }
        });
    });
    
    $('.btn-disp').on('click', function (e) {
        e.preventDefault();
        const Lpu_id = Number(e.currentTarget.dataset.lpu_id);
        const patient_id = Number(e.currentTarget.dataset.person_id);
        if (!Lpu_id) {
            showModal('Не удалось установить поликлинику прикрепления. Для прикрепления обратитесь в регистратуру вашей поликлиники.');
            return false;
        }
    
        window.location.href = '/service/disp/listUslugaComplex?patient_id=' + patient_id;
    })

});
