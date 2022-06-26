function getParent(selector,parentName) {
	return selector.parents(parentName);
}

function showSmartHint() {
	var sel = ".record-rating .can-change.stars0";
	if ($(sel).length) {
		var firstEl = $('.record-rating .can-change.stars0').first().get(0);
		var pos = firstEl.getBoundingClientRect();

		var bodyPos = document.body.getBoundingClientRect();
		var offset = pos.top - bodyPos.top;

		$(".smart-hint p").html('Пожалуйста, оцените прием');
		$(".smart-hint").css({ top: (offset-19)+'px' }).css({left: (pos.left-190)+'px'});
		$(".smart-hint").show();
	}
}

function clearFeedbackPopup() {

	// звезды отображение
	$('#starsCount').removeClass();
	$('#starsCount').addClass("mark-bigstars");

	// звезды инпут
	$('#markFeedbackId').val("");

	// текст отзыва
	if ($("[name=content]").length) {
		$("[name=content]").html("");
		$("[name=content]").val("");
	}

	// идентификатор бирки
	$("#rating_timetable_id").val("");
}

function saveFeedbackDoctor(fb_data) {

	var formData = null;
	ShowLoadIndicator();

	// если полная форма отзывов используется
	if (fb_data == undefined) {
		$('#feedback_errors').html('');
		formData = $('#feedbackForm').serialize();
	} else {
		formData = {
			feedback_rating: fb_data.feedback_rating,
			timetable_id: fb_data.timetable_id
		};

		$('.smart-hint').hide();
	}

	$.ajax({
		type: "POST",
		url: '/service/hospitals/saveDoctorFeedback/',
		dataType: 'json',
		data: formData,
		success: function(data) {

			HideLoadIndicator();

			if (data.errors) {

				// если полная форма отзывов используется
				if (fb_data == undefined) {
					$('#feedback_errors').html(data.errors.join('<br/>'));
				}

			} else {

				var header = FEEDBACK_SAVED;

				if (data.type && data.type == 'rating') header = 'Оценка сохранена';
				$.info(data.msg, header);


				var ret_feedback = {
					timetable_id: null,
					rating: null,
					comment: null
				};

				// если полная форма отзывов используется
				if (fb_data == undefined) {

					$(".popup.feedbacksBlock").dialog("close");
					var formParams = $('#feedbackForm').serializeArray();

					formParams.forEach(function(param) {
						if (param.value != undefined) {
							if (param.name == 'timetable_id' ) ret_feedback.timetable_id = param.value;
							if (param.name == 'feedback_rating') ret_feedback.rating = param.value;
							if (param.name == 'content') ret_feedback.comment = param.value;
						}
					});
				} else {
					ret_feedback.timetable_id = fb_data.timetable_id;
					ret_feedback.rating = fb_data.feedback_rating;
				}

				// обновляем рейтинг в истории записей
				if (ret_feedback.timetable_id != undefined && ret_feedback.rating != undefined) {

					var selector = $('#rating-'+ret_feedback.timetable_id);
					if (selector.length) {

						if (fb_data == undefined) {

							// изменяем кол-во звезд
							selector.html('<span class="mark-bigstars stars'+ret_feedback.rating+'"></span>');
							// добавляем кнопки в панель
							selector.parent().find('.toolbox').html('<span class="rate-visit edit"></span><span class="rate-visit delete"></span>');

							// добавляем отзыв
							if (ret_feedback.comment) {

								var more = "";
								if (ret_feedback.comment.length > 50) more = '<span class="more"></span>';

								selector.parent().find('.fb-content').html('' +
									'<span class="close-fb"></span>' +
									'<h4>Мой отзыв</h4>' +
									'<p>'+ret_feedback.comment+'</p>' +
									more
								);
							}
						} else {

							// изменяем кол-во звезд
							selector.html('<span class="can-change mark-bigstars stars'+ret_feedback.rating+'"></span>');

							selector.parent().data('rating', ret_feedback.rating);
							stored_rating_value = null;

							//переводим умную подказку на след. неоцененный фидбэк
							showSmartHint();
						}
					}
				}
			}
		}
	});
	if ($('.add-feedback .rate-visit.rate').length > 0)
		$('.add-feedback .rate-visit.rate').hide();
	return false;
}

