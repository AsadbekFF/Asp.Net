var storedTemplates = [];

// Тип текущей бирки, используется при валидации формы перед сохранением
let selectedTimeTableTypeId = null;

// загрузка инфы в диалог подтверждения записи на бирку или создания заявки
// todo: убрать все в интефейс
function loadRecordData(params){
	$(".noLogin").css('overflow','hidden'); // запрет скролла страницы
	selectedTimeTableTypeId = null; // Очищаем тип текущей бирки
	return new Promise(function (resolve, reject) {

		if (!params) reject(true);
		if ($(params.popupSelector).length) {

			ajax_params = {
				MedStaffFact_id: params.recordData.medstafffact_id,
				Person_id: (params.recordData.person_id !== 'null') ? params.recordData.person_id : ''
			};

			if (params.isPaid) {
				ajax_params.isPaid = params.isPaid;
			}

			if (params.recordData.timetablegraf_id) {
				ajax_params.TimetableGraf_id = params.recordData.timetablegraf_id;
			}

			$.ajax({
				url: '/service/record/getRegAgreeRecordData',
				dataType: 'json',
				type: 'post',
				data: ajax_params,
				success: function (data) {
					//console.log(data);
					// если не авторизован на портале
					// показываем окно авторизации
					if (data.error_code && data.error_code === 401) {
						openEnterBoxModal();
						if (params.onFail && typeof params.onFail === 'function') {
							params.onFail();
						}
						reject({error_msg: 'Необходима авторизация'});
						return false;
					} else if (data.error_msg) {
						$.alert(data.error_msg);
						if (params.onFail && typeof params.onFail === 'function') {
							params.onFail();
						}
						reject(true);
						return false;
					}

					if (data) {
						var popup_content = null;
						storedTemplates.some(function(template){
							if (template.selector === params.popupSelector) {
								popup_content = template.content;
								return true;
							}
						});

						// Сохраняем тип текущей бирки
						selectedTimeTableTypeId = data.TimeTableType_id;

						if (!popup_content) {
							popup_content = $(params.popupSelector).clone().html();
							storedTemplates.push({
								selector: params.popupSelector,
								content: popup_content
							})
						}

						// подставляем параметры
						Object.keys(data).forEach(function (replacedParam) {
							if (data[replacedParam] === null || data[replacedParam] === 'null') data[replacedParam] = '';
							popup_content = popup_content.replace('{' + replacedParam + '}', data[replacedParam]);
						});
						if (selectedTimeTableTypeId == 13) {
							popup_content = popup_content.replace('{online}', "на онлайн консультацию");
						} else {
							popup_content = popup_content.replace('{online}', "");
						}
						// заменяем верстку
						$(params.popupSelector).html(popup_content);
                        //формируем ссылку на информированное добровольное согласие
                        const consentElement = $("#regAgree-consent")
                        consentElement.find("a:first").prop("href", `/service/record/getConsentMedicalInterventions/?Lpu_id=${data.Lpu_id}&Person_id=${data.Person_id}&MedPersonal_id=${data.MedPersonal_id}`)
                        
						if (selectedTimeTableTypeId == 13) {
							$(".regAgree-row.lpu").hide();
							$(".regAgree-row.address").hide();
							$(".regAgree-row.annotation").hide();
							$(".regAgree-row.method").show()
							$("#regAgree-visit").hide()
							consentElement.show()
							$("#regAgree_rules").prop('checked', false);
                            $(".record-button").addClass('disabled');
                            $("#consulting_form_wrapper").show();
						} else {
							$(".regAgree-row.method").hide()
							$("#regAgree-visit").show()
							consentElement.hide()
							$("#consulting_form_wrapper").hide();

						}

						$(params.popupSelector).dialog({
							dialogClass: "Dialog",
							minWidth: $(window).width() <= 768 ? 299 : 600,
							modal: true
						});

						if ($(window).height() < 500) {
							$(params.popupSelector).height($(window).height() - 30)
						}

						if (params.onSuccess && typeof params.onSuccess === 'function') {
							params.onSuccess();
						}
						resolve(data);

						if($("input[name='Person_id']").val() =="") {
							$(".record-button").addClass('disabled');
						}

						if(data.Person_id) {
							$(".choise-persons-block").hide();
							$("#warning-choice-person").hide();
						} else {
							$(".person-fio").hide();
						}
						if ($("select").select2) {
							$("select").select2({
								minimumResultsForSearch: Infinity,
							});
							$("span.select2").addClass("notify_time")
						}

						if(!data.coordinates) {
							$(".coordinates").hide();
						} else {
							$(".coordinates").attr("href", `https://yandex.ru/maps?pt=${data.coordinates}&l=map&z=17`);
						}

						$('#phone').val(data.Person_Phone);
					} else {
						reject({error_msg: 'Ошибка загрузки данных'});
					}
				},
				error: function (err) {
					if (err) console.warn('error:', err);
					if (params.onFail && typeof params.onFail === 'function') {
						params.onFail();
					}
					reject({error_msg: 'Ошибка получения информации'});
					//$.alert('')
				}
			});
		} else {
			reject(true);
		}
	});
}

