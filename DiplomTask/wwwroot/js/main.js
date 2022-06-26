function ShowLoadIndicator() {
	var indicator = document.getElementById("load_indicator");
	if(indicator) indicator.style.display = "block";
}
function HideLoadIndicator() {
	document.getElementById("load_indicator").style.display = "none";
}


/**
 * Подсчет контрольной суммы номера полиса нового образца
 * @param ednum string Номер полиса
 * @returns {boolean}
 */
function checkEdNumFedSignature(ednum){
	if(!/^\d{16}$/.test(ednum))
		return false;
	var key = parseInt(ednum.charAt(ednum.length - 1));
	var str_chet = '';
	var str_nechet = '';
	var i;
	for(i = 14; i >= 0; i--){
		if(i % 2 === 0)
			str_nechet = String(str_nechet).concat(String(ednum.charAt(i)));
		else
			str_chet = String(str_chet).concat(String(ednum.charAt(i)));
	}
	var str_number = String(str_chet).concat(String(parseInt(str_nechet) * 2));
	var summ = 0;
	for(i = 0; i < str_number.length; i++)
		summ += parseInt(str_number.charAt(i));
	var number_key = (summ % 10 === 0) ? 0 : (10 - summ % 10);
	return (number_key === key);
}

/**
 * Открытие модального окна для входа
 */
function openEnterBoxModal(el){
	var modal = jQuery('#enterBoxModal');// модальная форма с авторизацией должна быть одна
	if(!modal.length){// но пока их может быть несколько
		console.log('--- #enterBoxModal не найден, нужно добавить. Поиск .enterBoxModal');
		modal = jQuery('.enterBoxModal');
		if(!modal.length){
			console.log('--- .enterBoxModal не найден, нужно добавить #enterBoxModal. Поиск .enterBox');
			modal = jQuery('.enterBox');
			if(!modal.length){
				console.log('--- .enterBox не найден!');
				return false;
			}
		}
	}
	modal.dialog({
		dialogClass: 'Dialog Test',
		minWidth: 315,
		modal: true,
		width : 200,
		resizable: false
	});
	return false;// для обработчика onclick="return openEnterBoxModal()" у ссылок
}

function checkForm(el, username, password){
	if((typeof password) === 'string' && password.length){
		var loginPassw = jQuery.trim(jQuery(el).find('[name="'+password+'"]').val());
		if(loginPassw.length < 4){
			return false;
		}
	}

	if((typeof username) === 'string' && username.length){
		var loginEmail = jQuery.trim(jQuery(el).find('[name="'+username+'"]').val());
		if(loginEmail.length < 1){
			return false;
		}
	}
	return true;
}