function deleteFeedback(timetable_id) {

	$.ajax({
		type: "POST",
		url: '/service/hospitals/deleteFeedback/',
		dataType: 'json',
		data: {
			timetable_id:timetable_id,
			subject: 'doctor'
		},
		success: function(data) {
			if (data.errors) {
				$.info(data.errors, 'Ошибка');
			}
			else {
				$.info('Ваш отзыв был успешно удален', 'Сообщение');

				// обновляем рейтинг в истории записей
				var selector = $('#rating-'+timetable_id);
				if (selector.length) {
					// изменяем кол-во звезд
					selector.html('<span class="mark-bigstars stars0"></span>');
					// меняем отображение кнопок
					// selector.parent().find('.toolbox').html('<a href="#" class="rate-visit rate">Оценить прием</a>');
					selector.parent().find('.toolbox').html('<span></span>');
					// убираем отзыв
					selector.parent().find('.fb-content').html('');
				}
			}
		}
	});
	if ($('.add-feedback .rate-visit.rate').length > 0)
	$('.add-feedback .rate-visit.rate').show();
	return false;
}

var selected_stars_id = null;
var stored_rating_value = null;

$(document).ready(function() {
	
	$( "#sendFeedbackLpu" ).click(function(e, x){
		var form = $('#feedbackForm');
		$('#feedback_errors').html('');
		$.ajax({
			type: "POST",
			url: '/service/hospitals/saveLpuFeedback/' + $('#Lpu_id').val(),
			dataType: 'json',
            data: form.serialize(),
			success: function(data) {
				if (data.errors) {
					$('#feedback_errors').html(data.errors.join('<br/>'));
				} else {

					var header = FEEDBACK_SAVED;
					if (data.type && data.type == 'rating') header = 'Оценка сохранена';
						$.info(data.msg, header);
				}
			}
		});
		
		return false;
	});
	
	$( "#sendFeedbackDoctor" ).click(function(e, x){
		saveFeedbackDoctor();
		return false;
	});

	$(".mark-bigstars").mousemove(function(e) {

		var countStars = Math.floor(e.offsetX/22)+1,
			starsClassName = "stars"+countStars,
			markText = '';
			
		$(this).removeClass( "stars0 stars1 stars2 stars3 stars4 stars5");
		if (  (countStars-1 == 0) && (e.offsetX%22 < 5) ){}
		else{
			$(this).addClass(starsClassName);
			markText = FEEDBACK_RATING[countStars - 1] || '';
		};

		if ($(this).siblings(".markText").length != 0)
			$(this).siblings(".markText")[0].innerHTML = markText;
	});

	$(document).on('mousemove','.can-change.mark-bigstars',function(e){

		var current_id = $(this).parent().attr('id');

		if (!selected_stars_id) {
			selected_stars_id = current_id;
			stored_rating_value = getParent($(this), '.remind').data('rating');
		}

		if (selected_stars_id && selected_stars_id == current_id) {
			var num = Math.floor(e.offsetX/22)+1;

			$(this).removeClass("stars0 stars1 stars2 stars3 stars4 stars5");

			if ((num-1 == 0) && (e.offsetX%22 < 5)) {}
			else {
				$(this).addClass("stars" + num);
				getParent($(this), '.remind').data('new-rating', num);
			}
		}
	});

	$(document).on('mouseleave','.can-change.mark-bigstars',function(e){

		selected_stars_id = 0;
		var num = getParent($(this), '.remind').data('rating');

		$(this).removeClass("stars0 stars1 stars2 stars3 stars4 stars5");
		$(this).addClass("stars"+num);

	});

	$(document).on('click','.can-change.mark-bigstars',function(e){

		var current_id = $(this).parent().attr('id');

		if (selected_stars_id && selected_stars_id == current_id) {

			selected_stars_id = null;
			var new_rating_value = getParent($(this), '.remind').data('new-rating');

			if (new_rating_value != stored_rating_value && new_rating_value != 0) {
				saveFeedbackDoctor({
					feedback_rating: new_rating_value,
					timetable_id: getParent($(this), '.remind').data('timetable_id')
				});
			}

		} else {
			selected_stars_id = current_id;
			stored_rating_value = getParent($(this), '.remind').data('rating');
		}
	});

	$(".mark-bigstars").click(function(e) {
		var countStars = Math.floor(e.offsetX/22)+1,
			starsClassName = "stars"+countStars,
			markText = '';
			
		if (  (countStars-1 == 0) && (e.offsetX%22 < 5) ){
			$(this).siblings("#markFeedbackId").attr('value', countStars-1);
		}
		else{
			$(this).siblings("#markFeedbackId").attr('value', countStars);
		}

	});
	
	$(".mark-bigstars").mouseleave(function(e) {
		var countStars = $(this).siblings("#markFeedbackId").attr('value'),
			starsClassName = "stars"+countStars,
			markText = '';

		if ($(this).siblings(".markText").length != 0)
			$(this).siblings(".markText")[0].innerHTML = FEEDBACK_RATING[parseInt(countStars) - 1] || '';

		$(this).removeClass( "stars0 stars1 stars2 stars3 stars4 stars5");
		$(this).addClass(starsClassName);
	});

	$(document).on('click', '.fb-content span.more', function() {
		$(this).hide();
		$(this).parent().addClass('expanded');
		$(this).parents('.service').addClass('no-overflow');
		if ($(window).width() <= 640) {
			$(this).parents(".service.order").first().find(".review-text").first().attr('style', 'height: 100% !important');
		}

		getParent($(this), '.remind').find('.toolbox').addClass('to-front');
		getParent($(this), '.remind').find('.record-rating').addClass('to-front');
	});

	$(document).on('click', '.fb-content.expanded .close-fb ', function() {
		$(this).parent().find('span.more').show();
		$(this).parent().removeClass('expanded');
		$(this).parents('.service').removeClass('no-overflow');
		if ($(window).width() <= 640) {
			$(this).parents(".service.order").first().find(".review-text").first().attr('style', 'height: 32px !important');
		}
		getParent($(this), '.remind').find('.toolbox').removeClass('to-front');
		getParent($(this), '.remind').find('.record-rating').removeClass('to-front');
	});

	$(document).on('click', '.rate-visit.delete', function() {
		var timetable_id = getParent($(this), '.remind').data("timetable_id");
		deleteFeedback(timetable_id);
	});

	$(document).on('click', '.rate-visit.rate, .rate-visit.edit', function() {

		var timetable_id = getParent($(this), '.remind, .add-feedback').data("timetable_id");
		clearFeedbackPopup();

		$.ajax({
			type: "GET",
			url: '/service/record/getVisitRatingData?record_id=' + timetable_id,
			dataType:'json',
			success: function(response) {

				if (response.error != undefined) { console.log(response.error);	}
				else {

					var minHeight = 299;
					if (response.data == null) {

						$("#rating_timetable_id").val(timetable_id);

					} else {

						var feedback = response.data;

						// опубликован анонимно
						if (feedback.publish_type == 2) $("[name=publishBy]").prop('checked', true);

						// текст отзыва
						$("[name=content]").html(feedback.comment);
						$("[name=content]").val(feedback.comment);

						// звезды отображение
						$('#starsCount').addClass('stars' + feedback.rating);

						// звезды инпут
						$('#markFeedbackId').val(feedback.rating);

						// идентификатор бирки
						$("#rating_timetable_id").val(feedback.timetable_id);
					}

					$(".popup.feedbacksBlock").dialog({
						dialogClass: "Dialog",
						minWidth: $(window).width() <= 640? 299 : 664,
						minHeight: minHeight,
						modal: true,
						open: function(){
							$(this).css('padding', '20px 30px');

							var expanded_container = $('.fb-content.expanded');
							if (expanded_container.length) expanded_container.find('.close-fb').trigger("click");
						}
					})

				}
			}
		});

		return false;
	});

	$(".popup.feedbacksBlock .close").click(function() {
		$(".popup.feedbacksBlock").dialog( "close" );
		return false;
	});

	$(document).mouseup(function(e) {

		// для модалки с отзывом
		var container = $(".popup.feedbacksBlock");
		if (container.length && container.css('display') != 'none') {
			if (!container.is(e.target) && container.has(e.target).length === 0) {
				container.dialog( "close" );
			}
		}

		var expanded_container = $('.fb-content.expanded');

		if (expanded_container.length) {
			if (!expanded_container.is(e.target) && expanded_container.has(e.target).length === 0) {
				expanded_container.find('.close-fb').trigger("click");
			}
		}
	});

});