function showRegAreePopup(params){

	loadRecordData({
		popupSelector: params.popupSelector,
		recordData: params.recordData,
		onFail: params.onFail ? params.onFail : null,
		onSuccess: params.onSuccess ?  params.onSuccess : null
	}).then(function(promiseData){

		if (params.recordData.timetablegraf_id && params.recordData.person_id && params.recordData.person_id != "null") {
			// проверяем прикрепление
			$.ajax({
				type: "POST",
				url: '/service/record/checkPersonAttachment',
				dataType: 'json',
				data: {
					timetable_record_id : params.recordData.timetablegraf_id
				},
				success: function (data) {
						if (data.msg) {
							if (promiseData
								&& promiseData.TimeTableType_id
								&& promiseData.TimeTableType_id != 13
							) {
								$('#warning-msg').show();
								$('#agree-msg').show();
								$(".record-button").addClass('disabled');
								$("#regAgree_rules").prop('checked', false);
							}
						}
				},
				error: function (data) {
					$(".record-button").removeClass('disabled');
				}
			});
		}

		$( "#email_notify_free" ).prop('checked', true);
		$( "#sms_notify_free" ).prop('checked', false);
		$( "#push_notify_free" ).prop('checked', false);

		const radioButtons = $('input:radio[name=notify_time]');
		if(radioButtons.is(':checked') === false) {
			radioButtons.filter('[id=day_free]').prop('checked', true);
		}

		const phone = $('#phone');
		phone.inputmask('+7 (999) 999-99-99', {
			onBeforeWrite: function() {
				validateForm();
			},
			removeMaskOnSubmit: true
		});
		phone.hide();
		$("input[name='consulting_form']").on('click', function() {
			// Показываем поле Телефон, если режим оказания консультации = Телефон (4)
			if($("input[name='consulting_form']:checked").val() == '4') {
				phone.show();
			} else {
				phone.hide();
			}
			validateForm();
		});
	});
}

function selectPerson(person_id, msf_id) {
	var _location = '/service/record/' + person_id + '/' + msf_id + '/timetable#';
	location.href = _location;
	return false;
}

function showPopupRegAree(dataset, e) {

	e.stopImmediatePropagation();
	let popupSelector = '';

	if ($('.popup.regAgree-free').length) {

		popupSelector = '.popup.regAgree-free';

		showRegAreePopup({
			recordData: dataset,
			popupSelector: popupSelector,
		});

	}

	if ($('.popup.regInfo').length) {

		popupSelector = '.popup.regInfo';

		if ($('.personList li').length == 1) {
			$('.personList li:first a').click();
		} else {
			$(popupSelector).dialog({
				dialogClass: "Dialog",
				minWidth: 370,
				modal: true
			})
		}

		if ($(window).width() <= 640) {
			let heightRegInfo = $(popupSelector).height();
			let widthRegInfo = $(popupSelector).width();
			$(popupSelector).height(heightRegInfo + 50);
			$("span.close").width(widthRegInfo);
		}
	}

	if ($('.popup.message.noticeYellow').length) {

		popupSelector = '.popup.message.noticeYellow';

		$(popupSelector).dialog({
			dialogClass: "Dialog",
			minWidth: $(window).width() <= 640 ? 299 : 475,
			minHeight: 0,
			modal: true,
			buttons: {
				"Продолжить": function() {
					window.location.href = 'https://www.gosuslugi.ru/10066/1/form';
				},
				"Отмена": function() {
					$(this).dialog( "close" );
					return false;
				},
			}
		});
	}
}

