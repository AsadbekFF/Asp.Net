const debugMode = true;

function VideoChat(config) {

	if (!config) config = {};
	const videoChat = this;

	// конфиг реквайра
	require.config({
		paths: {
			main: '/design/common_new/js',
		}
	});


	videoChat.onNestedRequireLoaded = new CustomEvent("onNestedRequireLoaded", {
		detail: {}
	});

	videoChat.loadComponents().then(function(){
		videoChat.init(config);
	});
}

VideoChat.prototype = {

	sounds: {
		IncomingCall: '../../design/common_new/sounds/IncomingCall.mp3',
		CallEnd: '../../design/common_new/sounds/CallEnd.mp3',
		CheckSound: '../../design/common_new/sounds/CheckSound.mp3',
		WaitingDoctor: '../../design/common_new/sounds/WaitingForTheInterlocutor.mp3',
		DoctorAnswered: '../../design/common_new/sounds/doctorAnswered.mp3'
	},

	requires: [
		//'videoChat.OfferWindow',
		'VideoChat.lib.ContactManager',
		'VideoChat.lib.setting',
		'VideoChat.lib.StreamsMixer',
		'VideoChat.lib.Connection',
		'VideoChat.lib.EventManager',
        'VideoChat.lib.BrowserManager',
        'VideoChat.lib.DeviceManager',

		//'videoChat.lib.ScreenCapture',
		//'videoChat.lib.RecorderFactory',
		//'videoChat.store.Message'
	],

	user: null,
	options: {},
	settings: {},
	devices: {video: [], audio: []},
	status: null,
	socket: null,
	events: null,
	room: null,
	dialog: null,
	recorder: null,
	connections: [],
	controllerPath: '/telemed',
	mainWrapper: 'bodyWrapper div.content',
	curEvnDirection: null,
	templates: {},
    timer: 0,
    typeCall: {audio: true, video: true},//тип вызова при инициализации
    streams: {audio: null, video: null},//стримы self устройств
	messageNotificationTpl: [
		'<p style="font-weight: bold;">',
		'{SurName} {FirName} {SecName}',
		'</p>',
		'<p>',
		'{text}',
		'</p>'
	],

	classes: {},
	requireListeners: [],
	loadComponents: function(external) {

		const videoChat = this;
		let requires = [];

		return new Promise(function (resolve, reject) {

			// определяем системные модули
			const modules = (external) ? external : videoChat.requires;

			if (modules.length > 0) {

				requires = requires.concat(modules.map(function(moduleName){
					return 'main/' + moduleName.replace(/\./gi, '/')
					})
				);

				log(requires, 'load modules');
				// подключаем файлы
				requirejs(requires, function() {

					let isListenerEnabled = false;

					modules.forEach(function(module, i){
						videoChat.initReferences(module).then(function(cls){

							log(cls, 'resolve init of ' + module);

							if (!cls.hasNestedRequires && !isListenerEnabled) {
								resolve();
							} else {

								isListenerEnabled = true;

								// Подписываемся на событие которое ждет прогрузки вложенных модулей
								document.addEventListener('onNestedRequireLoaded', function (e) {

									if (e.detail.className === module) {
										log('can be resolve ' + e.detail.className);
										resolve();
										return true;
									}

								}, false);
							}
						});
					})
				});
			} else {
				reject(new Error('no_modules'));
			}

		});
	},
	startTimer: function() {
		let videoChat = this;
		let clock = videoChat.clock;
		const timer = $(".videochat-call-start-timer");
		clock.seconds++;
		if (clock.seconds >= 59) {clock.minutes++; clock.seconds = 0;}
		if (clock.minutes >= 59) {clock.hours++; clock.minutes = 0;}

		if (clock.hours > 23) {
			clock.hours = 0;
			clearInterval(clock.refreshTimer);
			videoChat.getDateTimeFromServer();
		}
		let formatCurTime = ""; //нужен для сравнения с callBefore
		if(clock.minutes < 10) {
			formatCurTime = clock.hours + ":" + "0" + clock.minutes;
		} else {
			formatCurTime = clock.hours + ":" + clock.minutes;
		}
		
		timer.each(function (index, elem) {
            const ttg_begtime = elem.dataset.timetablegraf_begtime;
            const ttg_begtimeArr = ttg_begtime.split(":");
			const ttgH = Number(ttg_begtimeArr[0]);
			const ttgM = Number(ttg_begtimeArr[1]);
			const timeLimit = videoChat.config.timeLimit;
			let callBefore = "";
			let sumTime = ttgM+timeLimit;
			let numHour = Math.floor(sumTime/60);
			if(sumTime >= 60) {
				if(sumTime-(60*numHour) < 10) {
					callBefore = ttgH+(numHour) + ":" + "0" + (sumTime-(60*numHour));
				} else {
					callBefore = ttgH+(numHour) + ":" + (sumTime-(60*numHour));
				}
			} else {
				callBefore = ttgH + ":" + (ttgM+timeLimit);
			}

			let showTimer = true; // признак показа таймера
			let h = ttgH - clock.hours;
			let m = ttgM - clock.minutes;

			if(m <= 0) {
                if (h <= 0) {
                    showTimer = false;
                } else {
                    h--;
                    m = (60+ttgM)-clock.minutes;
                    if (h < 10) h = "0" + h;
                }
			}
			if (h < 0) {
				showTimer = false;
			}
			m--;
			if (m < 10) m = "0" + m;

			if (showTimer) {
                $(elem).text("Консультация начнётся через " + h + " ч " + m + " мин");
                $(elem).addClass("button-timer");
			} else {
				$(elem).text("Позвонить врачу до " + callBefore);
				$(elem).addClass("endOfReception");
				// $(elem).hide();
			}
			if(formatCurTime == callBefore) {
				$(elem).parents('.service').remove();
			}
		})
	},

    getDateTimeFromServer: function() {
		var videoChat = this;
		var clock = videoChat.clock;

		$.ajax({
			withoutPreloader: true,
            url: '/scoreboard/refreshDateTimeFromServer',
            dataType: 'JSON',
            success: function(datetime) {
				clock.hours = parseInt(datetime.hours);
				clock.minutes = parseInt(datetime.minutes);
				clock.refreshTimer = setInterval(function() { videoChat.startTimer() }, 1000);
            },
            error: function(){
                setTimeout(getDateTimeFromServer, 10000); // если ответа нет, повторяем еще раз через 10 сек
            }
        });
    },

	initReferences: function(module) {

		const videoChat = this;

		return new Promise(function (resolve, reject) {

			log(module,'initClass');
			videoChat.classes[module] = videoChat.createReference(module);
			resolve({
				hasNestedRequires: (videoChat.classes[module].requires && videoChat.classes[module].requires.length > 0) ? true : false
			});
		});
	},

	create: function(className){

		const videoChat = this;

		if (videoChat.classes[className]) {
			let obj = Object.assign({}, videoChat.classes[className]);
			return Object.setPrototypeOf(obj, videoChat.classes[className]);
		} else {
			return null;
		}
	},

	createReference: function(classNameStr){

		const videoChat = this;
		let classList = classNameStr.split('.');
		let classInstance = (window || this);

		if (classList[classList.length-1]) {
			classInstance = classInstance[classList[classList.length-1]];
			return new classInstance(videoChat);
		} else {
			return null;
		}
	},
	init: function(config) {

		const videoChat = this;
		// Реакция на видимость окна
		// проверено только на последних версиях FF и Chrome
        window.document.onvisibilitychange = function () {
        	// Если видео не выключено пользователем, выключаем/включаем видео
        	if (!videoChat.user['videousermuted']) {
				videoChat.setMuted('video', window.document.hidden);
			}
		};
		videoChat.initEvents();
		videoChat.initTemplates();

		this.clock = {
			hours: 0,
			minutes:0,
			seconds:0,
			refreshTimer:0
		};

		videoChat.setting = videoChat.create('VideoChat.lib.setting');
		videoChat.mixer = videoChat.create('VideoChat.lib.StreamsMixer');
		videoChat.contactManager = videoChat.create('VideoChat.lib.ContactManager');
		videoChat.eventManager = videoChat.create('VideoChat.lib.EventManager');
		videoChat.browserManager = videoChat.create('VideoChat.lib.BrowserManager');
		videoChat.deviceManager = videoChat.create('VideoChat.lib.DeviceManager');

		videoChat.addEvent = videoChat.eventManager.add.bind(videoChat.eventManager);
		videoChat.removeEvent = videoChat.eventManager.remove.bind(videoChat.eventManager);
		videoChat.fireEvent = videoChat.eventManager.fire.bind(videoChat.eventManager);

		log('bind event fn')

		videoChat.observeUserList = [];

		videoChat.config = config;
		videoChat.initSocket();
		videoChat.user = config.user || null;

		videoChat.addEvent('setStatus', function(status, oldStatus, cause) {
			if (status == 'connect' && (oldStatus == 'waitAnswer' || oldStatus == 'income')) {
				videoChat.saveCall();
			}
		}, videoChat);

		videoChat.addEvent('connectUser', videoChat.onConnectUser, videoChat);
		videoChat.addEvent('disconnectUser', videoChat.onDisconnectUser, videoChat);
		videoChat.addEvent('observeUsers', videoChat.contactManager.onObserve, videoChat.contactManager);

		if (config.textChatIsOn) videoChat.initChatWindow();
		if	($('.check-settings-communication').length > 0) {
			videoChat.browserManager.browserIsSupported();
		}
	},

	initTemplates: function(){

		const videoChat = this;
		const tplSelector = '.vc-template';

		$(tplSelector).each(function(i, tpl){
			const tplName = $(tpl).attr('id');
			videoChat.templates[tplName] = $(tpl).clone();

			// убираем
			$(tpl).remove();
		});

		log('t', videoChat.templates)
		return false;
	},

	initSocket: function(){

		const videoChat = this;
		let address = null;

		videoChat.options = videoChat.config.options;
		if($('.serviceContentVideoChat').length > 0) { // если нет видеобирок то не обращаемся
			setInterval(function() {

				$.ajax({
					type: 'post',
					url: "/user/getNotifications",
					dataType: 'JSON',
                    global: false,
					success: function (data) {
						if(data != '' && typeof data !== "undefined" && data.records) {
							const records = data.records;
							let currentTime = typeof data.currentDate != 'undefined' ? new Date(data.currentDate.datetime.date) : new Date();
							let minuteDiff = 0;
							$.each(records,function(index, rec) {
								if(typeof(rec.TimetableGraf_begTime.date) != "undefined" && rec.TimetableGraf_begTime.date !== null) { // при записи бывает ошибки и не обновляется бирка на которую только что записался, поэтому добавил эту проверку
									let ttg_begTime = new Date(rec.TimetableGraf_begTime.date);
									minuteDiff = Math.round((ttg_begTime-currentTime)/60000)+1; // сделал +1 потому что происходил опережение на минуту
									minuteDiff--;
									if(minuteDiff > 0) {
										const selector = ".pushBoxTMK div ul.push-items li p";
										let hours = currentTime.getHours();
										let minutes = currentTime.getMinutes();
										let minutesText = 'минут';
										if(minutes < 10) {
											minutes = '0' + minutes;
										}
										if(minuteDiff <= 4 && minuteDiff > 1) {
											minutesText = 'минуты';
										}
										if(minuteDiff == 1) {
											minutesText = 'минуту';
										}
										if (minuteDiff <= 15) {
											$(".pushBoxTMK").show();
											$(".pushBoxTMK").get(0).dataset.timetablegraf_id = rec.TimetableGraf_id;
											$(selector + ".push-content").text("Через " + minuteDiff + ' ' + minutesText + " онлайн консультация. " + rec.Person_FIO + " записан " + rec.datetime_readable + " к " + rec.MedPersonal_FIO);
											$(selector + ".push-date").text(hours + ':' + minutes);
										}
										if (minuteDiff <= 0 && minuteDiff >= -5) { // если пациент немного просрочил время приёма всё равно показывает уведомление
											$(".pushBoxTMK").show();
											$(".pushBoxTMK").get(0).dataset.timetablegraf_id = rec.TimetableGraf_id;
											$(selector + ".push-content").text("Начните онлайн консультацию. " + rec.Person_FIO + " записан " + rec.datetime_readable + " к " + rec.MedPersonal_FIO);
											$(selector + ".push-date").text(hours + ':' + minutes);
										}
									} else {
										$(".pushBoxTMK").hide();
									}
								}
							});
						} else {
							$(".pushBoxTMK").hide();
						}
					},
					error: function (e) {
						console.log('e', e)
					}
				});
			},60000);
		}
		$(".pushRead").click(function () {
			const pushBoxTMK = $(".pushBoxTMK")
			let timetablegraf_id = pushBoxTMK.get(0).dataset.timetablegraf_id;
			console.log('timetablegraf_id111',timetablegraf_id);
			//console.log('push_id',push_id);
			let params = {
				TimetableGraf_id:timetablegraf_id,
			};
			$.ajax({
				url: "/user/pushUpdateStatus",
				dataType: 'JSON',
				data: params,
				success: function (data) {
					console.log('data', data);
					pushBoxTMK.hide();
				},
				error: function (e) {
					console.log('e', e)
				}
			})
		});


		if (videoChat.options.enable && videoChat.options.host) {
			address = videoChat.options.host;
		}
		videoChat.getDateTimeFromServer();

		log(videoChat.options.host, 'VideoChat.options.host');
		if (!address) return;

        videoChat.disconnectSocket();
        videoChat.connectSocket(address);
	},

	notifyMessages: function(messages) {
		var me = this;
		if (!messages) return;
		if (!$.isArray(messages)) messages = [messages];
		messages.forEach(function(message) {
			me.notifyMessage(message);
		});
	},

	notifyMessage: function(message) {
		let me = this;
		let $chatWindow = $('.chat-window');
		let curEvnDirection_id = $chatWindow.data('record_data') ? $chatWindow.data('record_data').EvnDirection_id : null;

		if (!message.pmUser_sid ||
			(!message.file_name && message.pmUser_sid == me.user.pmUser_id) ||
			curEvnDirection_id != message.EvnDirection_id) {
			return;
		}
		let lengthLimit = 60;
		if (message.file_name) {
			message.text = `<a target="_blank" href="/telemed/getFileMessage?id=${message.id}" download>${message.file_name}</a>`;
			if (message.pmUser_sid == me.user.pmUser_id) {
				message.FullName = 'Вы:';
			}
		} else if (message.text.length > lengthLimit + 3) {
			message.text = message.text.substr(0, lengthLimit) + '...';
		}

		let mes_tpl = this.setMessageTpl(message);
		let $all_message = $("#all-mess");
		me.appendBorderDate($all_message);
		$all_message.append(mes_tpl);
	},

	isContact: function(user) {
		return true;
	},

	setStatus: function(status, cause) {
		var me = this;
		var oldStatus = me.status;

		me.status = status;
		me.fireEvent('setStatus', status, oldStatus, cause);
	},

	getStatus: function() {
		return this.status || 'disconnected';
	},

	getVideoDevices: function() {
		return this.devices.video.slice();
	},

	getAudioDevices: function() {
		return this.devices.audio.slice();
	},

	getCurrentVideoDevice: function(data) {
		if (!data || !data.stream) return null;
		var me = this;
		var videoLabel = null;

		if (data.stream.getVideoTracks().length > 0) {
			videoLabel = data.stream.getVideoTracks()[0].label;
		}
		return me.devices.video.find(function(device) {
			return device.label == videoLabel;
		});
	},

	getCurrentAudioDevice: function(data) {
		if (!data || !data.stream) return null;
		var me = this;
		var audioLabel = null;

		if (data.stream.getAudioTracks().length > 0) {
			audioLabel = data.stream.getAudioTracks()[0].label;
		}
		return me.devices.audio.find(function(device) {
			return device.label == audioLabel;
		});
	},
	updateDeviceData: function(device, type) {

		const me = this;

		let	clientDevices = (type === 'audio') ? me.getAudioDevices() : me.getVideoDevices();
		let subject = '';

		if (type === 'audio') {
			subject = 'Micro';
		} else if (type === 'video')  {
			subject = 'Camera';
		}

		let oldDevice = clientDevices.find(function(oldDevice){
			return oldDevice.deviceId = device.deviceId;
		});

		if (!device.label && oldDevice && oldDevice.label) {
			device.label = oldDevice.label;
		}

		log(device.deviceId, 'refresh ' + subject + ' device')

		if (!me.settingsTmp) {
			me.settingsTmp = {
				Micro:  me.settings.Micro,
				Camera:  me.settings.Camera
			};
		}

		// приоритетно вписываем выбранное устройство, если оно есть
		if (me.settingsTmp[subject] && device.deviceId == me.settingsTmp[subject]) {
			me.settings[subject] = device.deviceId;
		}

		// иначе вписываем первое попавшееся
		if (!me.settings[subject]) {
			me.settings[subject] = device.deviceId
		}

		me.devices[type].push(device);
		log(me.settings[subject], 'refresh ' + subject + ' device')
	},
	refreshDevices: function(devices) {

		const me = this;

		me.devices.video = [];
		me.devices.audio = [];

		me.settings.Micro = null;
		me.settings.Camera = null;

		log(devices,'refresh devices')
		devices.forEach(function(device) {
			if (device.kind == 'videoinput') {
				me.updateDeviceData(device, 'video');
			}
			if (device.kind == 'audioinput') {
				me.updateDeviceData(device, 'audio');
			}
		})

		return me.devices;
	},

	microphoneInputAnalyzer: function(vol){

		let squares = $('.analyzer-square');
		let squareLength = Math.round(vol/10);

		let range = squares.slice(0, squareLength);

		for (let i = 0; i < squares.length; i++) {
			squares[i].style.backgroundColor="#e6e7e8";
		}

		for (let i = 0; i < range.length; i++) {
			range[i].style.backgroundColor="#69ce2b";
		}
	},

	onCheckSettings: function(stream){

		const videoChat = this;

		audioContext = new AudioContext();
		if(stream.getAudioTracks().length) {
            analyser = audioContext.createAnalyser();
            microphone = audioContext.createMediaStreamSource(stream);
            javascriptNode = audioContext.createScriptProcessor(2048, 1, 1);
            
            analyser.smoothingTimeConstant = 0.8;
            analyser.fftSize = 1024;
            
            microphone.connect(analyser);
            analyser.connect(javascriptNode);
            javascriptNode.connect(audioContext.destination);
            javascriptNode.onaudioprocess = function () {
                var array = new Uint8Array(analyser.frequencyBinCount);
                analyser.getByteFrequencyData(array);
                var values = 0;
                
                var length = array.length;
                for (var i = 0; i < length; i++) {
                    values += (array[i]);
                }
                
                var average = values / length;
                videoChat.microphoneInputAnalyzer(average);
            }
        }
	},

	onShowSettingsPanel: function(){

		const videoChat = this;
        videoChat.deviceManager.getPlugedDevices({checkBrowserVersion: true}).then(function (result) {
            if(result && result.stream.getAudioTracks().length > 0) {
                    // затем заюзаем стрим и запустим его
                    videoChat.gettingStream = videoChat.deviceManager.getPlugedDevices({
                        checkSettings: true
                    }).then(function (data) {
                        videoChat.stream = data.stream;
                        const audioDevices = data.devices.filter(device => device.kind === 'audioinput');
                        let options = "";
            
                        audioDevices.forEach(function (device) {
                            options += '<option value="' + device.deviceId + '">' + device.label + '</option>';
                        })
            
                        if (!options) {
                            options = '<option value="0">Нет доступных устройств</option>'
                        }
                        $('#audio-source-selector').html(options);
            
                        const videoDevices = data.devices.filter(device => device.kind === 'videoinput');
                        options = "";
            
                        videoDevices.forEach(function (device) {
                            options += '<option value="' + device.deviceId + '">' + device.label + '</option>';
                        })
            
                        if (!options) {
                            options = '<option value="0">Нет доступных устройств</option>'
                        }
                        $('#video-source-selector').html(options);
            
            
                        const selfVideo = document.getElementById('settings-self-video');
                        if (selfVideo) selfVideo.srcObject = data.stream;
                    })
            }else{
                $('.setting-communication-window .close').trigger('click')
            }
        });
	},

	initDevices: function(){

		const me = this;
		return new Promise(function(resolve, reject){

			const isHttpsProto = location.protocol === 'https:';

			if (!isHttpsProto) {
				reject({message: 'Для совершения видеозвонка обязательно использование HTTPS-протокола'});
			}
            
            if (navigator.mediaDevices) {
                navigator.mediaDevices.enumerateDevices().then(function (devices) {
                    if (devices) {
                        resolve(devices);
                    } else {
                        reject({message: 'Ошибка проверки доступа к устройствам пользователя'});
                    }
                }).catch(function (error) {
                    reject(error);
                });
                
            } else {
				reject({message: 'Не найдены устройства для совершения видеозвонка'});
			}
		})
	},

	getTracks: function(stream, type) {
		if (!stream || (type && !['audio', 'video'].includes(type))) {
			return [];
		}

		return stream.getTracks().filter(function(track) {
			return !type || track.kind == type;
		});
	},

	stopStream: function(data) {

		if (!data || !data.stream || !data.stream.active) {
			return;
		}

		data.stream.getTracks().forEach(function(track) {
			track.stop();
		});
		data.stream = null;
	},

	stopVideo: function(data) {
		var me = this;
		if (!data.video) return;
		me.stopStream({stream: data.video.srcObject});
		data.video.srcObject = null;
	},

	isMuted: function(type) {
		var me = this;
		return me.getTracks(me.stream, type).every(function(track) {
			return !track.enabled;
		});
	},

	setMuted: function(type, muted) {

		var me = this;
		if (!me.room) return;

		me.getTracks(me.stream, type).forEach(function(track) {
			track.enabled = !muted;
		});

		me.onSetMuted(me.user, type, muted);
		me.socket.emit('setMuted', me.room, type, muted);
	},

	onSetMuted: function(user, type, muted) {

		var me = this;
		var types = type ? [type] : ['video','audio'];

		types.forEach(function(t) {
			if (user == me.user) {
				me.toggleSelfView(t, muted)
			} else {
				me.toggleRemoteView(t, muted);
			}
		});
	},

	toggleSelfView: function(type, muted){

		if (type === 'video') {
            //выключено если инициализирован аудио звонок или отсутствует видеоустроиство
            if (this.typeCall.video === false || this.streams.video === null) {
                return;
            }
		    
			const selfVideo = $(".vc-self-video-panel");

			if (selfVideo.length) {
				selfVideo.toggle(!muted);
			}

			const cameraBtn = $('button.vc-btn.toggleVideo span.camera');

			if (cameraBtn.length) {
				cameraBtn.toggleClass('off', !muted);
				cameraBtn.parent().toggleClass('transparent', !muted);
			}
		}

		if (type === 'audio') {
			const micBtn = $('button.vc-btn.toggleMic span.mic');
			if (micBtn.length) {
				micBtn.toggleClass('off', !muted);
				micBtn.parent().toggleClass('transparent', !muted);
			}
		}
	},

	toggleRemoteView: function(type, muted){

		if (type === 'video') {
			$("#remote-video").toggle(!muted);
			$(".no-video-view").toggle(muted);
		}

		if (type === 'audio') {
			let text = muted ? 'Микрофон собеседника отключён' : '' ;
			$(".call-view-notice").html(text);
			$(".no-video-view .vc-default-doctor-avatar").toggle(!muted);
		}
	},

	mute: function(type) {
		this.setMuted(type, true);
	},

	unmute: function(type) {
		this.setMuted(type, false);
	},

	getConnection: function(user) {
		var me = this;
		return me.connections.find(function(connection) {
			return connection.user.pmUser_id == user;
		});
	},

	getStream: function(video, audio) {
		var me = this;

		// if (me.stream) {
		// 	return Promise.resolve(me.stream);
		// }
        return me.initDevices().then(function(devices) {
			me.refreshDevices(devices);

			// только затем получаем стрим
			return me.deviceManager.getPlugedDevices({checkBrowserVersion: true}).then(function(data) {
                if (!data || !data.stream) return;
                me.stream = data.stream;
				return data.stream;
			});
		})
	},

	saveCall: function() {

		var videoChat = this;
		var params = {};

		if (videoChat.connections.length == 0) return;

		var pmUser_ids = videoChat.connections.map(function(connection) {
			return connection.user.pmUser_id;
		}).concat(videoChat.user.pmUser_id);

		params.pmUser_iid = videoChat.user.pmUser_id;
		params.pmUser_ids = JSON.stringify(pmUser_ids);
		params.room = videoChat.room;

		videoChat.socket.emit('callStarted', videoChat.room);
		videoChat.onCallStarted();
	},

	call: function(users, video, audio, data) {
		var me = this;
		if (!users) return;
		if (users && !users.length) users = [users];

		if (me.getStatus() == 'free') {
			me.setStatus('waitAnswer');
		}

		var userKeys = [];
		users.forEach(function(user) {
			if (!me.getConnection(user)) {
				userKeys.push(user.pmUser_id);
				const connection = me.create('VideoChat.lib.Connection');
				connection.setUser(user);
			}
		});

		if (userKeys.length == 0) {
			return;
		}

		var getRoom = function(room) {
			me.room = room;
		};

		if (!data) data = {};

		const inviterInfo = {
			ShortName: me.user.ShortName,
			Contact_Description: me.user.Contact_Description,
			TimetableGraf_id: data.TimetableGraf_id ? data.TimetableGraf_id : null,
			Person_id: data.Person_id ?  data.Person_id : null,
			EvnDirection_id: data.EvnDirection_id ? data.EvnDirection_id : null,
			MedStaffFact_id: data.MedStaffFact_id ? data.MedStaffFact_id : null
		};

		const curUser = me.user && me.user.pmUser_id ? +me.user.pmUser_id : null;
		me.curEvnDirection = null;

		me.getStream(video, audio).then(function(stream) {
			if (!me.room) {
				me.socket.emit(
					'createRoom',
					userKeys,
					getRoom,
					inviterInfo,
					curUser,
				);
			} else {
				me.socket.emit(
					'invite',
					me.room,
					userKeys,
					inviterInfo
				);
			}
		}).catch(function(error) {
			me.setStatus(null);
			me.showError(error);
		});
	},

	connectSocket: function(address) {
		var me = this;
		var socket = me.socket = io(address, {forceNew: true});

		log(socket, 'connect socket')

		socket.on('connect', function() {
			socket.emit('init', {
				pmUser_id: me.user.pmUser_id,
				hasCamera: (me.settings.Camera) ? me.settings.Camera : false,
				hasMicro: (me.settings.Micro) ? me.settings.Micro : false
			}, function(success) {
				if (!success) {
					me.disconnectSocket();
					return;
				}

				if (me.connections.length == 0) {
					me.setStatus('free');
				}

				me.fireEvent('connect');
			});
		});

		socket.on('disconnect', function(cause) {
			me.fireEvent('disconnect');
			// me.contactManager.globalStore.each(function(record) {
			// 	record.set('Status', 'offline');
			// });
			me.hangup('disconnect');
		});

		socket.on('observeUsersEvent', function(type, data) {
			me.fireEvent('observeUsers', type, data);
		});

		socket.on('message', function(message) {
			me.notifyMessages(message);
		});

		socket.on('setMuted', function(userKey, trackType, muted) {
			if (userKey != me.user.pmUser_id) {
				me.contactManager.getRecord(userKey).then(function(user) {
					user[trackType+'muted'] = muted;
					me.onSetMuted(user, trackType, muted);
				});
			}
		});

		socket.on('invite', function(room, inviter, inviterInfo = null) {
			if (me.getStatus() != 'free') {
				socket.emit('leave', room, 'busy');
				return;
			}

			me.room = room;
			me.setStatus('income');

			log(inviterInfo, 'inviterInfo')

			me.contactManager.getRecord(inviter).then(function(user) {

				const Contact_FullName = me.capitalize(user.SurName.toLowerCase())
					+ ' ' + me.capitalize(user.FirName.toLowerCase())
					+ ' ' + me.capitalize(user.SecName.toLowerCase());
				playAudio([me.sounds.IncomingCall], true);

				me.show('videoChat-offer-window', {
					params: {
						Contact_FullName: Contact_FullName,
						Contact_Description: user.Contact_Description,
					},
					wndEvents: {
						onAccept: function() {
                                stopAudio();
                                let EvnDirection_id = inviterInfo && inviterInfo.EvnDirection_id ? inviterInfo.EvnDirection_id : null;
								let joinInfo = {
									EvnDirection_id: EvnDirection_id,
									room: me.room
								}
                                me.show('videoChat-call-window', {
                                    ownerCt: me.mainWrapper,
                                    clearContent: true,
                                    params: {
										usersKeys: [user.pmUser_id],
										EvnDirection_id: EvnDirection_id,
										Contact_FullName: Contact_FullName,
                                        Call_State: 'Соединяем...'
                                    },
                                    callback: function () {
                                    	socket.emit('joinRoom', me.room, joinInfo);
                                    }
                                })
						},
						onRefuse: function() {
							stopAudio();
							me.hangup('refuse');
						}
					}
				});
			});
		});

		socket.on('connectTo', function(userKey) {

			if (userKey == me.user.pmUser_id) {
				return;
			}

			me.contactManager.getRecord(userKey).then(function(user) {
				var connection = me.create('VideoChat.lib.Connection');
				connection.setUser(user);

				me.getStream(true, true).then(function(stream) {
					connection.initPeer();
					me.mixer.setStream(me.stream);
					return stream;
				}).then(function(mixedStream) {

					const tracks = mixedStream.getTracks().map(function (track) {
						connection.peer.addTrack(track, mixedStream);
						return track.kind
					});
					//добавляем видео соединение (для добавления видео дорожки к текущему соединению в будущем)
                    !tracks.includes('video') && connection.peer.addTransceiver('video')
                    
					return connection.peer.createOffer({iceRestart: true});
				}).then(function(offer) {
					connection.peer.setLocalDescription(offer);
					var offerObj = {offer: offer, video: true, audio: true};
					me.socket.emit('offer', userKey, offerObj);
				}).catch(function(error) {
					connection.close('fail');
					me.showError(error);
				});
			});
		});

		socket.on('offer', function(userKey, offerObj) {

			log('offer');

			if (offerObj.reset) {

				log('offer reset');

				var connection = me.getConnection(userKey);
				connection.resetDescription = true;
				connection.peer.setRemoteDescription(offerObj.offer);
				return;
			}


			me.contactManager.getRecord(userKey).then(function(user) {
				var connection = me.create('VideoChat.lib.Connection');
				connection.setUser(user);

				log('get record getstream', offerObj);

				me.getStream(offerObj.video, offerObj.audio).then(function(stream) {
					connection.initPeer();
					me.mixer.setStream(me.stream);
					log('getstream')
					return stream;
				}).then(function(mixedStream) {
                    if (!mixedStream) return;
					mixedStream.getTracks().forEach(function(track) {
						connection.peer.addTrack(track, mixedStream);
					});

					log('then getstream')

					connection.peer.setRemoteDescription(offerObj.offer);
					return connection.peer.createAnswer();
				}).then(function(answer) {
                    if (!answer) {
                        me.hangup('fail')
                        return;
                    }
					log('before answer')
					connection.peer.setLocalDescription(answer);
					socket.emit('answer', userKey, answer);
					connection.sendCandidates();
				}).catch(function(error) {
					connection.close('fail');
					me.showError(error);
				});
			});
		});

		socket.on('answer', function(userKey, answer) {
			var connection = me.getConnection(userKey);

			if (!connection || !connection.candidates[0]) {
				if (connection) {
					connection.close('fail');
				} else if (me.connections.length == 0) {
					me.hangup('fail');
				}
				//todo: сообщение о невозможности соединения
				return;
			}

			connection.peer.setRemoteDescription(answer);
			connection.sendCandidates();
		});

		socket.on('iceCandidate', function(userKey, candidate) {
			var connection = me.getConnection(userKey);
			if (!connection || !connection.peer) return;
			connection.peer.addIceCandidate(candidate).catch(me.showError);
		});

		socket.on('callStarted', function(room) {
			me.setStatus('call');
			me.unmute('audio');
			me.unmute('screen');
		});

		socket.on('leave', function(userKey, cause) {

			log('onLeave')

			var connection = me.getConnection(userKey);
			if (connection) {
				connection.close(cause);
				stopAudio()
			} else {
				stopAudio()
				log('to resetcall type')
				me.contactManager.getRecord(userKey).then(function(user) {

					log('reset user call type')

					user.videocall = null;
					user.audiocall = null;
					if (me.getStatus() == 'income') {
						me.hangup(cause);
					}
				});
			}
		});

		socket.on('roomCreated', function(room) {
			if (!me.room) {
				me.room = room;
			}
		});
	},

	disconnectSocket: function() {
		var me = this;
		if (!me.socket) return;
		me.socket.disconnect();
		me.socket = null;
	},

	observeUsers: function(userList) {

		log('observe users')

		const me = this;
		if (!me.socket || !me.status) {
			log(!me.socket,'!me.socket')
			log(!me.status,'!me.status')
			return;
		}

		if (Array.isArray(userList)) {
			const records = me.contactManager.getObservable();
			userList = records.map(function(record){
				return record.pmUser_id
			});
		}

		log('emit user list')
		me.socket.emit('observeUsers', userList);
	},

	clearObserveUsers: function() {
		var me = this;
		if (!me.socket || !me.status) return;
		me.socket.emit('observeUsers', []);
	},

	hangup: function(cause) {
		var me = this;
		if (!me.socket || me.getStatus() == 'free') {
			return;
		}
		const content = $(".content")

		let $chatWindow = content.find('.chat-window');
		$chatWindow.find('.chat-panel').removeClass('chat-panel-in-call');
		$chatWindow.hide();
		$('#video-chat-module').prepend($chatWindow);


		content.not(':first').remove()
        if	(me.oldContent) {
			content.replaceWith(me.oldContent);
		}
		$(".video-chat-offer-window").hide(); //когда копируем в методе show то это окно уже видно
		$(".top-slideshow").show(); //слайдер с главной страницы
        const slider = $('.top-slideshow .wrapper')
        //обновляем слайдер 
        if (slider.length > 0) {
            slider.slick('refresh');
        }
		if(cause == 'callIsOver') {
			stopAudio();
			playAudio([me.sounds.CallEnd]);
			let regexp = /\d\d[-:]\d\d/g;
			let timer = $(".vc-header-panel .state").text().slice(0,5); // берем первые 5 симоволов (00:00)

			me.show('videoChat-call-is-over-window', {
				params: {
					timer: timer.match(regexp)
				}
			});
		}

        if (me.status == 'income' && cause == 'refuse') {
            me.show('videoChat-decline-call-window', {params: {}});
			if(window.location.pathname == "/user/cards") {
				$(".decline-call-window .button").hide();
				$(".decline-call-window").height(240);
			}
        }

		if (cause == 'notFound') {
			alert('Собеседник не найден');
		}
		if (cause == 'fail') {
			alert('Не удалось соединиться');
		}
		if (cause == 'busy') {
			alert('Контакт занят');
		}
		if (me.status == 'waitAnswer' && cause == 'refuse') {
			alert('Вызов отклонен');
		}

		if (me.mixer) me.mixer.stop();
		me.stopStream({stream: me.stream});
		me.connections.slice().forEach(function(connection) {
			connection.close(cause, false);
		});

		me.socket.emit('leave', me.room, cause);
		me.connections = [];
		me.stream = null;
		me.gettingStream = null;
		me.room = null;
		me.curEvnDirection = null;
		me.onCallStarted = me.emptyFn;

		if (cause == 'disconnect') {
			me.setStatus(null, cause);
		} else {
			me.setStatus('free', cause);
		}
	},

	// сообщение при ошибке добавления показателей
	showError: function(error){
		log(error);
		alert(error);
	},
	emptyFn: function(){},
	capitalize: function(s){
		return s[0].toUpperCase() + s.slice(1);
	},
	renderTpl: function(params) {

		const videoChat = this;
		return new Promise(function (resolve, reject) {

			const targetCt = $('.'+ ((params.ownerCt) ? params.ownerCt : videoChat.mainWrapper));

			if (targetCt.length) {
				if (videoChat.templates[params.tplName]) {

					const output = videoChat.templates[params.tplName];

					if (params.data) {

						let p = params.data;

						// подставляем параметры
						Object.keys(p).forEach(function (templateParam) {
							if (p[templateParam] === null || p[templateParam] === 'null') {
								p[templateParam] = '';
							}
							output.html(output.html().replace('{'+templateParam+'}', p[templateParam]));
						});
                        if (params.tplName === 'videoChat-choose-way-communication') {
                            output.attr("data-record_data", p.record_data);
                        }
                        if (params.tplName === 'videoChat-call-window') {
                            output.find('.contact-name').text(p.Contact_FullName);
                            output.find('.state').text('00:00');
                            let $chatWnd = $('.chat-window');
                            $chatWnd.find('.chat-panel').addClass('chat-panel-in-call');
                            params.chatWnd = $chatWnd;
                            videoChat.showChatWindow(params);
							targetCt.addClass('video-chat');
							targetCt.html(output);
							targetCt.append($chatWnd);
							$('.top-slideshow').hide();
                        }
						if (params.clearContent && params.tplName != 'videoChat-call-window') {
							targetCt.addClass('video-chat')
							targetCt.html(output);
							$('.top-slideshow').hide();

						} else {
							targetCt.append(output);
						}

						resolve();
					} else {
						reject({error: 'no_template_params'});
					}

				} else {
					reject({error: 'template_not_exist'});
				}
			} else {
				reject({error: 'no_template_target_ct'});
			}
		})

	},
	show: function(wndName, wndParams){

		const videoChat = this;
		const tplName = wndName;
        
        const content = $(".content")
        if (!content.hasClass('video-chat')) {
            videoChat.oldContent = content.clone(true);
        }
		videoChat.renderTpl({
			ownerCt: (wndParams.ownerCt) ? wndParams.ownerCt : null,
			tplName: tplName,
			clearContent: wndParams.clearContent ? wndParams.clearContent : false,
			data: wndParams.params
		}).then(function(){

			log(tplName + ' rendered');

			if (wndParams.wndEvents) {
				videoChat.assignWndEvents(wndName, wndParams.wndEvents);
			}

			$('#' + tplName).show();
			if (wndParams.callback && typeof wndParams.callback === 'function') {
				wndParams.callback();
			}
		}).catch(function(error){
			alert(error);
		});
	},
	toggleCallOption: function(params){
		const isMuted = params.muted !== undefined ? params.muted : !this.isMuted(params.option);
		this.user[params.option + 'usermuted'] = isMuted; // флаг активности аудио/видео заданный польователем
		this.setMuted(params.option, isMuted);
	},
	initEvents: function(){

		const videoChat = this;
		const mainWrapper = $('.' + videoChat.mainWrapper);

		mainWrapper.on('click','.video-chat-main-window .hangup', function(){
			videoChat.hangup('callIsOver');
		});

		mainWrapper.on('click','.setting-communication-column .play-audio', function(){
			$(".play-audio").toggleClass("stop-audio");
			if($(this).hasClass('stop-audio')) {
				playAudio([videoChat.sounds.CheckSound], true);
				$(this).text('Остановить');
			} else {
				stopAudio();
				$(this).text('Проиграть звук');
			}

		});

		mainWrapper.on('click','.check-settings-communication', function(){
			if($(".RegisteredVideoChat").length > 0) {
				$(".RegisteredVideoChat").hide();
			}
			videoChat.show('videoChat-setting-communication', {params: {},callback(){
					videoChat.onShowSettingsPanel();
				}});
		});

		mainWrapper.on('click','.endOfReception', function(e){
		    const params = {
		        record_data: e.currentTarget.dataset.record_data,
		    }
			videoChat.show('videoChat-choose-way-communication', {params: params});
		});

        mainWrapper.on('click','td.videochatFree', function(){
            videoChat.show('videochat-select-time', {params: {}});
			$(".message-videochat p").text(this.dataset.timetablegraf_begtime_format + ' можно будет позвонить врачу');
			$(".select-time-videochat .continue").data(this.dataset);
        });

        $( ".text-videochatIsOn" ).hover(
            function() {
                $(this).next('.tooltip-videochat').show();
            },
            function() {
                $(this).next('.tooltip-videochat').hide();
            }
        );

		mainWrapper.on('click', '.continue', function(e) {
			showPopupRegAree($(this).data(),e);
			$(this).parent().hide();
		});

		mainWrapper.on('click','.video-chat-main-window .toggleVideo', function(){
			videoChat.toggleCallOption({
				option: 'video'
			});
		});

		mainWrapper.on('click','.video-chat-main-window .toggleMic', function(){
			videoChat.toggleCallOption({
				option: 'audio'
			});
		});

		mainWrapper.on('click','.close, .call-is-over .button, .refuse', function(){
			$(this).parent().hide();
		});

		// добавить новые замеры
        $('.contact-list').on('click','.send-push-video-chat', function(){
            videoChat.sendPush();
        });

		mainWrapper.on('click','.choose-way-communication .close', function(){
			$(".choose-way-communication").remove();
		});

		mainWrapper.on('click','.setting-communication-window .close', function(){
			$(".setting-communication-window").remove();
			videoChat.stopStream({stream: videoChat.stream});
			stopAudio();
		});

		// добавить новые замеры
		$('.contact-list').on('click','.call-contact', function(){
			const userKey = $(this).data('pmuser_id');
			videoChat.showCallWindow(userKey);
		});

		mainWrapper.on('click','.choose-way-communication .option', function(){
      const el = this
      const ownerCt = $(el).parents('.choose-way-communication').first();
			const record = ownerCt.data('record_data');

			const isAudioCall = $(el).hasClass('audiocall');
			if (isAudioCall) {
			    videoChat.typeCall.video = false
                videoChat.setMuted('video', true)
				videoChat.onCallStarted = function(){
					videoChat.toggleCallOption({option: 'video', muted: true});
				}
			}else{
			    videoChat.typeCall.video = true
                videoChat.setMuted('video', false)
				videoChat.onCallStarted = function(){
					videoChat.toggleCallOption({option: 'video', muted: false});
				}
            }
            
            videoChat.deviceManager.getPlugedDevices().then(function (result) {
                $(".choose-way-communication").remove();
                if (result && result.stream.getAudioTracks().length > 0) {
                  videoChat.setStatus('initCall');
									videoChat.curEvnDirection = record;
                  videoChat.contactManager.loadRecordsByEvnDirection(record.EvnDirection_id);
                } else {
                    alert('Не удалось получить идентификатор контакта врача')
                }
            });

		$('#videochat-disconnect').on('click', function(){
			videoChat.disconnectSocket();
		});

		$('#videochat-connect').on('click', function(){
			videoChat.connectSocket();
		});

		$('#videochat-add-contact').on('click', function(){
			videoChat.addContact();
		});
		});
	},

	onAfterObserve: function(onlineUsers) {
		if (this.getStatus() === 'openChatWindow') {
			const usersKeys = onlineUsers.map(function(user) {
				return user.pmUser_id;
			});
			this.showChatWindow({usersKeys: usersKeys});
			return;
		}
		if (this.getStatus() === 'initCall') {
			if (onlineUsers.length === 0) {
				const doctorFIO = this.curEvnDirection && this.curEvnDirection.DoctorFIO ? this.curEvnDirection.DoctorFIO + ' ' : '';
				alert('Врач ' + doctorFIO + 'не в сети. Попробуйте позвонить позже.')
				return;
			}

			this.showCallWindow(onlineUsers);
		}
	},

	assignWndEvents: function(wndName, params){

		const videoChat = this;
		const wnd = $('#'+ wndName);

		if (wnd.length) {
		    
			if (params.onAccept && typeof params.onAccept === 'function') {
				wnd.on('click','.acceptVideoCall', function(el){
                    videoChat.onSetMuted(videoChat.user, 'video', false);//включаем отображение своего окна с видео
                    videoChat.typeCall.video = true;
                    videoChat.deviceManager.getPlugedDevices().then(function () {
                        params.onAccept();
                    });
                    wnd.off()
                    wnd.hide();
				});

				wnd.on('click','.acceptAudioCall', function(el){

					videoChat.onCallStarted = function(){
						videoChat.toggleCallOption({option: 'video'});
					};
                    videoChat.typeCall.video = false;
                    videoChat.deviceManager.getPlugedDevices({checkBrowserVersion: true}).then(function () {
                        params.onAccept();
                    });
                    wnd.off()
                    wnd.hide();
				});
			}

			if (params.onRefuse && typeof params.onRefuse === 'function') {
				wnd.on('click','.declineCall', function(el){
					params.onRefuse();
					wnd.hide();
				});
			}
		} else {
			log('can`t find assigned window');
		}
	},
	showCallWindow: function(users){

		const videoChat = this;
		const record = videoChat.curEvnDirection;
		const usersKeys = users.map(function(user) {
			return user.pmUser_id;
		});
		playAudio([videoChat.sounds.WaitingDoctor],true);
		videoChat.show('videoChat-call-window', {
			ownerCt: videoChat.mainWrapper,
			clearContent: true,
			params: {
				Contact_FullName: record.MedPersonal_FullFIO,
				Call_State: 'Соединяю...',
				EvnDirection_id: record.EvnDirection_id,
				usersKeys: usersKeys,
			},
			callback: function() {
				videoChat.call(users, true, true, record);
			}
		})


		$('#videochat-disconnect').on('click', function(){
			videoChat.disconnectSocket();
		});

		$('#videochat-connect').on('click', function(){
			videoChat.connectSocket();
		});

		$('#videochat-add-contact').on('click', function(){
			videoChat.addContact();
		});
	},
	sendPush: function() {

		const videoChat = this;

		$.ajax({
			type: 'post',
			data: {},
			url: videoChat.controllerPath + '/sendPush',
			success: function (responseData) {
				alert('Зло успешно пробудилось')
			},
			error: function (resp) {

			}
		});
	},
	loadContactList: function() {

		const videoChat = this;
		// если список контактов был уже загружен в стор, то берем его оттуда
		if (videoChat.contactManager && videoChat.contactManager.globalStore &&
			videoChat.contactManager.globalStore.data &&
			videoChat.contactManager.globalStore.data.items &&
			videoChat.contactManager.globalStore.data.items.length > 0) {
			videoChat.onLoadContactList(videoChat.contactManager.globalStore.data.items);
			return;
		}

		$.ajax({
			withoutPreloader: true,
			type: 'post',
			data: {},
			url: videoChat.controllerPath + '/loadPMUserContactList',
			success: function (responseData) {
				if (responseData.data && Array.isArray(responseData.data)) {
					videoChat.onLoadContactList(responseData.data);
				}
			},
			error: function (resp) {

			}
		});
	},
	onLoadContactList: function(contacts) {
		if (Array.isArray(contacts)) {
			let rows = '';
			contacts.forEach(function(contact) {
				rows += '<tr><td><a href="#" class="call-contact" data-pmuser_id="'+ contact.pmUser_id +'">'+contact.SurName+' ('+contact.Login+')</td><td></td></tr>';
			});
			$('#contact-list-content').html(rows);
		}
	},
	showVideoChatWindow: function(){
		log('showVideoChatWindow');
	},
	updateVideoSource: function(){

		const videoChat = this;
		const remoteVideo = document.getElementById('remote-video');
		const selfVideo = document.getElementById('self-video');

		if (remoteVideo) {
			stopAudio();
			playAudio([videoChat.sounds.DoctorAnswered]);

			$('.contact-list').hide();
			$('.no-video-view').hide();

			log(videoChat.connections, 'connections');

			videoChat.connections.some(function (connection) {
				remoteVideo.srcObject = connection.stream;
				return true;
			});

			selfVideo.srcObject = videoChat.stream;
			const callState = $('.state');

			if (callState.length) {
                videoChat.timer = 0
				videoChat.timeIntervalId = setInterval(function() {
					callState.html(videoChat.convertTime());
				}, 1000);
			}
		} else {
			log('cant get remoteVideo element')
		}
	},
	onCallStarted: function(){},
	onConnectUser: function(connection) {
		this.connections.forEach(function(conn) {
			if (conn !== connection) {
				conn.close('fail');
				log('close user');
			}
		});

		this.updateVideoSource();
	},
	onDisconnectUser: function(connection) {

		if (this.connections.length > 0) {
			return;
		}

		const callWindow = document.getElementById('videoChat-call-window');

		if (callWindow) {
			callWindow.remove();
		}

		$('.contact-list').show();
		$('.no-video-view').show();

		if (this.timeIntervalId) {
			clearInterval(this.timeIntervalId);
			this.timeIntervalId = null;
		}
	},
	convertTime: function() {

		const videoChat = this;
		const time = videoChat.timer++
		if (!time) return '00:00';

		var timePart = function(number) {
			if (videoChat.getNumberLength(number) < 2) {
				return '0'+number;
			}
			return number;
		};

		var _seconds = Math.floor(time);
		var _minutes = Math.floor(_seconds/60);
		var _hours = Math.floor(_minutes/60);

		var hours = _hours;
		var minutes = _minutes - _hours*60;
		var seconds = _seconds - _minutes*60;

		return (hours?timePart(hours)+':':'')+timePart(minutes)+':'+timePart(seconds);
	},
	getNumberLength: function(number) {
		return Math.log(number) * Math.LOG10E + 1 | 0;
	},
	onLoadStore: function(){
		this.contactManager.observe();
	},
    errorHandler: function (error, device) {
        if (error && error.name && error.name === 'NotAllowedError' || error && error.name && error.name === 'PermissionDeniedError') {
            alert('Вы заблокировали доступ к ' + (device === 'video' ? 'камере' : 'микрофону') + '. Если вы не сохранили ваш выбор, то для повторного разрешения перезагрузите страницу. Иначе необходимо сбросить доступ к устройству в настройках браузера.')
        } else if (error && error.name && error.name === 'NotFoundError' || error && error.name && error.name === 'DevicesNotFoundError') {
            device === 'video' ? alert('Камера не найдена.') : alert('Микрофон не найден.');
        } else if (error && error.name && error.name === 'NotReadableError' || error && error.name && error.name === 'TrackStartError') {
            device === 'video' ? alert('Камера уже используется.') : alert('Микрофон уже используется.');
        } else if (error && error.name && error.name === 'OverconstrainedError' || error && error.name && error.name === 'ConstraintNotSatisfiedError') {
            device === 'video' ? alert('Камера не найдена.') : alert('Микрофон не найден.');
        } else if (error && error.message === "Invalid constraint") {
            alert('Медиа устройства не поддерживаются');
        } else {
            log(error);
            alert(error && error.message ? error.message : 'Неизвестная ошибка')
        }
    },
	initChatWindow: function () {
		let videoChat = this;
		let $close_btn = $('#chat-window-close-btn');
		let $chat_window = $('.chat-window');
		let $loadMask = $('.chat-message-panel-mask');
		let $loadInputMask = $('.chat-message-container-mask');
		$loadMask.hide();
		$loadInputMask.hide();

		$("#chat-message-input").keypress(function (e) {
			if(e.which == 13 && !e.shiftKey) {
				$("#chat-message-form").submit();
				e.preventDefault();
			}
		});

		$(document).on('click', '.videochat-message-panel-button', function () {
			const EvnDirection_id = $(this).data('evn_direction_id');
			videoChat.setStatus('openChatWindow');

			videoChat.curEvnDirection = {
				EvnDirection_id: EvnDirection_id,
				TimeDiff: $(this).data('time_diff'),
				DoctorFIO: $(this).data('med_personal_fio'),
				isPastRecord: $(this).data('is_past_record'),
			};
			videoChat.contactManager.loadRecordsByEvnDirection(EvnDirection_id);
		});
		$close_btn.on('click', function () {
			$chat_window.hide();
			videoChat.curEvnDirection = null;
		})

	},
	showChatWindow: function (params = {}) {
		let videoChat = this;
		let EvnDirection_id = null;
		const usersKeys = params.usersKeys || params.data.usersKeys;
		let btn = params.btn;
		let $chat_window = params.chatWnd || $('.chat-window');
		let $loadMask = $('.chat-message-panel-mask');
		let $loadInputMask = $('.chat-message-container-mask');
		let $chat_panel_header = $('.chat-panel-header');
		let $form = $("#chat-message-form");
		let $input = $("#chat-message-input");
		let $file = $("#chat-file-input");
		let $all_messages = $("#all-mess");
		let $chat_message_panel = $('.chat-message-panel');
		let ownerCt = null;
		let TimeDiff = 0;
		let DoctorFIO = '';
		let isPastRecord = false;

		EvnDirection_id = params.data && params.data.EvnDirection_id ? params.data.EvnDirection_id : null;

		if	(videoChat.curEvnDirection && videoChat.getStatus('openChatWindow')) {
			EvnDirection_id = videoChat.curEvnDirection && videoChat.curEvnDirection.EvnDirection_id ? videoChat.curEvnDirection.EvnDirection_id : null;
			TimeDiff = videoChat.curEvnDirection.TimeDiff;
			DoctorFIO = videoChat.curEvnDirection.DoctorFIO;
			$chat_panel_header.html("<p>"+DoctorFIO+"</p>");
			isPastRecord = $(btn).data('is_past_record');
		}

		videoChat.setStatus('free');
		$all_messages.empty();
		$chat_window.show();
		$loadMask.show();

		$.ajaxSetup({
			cache: false
		});
		$.ajax({
			url: '/telemed/loadMessageList',
			withoutPreloader: true,
			dataType: 'json',
			type: 'POST',
			data: {
				EvnDirection_id: EvnDirection_id
			},
			success: function (messages) {

				messages.data.sort(function(a, b){
					return a.id - b.id;
				});
				let oldDate = null;
				messages.data.forEach(message => {
					let newDate = Date.parse(message.dt.slice(0,10));
					if (!oldDate || (oldDate && (newDate - oldDate > 0))) {
						let dayBorderTpl = videoChat.setDayBorderTpl(newDate);
						$all_messages.append(dayBorderTpl);
						oldDate = newDate;
					}
					let mes_tpl = videoChat.setMessageTpl(message);
					$all_messages.append(mes_tpl);

				});
				$chat_window.data({'record_data': {'EvnDirection_id': EvnDirection_id}});

				if ($all_messages && $all_messages.get()[0] && $all_messages.get()[0].scrollHeight) {
					$all_messages.scrollTop($all_messages.get()[0].scrollHeight);
				}
			},
			complete: function () {
				$loadMask.hide();
				if ((TimeDiff < 0 && $all_messages.children().length === 0) || TimeDiff > 1 || isPastRecord) {
					$chat_message_panel.hide();
				} else {
					$chat_message_panel.show();
				}
			}
		});

		$form.off('submit');
		$form.on('submit', function (e) {
			e.preventDefault();
			if	(!$input.val()) return;
			$loadInputMask.show();

			$.ajax({
				withoutPreloader: true,
				url: '/telemed/sendMessage',
				dataType:'json',
				type: 'POST',
				data: {
					pmUser_did: JSON.stringify(usersKeys),
					EvnDirection_id: $chat_window.data('record_data').EvnDirection_id,
					text: $input.val()
				},
				success: function(data){
					let mes_tpl = videoChat.setMessageTpl({
						FullName: 'Вы',
						text: data.data.text || 'Сообщение не отправлено, попробуйте еще раз'
					});
					if (data.data.text) {
						$input.val('');
					}
					videoChat.appendBorderDate($all_messages);
					$all_messages.append(mes_tpl);
					$all_messages.scrollTop($all_messages.get()[0].scrollHeight);
				},
				error: function(){
					console.log('Ошибка отправки сообщения');
				},
				complete: function () {
					$loadInputMask.hide();
				}
			});
		});

		$file.off('change');
		$file.on('change', function(){
			let file = this.files[0] || null;

			// ничего не делаем если files пустой
			if( !file ) return;

			// создадим объект данных формы
			var data = new FormData();

			// Проверяем размер файла
			let sizeLimitMB = 500;
			let sizeLimitB = sizeLimitMB * 1024 * 1024;
			if (file.size > sizeLimitB) {
				let mes_tpl = videoChat.setMessageTpl({
					FullName: 'Вы',
					text: 'Размер передаваемого файла превышает 500мб!'
				});
				$all_messages.append(mes_tpl);
				return;
			}
			// Проверяем тип файла
			let types = ['rtf', 'pdf', 'docx', 'xlsx', 'jpg', 'gif', 'png', 'bmp', 'xml', 'csv', 'MP3', 'WAV', 'AVI', 'MP4', 'MPG','MPEG'];
			let fileName = file.name.split('.');
			let fileType = fileName[fileName.length - 1];
			if (types.indexOf(fileType) === -1) {
				let mes_tpl = videoChat.setMessageTpl({
					FullName: 'Внимание!!!',
					text: 'Файлы типа ' + fileType + ' передавать запрещено!'
				});
				$all_messages.append(mes_tpl);
				$all_messages.scrollTop($all_messages.get()[0].scrollHeight);
				return;
			}
			data.append( 'FileMessage', file );

			data.append('pmUser_did', JSON.stringify(usersKeys));
			data.append('EvnDirection_id', $chat_window.data('record_data').EvnDirection_id);

			$loadInputMask.show();

			$.ajax({
				url: '/telemed/sendFileMessage',
				type: 'POST',
				withoutPreloader: true,
				data: data,
				cache: false,
				dataType: 'json',
				// отключаем обработку передаваемых данных, пусть передаются как есть
				processData : false,
				// отключаем установку заголовка типа запроса. Так jQuery скажет серверу что это строковой запрос
				contentType : false,
				success: function() {
					$all_messages.scrollTop($all_messages.get()[0].scrollHeight);
				},
				error: function(){
					console.log('Ошибка отправки сообщения с файлом');
				},
				complete: function () {
					$loadInputMask.hide();
				}

			});
		});
	},
	setMessageTpl: function (message) {
		return `
		<div class="message-view ${message.FullName == 'Вы' ? 'message-right' : 'message-left'}" data-date="${message.dt}">
			<p class="message-view__content">
				 ${message.text}
			</p>
		</div>`;
	},
	setDayBorderTpl: function (date) {
		return ` <div class="day-border">
					<p>${new Date(date).toLocaleDateString('ru-RU', {day: 'numeric', month: 'long', year: 'numeric'}).slice(0,-3)}</p>
				</div>`;
	},
	appendBorderDate: function($all_messages) {
		let videoChat = this;
		let lastMess = $all_messages.find('.message-view').last();
		let lastMessDate = lastMess && lastMess.data('date') ? Date.parse(lastMess.data('date').slice(0, 10)) : 0;
		let today = new Date().setHours(0, 0, 0, 0);
		if ($all_messages.length === 0 || today - lastMessDate > 0 ) {
			let dayBorderTpl = videoChat.setDayBorderTpl(today);
			$all_messages.append(dayBorderTpl);
		}
	},
};