$( document ).ready(function() {
    
    function showModal(text) {
        $(".popup.notifyEdit").html('<span class="close"></span><div>' + text + '</div>');
        $(".popup.notifyEdit").dialog({
            dialogClass: "Dialog",/*Dialog добавляем всем попапам. Второй класс для специфики.*/
            minWidth: $(window).width() <= 640 ? 299 : 570,
            modal: true
        });
    }
    
	var count = 0;		
	 $( ".miss, .busy, .free, .liveLine" ).tooltip({
		tooltipClass: "tooltip-white-style",
		track: true,
		position: { my: "center top+25", at: "right center" },
		content: function() {
			return $(this).attr('title');
		}
	});
	$( "body .info" ).tooltip({
		tooltipClass: "tooltip-white-style",
		position: { my: "center-5 top+25", at: "right center" },
		content: function() {
			return $(this).attr('title');
		}
	});
	
	$( ".biginfo" ).tooltip({
		tooltipClass: "tooltip-white-style toptooltip electronic-queue-tooltip",
		position: { my: "center bottom-5", at: "center top-10", collision:"none"},
		content: function() {
			return $(this).attr('title');
		}
	});

	$( "body .question" ).tooltip({
		tooltipClass: "tooltip-white-style toptooltip",
		position: { my: "center bottom-5", at: "center top-10", collision:"none"},
		content: function() {
			return $(this).attr('title');
		}
	});
	
	$( "body .hiddentooltip" ).tooltip({
		tooltipClass: "tooltip-white-style",
		position: { my: "center-35 top+25", at: "right center" },
		content: function() {
			return $(this).attr('title');
		}
	});
	$( ".dialog" ).dialog({
		autoOpen: false,
		modal: true
	});
	$( "a.trololo" ).click(function() {
		$(".popup.trololo").dialog({
			dialogClass: "Dialog activate",
			minWidth: $(window).width() <=768 ? 299 : 445
		})
	})
	$( "a.regNumber" ).click(function() {
		$(".popup.regNumber").dialog({
			dialogClass: "Dialog regnumber-win",
			minWidth: $(window).width() <= 768 ? 299 : 445
		})
	})
	$( "a.regAgree" ).click(function() {
		$(".popup.regAgree").dialog({
			dialogClass: "Dialog",
			minWidth: $(window).width() <= 768 ? 299 : 570
		})
	})
	$( "a.regNumber2" ).click(function() {
		$(".popup.regNumber2").dialog({
			dialogClass: "Dialog regnumber2-win",
			minWidth: $(window).width() <= 768 ? 299 : 445
		})
	})
	$( "a.typepolis" ).click(function() {
		$(".popup.typepoliswin").dialog({
			dialogClass: "Dialog typepolis",
			minWidth: $(window).width() <= 768 ? 299 : 600,
			height: document.body.clientHeight
		})
	});
	$('.side-mobile-menu').click(function (event) {
		$(this).addClass('hidden');
		$(document.body).removeClass('body-no-scroll');
	});
	$('.burger-menu').click(function () {
		$('.side-mobile-menu').removeClass('hidden');
		$(document.body).addClass('body-no-scroll');
	})
	// Демобокс
	$(" .cap .person .demo").hover(function(event) {
		var target = $(event.target);
		$(".demoBox").dialog({
			dialogClass: "Dialog-tooltip Dialog Test",
			width: 'auto',
			minHeight: 'auto',
			position: $(window).width() <=1080 ? { my:"center+100 top+20", at:" top+20", of: target}  : {my: "right+100 top+20", at: " top+20",of: target},
			resizable: false
		});
	},
	function() {
		setTimeout(function() {
			if(!$(".demoBox").is(':hover')) $(".demoBox").dialog('close');

		}, 300)
	});
	$(".demoBox").hover(
		function(){},
		function() {$(".demoBox").dialog('close');}
	);

	// Пушбокс
	$(" .cap .person .push-notice").hover(function(event) {
			var target = $(event.target);
			$(".pushBox").dialog({
				dialogClass: "Dialog-tooltip Dialog Test",
				width: 'auto',
				minHeight: 'auto',
				position: $(window).width() <=1080 ? { my:"center+100 top+20", at:" top+20", of: target}  : {my: "right+100 top+20", at: " top+20",of: target},
				resizable: false
			});
		},
		function() {
			setTimeout(function() {
				if(!$(".pushBox").is(':hover')) $(".pushBox").dialog('close');

			}, 300)
		});
	$(".pushBox").hover(
		function(){},
		function() {$(".pushBox").dialog('close');}
	);

	// Статус бирки
	$(" .status .info-quest-icon").hover(function(event) {
			var target = $(event.target);
			$(".info-quest-push").dialog({
				dialogClass: "Dialog-tooltip Dialog Test",
				width: 'auto',
				minHeight: 'auto',
				position: $(window).width() <=1080 ? { my:"center+100 top+10", at:" top+10", of: target}  : {my: "right+100 top+10", at: " top+10",of: target},
				resizable: false
			});
		},
		function() {
			setTimeout(function() {
				if(!$(".info-quest-push").is(':hover')) $(".info-quest-push").dialog('close');

			}, 300)
		});
	$(".info-quest-push").hover(
		function(){},
		function() {$(".info-quest-push").dialog('close');}
	);

	// Регбокс
	$(".cap .person .register").hover(function(event) {
			var jqRegBox = $(".regBox");
			if(!jqRegBox.length) return;
			var target = $(event.target);
			jqRegBox.dialog({
				dialogClass: "Dialog-tooltip Dialog Test",
				width: 'auto',
				minHeight: 'auto',
				position: $(window).width() <=1080 ? { my:"center-100 top+20", at:" top+20", of: target}  : {my: "right-260 top+20", at: " top+20",of: target},
				resizable: false
			});
		},
		function() {
			var jqRegBox = $(".regBox");
			if(!jqRegBox.length) return;
			setTimeout(function() {
				if(!jqRegBox.is(':hover')) jqRegBox.dialog('close');
			}, 300)
	});
	$('.side-mobile-menu .mobile-menu .person .register').click(function () {
		if($(".regBox").length > 0){
			$(".regBox").append('<span class="close"></span>')
			$(".regBox").dialog({
				dialogClass: "Dialog-tooltip Dialog Test",
				width: 299,
				minHeight: 'auto',
				modal:  true,
				position: { my:"top+10", at: "top", of: $(document.body)},
				resizable: false,
				beforeClose: function( event, ui ) {
					console.log($(event.target).children('span.close').remove());
				}
			});
			return false;
		}

	});
	$(".regBox").hover(
		function(){},
		function() {$(".regBox").dialog('close');}
	);

	$('a.enter[href="#"]').on('click', function(event){
		event.preventDefault();
		openEnterBoxModal();
	});

	$(document).on("click", "span.close", function() {
		$(this).parents('.popup').dialog("close").dialog("destroy");// destroy вместо close, т.к. не используется open
		return false;
	});
	
	// $("div.region").click(function(e) {
	// 	if ( $(".region ul").hasClass("closed") ) {
	// 		$(".region ul").addClass("opened");
	// 		$(".region ul").removeClass("closed");
	// 		e.stopPropagation();
	// 		return false; 
	// 	}
	// });
	
	
	$(document).mouseup(function (e) {
		var container = $(".region ul");
		if ( !container.has(e.target).length ) {
			$(".region ul").addClass("closed");
			$(".region ul").removeClass("opened");
		}

		var container = $(".enterBox");

		if ( container.dialog( "instance" ) && $(e.target).hasClass('ui-widget-overlay') ) {
			container.dialog( "close" );
		}
		
		var container = $(".moreMenu, .moreopts");
		if ( !container.is(e.target) ) {
			$(".moreMenu").removeClass("showed");
		}
		
	});
	
	$("ul.opened").hover(function(){}, function(){$(this).addClass('Trololo2')})

	$("a.more").hover(
		function(){
			$(this).next(".moreMenu").show();
			$(this).addClass("hovered");
			$(this).next(".moreMenu").hover(
				function(){
					$(this).css("display", "block")
					},
				function(){
					$(this).css("display", "none")
					$(this).prev().removeClass("hovered");
					});
		},
		function(){
			$(this).next(".moreMenu").hide();
		}
	);
	
	$( ".lock" ).tooltip({
		tooltipClass: "tooltip-black-style",
		position: { my: "center-5 top+15", at: "right center" },
		content: function() {
			return $(this).attr('title');
		}
	});
	
	$(".timeLine ul.type li").tooltip({
		tooltipClass: "tooltip-black-style",
		position: { my: "center-13 top+15", at: "right center" },
		content: function() {
			return $(this).attr('title');
		}
	});
	if ($(window).width() > '500') {
	$( "span.more" ).tooltip({
		tooltipClass: "tooltip-black-style thin-style",
		position: { my: "center-17 top+15", at: "right center", collision: "none"},
		content: "Подробнее",
		items: "span",
		show: { easing: "easeInExpo", duration: 800 }
	});
	}

	if ($(window).width() < '500') {
		$ ("span.desktop_title").hide();
		$ ("span.desktop_body").hide();
	}
	if ($(window).width() > '500') {
		$ ("span.mobile_title").hide();
		$ ("span.mobile_body").hide();
	}

		$("span.more").click(function (e, x) {
			 var nxt = $(this).next(".hidden");
			if ($(window).width() > '500') {
				var ttp = $("span.more");
				if (nxt.is(":visible")) {
					ttp.tooltip("option", "content", MORE);
				} else {
					ttp.tooltip("option", "content", COLLAPSE);
				}
				nxt.toggleClass('active');
			}
			if ($(window).width() < '500') {
				var selector = $(this).parents(".news-block, .slideTizerNews").first();

				selector.find("span.hidden").first().show();
				selector.find("span.mobile_title").first().hide();
				selector.find("span.more").first().hide();
				selector.find("span.ellipsis").first().hide();
				selector.find("span.hide").first().show();

				$("span.hide").click(function (e, x) {
					var selector = $(this).parents(".news-block, .slideTizerNews").first();
					selector.find("span.hidden").first().hide();
					selector.find("span.mobile_title").first().show();
					selector.find("span.hide").first().hide();
					selector.find("span.more").first().show();
					selector.find("span.ellipsis").first().show();

				});
			}

		});


	$( "a.lpuAddressTTLink" ).tooltip({
		tooltipClass: "tooltip-white-style lpuAddressTooltip",
		position: { my: "center+5 top+15", at: "center center" },
		content: function() {
			return $(this).next("span.lpuAddressHidden").html();
		},
		items: "a",
		show: {duration: 300 }
	});

	$('form input[type="password"] + label').click(function(e, x){
		var inputfield = $(this).prev("input");
		inputfield.toggleClass('opened');
		if(inputfield.attr('type')=="password")
		{inputfield.attr('type', 'text');}
		else{inputfield.attr('type', 'password');}
		return false;
	});

	$(window).on('beforeunload', function(){
		setTimeout(function() {
			ShowLoadIndicator();
		}, 100)
	});

	let tm = null;

	$(document).ajaxSend(function( event, jqxhr, settings ) {

		if (settings
			&& (settings.withoutPreloader === undefined)
			|| (settings.withoutPreloader !== undefined && !settings.withoutPreloader)
		) {
			ShowLoadIndicator();
			tm = setTimeout(function() {
				// на всякий случай если зависнет лоад индикатор
				HideLoadIndicator();
				console.log('Слишком долгое выполнение AJAX запроса...')
			}, 20000)
		}
	});

	$( document ).ajaxStop(function() {

		if (tm) {
			clearTimeout(tm);
			tm = null;
		}

	  	HideLoadIndicator();
	});

	$( document ).ajaxError(function(e, jqXHR, ajaxSettings, thrownError) {

		if (tm) {
			clearTimeout(tm);
			tm = null;
		}

		HideLoadIndicator();
		if (thrownError != 'abort') {
			//$.alert(SERVER_ERROR);
		}
	});

	$.extend({ alert: function (message, title) {
		$(".popup.infoWindow>h2").html(title || ERROR);
		$(".popup.infoWindow>h2").removeClass();
		$(".popup.infoWindow>h2").addClass('alert');
		$(".popup.infoWindow>p.contextAlert").html(message);
		$(".popup.infoWindow").dialog({
			dialogClass: "Dialog infoWindow",
			minWidth: $(window).width() <=640? 299 : 445,
			modal: true
		})
	}
	});

	$(".closeRedirectEsiaCovidPopup").click(function () {
		$("#redirectEsiaCovid").dialog("close");
	});

	$(".forgot_pass_link").click(function(event) {
		var jqParent = $(event.target).parents("form");
		var jqDialog = jqParent.parents(".popup");
		if ( $("#request_password_div").length == 0 ) {
			$(document.body).append('<div id="request_password_div"></div>');
			$("#request_password_div").load( "/user/request_password_form", function() {
				$('.telephonemask').inputmask('+7 (999) 999-99-99');
				if ( jqDialog.hasClass('ui-dialog-content') ) {
					jqDialog.dialog( "destroy" );
				}
				var target = $('.cap .person');
				$(".recoveryPassMain").dialog({
					dialogClass: "Dialog Test",
					minWidth: $(window).width() <=640? 299 : 550,
					modal: true,
					position: $(window).width() >=640 ? { my:"right+167 top+4", at: "left-90 top", of: target} : {},
					resizable: false,
					open: function( event, ui ) {
						$('#request_password_mail').val(jqParent.find('[name="username"]').val());
					}
				})
				if ($(window).width() <= 640) {
					let widthRecoveryPassMain = $(".recoveryPassMain").width();
					let heightRecoveryPassMain = $(".recoveryPassMain").height();
					$(".recoveryPassMain").height(heightRecoveryPassMain + 40);
					$("span.close").width(widthRecoveryPassMain);
				}
			});
		} else {
			jqDialog.dialog( "destroy" );
			var target = $('.cap .person');
			$(".recoveryPassMain").dialog({
				dialogClass: "Dialog Test",
				minWidth:$(window).width() <=640? 299 : 450,
				modal: true,
				position: $(window).width() >=640 ? { my:"right+167 top+4", at: "left-90 top", of: target} : {},
				resizable: false,
				open: function( event, ui ) {
					$('#request_password_mail').val(jqParent.find('[name="username"]').val());
				}
			})
			if ($(window).width() <= 640) {
				let widthRecoveryPassMain = $(".recoveryPassMain").width();
				let heightRecoveryPassMain = $(".recoveryPassMain").height();
				$(".recoveryPassMain").height(heightRecoveryPassMain + 30);
				$("span.close").width(widthRecoveryPassMain);
			}
		}
		return false;
	});

	$( ".clientLpuAttachmentsTab span" ).click (function(e, x){
		var prt = $(this).parents(".docRecordingBlock ");
		prt.toggleClass('expandedAttachments');
	});

	$.extend({ info: function (message, title, type) {
		$(".popup.infoWindow>h2").html(title);
		$(".popup.infoWindow>h2").removeClass();
		if ( type ) {
			$(".popup.infoWindow>h2").addClass(type);
		}
		$(".popup.infoWindow>p.contextAlert").html(message);
		$(".popup.infoWindow").dialog({
			dialogClass: "Dialog infoWindow",/*Dialog добавляем всем попапам. Второй класс для специфики.*/
			minWidth: $(window).width() <=640? 299 : 445,
			modal: true
		})
	}
	});

	$('.close-app-banner').click(function(){

		$('.app-banner-main').remove();
	});


	$('.smart-hint .close').mousedown(function(){
		$('.smart-hint').hide();
	});

	$('.enter-modal').on('click', function(event){
		event.preventDefault();
		openEnterBoxModal();
	});

	$(document).on('click', ".popup-close-button",function() {
		$(this).closest('.ui-dialog-content').dialog( "close" );
		return false;
	});
  
    $('.btn-forward-medservices').on('mousedown', function (e) {
        const patient_id = e.target.dataset.patient_id
        const UslugaComplexAttributeType_SysNick = e.target.dataset.uslugacomplexattributetype_sysnick
        const UslugaComplexAttribute_Value = e.target.dataset.uslugacomplexattribute_value
        const link = e.target.href
        // если это диспансеризация взрослого населения
        if (UslugaComplexAttributeType_SysNick === 'DispClass' && [1,31].includes(+UslugaComplexAttribute_Value)) {
            e.preventDefault()
            $.ajax({
                url: '/service/disp/allowRecord',
                dataType: 'json',
                data: {
                    patient_id: patient_id,
                    DispClass_Code: UslugaComplexAttribute_Value,
                },
                success: function (data) {
                    if (!data || typeof data !== 'object') {
                        $.alert('Ошибка записи на диспансеризацию!');
                        return false;
                    }
                    if (data.error_msg) {
                        $.alert(data.error_msg);
                        return false;
                    }
                    if (!data.status) {
                        showModal(data.message || 'Запись на диспансеризацию недоступна.');
                        return false;
                    }
                    if (data.status) {
                        window.location.href = link
                    }
                },
                error: function (e) {
                    console.error(e);
                    $.alert('Ошибка записи на диспансеризацию!');
                },
                complete: function () {
                    $('#load_indicator').hide();
                }
            })
            return false;
        }
    });
    
    $('.need_choose_patient').on('click', function (e) {
        e.preventDefault();
        
        const link = $(e.currentTarget).data("link");
        const loginWithPolis = $(e.currentTarget).data("login_with_polis");
        const title = "Выберите пользователя:";
    
        if(loginWithPolis){
           return $.info('Сервис недоступен при авторизации по полису ОМС', 'Внимание!');
        }
        
        function createTemplateListPersons(persons, link) {
            let list = '';
            persons.forEach(function (person) {
                list += '<li><a href="' + link + '?patient_id=' + person.Person_id + '">' + person.Person_FIO + '</a></li>';
            })
            return "<ul>" + list + "</ul>";
        }
    
        if (link) {
            $.ajax({
                url: '/user/persons',
                dataType: 'json',
                success: function (data) {
                    if (!data || !Array.isArray(data)) {
                        $.info('Пользователи не найдены!');
                        return false;
                    }
                    if (data.error_msg) {
                        $.info(data.error_msg);
                        return false;
                    }
                    $.info(createTemplateListPersons(data, link), title, 'list-persons');
                },
                error: function (e) {
                    console.error(e);
                    $.alert('Ошибка получения списка пользователей!');
                },
                complete: function () {
                    $('#load_indicator').hide();
                }
            })
            return false;
        }
    })
    
});