function renderCommandLinks(params){

	var wrapper = $('.command-links-content');
	var html = '';

	if (params.links.length > 0) {

		params.links.forEach(function(link){

			const cls = link.cls ? link.cls : '';

			if (link.type === 'link') {

				let dataAttr = '';

				if (link.linkData) {
					Object.keys(link.linkData).forEach(function (dataParam) {
						dataAttr += ' data-' + dataParam + '="' + link.linkData[dataParam] + '"';
					});
				}

				if (link.href && link.href !== '#') {
					dataAttr += ' data-href="' + link.href + '"';
				}

				html += '<li class="command-links-link ' + cls+'"'
				+ dataAttr + ' tabindex="0">'
				+'<span class="command-links-arrow"></span>'
				+'<h3>' + link.title +'</h3>';

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
					'<li class="command-links-footer ' + cls+'">' +
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

/**
 * Проверяем наличие значений в необходимых полях при записи на ТМК
 */
function isTMKFormValidToRecord() {
	const consulting_form_id = $("input[name='consulting_form']:checked").val();
	return selectedTimeTableTypeId != 13 ||
		$("#regAgree_rules").prop('checked') &&
		(
			consulting_form_id &&
			(
				consulting_form_id == '3' ||
				$("#phone").inputmask("isComplete")
			)
		)
}

/**
 * Проверяем наличие значений в необходимых полях
 */
function isFormValidToRecord() {
	return $("#regAgree_rules").prop('checked') &&
		$("input[name='Person_id']").val() &&
		$("input[name='Person_id']").val() != "" &&
		isTMKFormValidToRecord();
}

/**
 * Устанавлиает/убирает класс disabled для кнопки записи/сохранения
 * @param isEnabled
 */
function setRecordButtonEnabled(isEnabled) {
	if (isEnabled) {
		$(".record-button").removeClass('disabled');
	} else {
		$(".record-button").addClass('disabled');
	}
}

/**
 * Проверка валидности формы для записи/сохранения
 */
function validateForm() {
	setRecordButtonEnabled(isFormValidToRecord());
}

$(document).ready(function() {

	$.ui.dialog.prototype._focusTabbable = function(){};


	$(document).on('click', ".command-links-link.direct-link",function() {
		$(".command-links").dialog( "close" );
		window.location.href = $(this).data('href');
	});

	$(document).on('click', ".apply-record-request:not(.disabled)", function() {

		const cmdLinkDialog = $(".command-links");
		const popupSelector = ".popup.regAgree-free";

		const selBtn = this;

		if ($(popupSelector).length) {
			showRegAreePopup({
				recordData: this.dataset,
				popupSelector: popupSelector,
				onFail: function(){
					$(selBtn).addClass('disabled');
				},
				onSuccess: function () {
					cmdLinkDialog.dialog("close");
				}
			})
		}
	});

	$(document).on('mouseenter',".record-info-icon", function(){
		$(".cost-info").show();
	});
	$(document).on('mouseleave',".record-info-icon", function(){
		$(".cost-info").hide();
	});

	$(document).on('change', "#regAgree_rules", function () {
		validateForm();
	});

	$(".docsInLpuTableDetail span.nearest-record.free").click(function(){

		const ajax_param = {
			Person_id: $(this).data('person_id'),
			MedStaffFact_id: $(this).data('medstafffact_id'),
			TimetableGraf_begTime: $(this).data('timetablegraf_begtime')
		};

		// формируем окно командных ссылок
		$.ajax({
			url: '/service/record/onSelectFirstFreeDate',
			type: 'POST',
			dataType:'json',
			data: ajax_param,
			success: function(data) {

				console.log(data);

				// формируем окно командных ссылок
				if (data) {

					if (data.error_code && data.error_code === 401) {
						openEnterBoxModal();
						return false;
					} else if (data.error_msg) {
						$.alert(data.error_msg);
						return false;
					}

					var cmdLinks = $(".command-links");
					renderCommandLinks(
						{
							links: data,
							messages: null,
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


			},
			error: function(err){
				$.alert('Ошибка получения информации для записи')
			}
		});
	});

	$( ".timeTable" ).on('click', 'td.free', function(e) {
		var medStaffRegion_endDate = $('.activeWrDocHead').get(0).dataset.medstaffregion_enddate;
		var timetableGraf_begtime = this.dataset.timetablegraf_begtime;
		if((medStaffRegion_endDate && timetableGraf_begtime) && medStaffRegion_endDate < timetableGraf_begtime) {
			$('.popup.noticeYellow.doctorNotWorkOnRegion').dialog({
				dialogClass: "Dialog",
				minWidth: $(window).width() <= 640 ? 299 : 475,
				minHeight: 0,
				modal: true,
			});
			return true;
		}
	    showPopupRegAree(this.dataset,e);
	});
    
    $(".timeTable").on('click', 'td.videochatFree', function (e) {
        if (!this.dataset.person_id) {
            showPopupRegAree(this.dataset, e);
        }
    });

	$(".regAgree-free").on('ready', function () {
		validateForm();
	});

	$('.popup.regAgree-free').on('click','ul.choise-persons-list li div', function(){
		var person_fio = $(this).text();
		var person_id = $(this).get(0).dataset.person_id;
		var timetablegraf_id = $(".regAgree-free-inside").get(0).dataset.timetablegraf_id;

		if(person_id) {
			$("#warning-choice-person").hide();
		}

		if (timetablegraf_id && person_id) {
			// проверяем прикрепление
			$.ajax({
				type: "POST",
				url: '/service/record/checkPersonAttachment',
				dataType: 'json',
				data: {
					timetable_record_id : timetablegraf_id
				},
				success: function (data) {
					console.log('test', data);
					if (data.msg) {
						$('#warning-msg').show();
						$('#agree-msg').show();
						$("#regAgree_rules").prop('checked', false);
						$(".record-button").addClass('disabled');
					}
				},
				error: function (data) {
					$(".record-button").removeClass('disabled');
				}
			});
		}
		$(".choise-text").text(person_fio);
		$(".choise-persons-list").hide();
		$(".arrow ").css("transform", "rotateX(0deg)");
		$("input[name='Person_id']").val(person_id)
	});

	$('.popup.regAgree-free').on('click','.accept-rules', function(){
		validateForm();
	});

	$('.popup.regAgree-free').on('click','.choise-persons', function(){
		if ($(".choise-persons-list").is(':hidden')) {
			$(".choise-persons-list").show();
			$(".arrow ").css("transform", "rotateX(180deg)"); //отражение картинки со стрелочкой
		} else {
			$(".choise-persons-list").hide();
			$(".arrow ").css("transform", "rotateX(0deg)");
		}
	});


	$(".popup.regAgree-free").on('click','.record-button', function(){

		if ( $(this).hasClass('disabled') ) {
			return false;
		}

		let query = '?';
		if ( $('#email_notify_free').prop('checked') ) {
			query += 'email_notify=1&'
		}
		if ( $('#sms_notify_free').prop('checked') ) {
			query += 'sms_notify=1&'
		}
		if ( $('#push_notify_free').prop('checked') ) {
			query += 'push_notify=1&'
		}
		if ( $('#email_notify_free').prop('checked') || $('#sms_notify_free').prop('checked') || $('#push_notify_free').prop('checked') ) {
			query += 'notify_time=' + $( 'select[name="notify_time"]' ).val()
		}

		// Добавляем ТМК параметры
		if (selectedTimeTableTypeId == 13) {
			const consulting_form_id = $("input[name='consulting_form']:checked").val();
			query += '&consulting_form_id=' + consulting_form_id;
			query += '&evndirection_isagreement=' + $("#regAgree_rules").prop('checked');
			if ($("input[name='consulting_form']:checked").val() == 4) {
				query += '&person_phone=' + $("#phone").inputmask('unmaskedvalue');
			}
		}

		const $regContainer = $(".regAgree-free-inside").get(0);

		// Передаем в запрос MedStaffFact_id, если есть
		const medstafffact_id = $regContainer.dataset && $regContainer.dataset.medstafffact_id ? $regContainer.dataset.medstafffact_id : null;
		if (medstafffact_id) {
			query += '&doctor_id=' + medstafffact_id;
		}

		// Нажал один раз и хватит, подожди чуток
		$( "#agree").attr("checked", false);
		$(this).addClass('disabled');
		const record_id = $('.regAgree-free-inside').first().get(0).dataset.timetablegraf_id;
		const person_id = $('.popup.regAgree-free input[name="Person_id"]').val();

		if (record_id && person_id) {
			const url = '/service/record/' + person_id + '/' + record_id +'/record' + query;
			//console.log(url); return false;
			window.location.href = url;
		} else {
			$.alert('Не удалось получить идентификатор бирки');
		}

		return false;
	});

	$(".popup.regAgree-paid").on('click','.record-button', function(){

		const request_data = {
			Person_id: $('.regAgree-paid input[name="Person_id"]').val(),
			MedStaffFact_id: $('.regAgree-paid input[name="MedStaffFact_id"]').val(),
			source_system: $('.regAgree-paid input[name="source_system"]').val(),
			EvnDirection_Descr: $('.regAgree-paid textarea').val()
		};

		if (request_data.Person_id && request_data.MedStaffFact_id) {
			$.ajax({
				url: '/service/record/recordPaid',
				dataType: 'json',
				type: 'POST',
				data: request_data,
				success: function () {
					window.location.href = "/user/cards";
				},
				error: function (err) {
					if (err) console.warn('error:', err);
					$.alert('Ошибка получения информации')
				}
			});
		} else {
			return false;
		}
	});

	$(".btn-newRecord").click(function(e) {
		var recordLink = $(".record-link").length;
		if(!recordLink) {
			if ($(this).parents('.doc-row.row-isPays').length) { //вызывается из записи к врачу
				var dataset = $(this).parents('.doc-row.row-isPays').first().get(0).dataset;
			}
			if($(this).parents('.docInfoBlock').length) {
				var dataset = $(this).parents('.docInfoBlock').first().get(0).dataset
			}
			loadRecordData({
				recordData: dataset,
				popupSelector: '.popup.regAgree-paid',
				cell: $(this),
				isPaid: true
			}).then(function(){
				// здесь могла бы быть ваша реклама...
			});
		}
	});

	$(".popup.regAgree-free, .popup.regAgree-paid").on('click','.record-close-button', function(){
		$(".noLogin").css('overflow','visible'); // запрет скролла страницы
		$(this).parents('.popup').dialog( "close" );
		$('#warning-msg').hide();
		$('#argee-msg').hide();
		if($("select").select2) {
			$("select").select2('destroy');
		}
		return false;
	});

	$(".popup.regAgree-free").on("click", "span.close", function() {
		$(".noLogin").css('overflow','visible'); // запрет скролла страницы
		$(this).parents('.popup').dialog( "close" );
		$('#warning-msg').hide();
		$('#argee-msg').hide();
		$("select").select2('destroy');
		return false;
	});

	$( "#agree" ).change(function() {
		$( ".record-button" ).toggleClass('disabled', !$(this).is(':checked'));
		return false;
	})

	$( "#email_notify" ).click(function() {
		$( "#notify_time" ).prop('disabled', !(this.checked || $( "#sms_notify" ).prop('checked')) );
	})

	$( "#sms_notify" ).click(function() {
		$( "#notify_time" ).prop('disabled', !(this.checked || $( "#email_notify" ).prop('checked')) );
	});



	$('.btnCancelRecord').click(function(e){
        e.stopImmediatePropagation();
        id = this.id;
        if (confirm(DASHBOARD_CANCEL_RECORD_QUESTION)) {
            $.ajaxSetup({
                cache: false
            });
            $.ajax({
                url: '/service/record/cancelRecord/' + id,
                dataType:'json',
                success: function(data) {
                    if(data.success) {
                        window.location.reload();
                    }
                },
                error: function(){
                    $.alert(RECORD_CANCEL_ERROR)
                }
            });
        }
    });

	function startRecord() {
		var hash = window.location.hash.substring(1);
		if ( hash ) {
			document.getElementById(hash).scrollIntoView();
			$( "td.free#" + hash ).click();
		}
	}

	startRecord();
	if ($('.timeTableWrapper').length) {
        let widthPage = $(".timeTableContentSlideContainer").outerWidth();
		$('.timeTableWrapper .timeTableContentSlideContainer').slick({
			infinite: false,
			slidesToShow: 1,
			slidesToScroll: 1,
			speed: 100,
			nextArrow: '.timeTableWeekArrowsRight',
			prevArrow: '.timeTableWeekArrowsLeft',
			swipe: ($(window).width()>=widthPage), //если ширина окна меньше чем размер блока отключается стандартное поведение и применяется плавный скролинг, если ширина окна больше то переключается свайпами постранично
            touchMove: ($(window).width()>=widthPage),
		});
			$(".timeTableContentSlideContainer").scroll(function() {

				let widthBlock = $(".slick-track").outerWidth(); //общая ширина блока
				let scrollLeft = $(".timeTableContentSlideContainer").scrollLeft(); // длина прокрученной области
				let widthPage = $(".timeTableContentSlideContainer").outerWidth(); //ширина одной страницы
				let countPage = Math.ceil(widthBlock / widthPage); // количество страниц
				let pagesLeft = (widthBlock - scrollLeft)/widthPage; // количество оставшихся страниц
				let numPage = Math.ceil(countPage - pagesLeft); // вычисляем номер страницы на которой находимся
				let ttwText = $(".timeTableWeekText"+numPage); // присваивается номер страницы в класс
				if (ttwText.length) {
					$(".timeTableWeekText").html(ttwText.html());
				}
		});

		$('.timeTableWrapper .timeTableContentSlideContainer').on('afterChange', function(event, slick, currentSlide, nextSlide){
				setTimeTableLabel($('.timeTableWeekText' + (slick.currentSlide + 1)).html())
		});
		var setTimeTableLabel = function(t){
				$(".timeTableWeekText")[0].innerHTML = t
		};
	}
	//три точки
	$("body table.timeTable .yellowTableBlock span").each(function(a,b){
		if(b.scrollHeight>36)
		//if(b.clientHeight<b.scrollHeight)
		{
			$(this).addClass('treeDotted');
			var hiddenTooltip = document.createElement( "div" );
			hiddenTooltip.className = 'tableheader-yellow-hiddentooltip';
			hiddenTooltip.innerHTML = b.innerHTML;
			if ($(this).width() > 135) hiddenTooltip.style.width = ($(this).width()-3) + 'px';
			$(this).parents('td').append(hiddenTooltip);
		}
	})

	$( "table.timeTable td.annot" ).hover(
		function() {
			var a_id = $(this).attr('class').match(/ttg-annot-([0-9a-z]+)/i)[1];
			$('.ttg-annot-'+a_id).addClass('annot-active');
		},
		function() {
			$('table.timeTable td.annot').removeClass('annot-active');
		}
	);

	$( ".isAttachmentWrong" ).click(function() {
		$(".popup.warningAttach").dialog({
			dialogClass: "Dialog warningAlertCancelInvite",
			minWidth: 445,
			modal: true
		})
		if ($(window).width() <= 640) {
			let widthScreen = $(window).width();
			let heightwarningAttach = $(".popup.warningAttach").height();
			$(".popup.warningAttach").width(widthScreen-32);
			$(".popup.warningAttach").height(heightwarningAttach+40);
			$("span.close").width(widthScreen-32);
		}


		return false;
	});

	$( ".change-person" ).click(function() {

		$('#current-person-agree').empty();
		$('#current-person-agree').append($(this).text());
        const id = $(this).attr('id')
        $('#person-timetable-submit-link').attr("href", "/service/record/" + id);
        $('#person-timetable-submit-link').attr("data-patient_id", id);
	});
});
