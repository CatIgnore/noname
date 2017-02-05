character.gujian={
	character:{
		gjqt_bailitusu:['male','shu',4,['xuelu','fanshi','shahun']],
		gjqt_fengqingxue:['female','wu',3,['qinglan','yuehua','swd_wuxie']],
		gjqt_xiangling:['female','wu',3,['qianhuan','meihu','xidie']],
		gjqt_fanglansheng:['male','wu',3,['fanyin','mingkong','fumo']],
		gjqt_yinqianshang:['male','qun',4,['zuiji','zuizhan']],
		gjqt_hongyu:['female','shu',4,['jianwu','meiying']],

		gjqt_yuewuyi:['male','wei',4,['yanjia','xiuhua','liuying']],
		gjqt_wenrenyu:['female','shu',4,['chizhen','dangping']],
		gjqt_xiayize:['male','qun',3,['xuanning','liuguang','yangming']],
		gjqt_aruan:['female','wu',3,['zhaolu','jiehuo','yuling']],

		gjqt_xunfang:['female','shu',3,['manwu','xfanghua']],
		gjqt_ouyangshaogong:['male','shu',3,['yunyin','shishui','duhun']],
	},
	skill:{
		zuiji:{
			enable:'phaseUse',
			filterCard:true,
            position:'he',
			viewAs:{name:'jiu'},
			viewAsFilter:function(player){
				if(!player.num('he')) return false;
			},
			prompt:'将一张手牌或装备牌当酒使用',
			check:function(card){
				return 5-ai.get.value(card);
			},
			ai:{
				threaten:1.2
			}
		},
		manwu:{
			trigger:{global:'phaseEnd'},
			check:function(event,player){
				return ai.get.attitude(player,event.player)>0;
			},
			filter:function(event,player){
				var nh=event.player.num('h');
				for(var i=0;i<game.players.length;i++){
					if(game.players[i]!=event.player&&game.players[i].num('h')<nh){
						return false;
					}
				}
				return true;
			},
			logTarget:'player',
			content:function(){
				trigger.player.draw();
			},
			ai:{
				expose:0.1
			}
		},
		xfanghua:{
			trigger:{target:'useCardToBegin'},
			priority:-1,
			filter:function(event,player){
				return get.color(event.card)=='red'&&player.isDamaged();
			},
			frequent:true,
			content:function(){
				player.recover();
			},
			ai:{
				effect:{
					target:function(card,player,target,current){
						if(get.color(card)=='red'&&target.isDamaged()) return [1,1];
					}
				}
			}
		},
		duhun:{
			enable:'chooseToUse',
			filter:function(event,player){
				if(event.type!='dying') return false;
				if(player!=event.dying) return false;
				if(player.maxHp<=1) return false;
				if(player.num('h')==0) return false;
				return true;
			},
			filterTarget:function(card,player,target){
				return target!=player&&target.num('h')>0&&target.hp>0&&target.hp<=player.maxHp;
			},
			content:function(){
				'step 0'
				player.chooseToCompare(target);
				'step 1'
				if(!result.bool){
					player.die();
					event.finish();
				}
				else{
					event.num=target.hp-player.hp;
					player.loseMaxHp();
				}
				'step 2'
				player.changeHp(event.num);
				'step 3'
				event.target.changeHp(-event.num);
				'step 4'
				if(event.target.hp<=0){
					event.target.dying({source:player});
				}
			},
			ai:{
				order:1,
				skillTagFilter:function(player){
					if(player.maxHp<=1) return false;
					if(player.hp>0) return false;
					if(player.num('h')==0) return false;
				},
				save:true,
				result:{
					target:-1,
					player:1
				},
				threaten:2
			},
		},
		yunyin:{
			trigger:{player:'phaseEnd'},
			direct:true,
			subSkill:{
				count:{
					trigger:{player:'useCard'},
					forced:true,
					popup:false,
					silent:true,
					filter:function(event,player){
						return _status.currentPhase==player;
					},
					content:function(){
						if(!player.storage.yunyin){
							player.storage.yunyin=[];
						}
						var suit=get.suit(trigger.card);
						if(suit){
							player.storage.yunyin.add(suit);
						}
					}
				},
				set:{
					trigger:{player:'phaseAfter'},
					forced:true,
					popup:false,
					silent:true,
					content:function(){
						delete player.storage.yunyin;
					}
				}
			},
			filter:function(event,player){
				if(!player.storage.yunyin) return true;
				var hs=player.get('h');
				for(var i=0;i<hs.length;i++){
					if(!player.storage.yunyin.contains(get.suit(hs[i]))) return true;
				}
				return false;
			},
			group:['yunyin_count','yunyin_set'],
			content:function(){
				'step 0'
				player.chooseToDiscard(get.prompt('yunyin'),function(card){
					if(!player.storage.yunyin) return true;
					return !player.storage.yunyin.contains(get.suit(card));
				}).set('logSkill','yunyin').ai=function(card){
					return 9-ai.get.value(card);
				}
				'step 1'
				if(!result.bool){
					event.finish();
					return;
				}
				var list=[];
				for(var i=0;i<lib.inpile.length;i++){
					var name=lib.inpile[i];
					var type=get.type(name);
					if(type=='trick'||type=='basic'){
						if(lib.filter.cardEnabled({name:name},player)){
							list.push([get.translation(type),'',name]);
						}
					}
				}
				var dialog=ui.create.dialog('云音',[list,'vcard']);
				player.chooseButton(dialog).ai=function(button){
					var name=button.link[2];
					var taoyuan=0,nanman=0;
					for(var i=0;i<game.players.length;i++){
						var eff1=ai.get.effect(game.players[i],{name:'taoyuan'},player,player);
						var eff2=ai.get.effect(game.players[i],{name:'nanman'},player,player);
						if(eff1>0){
							taoyuan++;
						}
						else if(eff1<0){
							taoyuan--;
						}
						if(eff2>0){
							nanman++;
						}
						else if(eff2<0){
							nanman--;
						}
					}
					if(Math.max(taoyuan,nanman)>1){
						if(taoyuan>nanman) return name=='taoyuan'?1:0;
						return name=='nanman'?1:0;
					}
					if(player.num('h')<player.hp&&player.hp>=2){
						return name=='wuzhong'?1:0;
					}
					if(player.hp<player.maxHp&&player.hp<3){
						return name=='tao'?1:0;
					}
					return name=='zengbin'?1:0;
				}
				'step 2'
				if(result.bool){
					var name=result.links[0][2];
					var info=lib.card[name];
					var card={name:name};
					if(info.selectTarget==-1){
						var targets=[];
						for(var i=0;i<game.players.length;i++){
							if(lib.filter.filterTarget(card,player,game.players[i])){
								targets.push(game.players[i]);
							}
						}
						if(targets.length){
							targets.sort(lib.sort.seat);
							player.useCard(card,targets);
						}
						event.finish();
					}
					else if(info.notarget){
						player.useCard(card);
					}
					else{
						var next=player.chooseTarget('选择'+get.translation(name)+'的目标');
						next._get_card=card;
						next.filterTarget=lib.filter.filterTarget;
						next.ai=ai.get.effect;
						if(typeof info.selectTarget=='function'){
							next.selectTarget=info.selectTarget;
						}
						else{
							next.selectTarget=get.select(info.selectTarget);
						}
						event.card=card;
					}
				}
				else{
					event.finish();
				}
				'step 3'
				if(result.bool){
					player.useCard(event.card,result.targets);
				}
			},
			ai:{
				threaten:1.5,
			}
		},
		shishui:{
			trigger:{player:'useCardToBegin'},
			filter:function(event,player){
				return event.target&&get.color(event.card)=='red';
			},
			forced:true,
			check:function(event,player){
				return ai.get.attitude(player,event.player)<0;
			},
			content:function(){
				trigger.target.loseHp();
			},
			ai:{
				effect:{
					player:function(card,player,target,current){
						if(get.color(card)=='red') return [1,0,1,-2];
					}
				}
			}
		},
		chizhen:{
			trigger:{player:'phaseUseBegin'},
			frequent:true,
			content:function(){
				'step 0'
				event.num=Math.max(1,player.maxHp-player.hp);
				player.draw(event.num);
				'step 1'
				player.chooseToDiscard('he',event.num,true);
				'step 2'
				var useCard=false;
				if(result.bool&&result.cards){
					for(var i=0;i<result.cards.length;i++){
						if(result.cards[i].name=='sha'){
							useCard=true;break;
						}
					}
				}
				if(useCard){
					player.chooseTarget('是否视为使用一张决斗？',function(card,player,target){
						return lib.filter.targetEnabled({name:'juedou'},player,target);
					}).set('ai',function(target){
						return ai.get.effect(target,{name:'juedou'},_status.event.player);
					});
				}
				else{
					event.finish();
				}
				'step 3'
				if(result.bool){
					player.useCard({name:'juedou'},result.targets);
				}
			},
			ai:{
				threaten:function(player,target){
					return Math.sqrt(Math.max(1,target.maxHp-target.hp));
				}
			}
		},
		xiuhua:{
			trigger:{global:'loseEnd'},
			filter:function(event,player){
				if(event.player==player) return false;
				if(event.parent.name!='equip'&&event.parent.name!='discard') return false;
				for(var i=0;i<event.cards.length;i++){
					if(get.type(event.cards[i])=='equip'&&get.position(event.cards[i])=='d'){
						return true;
					}
				}
			},
			frequent:true,
			content:function(){
				"step 0"
				game.delay();
				"step 1"
				var cards=[];
				for(var i=0;i<trigger.cards.length;i++){
					if(get.type(trigger.cards[i])=='equip'&&get.position(trigger.cards[i])=='d'){
						cards.push(trigger.cards[i]);
					}
				}
				if(cards.length){
					player.gain(cards,'gain2','log');
				}
			}
		},
		liuying:{
			trigger:{player:'useCard'},
			filter:function(event,player){
				if(event.card.name!='sha') return false;
				for(var i=0;i<game.players.length;i++){
					if(event.targets.contains(game.players[i])==false&&game.players[i]!=player&&
					lib.filter.targetEnabled(event.card,player,game.players[i])){
						return true;
					}
				}
				return false;
			},
			direct:true,
			content:function(){
				'step 0'
				var list=[];
				for(var i=0;i<game.players.length;i++){
					if(trigger.targets.contains(game.players[i])==false&&game.players[i]!=player&&
					lib.filter.targetEnabled(trigger.card,player,game.players[i])){
						list.push(game.players[i]);
					}
				}
				event.list=list;
				'step 1'
				if(event.list.length){
					player.chooseTarget(get.prompt('liuying'),function(card,player,target){
						return event.list.contains(target);
					}).ai=function(target){
						return ai.get.effect(target,trigger.card,player,player);
					};
				}
				else{
					event.finish();
				}
				'step 2'
				if(result.bool){
					event.current=result.targets[0];
					event.current.judge(function(card){
						if(get.color(card)=='black') return -1;
						return 0;
					});
					event.list.remove(event.current);
					player.logSkill('liuying',event.current);
				}
				else{
					event.finish();
				}
				'step 3'
				if(result.color=='black'){
					trigger.targets.push(event.current);
					game.log(event.current,'被追加为额外目标');
					event.goto(1);
				}
			}
		},
		yanjia:{
			enable:'phaseUse',
			filter:function(event,player){
				var he=player.get('he');
				var num=0;
				for(var i=0;i<he.length;i++){
					var info=lib.card[he[i].name];
					if(info.type=='equip'&&!info.nomod&&lib.inpile.contains(he[i].name)){
						num++;
						if(num>=2) return true;
					}
				}
			},
			filterCard:function(card){
				var info=get.info(card);
				return info.type=='equip'&&!info.nomod&&lib.inpile.contains(card.name);
			},
			selectCard:2,
			position:'he',
			check:function(card){
				return ai.get.value(card);
			},
			content:function(){
				var name=cards[0].name+'_'+cards[1].name;
				var info1=get.info(cards[0]),info2=get.info(cards[1]);
				if(!lib.card[name]){
					var info={
						enable:true,
						type:'equip',
						subtype:get.subtype(cards[0]),
						vanish:true,
						cardimage:info1.cardimage||cards[0].name,
						filterTarget:function(card,player,target){
							return target==player;
						},
						selectTarget:-1,
						modTarget:true,
						content:lib.element.content.equipCard,
						legend:true,
						onEquip:[],
						onLose:[],
						skills:[],
						distance:{},
						ai:{
							order:8.9,
							equipValue:10,
							useful:2.5,
							value:function(card,player){
								var value=0;
								var info=get.info(card);
								if(player.get('e',info.subtype[5])&&card!=player.get('e',info.subtype[5])){
									value=ai.get.value(player.get('e',info.subtype[5]),player);
								}
								var equipValue=info.ai.equipValue||info.ai.basic.equipValue;
								if(typeof equipValue=='function') return equipValue(card,player)-value;
								return equipValue-value;
							},
							result:{
								target:function(player,target){
		    						var card=get.card();
		    						if(card==undefined){
		                                card={name:name};
		                            }
		    						var value1=ai.get.value(card,target);
		    						var value2=0;
		    						if(target[get.subtype(card)]&&target[get.subtype(card)]!=card){
										value2=ai.get.value(target[get.subtype(card)],target);
									}
		                            return Math.max(0,value1-value2)/5;
		    					}
							}
						}
					}
					for(var i in info1.distance){
						info.distance[i]=info1.distance[i];
					}
					for(var i in info2.distance){
						if(typeof info.distance[i]=='number'){
							info.distance[i]+=info2.distance[i];
						}
						else{
							info.distance[i]=info2.distance[i];
						}
					}
					if(info1.skills){
						info.skills=info.skills.concat(info1.skills);
					}
					if(info2.skills){
						info.skills=info.skills.concat(info2.skills);
					}
					if(info1.onEquip){
						if(Array.isArray(info1.onEquip)){
							info.onEquip=info.onEquip.concat(info1.onEquip);
						}
						else{
							info.onEquip.push(info1.onEquip);
						}
					}
					if(info2.onEquip){
						if(Array.isArray(info2.onEquip)){
							info.onEquip=info.onEquip.concat(info2.onEquip);
						}
						else{
							info.onEquip.push(info2.onEquip);
						}
					}
					if(info1.onLose){
						if(Array.isArray(info1.onLose)){
							info.onLose=info.onLose.concat(info1.onLose);
						}
						else{
							info.onLose.push(info1.onLose);
						}
					}
					if(info2.onLose){
						if(Array.isArray(info2.onLose)){
							info.onLose=info.onLose.concat(info2.onLose);
						}
						else{
							info.onLose.push(info2.onLose);
						}
					}
					if(info.onEquip.length==0) delete info.onEquip;
					if(info.onLose.length==0) delete info.onLose;
					lib.card[name]=info;
					lib.translate[name]=get.translation(cards[0].name,'skill')+get.translation(cards[1].name,'skill');
					var str=lib.translate[cards[0].name+'_info'];
					if(str[str.length-1]=='.'||str[str.length-1]=='。'){
						str=str.slice(0,str.length-1);
					}
					lib.translate[name+'_info']=str+'；'+lib.translate[cards[1].name+'_info'];
					try{
						game.addVideo('newcard',null,{
							name:name,
							translate:lib.translate[name],
							info:lib.translate[name+'_info'],
							card:cards[0].name,
							legend:true,
						});
					}
					catch(e){
						console.log(e);
					}
				}
				player.gain(game.createCard({name:name,suit:cards[0].suit,number:cards[0].number}),'gain2');
			},
			ai:{
				order:9.5,
				result:{
					player:1
				}
			}
		},
		meiying:{
			global:'meiying2',
			globalSilent:true,
			trigger:{global:'phaseEnd'},
			filter:function(event,player){
				return event.player!=player&&!event.player.tempSkills.meiying3&&event.player.isAlive()&&player.num('he',{color:'red'})>0;
			},
			direct:true,
			content:function(){
				"step 0"
				var next=player.chooseToDiscard('he','魅影：是否弃置一张红色牌视为对'+get.translation(trigger.player)+'使用一张杀？');
				next.logSkill=['meiying',trigger.player];
				var eff=ai.get.effect(trigger.player,{name:'sha'},player,player);
				next.ai=function(card){
					if(eff>0){
						return 7-ai.get.value(card);
					}
					return 0;
				}
				"step 1"
				if(result.bool){
					player.useCard({name:'sha'},trigger.player).animate=false;
				}
			},
			ai:{
				expose:0.1
			}
		},
		meiying2:{
			trigger:{player:'useCard'},
			filter:function(event,player){
				return _status.currentPhase==player&&event.targets&&(event.targets.length>1||event.targets[0]!=player);
			},
			forced:true,
			popup:false,
			content:function(){
				player.addTempSkill('meiying3','phaseAfter');
			}
		},
		meiying3:{},
		jianwu:{
			trigger:{player:'shaBegin'},
			forced:true,
			filter:function(event,player){
				return get.distance(event.target,player,'attack')>1;
			},
			content:function(){
				trigger.directHit=true;
			}
		},
		zuizhan:{
			trigger:{player:'useCard'},
			popup:false,
			filter:function(event,player){
				if(event.card.name!='sha') return false;
				for(var i=0;i<game.players.length;i++){
					if(event.targets.contains(game.players[i])==false&&
					game.players[i]!=player&&
					lib.filter.targetEnabled(event.card,player,game.players[i])){
						return true;
					}
				}
				return false;
			},
			content:function(){
				var list=[];
				for(var i=0;i<game.players.length;i++){
					if(trigger.targets.contains(game.players[i])==false&&
					game.players[i]!=player&&
					lib.filter.targetEnabled(trigger.card,player,game.players[i])){
						list.push(game.players[i]);
					}
				}
				if(list.length){
					event.target=list.randomGet();
					player.line(event.target,'green');
					game.log(event.target,'被追加为额外目标');
					trigger.targets.push(event.target);
					player.draw();
				}
			}
		},
		meiying_old:{
			trigger:{global:'phaseBefore'},
			filter:function(event,player){
				return event.player!=player&&!player.isTurnedOver()&&!player.storage.meiying;
			},
			check:function(event,player){
				return ai.get.attitude(player,event.player)<0&&
				((player.num('h')>player.hp&&player.num('h','lebu')==0)||get.distance(player,event.player)>1);
			},
			logTarget:'player',
			content:function(){
				"step 0"
				player.line(trigger.player,'green');
				player.phase();
				player.storage.meiying=trigger.player;
				"step 1"
				if(!player.isTurnedOver()){
					player.turnOver();
				}
				delete player.storage.meiying;
			},
			mod:{
				targetInRange:function(card,player,target,now){
					if(target==player.storage.meiying) return true;
				},
			},
			ai:{
				effect:{
					target:function(card){
						if(card.name=='guiyoujie') return [0,0];
					}
				}
			}
		},
		xidie:{
			trigger:{player:'phaseBegin'},
			direct:true,
			filter:function(event,player){
				return player.num('h')>player.hp;
			},
			content:function(){
				"step 0"
				var next=player.chooseToDiscard(get.prompt('xidie'),[1,Math.min(3,player.num('h')-player.hp)]);
				next.ai=function(card){
					return 6-ai.get.value(card);
				}
				next.logSkill='xidie';
				"step 1"
				if(result.bool){
					player.storage.xidie=result.cards.length;
				}
			},
			group:'xidie2'
		},
		xidie2:{
			trigger:{player:'phaseEnd'},
			forced:true,
			filter:function(event,player){
				return player.storage.xidie>0;
			},
			content:function(){
				player.draw(player.storage.xidie);
				player.storage.xidie=0;
			}
		},
		meihu:{
			trigger:{player:'damageEnd'},
			check:function(event,player){
				return ai.get.attitude(player,event.source)<4;
			},
			filter:function(event,player){
				return event.source&&event.source!=player&&event.source.num('h')>0;
			},
			logTarget:'source',
			content:function(){
				"step 0"
				trigger.source.chooseCard('交给'+get.translation(player)+'一张手牌',true).ai=function(card){
					return -ai.get.value(card);
				};
				"step 1"
				if(result.bool){
					player.gain(result.cards[0],trigger.source);
					trigger.source.$give(1,player);
				}
			},
			ai:{
				effect:{
					target:function(card,player,target){
						if(get.tag(card,'damage')){
							if(player.hasSkill('jueqing')) return [1,-1.5];
							return [1,0,0,-0.5];
						}
					}
				}
			}
		},
		qianhuan:{
			trigger:{player:'phaseAfter'},
			check:function(event,player){
				return player.hp==1||player.isTurnedOver();
			},
			filter:function(event,player){
				return player.hp<player.maxHp;
			},
			content:function(){
				"step 0"
				player.recover();
				"step 1"
				player.turnOver();
			},
			mod:{
				targetEnabled:function(card,player,target){
					if(target.isTurnedOver()) return false;
				},
				cardEnabled:function(card,player){
					if(player.isTurnedOver()) return false;
				}
			}
		},
		fumo:{
			trigger:{player:'damageAfter'},
			check:function(event,player){
				return event.source&&ai.get.attitude(player,event.source)<0;
			},
			filter:function(event,player){
				return event.source&&event.source.isAlive()&&player.num('h',{color:'red'})>1||player.num('h',{color:'black'})>1;
			},
			direct:true,
			content:function(){
				"step 0"
				player.chooseToDiscard(get.prompt('fumo',trigger.source),2,function(card){
					if(ui.selected.cards.length){
						return get.color(card)==get.color(ui.selected.cards[0]);
					}
					return player.num('h',{color:get.color(card)})>1;
				}).ai=function(card){
					if(ai.get.damageEffect(trigger.source,player,player,'thunder')>0){
						return 8-ai.get.value(card);
					}
					return 0;
				};
				"step 1"
				if(result.bool){
					player.logSkill('fumo',trigger.source,'thunder');
					// player.line(trigger.source,'thunder');
					trigger.source.damage('thunder');
				}
			},
			ai:{
				threaten:0.8
			}
		},
		fanyin:{
			trigger:{player:'phaseEnd'},
			direct:true,
			content:function(){
				"step 0"
				player.chooseTarget(get.prompt('fanyin'),function(card,player,target){
					if(player==target) return false;
					if(target.isLinked()) return true;
					if(target.isTurnedOver()) return true;
					if(target.num('j')) return true;
					if(target.hp==target.maxHp) return false;
					for(var i=0;i<game.players.length;i++){
						if(game.players[i].hp<target.hp){
							return false;
						}
					}
					return true;
				}).ai=function(target){
					var num=0;
					var att=ai.get.attitude(player,target);
					if(att>0){
						var min=true;
						for(var i=0;i<game.players.length;i++){
							if(game.players[i].hp<target.hp){
								min=false;break;
							}
						}
						if(min){
							num+=5;
						}
						if(target.isTurnedOver()){
							num+=5;
						}
						if(target.num('j')){
							num+=2;
						}
						if(target.isLinked()){
							num++;
						}
						if(num>0){
							return num+att;
						}
					}
					return num;
				}
				"step 1"
				if(result.bool){
					event.target=result.targets[0];
					player.logSkill('fanyin',event.target);
				}
				else{
					event.finish();
				}
				"step 2"
				if(event.target.isLinked()){
					event.target.link();
				}
				"step 3"
				if(event.target.isTurnedOver()){
					event.target.turnOver();
				}
				"step 4"
				var cards=event.target.get('j');
				if(cards.length){
					event.target.discard(cards);
				}
				"step 5"
				var min=true;
				for(var i=0;i<game.players.length;i++){
					if(game.players[i].hp<event.target.hp){
						min=false;break;
					}
				}
				if(min){
					event.target.recover();
				}
			},
			ai:{
				expose:0.2,
				threaten:1.3
			}
		},
		mingkong:{
			trigger:{player:'damageBegin'},
			forced:true,
			filter:function(event,player){
				return player.num('h')==0&&event.num>=1;
			},
			content:function(){
				if(trigger.num>=1){
					trigger.num--;
				}
				if(trigger.source){
					trigger.source.storage.mingkong=true;
					trigger.source.addTempSkill('mingkong2','phaseBefore');
				}
			},
			ai:{
				effect:{
					target:function(card,player,target){
						if(get.tag(card,'damage')&&target.num('h')==0){
							if(player.hasSkill('jueqing')) return;
							return 0.1;
						}
					}
				}
			},
		},
		mingkong2:{
			trigger:{source:'damageEnd'},
			forced:true,
			popup:false,
			audio:false,
			filter:function(event,player){
				return player.storage.mingkong?true:false;
			},
			content:function(){
				player.draw();
				player.storage.mingkong=false;
				player.removeSkill('mingkong2');
			}
		},
		yuehua:{
			trigger:{player:['useCardAfter','respondAfter','discardAfter']},
			frequent:true,
			filter:function(event,player){
				if(player==_status.currentPhase) return false;
				if(event.cards){
					for(var i=0;i<event.cards.length;i++){
						if(get.color(event.cards[i])=='red'&&
						event.cards[i].original!='j') return true;
					}
				}
				return false;
			},
			content:function(){
				player.draw();
			},
			ai:{
				threaten:0.7
			}
		},
		qinglan:{
			trigger:{global:'damageBefore'},
			filter:function(event,player){
				return event.nature&&player.num('he')>0;
			},
			direct:true,
			priority:-5,
			content:function(){
				"step 0"
				var next=player.chooseToDiscard(get.prompt('qinglan',trigger.player),'he');
				next.logSkill=['qinglan',trigger.player];
				next.ai=function(card){
					if(trigger.num>1||!trigger.source){
						if(ai.get.attitude(player,trigger.player)>0){
							return 9-ai.get.value(card);
						}
						return -1;
					}
					else if(ai.get.attitude(player,trigger.player)>0){
						if(trigger.player.hp==1){
							return 8-ai.get.value(card);
						}
						if(trigger.source.hp==trigger.source.maxHp){
							return 6-ai.get.value(card);
						}
					}
					else if(ai.get.attitude(player,trigger.source)>0&&
						trigger.source.hp<trigger.source.maxHp&&trigger.num<=1&&trigger.player.hp>1){
						if(get.color(card)=='red') return 5-ai.get.value(card);
					}
					return -1;
				}
				"step 1"
				if(result.bool){
					trigger.untrigger();
					trigger.finish();
					if(trigger.source){
						trigger.source.recover();
					}
				}
				else{
					event.finish();
				}
				"step 2"
				if(trigger.source){
					trigger.source.draw();
				}
			},
			ai:{
				expose:0.1
			}
		},
		fanshi:{
			trigger:{player:'phaseDiscardAfter'},
			forced:true,
			filter:function(event,player){
				return player.getStat('damage')>0;
			},
			check:function(event,player){
				return player.hp==player.maxHp;
			},
			content:function(){
				"step 0"
				player.loseHp();
				"step 1"
				player.draw();
			}
		},
		xuelu:{
			unique:true,
			trigger:{player:'phaseEnd'},
			direct:true,
			filter:function(event,player){
				return player.maxHp>player.hp&&player.num('he',{color:'red'})>0;
			},
			content:function(){
				"step 0"
				player.chooseCardTarget({
					position:'he',
					filterTarget:function(card,player,target){
						return player!=target;
					},
					filterCard:function(card,player){
						return get.color(card)=='red'&&lib.filter.cardDiscardable(card,player);
					},
					ai1:function(card){
						return 9-ai.get.value(card);
					},
					ai2:function(target){
						return ai.get.damageEffect(target,player,player,'fire');
					},
					prompt:get.prompt('xuelu')
				});
				"step 1"
				if(result.bool){
					event.target=result.targets[0];
					player.logSkill('xuelu',event.target,'fire');
					event.num=Math.ceil((player.maxHp-player.hp)/2);
					if(event.num>2) event.num=2;
					player.discard(result.cards);
				}
				else{
					event.finish();
				}
				"step 2"
				if(event.target){
					event.target.damage(event.num,'fire');
				}
			},
			ai:{
				maixie:true,
				expose:0.2,
				threaten:function(player,target){
					if(target.hp==1) return 3;
					if(target.hp==2) return 1.5;
					return 0.5;
				},
				effect:{
					target:function(card,player,target){
						if(!target.hasFriend()) return;
						if(get.tag(card,'damage')){
							if(target.hp==target.maxHp) return [0,1];
						}
						if(get.tag(card,'recover')&&player.hp>=player.maxHp-1) return [0,0];
					}
				}
			}
		},
		xiuhua_old:{
			changeSeat:true,
			trigger:{player:'shaHit'},
			filter:function(event,player){
				return event.target!=player.previous;
			},
			content:function(){
				game.swapSeat(trigger.target,player,true,true);
			}
		},
		shahun:{
			enable:'chooseToUse',
			skillAnimation:true,
			animationColor:'fire',
			filter:function(event,player){
				return !player.storage.shahun&&player.hp<=0;
			},
			content:function(){
				"step 0"
				var cards=player.get('hej');
				player.discard(cards);
				event.num=Math.max(3,cards.length);
				"step 1"
				if(player.isLinked()) player.link();
				"step 2"
				if(player.isTurnedOver()) player.turnOver();
				"step 3"
				player.draw(3);
				"step 4"
				player.recover(1-player.hp);
				player.removeSkill('fanshi');
				player.addSkill('juejing');
				player.storage.shahun=3;
				player.markSkill('shahun');
				game.addVideo('storage',player,['shahun',player.storage.shahun]);
			},
			group:'shahun2',
			intro:{
				content:'turn'
			},
			ai:{
				save:true,
				skillTagFilter:function(player){
					if(player.storage.shahun) return false;
					if(player.hp>0) return false;
				},
				result:{
					player:3
				}
			}
		},
		shahun2:{
			trigger:{player:'phaseAfter'},
			forced:true,
			filter:function(event,player){
				return player.storage.shahun?true:false;
			},
			content:function(){
				if(player.storage.shahun>1){
					player.storage.shahun--;
					game.addVideo('storage',player,['shahun',player.storage.shahun]);
				}
				else{
					player.die();
				}
			}
		},
		yanjia_old:{
			enable:'chooseToUse',
			filter:function(event,player){
				return player.num('he',{type:'equip'})>0;
			},
			filterCard:function(card){
				return get.type(card)=='equip';
			},
			position:'he',
			viewAs:{name:'wuzhong'},
			prompt:'将一张装备牌当无中生有使用',
			check:function(card){
				var player=_status.currentPhase;
				if(player.num('he',{subtype:get.subtype(card)})>1){
					return 11-ai.get.equipValue(card);
				}
				if(player.num('h')<player.hp){
					return 6-ai.get.value(card);
				}
				return 2-ai.get.equipValue(card);
			},
			ai:{
				order:9,
				threaten:1.1
			}
		},
		jizhan:{
			enable:'phaseUse',
			usable:1,
			changeSeat:true,
			filterTarget:function(card,player,target){
				return player!=target&&player.next!=target&&player.canUse('sha',target,false);
			},
			filter:function(event,player){
				var min=Math.max(1,player.maxHp-player.hp);
				return lib.filter.filterCard({name:'sha'},player);
			},
			content:function(){
				game.swapSeat(player,target,true,true);
				player.useCard({name:'sha'},target,false);
			},
			ai:{
				result:{
					target:function(player,target){
						return ai.get.effect(target,{name:'sha'},player,target);
					},
				},
				order:4,
			}
		},
		qianjun:{
			trigger:{player:'useCard'},
			direct:true,
			filter:function(event,player){
				if(event.card.name!='sha') return false;
				if(event.targets.length!=1) return false;
				if(!player.num('he')) return false;
				var target=event.targets[0];
				for(var i=0;i<game.players.length;i++){
					if(player!=game.players[i]&&target!=game.players[i]&&get.distance(target,game.players[i])<=1){
						return true;
					}
				}
				return false;
			},
			content:function(){
				"step 0"
				event.targets=[];
				for(var i=0;i<game.players.length;i++){
					if(player!=game.players[i]&&trigger.targets[0]!=game.players[i]&&get.distance(trigger.targets[0],game.players[i])<=1){
						event.targets.push(game.players[i]);
					}
				}
				var num=0;
				for(var i=0;i<event.targets.length;i++){
					num+=ai.get.effect(event.targets[i],{name:'sha'},player,player);
				}
				var next=player.chooseToDiscard(get.prompt('qianjun',event.targets),'he');
				next.logSkill=['qianjun',event.targets];
				next.ai=function(card){
					if(num<=0) return -1;
					return 7-ai.get.value(card);
				}
				"step 1"
				if(result.bool){
					for(var i=0;i<targets.length;i++){
						trigger.targets.add(targets[i]);
						// targets[i].classList.add('selected');
					}
				}
			}
		},
		xuanning:{
			group:['xuanning1','xuanning2'],
			intro:{
				content:'mark'
			},
			ai:{
				threaten:0.9
			}
		},
		xuanning1:{
			enable:'phaseUse',
			usable:1,
			filter:function(event,player){
				return player.num('h',{type:'basic'})>0&&player.storage.xuanning!=3;
			},
			filterCard:function(card){
				return get.type(card)=='basic';
			},
			check:function(card){
				return 7-ai.get.useful(card);
			},
			content:function(){
				player.storage.xuanning=3;
				player.markSkill('xuanning');
				game.addVideo('storage',player,['xuanning',player.storage.xuanning]);
			},
			ai:{
				result:{
					player:function(player){
						var num=player.num('h');
						if(num>player.hp+1) return 1;
						if(player.storage.xuanning>=2) return 0;
						if(num>player.hp) return 1
						if(player.storage.xuanning>=1) return 0;
						return 1;
					},
				},
				order:5
			}
		},
		xuanning2:{
			trigger:{player:'damageEnd'},
			forced:true,
			filter:function(event,player){
				if(player.storage.xuanning){
					return (event.source&&event.source.num('he')>0);
				}
				return false;
			},
			content:function(){
				player.discardPlayerCard(trigger.source,ai.get.buttonValue,'he',true);
				player.storage.xuanning--;
				if(!player.storage.xuanning){
					player.unmarkSkill('xuanning');
				}
				game.addVideo('storage',player,['xuanning',player.storage.xuanning]);
			}
		},
		liuguang:{
			trigger:{player:'phaseBegin'},
			direct:true,
			filter:function(event,player){
				if(player.storage.xuanning) return true;
				return false;
			},
			content:function(){
				"step 0"
				player.chooseTarget(function(card,player,target){
					return player!=target;
				},get.prompt('liuguang'),[1,3]).ai=function(target){
					return ai.get.damageEffect(target,player,player);
				}
				"step 1"
				if(result.bool){
					player.storage.xuanning--;
					if(!player.storage.xuanning){
						player.unmarkSkill('xuanning');
					}
					event.targets=result.targets.slice(0);
					event.targets.sort(lib.sort.seat);
					player.logSkill('liuguang',result.targets);
					game.addVideo('storage',player,['xuanning',player.storage.xuanning]);
				}
				else{
					event.finish();
				}
				"step 2"
				if(event.targets.length){
					var target=event.targets.shift();
					var next=target.chooseToDiscard('流光：弃置一张牌或受到一点伤害','he');
					next.ai=function(card){
						if(ai.get.damageEffect(_status.event.player,player,_status.event.player)>=0) return -1;
						if(_status.event.player.hp==1) return 9-ai.get.value(card);
						return 8-ai.get.value(card);
					};
					next.autochoose=function(){
						return this.player.num('he')==0;
					};
					event.current=target;
				}
				else{
					event.finish();
				}
				"step 3"
				if(result.bool&&result.cards&&result.cards.length){
					event.goto(2);
				}
				else{
					event.current.damage();
				}
			},
			ai:{
				expose:0.2,
				threaten:1.3
			}
		},
		yangming:{
			enable:'phaseUse',
			filter:function(event,player){
				if(player.storage.yangming2>0) return false;
				return player.num('h',{color:'red'})>0;
			},
			filterCard:function(card){
				return get.color(card)=='red';
			},
			content:function(){
				player.storage.yangming2=2;
				player.addSkill('yangming2');
				game.addVideo('storage',player,['yangming2',player.storage.yangming2]);
			},
			check:function(card){
				return 6-ai.get.value(card);
			},
			ai:{
				result:{
					player:function(player){
						if(player.num('h')<=player.hp&&player.hp==player.maxHp){
							return 0;
						}
						return 1;
					}
				},
				order:6,
				threaten:1.3
			}
		},
		yangming2:{
			trigger:{player:'phaseUseEnd'},
			direct:true,
			mark:true,
			content:function(){
				"step 0"
				player.storage.yangming2--;
				game.addVideo('storage',player,['yangming2',player.storage.yangming2]);
				if(player.storage.yangming2>0){
					event.finish();
				}
				else{
					player.removeSkill('yangming2');
					var num=0
					for(var i=0;i<game.players.length;i++){
						if(get.distance(player,game.players[i])<=1&&game.players[i].hp<game.players[i].maxHp){
							num++;
						}
					}
					if(num==0){
						event.finish();
					}
					else{
						player.chooseTarget(function(card,player,target){
							return get.distance(player,target)<=1&&target.hp<target.maxHp;
						},'请选择目标回复体力',[1,num]);
					}
				}
				"step 1"
				if(result.bool){
					player.logSkill('yangming',result.targets);
					for(var i=0;i<result.targets.length;i++){
						result.targets[i].recover();
					}
				}
			},
			intro:{
				content:'turn'
			},
		},
		zhaolu:{
			unique:true,
			mark:true,
			check:function(){
				return false;
			},
			forbid:['infinity'],
			init:function(player){
				player.storage.zhaolu=Math.min(5,game.players.length);
				game.addVideo('storage',player,['zhaolu',player.storage.zhaolu]);
			},
			trigger:{player:['phaseEnd','damageEnd'],global:'dieAfter'},
			forced:true,
			content:function(){
				var num=2;
				if(typeof trigger.num=='number') num=2*trigger.num;
				if(trigger.name=='phase') num=1;
				if(trigger.name=='die') num=2;
				player.storage.zhaolu-=num;
				if(player.storage.zhaolu<=0){
					player.loseMaxHp(true);
					player.storage.zhaolu=Math.min(5,game.players.length);
				}
				game.addVideo('storage',player,['zhaolu',player.storage.zhaolu]);
			},
			intro:{
				content:'turn'
			},
			ai:{
				mingzhi:false,
				threaten:0.8
			},
		},
		jiehuo:{
			unique:true,
			forbid:['infinity'],
			skillAnimation:true,
			animationColor:'fire',
			init:function(player){
				player.storage.jiehuo=false;
			},
			enable:'phaseUse',
			filter:function(event,player){
				//if(player.maxHp<=1) return false;
				return !player.storage.jiehuo
			},
			intro:{
				content:'limited'
			},
			// mark:true,
			line:'fire',
			filterTarget:function(card,player,target){
				return player!=target;
			},
			selectTarget:-1,
			content:function(){
				if(!player.storage.jiehuo2){
					player.storage.jiehuo2=player.maxHp;
					player.addSkill('jiehuo2');
				}
				player.storage.jiehuo=true;
				target.damage(Math.min(target.hp,player.storage.jiehuo2),'fire');
			}
		},
		jiehuo2:{
			trigger:{player:'phaseUseEnd'},
			forced:true,
			popup:false,
			content:function(){
				player.die();
			}
		},
		yuling:{
			unique:true,
			locked:true,
			group:['yuling1','yuling2','yuling3','yuling4','yuling5','yuling6'],
			intro:{
				content:'time'
			},
			ai:{
				noh:true,
				threaten:0.8,
				effect:{
					target:function(card,player,target){
						if(card.name=='bingliang') return 0;
						if(card.name=='lebu') return 1.5;
						if(card.name=='guohe'){
							if(!target.num('e')) return 0;
							return 0.5;
						}
						if(card.name=='liuxinghuoyu') return 0;
					}
				}
			}
		},
		yuling1:{
			trigger:{player:['phaseDrawBefore','phaseDiscardBefore']},
			priority:10,
			forced:true,
			popup:false,
			check:function(){
				return false;
			},
			content:function(){
				trigger.untrigger();
				trigger.finish();
			}
		},
		yuling2:{
			trigger:{player:['loseEnd','drawEnd'],global:'gameDrawAfter'},
			check:function(event,player){
				return player.num('h')<2;
			},
			priority:10,
			forced:true,
			filter:function(event,player){
				return player.num('h')<5;
			},
			content:function(){
				player.draw(5-player.num('h'));
			}
		},
		yuling3:{
			trigger:{player:'gainEnd'},
			priority:10,
			forced:true,
			filter:function(event,player){
				return player.num('h')>5;
			},
			check:function(event,player){
				return player.num('h')<2;
			},
			content:function(){
				player.chooseToDiscard(true,player.num('h')-5);
			}
		},
		yuling4:{
			mod:{
				cardEnabled:function(card,player){
					if(_status.currentPhase!=player) return;
					if(get.cardCount(true,player)>=player.maxHp+2) return false;
				}
			}
		},
		yuling5:{
			trigger:{player:['useCardAfter','phaseBegin']},
			forced:true,
			popup:false,
			silent:true,
			content:function(){
				player.storage.yuling=player.maxHp+2-get.cardCount(true,player);
			}
		},
		yuling6:{
			trigger:{player:'phaseAfter'},
			forced:true,
			popup:false,
			silent:true,
			content:function(){
				delete player.storage.yuling;
			}
		},
	},
	translate:{
		gjqt_bailitusu:'百里屠苏',
		gjqt_fengqingxue:'风晴雪',
		gjqt_fanglansheng:'方兰生',
		gjqt_xiangling:'襄铃',
		gjqt_yinqianshang:'尹千觞',
		gjqt_hongyu:'红玉',

		gjqt_ouyangshaogong:'欧阳少恭',
		gjqt_xunfang:'巽芳',

		gjqt_yuewuyi:'乐无异',
		gjqt_wenrenyu:'闻人羽',
		gjqt_xiayize:'夏夷则',
		gjqt_aruan:'阿阮',

        zuiji:'醉饮',
        zuiji_info:'出牌阶段，你可以将一张手牌或装备牌当酒使用',
		manwu:'曼舞',
		manwu_info:'在一名角色的回合结束阶段，若其手牌数为全场最少或之一，你可以令其摸一张牌',
		xfanghua:'芳华',
		xfanghua_info:'在你成为红色牌的目标后，你可以回复一点体力',
		yunyin:'云音',
		yunyin_info:'回合结束阶段，你可以弃置一张与本回合使用过的卡牌花色均不相同的手牌，视为使用一张基本牌或非延时锦囊牌',
		shishui:'逝水',
		shishui_info:'锁定技，每当你使用一张红色牌，你令目标流失一点体力',
		duhun:'渡魂',
		duhun_info:'濒死阶段，你可以与一名体力值不超过你的体力上限的角色拼点，若你赢，你失去一点体力上限并与该角色交换体力值；若你没赢，你立即死亡',
		chizhen:'驰阵',
		chizhen_info:'出牌阶段开始时，你可以摸X张牌并弃置X张牌，若你弃置了杀，可以视为使用一张决斗（X为你已损失的体力值且至少为1）',
		xidie:'戏蝶',
		xidie2:'戏蝶',
		xidie_info:'回合开始阶段，若你的手牌数大于体力值，可以弃置至多X张牌，并于回合结束阶段摸等量的牌，X为你的体力值与手牌数之差且不超过3',
		meihu:'魅狐',
		meihu2:'魅狐',
		meihu_info:'当你受到伤害后，可令伤害来源交给你一张手牌',
		jianwu:'剑舞',
		jianwu_info:'锁定技，攻击范围不含你的角色无法闪避你的杀',
		meiying:'魅影',
		meiying_info:'一名其他角色的回合结束时，若其未于此回合内使用过指定另一名角色为目标的牌，你可以弃置一张红色牌视为对其使用一张杀',
		zuizhan:'乱斩',
		zuizhan_info:'每当你使用一张杀，可以摸一张牌，然后此杀随机增加一个额外目标',
		qianhuan:'千幻',
		qianhuan_info:'回合结束后，若你已受伤，你可以回复一点体力并将武将牌翻面。若你的武将牌背面朝上，你不能使用卡牌，也不能成为卡牌的目标',
		fumo:'伏魔',
		fumo_info:'每当你受到一次伤害，可以弃置两张颜色相同的手牌并对伤害来源造成一点雷电伤害',
		fanyin:'梵音',
		fanyin_info:'回合结束阶段，你可以令其他一名角色重置武将牌。若其体力值是全场最少的之一，其回复一点体力。',
		mingkong:'明空',
		mingkong_info:'锁定技，若你没有手牌，你受到的伤害-1，然后伤害来源摸一张牌',
		qinglan:'晴岚',
		qinglan_info:'每当有一名角色即将受到属性伤害，你可以弃置一张牌令其防止此伤害，然后伤害来源摸一张牌并回复一点体力',
		yuehua:'月华',
		yuehua_info:'每当你于回合外使用、打出或弃置红色牌，你可以摸一张牌',
		xuelu:'血戮',
		xuelu_info:'回合结束阶段，你可以弃置一张红色牌并对一名其他角色造成X点火焰伤害，X为你已损失体力值的一半，向上取整且不超过2',
		fanshi:'反噬',
		fanshi_info:'锁定技，弃牌阶段结束时，若你本回合内造成过伤害，你流失一点体力并摸一张牌',
		shahun:'煞魂',
		shahun2:'煞魂',
		shahun_info:'限定技，濒死阶段，你可以重置武将牌，弃置所有牌并摸三张牌，然后将体力回复至1；若如此做，你失去技能【反噬】，获得技能【绝境】，并于三回合后立即死亡',

		yanjia:'偃甲',
		yanjia_info:'出牌阶段，你可以将两张装备牌合成为一张强化装备',
		xiuhua:'袖花',
		xiuhua_info:'每当一件其他角色的装备因被替换或弃置进入弃牌堆，你可以获得之',
		liuying:'流影',
		liuying_info:'每当你使用一张杀，你可以指定一名不是此杀目标的角色并进行一次判定，若结果是黑色，将其追加为杀的额外目标并可以再次判定',
		boyun:'拨云',
		boyun1:'拨云',
		boyun2:'拨云',
		boyun_info:'在你的回合内，你可以弃置一张装备牌，并展示牌堆顶的一张牌，若其为装备牌，你须将其交给任意一张角色并对其造成一点伤害，否则你摸一张牌',
		jizhan:'疾战',
		jizhan_info:'出牌阶段限一次，你可以将移动到任意一名角色的前一位，视为对其使用了一张不计入出杀次数的杀',
		qianjun:'千军',
		qianjun_info:'每当你使用一张杀，你可以弃置一张牌，令距离目标1以内的所有角色成为额外目标',
		xuanning:'玄凝',
		xuanning1:'玄凝',
		xuanning2:'玄凝',
		liuguang:'流光',
		yangming:'养命',
		yangming2:'养命',
		xuanning_info:'出牌阶段，你可以弃置一基本牌，获得至多3个玄凝标记。当你受到伤害时，若你有玄凝标记，你须弃置一个玄凝标记并弃置伤害来源一张牌',
		liuguang_info:'回合开始阶段，若你有玄凝标记，你可以弃置一枚玄凝标记，选择至多三名角色依次令其选择一项：弃置一张牌，或受到一点伤害，并终止流光结算',
		yangming_info:'出牌阶段，你可以弃置一张红色牌，并在下个出牌阶段结束时令距离1以内的任意名角色回复一点体力，在此之前不可再次发动',
		zhaolu:'朝露',
		jiehuo:'劫火',
		yuling:'御灵',
		yuling1:'御灵',
		yuling2:'御灵',
		yuling3:'御灵',
		yuling4:'御灵',
		zhaolu_info:'锁定技，每隔X回合，你流失一点体力上限，每当你受到一点伤害或有人死亡，视为减少两个回合，X为现存角色数且至多为5',
		jiehuo_info:'限定技，出牌阶段，你可以令所有其他角色受到X点火焰伤害，并在此阶段结束后死亡，X为你的体力上限且不超过该角色的当前体力值',
		yuling_info:'锁定技，你没有摸牌和弃牌阶段，你的手牌数始终为5，你在一个出牌阶段最多使用X+2张牌，X为你的体力上限',
	},
}