// FROM EXT
function Store(engine) {
	this.init(engine);
}

// FROM EXT
Store.prototype = {
	requires: [
		'VideoChat.MixedCollection'
	],
	alias: '',
	proxy: {
		keyField: 'id',
	},
	init: function (engine) {

		let store = this;
		store.engine = engine;

		store.engine.loadComponents(store.requires).then(function(){
			store.data = engine.create('VideoChat.MixedCollection');

			store.engine.onNestedRequireLoaded.detail.className = store.alias;
			store.data.setKeyField(store.proxy.keyField);

			// сообщаем что зависимости модуля загружены
			document.dispatchEvent(store.engine.onNestedRequireLoaded);
		});
	},
	getById: function(id){
		return this.data.key(id);
	},
	load: function(params){
		const store = this;
		store.proxyLoad(params);
		return true;
	},
	proxyLoad: function(params){

		const store = this;
		let loadParams = params.params;
		let callback = store.engine.emptyFn;

		if (params.callback && typeof params.callback  === 'function') {
			callback = params.callback;
		}

		$.ajax({
			withoutPreloader: true,
			type: 'post',
			data: loadParams,
			url: loadParams.url || store.proxy.url,
			success: function (responseData) {
				store.onLoadData(responseData.data, callback);
			},
			error: function (resp) {
				console.error(resp);
			}
		});
	},
	onLoadData: function(r, callback){

		const store = this;

		store.data.clear();
		store.data.addAll(this.data.prepareData(r));
		callback(store.data.items);

		store.engine.onLoadStore();
	},
	get: function(name){
		return this.data[name];
	}
};

function log(title, param) {
	if (debugMode) {
		if (param) console.warn(title, param);
		else console.warn(title);
	}
}
